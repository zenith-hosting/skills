# Zenith compose contract

This is the working checklist for the public developer-submission contract for a repository-root `zenith-compose.yml`. It is not the private Zenith catalogue workflow. Before generating or approving a manifest, fetch `https://docs.zenith.hosting/llms.txt` and read the complete live **Create zenith-compose.yml** and **zenith-compose.yml reference** pages it links. The live reference is authoritative when this checklist lags it.

## Hard validation rules

The file must be non-empty, no larger than 128 KiB, and contain at least one Compose service. Every service that renders must have an `image`; `build` alone does not work. YAML mapping keys must be unique at every level. A repeated key such as two `environment:` blocks on one service is invalid even when a permissive YAML reader silently keeps the last value; never rely on merge-by-repetition.

The submission loader uses an empty environment and will not read supporting files. These forms are rejected:

- top-level `include`
- service `extends`
- service `env_file`
- any bind mount, including `./data:/data` and absolute host paths
- top-level `configs` or `secrets` entries that use `file`

Do not leave `${VAR}` for Zenith to fill. Put a fixed non-secret value directly in `environment`, or declare a resolved value under `x-zenith.env`.

Service names must render as distinct DNS labels. Zenith converts underscores to hyphens, so `web_api` and `web-api` collide. Do not start a service name with `zenith-ready-`. Keep names lowercase and simple.

The rendered stack must not contain legacy `{{ZENITH_*}}` tokens.

## Required x-zenith shape

Start the file with the developer-page URL comment below and one blank line before the YAML content. Use the plain URL, not Markdown link syntax.

```yaml
# https://zenith.hosting/developers

x-zenith:
  catalog:
    name: My App
  expose:
    - service: app
      port: 8080
      web: true
```

`catalog.name` must be non-empty.

`expose` must contain exactly one entry. It needs only the documented fields:

- `service`, matching a Compose service exactly
- `port`, from `1` through `65535`
- `web`, explicitly set to `true` or `false`

Do not add a `label`, protocol, hostname, or other endpoint field. Zenith creates the public HTTP route and terminates TLS. Use `web: true` for the app-facing HTTP service so owner-added environment variables target it.

Unknown `x-zenith` fields fail the typed parser. The supported top-level fields are `catalog`, `expose`, `storage`, `configs`, and `env`. Use only fields needed by this repository-root proposal. Within them, use only fields in the live complete reference. For example, `x-zenith.configs` is reserved metadata and is not applied at runtime; do not depend on it for configuration.

## Services and ports

Zenith runs one container per Compose service. It uses `image`, `entrypoint`, `command`, `working_dir`, `environment`, `user`, `healthcheck`, named volumes, and supported `depends_on` behavior when rendering the deployment.

All services share private in-deployment networking and resolve each other by service name. A sibling does not need a published host port to be reachable. Keep a service's `ports` entry only when the app or a health-gated dependency needs that declared port. The `x-zenith.expose` port is added to the public app service automatically.

Each service needs a registry image that the Zenith cluster can pull without repository-local build context. Zenith accepts image tags, but this skill produces anonymously verified immutable digests so the proposed release is reproducible. Require `linux/amd64` for production; preserve the index digest when the image includes multiple platforms.

## Persistence

Use top-level named Compose volumes for state. The example image below is illustrative; replace it with the verified image digest:

```yaml
x-zenith:
  catalog:
    name: My App
  expose:
    - { service: app, port: 8080, web: true }
  storage:
    data:
      volume: app-data
      label: App data
      description: Uploaded files and application state.
      default_size: 2Gi

services:
  app:
    image: ghcr.io/example/my-app@sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
    volumes:
      - app-data:/var/lib/my-app

volumes:
  app-data:
```

Each `storage` entry supports `volume`, `label`, `description`, `default_size`, and optional `public`. `volume` must match a non-external top-level named volume. Use a Kubernetes quantity such as `1Gi`, `2Gi`, or `5Gi` for `default_size`.

Do not persist caches or reproducible build output. Do persist databases, uploads, keys, and application state that must survive a restart.

## Runtime configuration consistency

Treat `x-zenith.env` as an override layer, not a substitute for understanding the Compose service definitions. For every declaration:

1. identify each process that reads the variable from code, entrypoint, or upstream image documentation;
2. list those exact services in `services` (or deliberately omit `services` to target all of them);
3. put a syntactically valid non-secret placeholder in each targeted service's normal `environment` block when that makes the standalone Compose model runnable;
4. verify that all references to one generated credential resolve to the same declaration; and
5. distinguish image-build values from container-runtime values—Zenith injection cannot rewrite client configuration already compiled into an image.

For a database password, the generated value must be injected into the database service under the variable its image consumes, and client connection strings must reference that same declaration. A generated password placed only in client URLs leaves the database initialized with a different or missing password. Likewise, every process that mints or verifies shared sessions needs the same application secret. Do not scope a required value to only one consumer because the manifest still parses.

A Compose config render cannot resolve Zenith declarations and does not prove these relationships. Review the `x-zenith.env` service scopes and templates explicitly, then boot with representative resolved values.

## Useful Compose behavior

Keep a dependency health check when the app must wait for that dependency. Pair it with long-form `depends_on` and `condition: service_healthy`. Every `service_healthy` target must define a working health check using tools present in that image. Do not add this gate without evidence of a startup race or an upstream requirement.

Zenith terminates TLS before traffic reaches the app. Configure the container for plain HTTP on its internal port unless the image requires something else. If the app needs its canonical external URL or host, declare the appropriate built-in alias from [environment.md](environment.md).

The public proposal contains no `internal.yml`, pricing, resource sizing, product ID, or cluster placement fields.

## Validation evidence

Validate the final file after the last edit, not a draft or source Compose file:

```sh
docker compose -f zenith-compose.yml config --quiet
```

Also inspect the rendered output and compare it with `x-zenith.env`, because Compose preserves the extension block but does not apply Zenith aliases, generators, templates, service targeting, or strict schema rules. Run the actual manifest with representative resolved values and request every public readiness route. A separate image smoke script using manually supplied `docker run` arguments proves the image can boot; it does not prove `zenith-compose.yml` supplies the same commands, environment, dependencies, and mounts.

Keep manifest validation runnable on compose-only pull requests. If a workflow uses path filters to avoid republishing images for manifest edits, provide an unfiltered validation path or a dedicated manifest job so required checks do not disappear. Report contract or runtime checks that could not run as unverified rather than a pass.
