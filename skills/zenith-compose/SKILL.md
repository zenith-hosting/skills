---
name: zenith-compose
description: Create or adapt Dockerfile and zenith-compose.yml files for Zenith previews and public app submissions using the shared Compose contract.
---

# Zenith Compose

Inspect the app's build scripts, entrypoint, HTTP port, dependencies, health checks, environment variables, and durable data. Preserve the services the app needs. Bind HTTP to `0.0.0.0` in the container and use service names for database addresses.

## Read the contract

Use the bundled contract files as the specification. Read the definitions relevant to the manifest before editing it:

- [zenith-compose.schema.json](references/zenith-compose.schema.json) defines the developer Compose document and `x-zenith` fields. Start with `$defs.xZenith`, `catalog`, `expose`, and the service definitions.
- [zenith-dev-compose.schema.json](references/zenith-dev-compose.schema.json) adds preview restrictions. Apply it together with the public schema. It does not replace the public schema.
- [dev-env-policy.json](references/dev-env-policy.json) defines permitted local environment names and reserved built-ins.

The contract files come from Zenith's `contract` folder. The Compose schema is filtered to developer-facing Zenith fields. Their source commit and source/distribution hashes are recorded in [contract-source.json](references/contract-source.json). Do not invent `x-zenith` fields or infer runtime support from generic Docker Compose alone. A schema pass does not cover every semantic restriction. Run `zenith check` for the installed CLI's preview checks and act on its errors.

## Prepare a preview

Keep one application service with `build: .` and a root `Dockerfile`. Use pullable images for its required dependencies. Keep preview `x-zenith` to `catalog` and `expose`. The public schema requires the catalog's name, description, authors, tags, source URL, and license. Use the app's actual values.

Expose the built HTTP service with its container port and `web: true`. Omit `label` for the primary endpoint. Follow the dev schema for additional endpoints, volumes, health checks, and inline configuration.

Use literal service environment values in preview Compose. Keep test secrets in a gitignored `.env.local`. The CLI sends those values separately from the source archive. The preview does not support Compose interpolation or published `x-zenith.env` mappings. Consult the local environment policy before choosing names, and preserve existing ignore rules.

Run `zenith check`, then use `zenith-test` to exercise the live preview. Correct manifest and runtime failures before calling the app ready.

## Prepare a public submission

Commit and push the Dockerfile, app source, and `zenith-compose.yml` to the public GitHub repository when the user authorizes submission. Keep `build: .` for the built app. Zenith builds the pinned GitHub commit for publication. A prepublished image is also supported; publishing to GHCR is optional.

Use the public schema for the submitted manifest. Published `x-zenith.env` can map generated values, inputs, aliases, and built-ins to the app's environment names. Published `x-zenith.storage` describes its declared persistent volumes. Read [published environment](references/published-environment.md) when configuring credentials or mail.

`zenith check` validates the preview form. A manifest with published `x-zenith.env` or storage metadata can fail preview checks while remaining eligible for publication. The submission checks the file at the selected GitHub commit. Preserve an intentional preview variant separately if needed, and make clear which commit and manifest were tested. Use `zenith-publish` for listing metadata, screenshots, and submission status.
