# Publish an image with GHCR

Use this phase when Zenith cannot anonymously pull a maintained image for the app. GHCR keeps the image under the same GitHub owner as the source. Local Docker is optional: GitHub Actions supplies the required build and runtime checks.

## Establish the image build

Reuse a working production Dockerfile when one exists. Otherwise create the smallest one supported by the repository's build scripts and runtime behavior. It must build without credentials in layers, start the real production process, listen on `0.0.0.0`, retain runtime files, and keep durable state in mountable paths. Declare the known internal port with `EXPOSE`. Derive `.dockerignore` from actual build inputs and sensitive files.

Production Zenith runs `linux/amd64`. Explicitly build and verify that platform. ARM local clusters are a separate development concern; do not require multi-platform publishing or turn an ARM pull failure into a production blocker. Local emulation can provide feedback but does not replace the CI check.

Add a small repository-owned `scripts/zenith-smoke.sh` accepting an image reference. Adapt it to the actual app: start disposable database/cache dependencies if required, provide documented test configuration, wait with a bounded timeout, and request a real readiness route or meaningful page through the published port. Check the response expected from this app. Capture container logs on failure and clean up containers, networks, and test volumes with a trap. A successful build, open TCP port, or generic curl against an invented `/health` route is not sufficient. Never use production credentials or data. If an external service prevents boot validation, report exactly what remains unverified rather than marking the check passed.

When Docker is installed locally, run this same check for faster feedback. Otherwise proceed directly to CI.

## Add CI validation and publishing

Detect the default branch and adapt all paths for the app, including monorepo shared inputs. The following is a starting shape, not a file to paste unchanged. Replace `DEFAULT_BRANCH`, the example build-input paths, and context/Dockerfile locations. Follow the repository's action-pinning policy and verify current action releases before generating the workflow.

```yaml
name: Publish container image

on:
  pull_request:
  push:
    branches: [DEFAULT_BRANCH]
    tags: ["v*"]
    paths:
      - 'src/**'
      - 'public/**'
      - 'package.json'
      - 'package-lock.json'
      - 'Dockerfile'
      - '.dockerignore'
      - 'scripts/zenith-*.sh'
      - 'scripts/zenith-check-image.py'
      - '.github/workflows/publish-container.yml'
  workflow_dispatch:

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - name: Build AMD64 image
        run: docker build --platform linux/amd64 -t zenith-smoke .
      - name: Boot and check app
        run: bash scripts/zenith-smoke.sh zenith-smoke
      - name: Validate existing Compose
        run: |
          if test -f zenith-compose.yml; then
            docker compose -f zenith-compose.yml config --quiet
          fi

  publish:
    needs: validate
    if: >-
      github.event_name != 'pull_request' &&
      (github.ref == format('refs/heads/{0}', github.event.repository.default_branch) ||
       startsWith(github.ref, 'refs/tags/v'))
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false
      - uses: docker/setup-buildx-action@v4
      - uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v6
        id: meta
        with:
          images: ghcr.io/${{ github.repository }}
          tags: type=sha,format=long
      - uses: docker/build-push-action@v7
        id: image
        with:
          context: .
          platforms: linux/amd64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
      - name: Verify public image and prepare update
        env:
          IMAGE_TAGS: ${{ steps.meta.outputs.tags }}
          IMAGE_DIGEST: ${{ steps.image.outputs.digest }}
          SOURCE_SHA: ${{ github.sha }}
        run: bash scripts/zenith-prepare-image-update.sh
      - uses: actions/upload-artifact@v4
        with:
          name: zenith-image-${{ github.sha }}
          path: zenith-image-update/
          if-no-files-found: error
```

PR validation is read-only and does not log into GHCR or publish. Use `pull_request`, never `pull_request_target` to execute incoming code. Keep validation running on compose-only PRs so the required check is not left pending by a path filter. Publishing uses real build-input path filters; exclude `zenith-compose.yml` and generated digest metadata when they do not affect the image. GitHub does not apply path filters to tag pushes. Manual dispatch on the default branch also permits verification to resume after a package becomes public.

The source label links the package to the repository. `GITHUB_TOKEN` normally suffices for a same-owner package with repository access; an existing package may need Actions access configured. Do not introduce a PAT or silently expand permissions to work around policy. Full-SHA tags identify builds; use the returned digest for deployment, because tags can still be overwritten on reruns. Optional release tags can be added according to the project's release policy.

