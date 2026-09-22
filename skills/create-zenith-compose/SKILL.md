---
name: create-zenith-compose
description: Prepare or maintain a public GitHub repository for Zenith. Publish an AMD64 container, create or update zenith-compose.yml, retain a repository-local skill pointer, and prepare reviewed image updates. Use for deployment-affecting changes as well as initial onboarding.
---

# Create and maintain Zenith Compose

Prepare the current public GitHub repository for Zenith, or bring its existing deployment files up to date. Production runs `linux/amd64`. Local ARM clusters are a separate development concern; do not require developers to publish ARM images.

For first publication, use two resumable phases: publish a pullable container image, then add the pinned `zenith-compose.yml`. The repository owner merges the PRs. Never merge, push to the default branch, change package visibility, or submit/publish the app on Zenith for them.

## Establish access and resume

Invoking this skill authorizes the reversible repository work needed for the requested PRs: edit owned files, create branches, commit those files, push, and create or update PRs. Routine repository choices do not need another approval. Later automatic discovery of this skill during unrelated work does not authorize publishing images or opening PRs.

Read [github-pr-workflow.md](references/github-pr-workflow.md) first. Use an available authenticated GitHub connector/API or CLI plus Git transport; `gh` is convenient, not required. Local Docker is optional. Discover repository visibility, default branch, dirty files, existing PRs, and usable workflow-write permissions before editing. Do not install Docker or request broader credentials when existing tools suffice.

Inspect the remote default branch and registry, not just the current checkout. Resume the matching PR or failed workflow rather than duplicating it:

- An open container PR needs its merge before a default-branch image can exist. Give that one owner action. If the owner merges while the session continues, inspect the resulting CI run and proceed without asking for a new invocation.
- After successful publication, verify anonymous manifest/config access and production architecture with [scripts/check-image.py](scripts/check-image.py). CI must also pull and boot the published image without registry credentials. Manifest inspection alone does not prove a complete pull or runtime behavior.
- Only diagnose private package visibility from evidence after the package exists. Never preemptively say it is probably private or send guessed settings URLs. Follow [publish-image-ghcr.md](references/publish-image-ghcr.md) for actual access failures.
- An open compose/update PR needs its merge. After merge, check the default-branch files and required CI results, then direct the owner back to Zenith's **Publish an app** page.
- An existing `zenith-compose.yml` selects **maintenance mode**, not automatic success. Audit its pinned image and runtime contract using [maintenance.md](references/maintenance.md).

Stop at a concrete missing credential, unestablished runtime requirement, or owner-only action. Report the existing PR/run link, what passed, and the single next action. Do not describe a prepared repository as published on Zenith.

## Keep the skill in the repository

Read [maintenance.md](references/maintenance.md) and commit the small loader from [assets/project-skill.md](assets/project-skill.md) into the project, together with agent-discovery pointers and a brief deployment document. Do this in the first applicable PR, including when containerization is unnecessary. This is part of the requested onboarding, not uncommitted installation debris for the owner to clean up.

The loader reads the current skill and referenced specification from `zenith-hosting/skills` when relevant work starts. It does not claim agents self-update continuously. Preserve the project's existing instructions and unrelated skills.

## Phase 1: publish a container image

Read [publish-image-ghcr.md](references/publish-image-ghcr.md). Find the real production build and runtime from the Dockerfile, scripts, entrypoint, source, deployment docs, and sample configuration. Reuse a suitable anonymously pullable maintained AMD64 image if one exists.

Otherwise create the smallest working Dockerfile, a deliberate `.dockerignore` when needed, and CI to build and smoke-test PRs and publish trusted default-branch/release builds. Run checks in CI when local Docker is unavailable; never equate skipped runtime verification with a pass. Keep test secrets synthetic and PR builds unprivileged.

Commit the container files, necessary minimal runtime fixes, persistent skill loader, and deployment guidance. Open or update the container PR. After its merge, monitor publication and anonymous pull/boot checks, resolve the top-level digest, and continue to phase 2.

## Phase 2: create Zenith Compose

