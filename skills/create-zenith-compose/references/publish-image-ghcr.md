# Publish an image with GHCR

Use this phase when Zenith cannot anonymously pull a maintained image for the app. GHCR keeps the image under the same GitHub owner as the source.

## Establish the image build

Reuse a working production Dockerfile when one exists. Otherwise create the smallest one supported by the repository's build scripts and runtime behavior.

The image must:

- build without copying credentials into a layer;
- start the real production process;
- listen on `0.0.0.0`, not only `localhost`;
- retain every file needed at runtime;
- keep durable state in paths that Compose can mount as volumes;
- declare the internal HTTP port with `EXPOSE` when known.

Add `.dockerignore` only when repository files would expose secrets, bloat the build context, or break caching. Derive it from this repository. Do not paste a generic ignore file that removes build inputs.

When Docker is available, build the image and start it with documented test values. A successful build is not enough. Confirm the entrypoint starts and the expected port listens when the app can run without external production credentials.

## Add the publishing workflow

Detect the default branch and adapt the context and Dockerfile path for a monorepo. Add `.github/workflows/publish-container.yml`:

```yaml
name: Publish container image

on:
  push:
    branches: [DEFAULT_BRANCH]
    tags: ["v*"]
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v6

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Set image metadata
        id: meta
        uses: docker/metadata-action@v6
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push image
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

Replace `DEFAULT_BRANCH`. Follow a repository's action-pinning policy when it has one. Keep permissions narrow. Do not add extra architectures unless the app and every base image support them. Zenith needs `linux/amd64`.

The metadata action adds the source label that links the package to the repository. `GITHUB_TOKEN` is enough for a package owned by the same user or organization, so do not introduce a personal access token unless repository policy requires one.

Commit this work and open the containerization PR through [github-pr-workflow.md](github-pr-workflow.md).

## After the owner merges

Watch the default-branch **Publish container image** run with `gh run list` and `gh run watch`. If it fails, inspect the logs first. Open a focused follow-up PR only for a repository code or workflow fix. For an Actions permission, organization policy, or package access failure, give the owner the single setting change required instead of opening a PR that cannot fix it.

Test the image without local GHCR credentials. A fresh temporary `DOCKER_CONFIG` with `docker manifest inspect` or `docker buildx imagetools inspect` is sufficient. Resolve the digest for use in `zenith-compose.yml` when possible.

New GHCR packages may be private. If the anonymous check fails for that reason, GitHub provides no REST endpoint to change visibility. Use `gh api users/OWNER --jq .type` to determine the owner type, then give the owner the matching URL:

```text
organization: https://github.com/orgs/OWNER/packages/container/REPOSITORY/settings
personal:     https://github.com/users/OWNER/packages/container/REPOSITORY/settings
```

Ask them to choose **Change visibility** and **Public**. Tell them GitHub does not allow a public package to become private again. For organization packages, they need package admin permission.

Once an anonymous pull works, continue to the compose phase. Prefer the resolved digest. Otherwise use the generated `sha-<short-sha>` tag. Do not use `latest` when an immutable reference is available.
