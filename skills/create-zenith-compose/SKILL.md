---
name: create-zenith-compose
description: Create or update a repository-root zenith-compose.yml for publishing an app on Zenith. Use when adapting an app's existing Compose setup, container docs, or published images to Zenith's public developer submission contract.
---

# Create Zenith Compose

Create `/zenith-compose.yml` in the current repository. Base it on the app that is actually here, not on a generic stack.

Read [references/contract.md](references/contract.md) before writing the file. If the app needs a public URL, generated secret, owner-supplied value, seeded account, or outbound mail, also read [references/environment.md](references/environment.md).

## Work from repository evidence

Find the app's real deployment path. Inspect current Compose files, container documentation, Dockerfiles, release workflows, sample environment files, and startup code as needed.

Prefer a published image maintained by this repository or its project. Pin the version when the repository gives you a stable release tag. Every service needs an `image`; Zenith does not build images from `build`.

Start from the smallest stack that preserves the app's working behavior. Keep required databases, queues, workers, health checks, commands, and named data volumes. Remove optional observability, development tooling, reverse proxies, and local-only helpers unless the app cannot run without them.

Do not guess credentials, ports, mount paths, image names, or required services. If the repository does not establish a published image or enough runtime facts to produce a working deployment, explain the missing fact instead of inventing it.

## Repositories without Compose

An existing Compose file is useful, not required. If the repository has none, create `zenith-compose.yml` from the app's container contract:

1. Find a public registry image from release documentation, package metadata, badges, or image-publishing workflows. Match its tag to a repository release when possible.
2. Read the Dockerfile, entrypoint, startup code, and deployment documentation to establish the command, internal HTTP port, required environment values, health check, and persistent paths.
3. Add database, queue, worker, or other services only when the app's code or production documentation requires them. Use the upstream project's supported versions and connection settings.
4. Translate deployment-specific URLs, secrets, owner inputs, and mail settings through `x-zenith.env`. Keep fixed non-secret settings in normal Compose `environment`.
5. Put persistent paths on named volumes and declare user data through `x-zenith.storage`.

Do not turn `build:` or a Dockerfile path into an image guess. If the repository has no public image that Zenith can pull, read [references/publish-image-ghcr.md](references/publish-image-ghcr.md) and give the owner the GHCR publishing path. If they ask you to set it up, create or fix the Dockerfile and publishing workflow, verify the build, and guide them through the first publish. Do not add CI or registry configuration during a compose-only request without telling them and getting authorization for that expanded change.

Resume the compose work after the image is anonymously pullable. Use its release tag or digest in `zenith-compose.yml`, not a local-only tag.

## Adapt it for Zenith

- Put the file at the repository root with the exact name `zenith-compose.yml`.
- Make the file standalone. Replace `.env` interpolation with non-secret literals or `x-zenith.env` declarations.
- Replace bind-mounted data directories with named volumes. Do not depend on files from the repository at deploy time.
- Add the smallest truthful `x-zenith` block. `catalog.name` and one primary `expose` entry are required.
- Expose the app service's internal HTTP port. Do not add a proxy just to terminate TLS. Zenith owns the public host and TLS.
- Declare persistent user data under `x-zenith.storage`. Map each entry to a top-level named volume and choose a modest default size supported by the app's real needs.
- Use `x-zenith.env` only for values Zenith must resolve. Leave ordinary fixed configuration in the service's `environment` block.
- Do not add `internal.yml`, pricing, resource limits, catalogue IDs, CDN artwork, or reviewer-only metadata.

Change an existing `zenith-compose.yml` in place. Preserve settings that repository evidence still supports.

## Check the result

Run `docker compose -f zenith-compose.yml config` when Docker Compose is available. Fix its errors, but remember that this command does not enforce the Zenith contract.

Then check every hard rule in [references/contract.md](references/contract.md). Re-read the produced file for unresolved `${...}` expressions, local paths, placeholder values, floating secrets, and services without images.

Do not commit or push unless the user asks. Finish by showing the file and listing only assumptions or missing runtime evidence that could affect deployment.

## End with publishing steps

Every successful run must end with a `Next steps` section for the repository owner. Tell them to:

1. Commit `zenith-compose.yml` and push it to the public repository's default branch. Name the detected branch and give commands that fit the repository when you can determine them safely.
2. Return to Zenith's **Publish an app** page and select the repository again. Zenith checks the latest commit on the default branch.
3. When Zenith reports `zenith-compose.yml found`, complete the review details and submit the app for review.

Do not omit this handoff. These are instructions for the owner. Do not run the commit, push, or Zenith submission yourself without separate authorization.
