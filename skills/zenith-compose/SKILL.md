---
name: zenith-compose
description: Create or adapt Dockerfile and zenith-compose.yml files using the live Zenith docs and CLI validation.
---

# Zenith Compose

## Read the current contract

Before editing or approving a manifest, read the [documentation index](https://docs.zenith.hosting/llms.txt), [Compose guide](https://docs.zenith.hosting/content/zenith-compose.md), and complete [Compose reference](https://docs.zenith.hosting/content/zenith-compose-reference.md). Before changing or verifying an image, also read the [container guide](https://docs.zenith.hosting/content/containerise.md).

The live docs and CLI are the sources of truth, not this skill. The docs define public runtime support; the installed CLI shows what its local validator checks. They currently differ. Read [known compatibility differences](references/compatibility.md), record `zenith --version`, and report unresolved conflicts. Do not infer deployed-server support from a passing local check or silently remove app features to fit a snapshot.

Bundled files are structural aids from the CLI revision in [contract-source.json](references/contract-source.json):

- [zenith-compose.schema.json](references/zenith-compose.schema.json) describes Compose structure and allowlisted public `x-zenith` fields.
- [zenith-dev-compose.schema.json](references/zenith-dev-compose.schema.json) adds that CLI revision's preview restrictions. Apply both schemas; neither replaces semantic checks.
- [dev-env-policy.json](references/dev-env-policy.json) describes local preview environment limits and reserved names, not the published environment policy.

Generic Compose fields in these schemas are not promises of Zenith runtime support. Generate only documented fields. In particular, do not infer support for `jobs` or `pre_start` from schema acceptance.

## Inspect the app

Preserve the app's build, entrypoint, HTTP port, dependencies, health checks, environment variables, and durable data. Bind HTTP to `0.0.0.0` and use service names for database addresses. Images must support `linux/amd64`, start without host files, and write logs to stdout/stderr. Store durable data in declared volumes. Never copy secrets or `.env` files into image layers.

Use actual catalog values: name, description, authors, tags, source URL, and license. Keep exactly one preview service with `build: .` and a root `Dockerfile`; do not also set `image` on it. Dependencies need public images that Zenith can pull without credentials. Pin versions rather than using `latest`.

## Prepare a preview

Read the live [preview policy](https://docs.zenith.hosting/content/up.md). Its documented conservative target is one built app plus up to four image services, with the built HTTP service exposed through `web: true` and no `label` on the primary endpoint. Include the port in Dockerfile `EXPOSE` to meet that documented target, although the current CLI treats it as optional.

The live docs restrict preview `x-zenith` to `catalog` and `expose` and require literal Compose values. The current CLI accepts environment mappings, storage/config metadata, image-based endpoints, and interpolation; its README describes preview environment and SMTP support. Do not claim those fields inherently fail the current checker. Use the compatibility notes to report the difference and verify the target service before depending on the broader behavior. Keep any deliberate preview variant separate and record which manifest was tested.

Use named volumes, documented health checks, and inline Compose configs for non-secret files. Do not use inline secret content: the CLI rejects it. Only long-form `depends_on` with `condition: service_healthy` creates a documented runtime wait. Config file mode defaults to `0644`. Do not rely on generic Compose ordering or mode defaults.

Keep test secrets in a gitignored `.env.local`. It permits at most 64 variables and 32 KiB; consult the local policy for reserved names. The CLI sends these values separately from the source archive. Other `.env` files are excluded. Do not depend on `env_file` or host environment inheritance. CLI acceptance of `${NAME}` does not evaluate it or supply a host value.

Run `NO_COLOR=1 zenith check --upload-size` without a TTY. Fix reported errors, then follow [zenith-test](../zenith-test/SKILL.md) for an authorized live test. Schema validation, local checks, and a ready URL alone do not prove that required app flows work.

## Prepare a public submission

Read [published environment](references/published-environment.md) for credentials and mail, then follow [zenith-publish](../zenith-publish/SKILL.md). Use `x-zenith.env` for deployment values and `x-zenith.storage` for declared persistent volumes, subject to the live reference's semantic rules.

Only with explicit authorization, commit and push the Dockerfile, app source, and manifest to a public GitHub repository. The docs require a root Dockerfile even for an image-only submission. Keep `build: .` for a built app; publishing an image to GHCR is optional. Do not add a registry publishing workflow or change registry visibility without authorization.

Publishing pins the public GitHub commit. A compatible server can reuse a source-verified successful preview image; otherwise it builds the pinned source. This differs from the live docs' separate-build wording. Do not promise either reuse or rebuilding; record the CLI result. Uncommitted source is not published.

`zenith check` checks the local preview form, not publication eligibility. An image-only manifest can be publishable without meeting preview build requirements. Publication validates the selected GitHub manifest. Record the tested commit, local changes, preview variant, and any differences from the submission.
