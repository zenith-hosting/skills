# Publish an image with GHCR

Use this path when the repository has no public image Zenith can pull. GHCR is the default because the source and package stay under the same GitHub owner.

This is a separate repository change. Explain it before creating a Dockerfile or workflow. A request to create only `zenith-compose.yml` does not authorize extra CI files.

## Establish the image build

Inspect the app's build and runtime before editing anything. Reuse a working Dockerfile when one exists. If none exists and the owner asks for image publishing setup, create the smallest production Dockerfile supported by the repository's build scripts and runtime documentation.

The Dockerfile must:

- build without credentials copied into an image layer;
- start the production application through its real entrypoint or command;
- listen on `0.0.0.0`, not only `localhost`;
- document the app's internal HTTP port with `EXPOSE` when known;
- retain every runtime file the process needs;
- write durable state only to paths that can become Compose volumes.

Add `.dockerignore` only when repository files would leak secrets, bloat the context, or invalidate caching. Derive its entries from the repository. Do not paste a generic ignore file that removes build inputs.

Build the image locally when Docker is available:

```sh
docker build -t zenith-local-check .
```

Run the image far enough to prove the entrypoint starts and the expected port listens. Supply only documented test values. Do not treat a successful build as proof that the app boots.

## Add the publishing workflow

Detect the repository's default branch instead of assuming `main`. Adapt the Dockerfile path and build context when the app lives in a subdirectory.

Create `.github/workflows/publish-container.yml` when the owner authorizes it:

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

Replace `DEFAULT_BRANCH` with the detected branch. Keep the job permissions narrow. `GITHUB_TOKEN` supplies the GHCR login, so this workflow needs no personal access token for a package owned by the same user or organization.

Use current stable major versions if these action versions have moved. GitHub recommends pinning third-party actions to commit SHAs for stronger supply-chain control. Follow an existing repository policy when it already pins actions.

The metadata labels link the package to its source repository. Do not add `linux/arm64` or other platforms unless the app and its base images support them. A normal GitHub-hosted build produces the `linux/amd64` image Zenith needs.

## First publish

Tell the owner to commit the Dockerfile, workflow, and any intentional `.dockerignore` change to the public repository's default branch, then push. The default-branch push starts the workflow. They can also run **Publish container image** from the repository's Actions tab after the workflow exists on the default branch.

Have them wait for the workflow to finish and open the package under the GitHub user or organization profile's **Packages** tab.

New personal GHCR packages start private. Zenith must pull without GitHub credentials, so the owner must open **Package settings**, choose **Change visibility**, and set the package to **Public**. Warn them that GitHub says a public package cannot be made private again.

For an organization package, the owner may need organization permission to change package visibility. If the workflow cannot push, check the package's **Manage Actions access** and the organization's package inheritance policy before introducing a PAT.

## Verify and continue

Confirm the image exists at `ghcr.io/<owner>/<repository>:<tag>` and can be pulled anonymously. Use a release tag when the project has one. Otherwise use the generated `sha-<short-sha>` tag for the first Zenith proposal. Do not pin the compose file to `latest` when an immutable tag or digest is available.

After the anonymous pull works, return to the main skill. Create `zenith-compose.yml` with that image, validate it, and finish with the normal default-branch and Zenith submission steps.
