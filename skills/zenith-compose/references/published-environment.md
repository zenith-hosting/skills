# Published environment

Read the live [environment reference](https://docs.zenith.hosting/content/zenith-compose-reference.md) before configuring deployment values. `$defs.envVar` and `$defs.input` in [the bundled schema](zenith-compose.schema.json) are structural aids, not the runtime specification. The current CLI also supports these mappings for previews, while the live preview policy still rejects them. Follow [known compatibility differences](compatibility.md) rather than treating either a copied schema or a local check as proof of server support.

Use the app's actual environment names and scope each generated value to the services that consume it. For an app and Postgres that share a password, generate it once and alias it to the database variable. `input` makes a value available in the environment editor and adds display/validation metadata. `secret: true` masks non-generated values there; it is not a documented switch for a credentials panel. Generated inputs accept owner replacements:

## Shared credentials

```yaml
x-zenith:
  env:
    APP_DB_PASSWORD:
      generate: '([A-Za-z0-9_-]{16})([A-Za-z0-9_-]{16})'
      services: [app]
    POSTGRES_PASSWORD:
      alias: APP_DB_PASSWORD
      services: [db]
    APP_ADMIN_PASSWORD:
      generate: '([A-Za-z0-9_-]{8})([A-Za-z0-9_-]{8})'
      services: [app]
      input:
        label: Admin password
        secret: true
```

This fragment supplements the required catalog and expose fields. Replace example service and variable names with the app's own names. Establish password relationships from its configuration rather than assuming every app uses these variables.

## Mail

For an app that already sends mail, map its supported settings to Zenith's SMTP built-ins. For example, an app that consumes these variable names and supports STARTTLS on port 587 can use:

```yaml
x-zenith:
  env:
    SMTP_HOST: ZENITH_SMTP_HOST
    SMTP_PORT: ZENITH_SMTP_PORT
    SMTP_USERNAME: ZENITH_SMTP_USER
    SMTP_PASSWORD: ZENITH_SMTP_PASS
    SMTP_FROM: ZENITH_SMTP_FROM
```

Configure the app's STARTTLS switch according to its documentation. Use the supplied sender address. Apply the settings to every process that sends mail. The current CLI README describes these same mappings for previews on Zenith; do not copy Zenith relay credentials into `.env.local`. If you target the stricter documented preview policy or test outside Zenith, use a separately reachable test SMTP server with your own test credentials. Record which configuration was tested. Do not add email functionality merely to use these built-ins.

## Check semantic rules

A schema pass does not enforce all submission rules. Check the live reference, including:

- Each declaration needs `input` or one computed source: `generate`, `template`, or `alias`. Computed sources are mutually exclusive.
- `default` and `default_template` are mutually exclusive and cannot accompany a computed source.
- A required input must resolve non-empty at submission without owner input. Supply a valid default, default template, or computed source; do not assume the owner can fill it later.
- Static address defaults at `zenith.hosting`, `example.com`, `example.org`, or `example.net` fail submission validation. Use `default_template: '{ZENITH_OWNER_EMAIL}'` for an owner address.
- References must exist and must not form cycles. Every name in `services` must name a real service. Without this field, injection targets all services; mapped values replace Compose environment values with the same name.
- `argon2id` works only with input-only or generated values, not aliases or templates. `urlencode` applies to a URL component, not a whole URL.
- `legacy` is supported only for migrating an existing app's stored generated value. Omit it for new apps; old inline `{{ZENITH_*}}` tokens are not expanded.
- Generated and defaulted values are stored. Changing a pattern or default does not rotate an existing deployment's value. Aliases and templates resolve on every render.
- Use the published reference's reserved-name rules for `x-zenith.env`. The local preview environment policy does not override them.

Keep real credentials out of Compose, committed files, listing metadata, and image layers. Report unresolved validation errors rather than weakening the app's authentication or removing required services.