Start every created `zenith-compose.yml` with exactly `# https://zenith.hosting/developers`, followed by a blank line before the YAML content.

Read Zenith's current public documentation before writing or approving the manifest:

1. fetch `https://docs.zenith.hosting/llms.txt` to discover the published pages;
2. read the complete **Create zenith-compose.yml** and **zenith-compose.yml reference** pages linked there; and
3. read **Containerise your app** when creating or changing images.

Use the Markdown page URLs from the index rather than relying on the JavaScript-rendered homepage or guessing paths. The live reference is authoritative for the accepted fields and runtime behavior. [contract.md](references/contract.md) and [environment.md](references/environment.md) are working checklists, not permission to ignore newer public documentation. If the live reference conflicts with them, follow the live reference and update these local references in the same upstream skill change when authorized. If it cannot be fetched, continue repository investigation but report Zenith contract validation as blocked; do not invent fields or claim the manifest is valid.

Read [contract.md](references/contract.md). Read [environment.md](references/environment.md) if the app needs public URLs, generated secrets, user inputs, seeded accounts, or mail.

Check whether the app supports an external SMTP server for features such as password resets, invitations, or notifications. When it does and its supported configuration can be expressed in the manifest, wire it to Zenith's SMTP built-ins using the app's actual configuration names and STARTTLS settings from [environment.md](references/environment.md#smtp-when-the-app-supports-it). Do not wait for the owner to request mail configuration separately. Omit SMTP for apps without mail support; do not add a mail service, invent settings, or introduce email functionality.

- Every service needs a pullable image; Zenith does not build `build:` entries. Pin immutable digests, preserving the top-level index digest for multi-platform images.
- Preserve required databases, workers, queues, commands, health checks, and durable volumes. Remove optional development/observability helpers only when they are not required by the app.
- Establish ports, credentials, mount paths, and runtime behavior from repository evidence. Do not invent them.
- Replace unresolved `.env` interpolation with fixed non-secret values or `x-zenith.env`. Replace data bind mounts with declared named volumes and `x-zenith.storage`.
- Include the truthful minimum `x-zenith`: `catalog.name` and the single required `expose` entry using the internal HTTP port. Zenith owns the public host and TLS.
- Do not add operator-only `internal.yml`, pricing, resource limits, catalogue IDs, or reviewer metadata.

Change an existing manifest in place. For the final file, complete all three independent checks below; never infer one from another:

1. **YAML and Compose:** run `docker compose -f zenith-compose.yml config --quiet`. Treat any warning as something to investigate. This catches malformed YAML, duplicate mapping keys, unsupported Compose syntax, and unresolved interpolation; it does not validate `x-zenith` semantics.
2. **Zenith contract:** inspect the complete rendered manifest—not just the `x-zenith` block—against every hard rule in [contract.md](references/contract.md). Trace each `x-zenith.env` declaration to the exact target services and confirm the rendered value overrides a placeholder in the same service where practical. In particular, a generated database password must reach both the database server and every matching client URL; a generated app secret must reach every process that shares sessions. Reject duplicate keys, missing required runtime environment, missing health checks needed by `service_healthy`, invented endpoints, and values scoped to the wrong service even if Compose parsing succeeds.
3. **Runtime:** run the fully resolved manifest with the same deployment-specific values Zenith will inject, or add an equivalent CI smoke test that exercises every required service, dependency health gate, and public route. A separate hand-written `docker run` test is useful image evidence but does not prove the manifest. If the actual manifest cannot be booted, name that check as unverified and do not call it valid.

Before committing, read the final file back from disk, review its diff, and rerun all available checks after the last edit. Ensure CI validates `zenith-compose.yml` even on compose-only PRs; path-filtered image publication may stay disabled, but the manifest validation job must not be skipped. Do not open a PR containing a known invalid manifest and plan to repair it after merge.

Include the manifest, associated deployment guidance, and the tested image-update preparation described in [maintenance.md](references/maintenance.md). Open the compose PR against the latest default branch. After merge and verification, direct the owner back to Zenith for submission/review. Later image builds or GitHub merges do not automatically update the Zenith catalogue or running customer deployments.
