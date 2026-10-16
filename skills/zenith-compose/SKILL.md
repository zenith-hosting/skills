---
name: zenith-compose
description: Create or adapt Dockerfile and zenith-compose.yml files for Zenith previews and public app submissions using the shared Compose contract and built-in platform email.
---

# Zenith Compose

Inspect the app's build scripts, entrypoint, HTTP port, dependencies, health checks, environment variables, and durable data. Preserve the services the app needs. Bind HTTP to `0.0.0.0` in the container and use service names for database addresses.

## Email is part of the platform

Zenith provides outbound email through its authenticated SMTP relay for previews and published apps. Use it for verification emails, password resets, invitations, and app notifications. Configure the app's existing mail settings with `x-zenith.env`; no separate email-provider account or user-supplied SMTP credentials are needed.

```yaml
x-zenith:
  env:
    SMTP_HOST: ZENITH_SMTP_HOST
    SMTP_PORT: ZENITH_SMTP_PORT
    SMTP_USERNAME: ZENITH_SMTP_USER
    SMTP_PASSWORD: ZENITH_SMTP_PASS
    SMTP_FROM: ZENITH_SMTP_FROM
```

The names on the left must match the app's configuration. Enable authenticated STARTTLS on port 587 and use the supplied sender address. Include every service that sends email, including background workers. Zenith injects credentials at runtime; never copy them into source or `.env.local`. Read [environment and email](references/published-environment.md) for generated credentials and service scoping.

The relay is reachable inside Zenith deployments. A process running directly on a developer's laptop needs a local mail catcher or separately reachable SMTP service. Platform email here means outbound app mail, not an inbox or mailbox service.

## Read the contract

Use the bundled contract files as the specification. Read the definitions relevant to the manifest before editing it:

- [zenith-compose.schema.json](references/zenith-compose.schema.json) defines the developer Compose document and `x-zenith` fields. Start with `$defs.xZenith`, `catalog`, `expose`, and the service definitions.
- [zenith-dev-compose.schema.json](references/zenith-dev-compose.schema.json) adds source-build and primary HTTP endpoint requirements. Apply it together with the public schema. It does not replace the public schema.
- [dev-env-policy.json](references/dev-env-policy.json) defines permitted local environment names and reserved built-ins.

The contract files come from Zenith's `contract` folder. The Compose schema is filtered to developer-facing Zenith fields. Their source commit and source/distribution hashes are recorded in [contract-source.json](references/contract-source.json). Do not invent `x-zenith` fields or infer runtime support from generic Docker Compose alone. A schema pass does not cover every semantic restriction. Run `zenith check` for the installed CLI's preview checks and act on its errors.

## Prepare a preview

Keep one application service with `build: .` and a root `Dockerfile`. Use pullable images for its required dependencies. Previews use the same public `x-zenith` fields as published apps, including `env`, `storage`, and `configs`. The public schema requires the catalog's name, description, authors, tags, source URL, and license. Use the app's actual values.

Expose the HTTP service, whether it is built locally or uses a pullable image, with its container port and `web: true`. Omit `label` for the primary endpoint. Follow the dev schema for additional endpoints, volumes, health checks, and inline configuration.

Use `x-zenith.env` for platform email, generated secrets, aliases, and templates in both previews and published apps. Keep other local test secrets in a gitignored `.env.local`; the CLI sends them separately from source. Compose interpolation uses an empty host environment. Use `$$` for a literal dollar sign. Dockerfile `EXPOSE` is optional; `x-zenith.expose` declares the routed port. Preserve existing ignore rules.

Run `zenith check`, then use `zenith-test` to exercise the live preview. Correct manifest and runtime failures before calling the app ready.

## Prepare a public submission

Commit and push the Dockerfile, app source, and `zenith-compose.yml` to the public GitHub repository when the user authorizes submission. Keep `build: .` for the built app. Zenith reuses the last successful preview image when its server-verified source matches the pinned GitHub commit. Otherwise it builds that commit. A prepublished image is also supported; publishing to GHCR is optional.

Use the public schema for the submitted manifest. `x-zenith.env` can map generated values, inputs, aliases, and built-ins to the app's environment names. `x-zenith.storage` describes its declared persistent volumes. Read [published environment](references/published-environment.md) when configuring credentials or mail.

Use the same manifest for preview and publication, including email mappings. The submission checks the file at the selected GitHub commit. Preview parity and image reuse require the matching backend and CLI release; older versions may reject these fields or rebuild. Use `zenith-publish` for listing metadata, screenshots, and submission status.
