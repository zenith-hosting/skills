# x-zenith environment values

Read this when the app needs deployment-specific values. Fixed non-secret settings belong in the Compose service's normal `environment` block.

## Declarations

```yaml
x-zenith:
  env:
    APP_URL: ZENITH_PUBLIC_URL
    APP_SECRET:
      generate: '([A-Za-z0-9+/]{11})([A-Za-z0-9+/]{11})([A-Za-z0-9+/]{11})([A-Za-z0-9+/]{9}[AQgw])='
      services: [app, worker]
    ADMIN_EMAIL:
      input:
        label: Admin email
        description: Email address used for the first administrator account.
        default_template: '{ZENITH_OWNER_EMAIL}'
        required: true
```

The map key is the exact environment variable injected into the container. It must match `^[A-Za-z_][A-Za-z0-9_]*$`.

A declaration needs an `input` or one computed source. The computed sources are mutually exclusive:

- `generate` mints and stores a value matching an RE2 pattern.
- `alias` copies another declaration or Zenith built-in. A bare string is shorthand for `alias`.
- `template` substitutes `{NAME}` references on every render.

Omit `services` to inject the value into every service. Set it to exact Compose service names when only part of the stack needs the value. An `x-zenith.env` value overrides a normal Compose `environment` value with the same name.

## Inputs

`input` supports `label`, `description`, `default`, `default_template`, `required`, `validator`, and `secret`.

Use an input when the owner must see or set the value. `validator` is an RE2 pattern applied to the whole value. Mark passwords and tokens with `secret: true`.

Use `default` for a fixed initial value. Use `default_template` when the app consumes a value once during first boot, such as an administrator email seeded from `{ZENITH_OWNER_EMAIL}`. Do not set both. Do not put either default beside `generate`, `alias`, or `template`.

Never seed an account with a placeholder address at `zenith.hosting`, `example.com`, `example.org`, or `example.net`. Use `default_template: '{ZENITH_OWNER_EMAIL}'` when the repository establishes that the app accepts an initial owner email.

## Built-ins

Built-ins are not injected automatically. Alias or reference only the ones the app needs.

| Name | Value |
|---|---|
| `ZENITH_PUBLIC_URL` | Verified custom-domain URL when mapped, otherwise the Zenith URL |
| `ZENITH_PUBLIC_HOST` | Host part of the public URL |
| `ZENITH_PUBLIC_URLS` | Zenith URL and custom URL, comma-separated |
| `ZENITH_PUBLIC_HOSTS` | Zenith host and custom host, comma-separated |
| `ZENITH_OWNER_EMAIL` | Deployment owner's account email |
| `ZENITH_SMTP_HOST` | Zenith SMTP host |
| `ZENITH_SMTP_PORT` | `587` |
| `ZENITH_SMTP_FROM` | Allowed sender address |
| `ZENITH_SMTP_DISPLAY` | Stable `*.zenith.hosting` display identity |
| `ZENITH_SMTP_USER` | Per-deployment SMTP username |
| `ZENITH_SMTP_PASS` | Per-deployment SMTP password |

Do not declare a built-in name as an environment key. Alias it to the variable the app expects:

```yaml
x-zenith:
  env:
    PUBLIC_BASE_URL: ZENITH_PUBLIC_URL
    SMTP_HOST: ZENITH_SMTP_HOST
    SMTP_PORT: ZENITH_SMTP_PORT
    SMTP_USERNAME: ZENITH_SMTP_USER
    SMTP_PASSWORD: ZENITH_SMTP_PASS
    SMTP_FROM: ZENITH_SMTP_FROM
```

Only add the SMTP mapping when repository evidence shows the app's mail variables and TLS mode. Zenith supplies credentials, but it cannot infer application-specific variable names or transport switches.

## Generated secrets

Use `generate` for an application secret that must remain stable across restarts. Do not hardcode a secret, use `${SECRET}`, or place a random literal in normal Compose environment.

The pattern uses RE2 syntax. Prefer the four-capture base64 pattern above for a 32-byte secret. Preserve required prefixes in the pattern, for example `base64:` for a Laravel application key. Use separate declarations for secrets that must differ.

Do not add a generated secret because an upstream sample happens to include an optional one. Confirm that the app reads it and establish any length, alphabet, encoding, or prefix requirement from its code or documentation.
