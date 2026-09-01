---
name: create-zenith-compose
description: Prepare a public GitHub repository for publishing on Zenith. Containerize the app when needed, publish it through GHCR, create zenith-compose.yml, and open the required pull requests with GitHub CLI.
---

# Create Zenith Compose

Prepare the current public GitHub repository for Zenith. Work in two resumable phases:

1. Make a public container image available and open the containerization PR when the repository needs one.
2. Create `/zenith-compose.yml` and open a second PR.

The repository owner merges each PR. Never merge a PR, push to the default branch, change package visibility, or submit the app to Zenith for them.

## Run autonomously

Use repository evidence instead of asking the owner routine implementation questions. Invoking this skill authorizes the normal reversible repository work needed for these PRs: editing owned files, creating a branch, committing only those files, pushing the branch, and opening or updating its PR.

Stop only when credentials or permissions are missing, required runtime behavior cannot be established from the repository, or an irreversible owner action is required. Do not stop merely to show a draft or ask permission for an ordinary PR change.

Use `gh repo view` to find the GitHub repository, visibility, and default branch. Stop before editing if the repository is private because Zenith must read the default branch and pull its image without repository credentials. Check `gh auth status`, the worktree, existing Zenith branches, and open or merged PRs before editing. Resume existing work instead of creating duplicate PRs. Keep unrelated changes out of commits. Read [references/github-pr-workflow.md](references/github-pr-workflow.md) before creating either PR.

## Determine the current phase

Inspect the default branch and registry state, not just the current checkout.

- If a suitable public image already exists, skip containerization.
- If a containerization PR is open, report its URL and the single next owner action. Do not create `zenith-compose.yml` from an image that Zenith cannot pull yet.
- If the containerization PR has merged, wait for its publish workflow to finish, then test an anonymous pull. Continue directly to the compose phase when it works.
- If anonymous pull fails only because the new GHCR package is private, give the exact package settings URL and ask the owner to make it public. This is irreversible on GitHub and cannot be done through the package REST API.
- If the compose PR is open, report its URL and ask the owner to merge it.
- If `zenith-compose.yml` is already on the default branch, report that the repository is ready for Zenith. Tell the owner to return to Zenith's **Publish an app** page, select the repository again, and submit it for review.

## Phase 1: publish a container image

An existing Compose file is useful, not required. Find the app's real production build and runtime path from its Dockerfile, build scripts, entrypoint, startup code, deployment docs, sample environment, and release workflows.

If no anonymously pullable maintained image exists, read [references/publish-image-ghcr.md](references/publish-image-ghcr.md). Create or fix the smallest production Dockerfile, a deliberate `.dockerignore` when needed, and the GHCR publishing workflow. Verify that the image builds and boots far enough to expose the expected service when local tools and documented test values allow it.

Commit only files required by the container phase. This may include the smallest runtime or source change needed for the production process to bind correctly. Push a dedicated branch and open the first PR with `gh pr create`. End this phase with the PR URL and ask the owner to merge it. If they merge it during the same session, continue from the default branch without asking them to invoke the skill again.

## Phase 2: create Zenith Compose

Read [references/contract.md](references/contract.md) before writing the file. If the app needs a public URL, generated secret, owner-supplied value, seeded account, or outbound mail, also read [references/environment.md](references/environment.md).

Build the smallest stack that preserves the app's working behavior:

- Every service must use an image. Zenith does not build `build:` entries.
- Prefer an image maintained by this repository or its project. Pin an immutable digest when it can be resolved.
- Keep required databases, queues, workers, health checks, commands, and named data volumes.
- Remove optional observability, development tools, reverse proxies, and local-only helpers unless the app cannot run without them.
- Establish credentials, ports, mount paths, commands, and services from repository evidence. Never invent them.
- Replace `.env` interpolation with fixed non-secret values or `x-zenith.env` declarations.
- Replace bind-mounted data directories with named volumes and declare user data through `x-zenith.storage`.
- Add the smallest truthful `x-zenith` block. `catalog.name` and one primary `expose` entry are required.
- Expose the app service's internal HTTP port. Zenith owns the public host and TLS.
- Do not add `internal.yml`, pricing, resource limits, catalogue IDs, artwork, or reviewer-only metadata.

Change an existing `zenith-compose.yml` in place when one exists. Preserve settings the repository still supports.

Run `docker compose -f zenith-compose.yml config` when Docker Compose is available. Then check every hard rule in [references/contract.md](references/contract.md). Re-read the result for unresolved `${...}` expressions, local paths, placeholder values, floating secrets, and services without images.

Commit only the Zenith file. Push a separate branch and open the second PR with `gh pr create`. End with the PR URL and ask the owner to merge it. After the merge, confirm the file exists on the default branch and direct them back to Zenith's **Publish an app** page.
