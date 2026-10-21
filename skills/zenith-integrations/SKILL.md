---
name: zenith-integrations
description: Wire an app to Zenith category integration APIs using live capabilities, scoped tokens, and graceful degradation.
---

# Zenith integrations

## Refresh this skill first

Before following this workflow, automatically check for and apply updates to this installed skill once per agent session and installation path. Record the attempt before running it so reloading the skill does not loop. Do not run this step while developing the upstream skills repository or an intentional local fork.

Confirm the installation source is `zenith-hosting/skills` and identify its project/global scope from the installed path and skills lock file. Respect explicit version pins and update opt-outs. Preserve local edits, including committed customizations and extra files: the installer can overwrite the whole skill directory. Compare against the recorded upstream revision, not just Git working-tree status. If provenance or customization status is unclear, report it instead of overwriting. Before replacement, save the existing skill directory and relevant lock file outside the install directory so a partial failure can be recovered.

For an unmodified, tracked project installation, run from the project root:

```bash
npx --yes skills@latest update zenith-integrations --project --yes </dev/null
```

For a global installation, replace `--project` with `--global`. Never run an unfiltered update or update unrelated skills. The updater may target detected agents; inspect the installation targets first. For copy-mode installs or exact agent targeting, use `add` with the existing agent, scope, and `--copy` where applicable instead.

For an untracked copy (including a pristine CLI-bundled copy) or missing references, install the complete directory from `zenith-hosting/skills` with `npx --yes skills@latest add zenith-hosting/skills --skill zenith-integrations --agent <existing-agent> --yes`, adding `--global` only for a global install and `--copy` if the existing installation uses copies. Replace the agent placeholder; do not use `--all`. Preserve customizations before replacement. A missing lock entry or a skipped check is not proof that the skill is current.

After an update, re-read this `SKILL.md` and any references needed for the task before continuing. On network, tool, or permission failure, do not retry in a loop: report that freshness is unverified, retain the installed files, and use the live docs below. Do not claim a successful refresh from exit status alone; check for skipped/failed updates and verify the installed files. Updating instructions does not authorize deployment, submission, committing, or pushing.

## Read the live contract

Read the [catalogue](https://docs.zenith.hosting/content/integrations.md) and `https://docs.zenith.hosting/content/integrations/<category>.md` for the requested category, such as [calendar](https://docs.zenith.hosting/content/integrations/calendar.md) or [git](https://docs.zenith.hosting/content/integrations/git.md). Treat the live category page as the source of truth for operations, fields, and responses; never maintain a copied operation or provider table. Read the [environment and preview reference](https://docs.zenith.hosting/content/zenith-compose-reference.md#env) before editing Compose.

## Prepare the app

If `zenith-compose.yml` is missing, delegate preparation to [zenith-setup](../zenith-setup/SKILL.md) and [zenith-compose](../zenith-compose/SKILL.md): run `NO_COLOR=1 zenith init` with the matching template and adapt generated files to the app's build, start command, port, and dependencies. Preserve existing files; omit `--force`.

Merge `INTEGRATIONS_URL` and `<CATEGORY>_TOKEN` into `x-zenith.env`; replace `<CATEGORY>` with the uppercase category. Scope both declarations with `services: [<calling-service>]`. Set URL `input.default` to `https://app.zenith.hosting/api/v1/integrations`. Set token `input.secret: true`, omit `input.required` (defaults to false), and supply no default or generated value so submission works before owner configuration.

Keep tokens and API calls server-side. If the token is missing, skip calls, keep the app usable, and show a setup state; enable the integration after configuration. Direct the owner to [Settings > Integrations](https://app.zenith.hosting/settings/integrations) for a connection-scoped app token supplied through deployment Credentials. Never invent, log, commit, or bake tokens into images.

## Wire the category API

Read `GET $INTEGRATIONS_URL/<category>/capabilities` with `Authorization: Bearer <CATEGORY_TOKEN>`. Parse the bare manifest keyed by operation, each containing `{support, fields}`, not an operation envelope. Choose features from operation and field support (`native`, `emulated`, `unsupported`), including fields an app needs on reads; never hard-code a provider or assume capabilities grant resource permissions.

Call `POST $INTEGRATIONS_URL/<category>/<operation>` with the same bearer token, `Content-Type: application/json`, and the documented JSON input object. Follow live field constraints and pagination; unknown input fields are rejected.

Parse HTTP 200 as `{support, warnings, data}`. Use `data` for results, account for native/emulated `support`, and surface `field_dropped` warnings (`{code, field}`) so dropped inputs are visible. Keep best-effort as the default; send `Zenith-Degrade: strict` only where dropping a field or emulating an operation would be incorrect. Strict mode rejects both before calling the provider; unsupported operations fail in either mode.

Handle errors by `code`, not message text. Expect `{code, operation, provider}` with optional `field`, `message`, and `retry_after`, except HTTP 401 returns only `{"code":"unauthorized"}` with `WWW-Authenticate: Bearer`. Request a valid, correctly scoped app token for `unauthorized`; distinguish `provider_auth` (424), which needs authorized provider reconnection.

Respect `Retry-After` for `provider_rate_limited` (429); use bounded retries for `provider_unavailable` (502), avoiding duplicate writes. Explain unavailable features for `operation_unsupported` (501) and strict rejection for `operation_emulated` (501) or `field_unsupported` (422); do not silently retry in best-effort mode. Correct `invalid_input` (400) and handle missing resources for `not_found` (404).

## Verify within authorization

Run the app's tests, covering missing tokens, capabilities, warnings, strict rejection, and typed errors. Run `NO_COLOR=1 zenith check` after Compose changes without a TTY or verbose output. Report commands, results, and unverified behavior; local tests do not prove a live integration.

Report CLI preview-policy rejection of `x-zenith.env` separately from published runtime support. For previews, follow the [preview guide](https://docs.zenith.hosting/content/up.md): use a separate preview manifest without `x-zenith.env` and a gitignored `.env.local` for URL and token values. Preserve published declarations and record which manifest was checked.

Use [zenith-test](../zenith-test/SKILL.md) only with authorization to upload and create a public temporary deployment. With an authorized preview and token, verify native and emulated operations where available, strict rejection, visible warnings, and the missing-token state; check side effects only for authorized writes. Report checks blocked by credentials, setup, or preview policy. Do not connect accounts, deploy, or publish without authorization for that action; existing credentials are not consent.
