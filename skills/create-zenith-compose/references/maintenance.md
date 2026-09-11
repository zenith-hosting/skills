# Persistent installation and maintenance

## Commit the loader and its discovery pointers

Put [assets/project-skill.md](../assets/project-skill.md) at `.agents/skills/create-zenith-compose/SKILL.md` in the target repository. This small entry intentionally loads current upstream instructions instead of copying the specification into every app.

If the installer placed a full copy there, replace only this skill's entry with the loader. Remove only reference/assets/script files owned by that exact installation which the loader no longer uses; never remove another skill or a user-modified file. Preserve relative agent symlinks to this entry (for example `.claude/skills/create-zenith-compose`). Never commit an absolute symlink or a pointer to a global installation. If symlinks are unsupported, use a small agent-local pointer to the canonical loader. Stage the exact skill paths and this skill's lockfile entry when the installer created one; do not stage unrelated `.agents/`, `.claude/`, or lockfile changes wholesale.

Add or update one concise section in root `AGENTS.md`, preserving all existing content:

> This project deploys through `zenith-compose.yml`. Before changing dependencies, build output, startup commands, ports, environment variables, or persistent storage, read `.agents/skills/create-zenith-compose/SKILL.md` and `docs/zenith-deployment.md`. Refresh the upstream skill as directed, then update the Dockerfile, image workflow, and Zenith manifest where needed. Keep the image digest in sync with the release being proposed; publishing an image alone does not deploy it on Zenith.

In an existing root `CLAUDE.md`, add a short reference to that section if it is not already included. If absent, create a minimal `CLAUDE.md` that imports `@AGENTS.md`, so Claude sessions discover the same instruction. Respect a repository's equivalent agent-entry convention. Do not rely on an installed skill being implicitly selected for an ordinary code change.

Create `docs/zenith-deployment.md` with this project's actual build context, Dockerfile and workflow paths, production platform (`linux/amd64`), internal port, required services, storage/env contract, smoke-test command, and publish → verify → propose digest update → Zenith review procedure. Keep application facts here, not a copied Zenith spec. Amend an equivalent existing deployment document instead of duplicating it, and adjust the loader's pointer accordingly.

Include these owned files in the first container or compose PR. Verify their committed presence on the remote default branch after merge. Installer-created local files are not a completed persistent installation until they are included in the PR.

## Audit an existing deployment

Compare the current app's build/runtime with its Dockerfile, publishing workflow, and manifest. Check base image/runtime versions, copied build output, startup behavior, ports, configuration, health checks, dependencies, and durable paths. Check that the pinned image is anonymously accessible and contains `linux/amd64`, and identify the source revision it represents from the build run/provenance. Do not call it current solely because a manifest exists or a newer image was published.

For application-only changes that need a new image, retain the current working digest until the new image is published and verified. For runtime-contract changes, prepare the matching manifest changes alongside the new digest. Work from current remote state and reuse an existing update PR.

The loader improves future agent discovery; it cannot guarantee compliance. CI should build and boot the image on relevant PRs, validate Compose when present, and check the generated manifest's supported contract. Describe any semantic checks that remain manual.

## Prepare image updates automatically

Adapt the CI procedure in [publish-image-ghcr.md](publish-image-ghcr.md). After successful trusted publication and an anonymous pull/boot check, produce a machine-prepared digest update for the exact app service(s), with source commit and old/new digest evidence. Leave database and third-party image references untouched.

Use an existing permitted PR mechanism when available. Otherwise upload the updated manifest and a patch as a workflow artifact for the agent to turn into a reviewed update PR. Do not silently add a PAT, widen workflow permissions, or assume the repository allows Actions to create PRs. A claimed automatic update path must be implemented and exercised, not just mentioned in the final reply.

Only application/build inputs trigger publication. Exclude changes confined to `zenith-compose.yml`, the skill loader, or deployment docs, unless those files are actual image build inputs. Derive the positive path filters from the Dockerfile/build context; do not ignore every YAML or Markdown file indiscriminately. For builds that legitimately embed deployment files, use a separate explicitly triggered image-release path to prevent update loops.

Before generating or applying a digest update, confirm the successful build corresponds to the latest applicable source revision; superseded builds must not replace a newer proposal. Recheck before pushing, never backdate or downgrade on stale completion, and make no-op updates exit cleanly. Validate the resulting manifest and anonymous image access. A merge of the digest-only update must not publish another image. When a PR is created by automation, inspect its actual required check/approval state instead of assuming workflows ran.

Maintain the upstream manifest through reviewed changes. Zenith catalogue acceptance and updates to running customer deployments remain separate operations; never promise an automatic production rollout from this workflow.