## Prepare the next digest update automatically

Create the `scripts/zenith-prepare-image-update.sh` called above with this contract; implement it using the project's existing tooling, not unreviewed remote code executed by CI:

1. Derive the image name from metadata and combine it with `IMAGE_DIGEST`. Copy the skill's [registry checker](../scripts/check-image.py) into the app as `scripts/zenith-check-image.py` when generating CI. Run it anonymously against that exact digest, with bounded retries for registry propagation. Require a `linux/amd64` image and use the returned **top-level digest** (an index digest when applicable), not an arbitrary child or a mutable tag. Then use a fresh temporary `DOCKER_CONFIG` for `docker pull --platform linux/amd64` and run `scripts/zenith-smoke.sh` against the pulled digest, removing the temporary config afterward. This checks layer access and the published image's runtime; the Python checker alone cannot. CI does not download the current remote skill on each build.
2. Write `zenith-image-update/image.json` with the verified immutable image reference, source commit, and workflow run URL. During bootstrap, when `zenith-compose.yml` does not yet exist, this metadata is the handoff for the compose PR.
3. When the compose file exists, prepare an updated copy plus a patch in that directory. Replace only the app service's image belonging to this publishing workflow, preserving other services, comments, and configuration. Fail on an ambiguous service rather than changing database images or every `image:` entry. Validate the resulting compose manifest. Include the original image reference and source SHA so an agent can detect a stale patch before applying it.
4. Upload the prepared files as the artifact shown above and link it in the run summary. This creates a reviewable update for every successful public publication without granting CI repository-write access. A prepared artifact is **not** an applied update or live release; the agent should retrieve it and open/update the compose PR when authorized.

If the repository already has permitted automation for opening dependency-update PRs, reuse it to propose this patch instead. Do not add credentials, `contents: write`, or `pull-requests: write` implicitly. Open a PR; do not push digest updates straight to the default branch or auto-merge. Before applying an artifact or updating an existing PR, fetch the current target branch and confirm no relevant image-build inputs changed since `SOURCE_SHA`; rebase the narrow image replacement onto the current manifest without overwriting intervening edits. If newer build inputs exist, use their successful image run instead. Tag builds must not silently replace the default branch's image with an older release.

A PR made with `GITHUB_TOKEN` must not be assumed to run required checks unattended. Current GitHub docs place its `opened`/`synchronize`/`reopened` runs behind approval by a writer; most other token-generated events are suppressed. Inspect required checks and report any approval required. Compose-only updates must not cause another image publication loop.

Commit the build, checks, and workflow and open the containerization PR through [github-pr-workflow.md](github-pr-workflow.md).

## After the owner merges

Use the available authenticated GitHub connector/API or CLI to watch the default-branch **Publish container image** run and read its logs. `gh run list` / `gh run watch` are conveniences, not prerequisites. Open a focused follow-up PR for code or workflow failures; report the specific required setting for permissions or package-access failures.

Wait for successful publication before diagnosing visibility. Run the registry checker without local GHCR credentials; Docker inspection is optional. Distinguish propagation delays, missing tags, network failures, architecture failures, and denied anonymous access. Do not guess that a not-yet-published image is private.

If anonymous access is denied after publication, inspect the actual package using authenticated GitHub package APIs (through a connector, REST client, or `gh api`). Resolve the owner type with `GET /users/{owner}`, then list container packages with `GET /orgs/{org}/packages?package_type=container` or `GET /users/{username}/packages?package_type=container`. Match the **actual package name**, including nested image paths, and inspect its returned visibility and `html_url`; do not assume the package name equals the repository name. If the available credential cannot inspect it, say that visibility is unconfirmed and point to GitHub's package list rather than inventing a package settings URL.

Only when the package is confirmed private, link its returned GitHub package page and ask the owner to open **Package settings → Change visibility → Public**. GitHub does not offer a REST visibility update; public packages cannot be made private again, and organization packages require package-admin access. After the setting changes, repeat anonymous verification and resume the failed preparation step (or dispatch the workflow). Do not ask for Docker installation to perform this check.

Once anonymous verification passes, continue to the compose phase with the verified digest. If verification fails, preserve the existing working manifest and report the actual blocker; never silently fall back to `latest` or an unverified image.

Documentation: [publishing Docker images](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images), [workflow triggers](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [container registry access and visibility](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry).
