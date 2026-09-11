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

The example variable names are illustrative. Use the exact names the app actually reads.

## SMTP when the app supports it

During onboarding and maintenance, inspect the app's production configuration, mailer code, and documentation for external SMTP support. If SMTP powers an existing feature such as password resets, invitations, or notifications, configure it in `zenith-compose.yml` rather than leaving the owner to discover and supply a separate mail provider.

- Alias the app's host, port, authentication username/password, and sender-address settings to `ZENITH_SMTP_HOST`, `ZENITH_SMTP_PORT`, `ZENITH_SMTP_USER`, `ZENITH_SMTP_PASS`, and `ZENITH_SMTP_FROM` as shown above. Zenith supplies these values; do not ask the owner to enter them or hardcode credentials.
- Zenith's relay uses port **587 with authenticated STARTTLS**, not implicit TLS on port 465. Set the app's documented transport, authentication, and certificate-verification options in its normal Compose `environment`. Preserve certificate verification; do not guess that a variable named `SECURE` means STARTTLS.
- Use `ZENITH_SMTP_FROM` for the sender address. `ZENITH_SMTP_DISPLAY` may supply a supported sender-name field; it is not an email address. Do not substitute the deployment owner's email as the sender.
- Scope aliases with `services` when only the app or a mail worker needs them, and configure every process that actually sends mail. Do not inject mail credentials into unrelated databases or caches.
- For DSN-only mailers, alias the username and password with `transform: urlencode`, then reference those encoded declarations in a `template`. Encode each credential component, not the whole DSN. Determine the scheme and STARTTLS parameters from that mailer's documentation.

If configuration is available only through an interactive admin screen or an unsupported manifest mechanism, explain that limitation instead of inventing environment variables. Apps with no outbound-mail feature need no SMTP entries or extra mail service. A commented-out or unused mail example is not evidence of active support.

Validate the app's configuration and, where testable, trigger a real reset, invitation, or notification using a disposable SMTP test sink in CI. Confirm the recipient, sender, and content; a successful TCP connection alone does not prove the app sends mail. A test sink does not prove delivery through Zenith's real STARTTLS relay. Report separately what was configured, what was tested, and any live delivery verification still needed; do not require production credentials for local or CI checks.

## Generated secrets

Use `generate` for an application secret that must remain stable across restarts. Do not hardcode a secret, use `${SECRET}`, or place a random literal in normal Compose environment.

The pattern uses RE2 syntax. Prefer the four-capture base64 pattern above for a 32-byte secret. Preserve required prefixes in the pattern, for example `base64:` for a Laravel application key. Use separate declarations for secrets that must differ.

Do not add a generated secret because an upstream sample happens to include an optional one. Confirm that the app reads it and establish any length, alphabet, encoding, or prefix requirement from its code or documentation.
