# Zenith compose contract

This is the public developer-submission contract for a repository-root `zenith-compose.yml`. It is not the private Zenith catalogue workflow.

## Hard validation rules

The file must be non-empty, no larger than 128 KiB, and contain at least one Compose service. Every service that renders must have an `image`; `build` alone does not work.

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

```yaml
x-zenith:
  catalog:
    name: My App
  expose:
    - service: app
      port: 8080
      web: true
```

`catalog.name` must be non-empty.

At least one `expose` entry is required. Each entry needs:

- `service`, matching a Compose service exactly
- `port`, from `1` through `65535`
- `web`, explicitly set to `true` or `false`

The entry with no `label` is the primary public host. A non-empty label creates another hostname prefix. Most submissions need one primary entry with `web: true`.

Unknown `x-zenith` fields fail the typed parser. The supported top-level fields are `catalog`, `expose`, `storage`, `configs`, and `env`. Use only fields needed by this repository-root proposal.

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

## Useful Compose behavior

Keep a dependency health check when the app must wait for that dependency. Pair it with long-form `depends_on` and `condition: service_healthy`. Do not add this gate without evidence of a startup race or an upstream requirement.

Zenith terminates TLS before traffic reaches the app. Configure the container for plain HTTP on its internal port unless the image requires something else. If the app needs its canonical external URL or host, declare the appropriate built-in alias from [environment.md](environment.md).

The public proposal contains no `internal.yml`, pricing, resource sizing, product ID, or cluster placement fields.
