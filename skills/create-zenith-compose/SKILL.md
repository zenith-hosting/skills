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

## Use the live Zenith documentation

At the start of each image or manifest phase, fetch `https://docs.zenith.hosting/llms.txt` and follow its Markdown links. Read the relevant pages completely:

- **Containerise your app** before creating, changing, publishing, or verifying images.
- **Create zenith-compose.yml** and the complete **zenith-compose.yml reference** before creating, changing, or approving the manifest.

The live documentation is the sole public source of truth for the Zenith Compose schema, validation, built-ins, and runtime behavior. Do not substitute memory, a cached copy, or a second contract maintained in this skill. Use the direct `.md` pages rather than scraping the JavaScript-rendered site or guessing routes. If the documentation cannot be fetched, continue repository investigation where useful but report the affected contract check as unverified; do not invent fields or claim the manifest is valid.

## Phase 1: publish a container image

Read [publish-image-ghcr.md](references/publish-image-ghcr.md) and the live containerisation documentation above. Find the real production build and runtime from the Dockerfile, scripts, entrypoint, source, deployment docs, and sample configuration. Reuse a suitable anonymously pullable maintained AMD64 image if one exists.

Otherwise create the smallest working Dockerfile, a deliberate `.dockerignore` when needed, and CI to build and smoke-test PRs and publish trusted default-branch/release builds. Run checks in CI when local Docker is unavailable; never equate skipped runtime verification with a pass. Keep test secrets synthetic and PR builds unprivileged.

Commit the container files, necessary minimal runtime fixes, persistent skill loader, and deployment guidance. Open or update the container PR. After its merge, monitor publication and anonymous pull/boot checks, resolve the top-level digest, and continue to phase 2.

## Phase 2: create Zenith Compose

Read the live Compose guide and complete reference above in full before editing. Start every created `zenith-compose.yml` with exactly `# https://zenith.hosting/developers`, followed by a blank line before the YAML content.

Build the manifest from repository evidence: the working Compose model, Dockerfile, entrypoint, source, deployment docs, sample configuration, and smoke tests. Preserve required databases, workers, queues, commands, health checks, durable paths, and internal hostnames. Use the verified immutable image references from phase 1. Establish every port, credential relationship, environment value, mount, and startup dependency from the app; do not invent them.

Inspect whether the app already supports external SMTP for password resets, invitations, or notifications. If it does, map the app's exact supported settings to the Zenith SMTP built-ins and port documented in the live reference, using the app's own documentation to choose its transport settings. Configure every process that sends mail. Omit SMTP when the app lacks mail support or cannot express it through the documented manifest contract; do not invent settings or add email functionality.

Change an existing manifest in place. Then perform the guide's completion checks and the reference's submission-validation checklist against the final file. A Compose parse does not apply or validate `x-zenith`. Also boot the actual manifest with representative resolved deployment values and exercise every required service, dependency health gate, and public route. A separate hand-written `docker run` smoke test proves the image, not the manifest. Name any check that could not run as unverified rather than calling the manifest valid.

Before committing, read the final file back from disk, review its diff, and rerun all available checks after the last edit. Ensure CI validates `zenith-compose.yml` even on compose-only PRs; path-filtered image publication may stay disabled, but manifest validation must not be skipped. Do not open a PR containing a known invalid manifest and plan to repair it after merge.

Include the manifest, associated deployment guidance, and the tested image-update preparation described in [maintenance.md](references/maintenance.md). Open the compose PR against the latest default branch. After merge and verification, direct the owner back to Zenith for submission/review. Later image builds or GitHub merges do not automatically update the Zenith catalogue or running customer deployments.
