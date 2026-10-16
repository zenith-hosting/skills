---
name: zenith-test
description: Review upload inputs, validate an app, and verify a temporary Zenith preview.
---

# Zenith test

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
