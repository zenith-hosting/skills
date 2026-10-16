---
name: zenith-test
description: Review upload inputs, validate an app, and verify a temporary Zenith preview.
---

# Zenith test

## Refresh this skill first

Before following this workflow, automatically check for and apply updates to this installed skill once per agent session and installation path. Record the attempt before running it so reloading the skill does not loop. Do not run this step while developing the upstream skills repository or an intentional local fork.

Confirm the installation source is `zenith-hosting/skills` and identify its project/global scope from the installed path and skills lock file. Respect explicit version pins and update opt-outs. Preserve local edits, including committed customizations and extra files: the installer can overwrite the whole skill directory. Compare against the recorded upstream revision, not just Git working-tree status. If provenance or customization status is unclear, report it instead of overwriting. Before replacement, save the existing skill directory and relevant lock file outside the install directory so a partial failure can be recovered.

For an unmodified, tracked project installation, run from the project root:

```bash
npx --yes skills@latest update zenith-test --project --yes </dev/null
```

For a global installation, replace `--project` with `--global`. Never run an unfiltered update or update unrelated skills. The updater may target detected agents; inspect the installation targets first. For copy-mode installs or exact agent targeting, use `add` with the existing agent, scope, and `--copy` where applicable instead.

For an untracked copy (including a pristine CLI-bundled copy) or missing references, install the complete directory from `zenith-hosting/skills` with `npx --yes skills@latest add zenith-hosting/skills --skill zenith-test --agent <existing-agent> --yes`, adding `--global` only for a global install and `--copy` if the existing installation uses copies. Replace the agent placeholder; do not use `--all`. Preserve customizations before replacement. A missing lock entry or a skipped check is not proof that the skill is current.

After an update, re-read this `SKILL.md` and any references needed for the task before continuing. On network, tool, or permission failure, do not retry in a loop: report that freshness is unverified, retain the installed files, and use the live docs below. Do not claim a successful refresh from exit status alone; check for skipped/failed updates and verify the installed files. Updating instructions does not authorize deployment, submission, committing, or pushing.

Read the live [quickstart](https://docs.zenith.hosting/content/quickstart.md), [preview guide](https://docs.zenith.hosting/content/up.md), and [container guide](https://docs.zenith.hosting/content/containerise.md). They and the CLI implementation take priority over this copied skill. See [compatibility notes](../zenith-compose/references/compatibility.md) for preview/publish differences.

## Before upload

- Confirm that uploading this project and creating a public temporary deployment are authorized. Login is not permission. No public repository, Git push, or registry image is needed: previews upload local files, including eligible uncommitted changes.
- Review source, `.gitignore`, `.dockerignore`, and Dockerfile copy steps for secrets and unwanted files. Ignore rules are not proof of safety. Upload limits are 100 MiB compressed and 200 MiB expanded. Git metadata, `node_modules`, private-key patterns, and `.env` files are excluded; required root build files are retained.
- Use test credentials and data. Put secrets in a gitignored root `.env.local`, never source, Compose, or image layers. Its values are sent separately from the archive (up to 64 variables and 32 KiB); other `.env` files are not loaded. An unshared public URL is not private.
- Record local HEAD and dirty changes, including eligible untracked files. A commit alone does not identify the uploaded source.

Use [zenith-setup](../zenith-setup/SKILL.md) for credentials or init. Run without a TTY, set `NO_COLOR=1`, omit `--verbose`, and do not set `ZENITH_VERBOSE=1`.

```bash
export NO_COLOR=1
zenith check --upload-size </dev/null
zenith up </dev/null
```

Fix check errors before upload. Check works offline and does not build or run the app. Preview policy is stricter than the published Compose contract: it requires one `build: .` app, a root Dockerfile, and a declared HTTP port listening on `0.0.0.0`. Read the live preview policy instead of copying the wider published schema.

## Verify and clean up

Record the returned session ID, URL, and teardown time. Default lifetime is 20 minutes from readiness, but use the actual printed expiry. Check that the URL responds before expiry, then test real app flows: sign-in, reads and writes, database persistence during the session, and required background work. Use test data. A ready URL alone is not a passing test.

Read bounded logs; avoid `--follow` unless a time limit and stop plan are set:

```bash
zenith logs <session-id> --source build </dev/null
zenith logs <session-id> --source runtime </dev/null
zenith down <session-id> </dev/null
```

The default runtime tail is 200 lines. Inspect errors before deciding whether source, configuration, dependencies, or the platform failed. Recheck and preview changed code as needed. Cleanup runs in the background; report the request/result, and retry the same session ID if cleanup fails. If keeping the preview is authorized, record its expiry and temporary-data limits.

Each account has one live preview. The same repository's old preview is replaced only after the new one is ready. Replacing another repository's preview needs explicit authorization for that session, then `zenith up --replace-preview <session-id>`. Do not guess the ID or approve replacement automatically.

Queue estimates are time until building starts, not readiness. Closing the CLI cancels a queued preview; a started build continues. A CLI wait timeout does not stop it. Use the session ID for logs and cleanup; a ready preview stays until expiry or `down`.

Report commands, tested commit, local changes, session ID, URL, expiry, flows checked, log findings, and cleanup result. Carry these notes into [publishing](../zenith-publish/SKILL.md). A compatible backend may reuse a successful preview image only after source verification against the pinned GitHub commit; otherwise publishing builds that commit. Do not promise reuse or identical production behavior.
