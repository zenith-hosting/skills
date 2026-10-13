# Published environment

Read `$defs.envVar` and `$defs.input` in [the public schema](zenith-compose.schema.json) for accepted fields. These mappings apply to published products. Preview Compose accepts literal service environment values and separate `.env.local` values.

Use the app's actual environment names and scope each generated value to the services that consume it. For an app and Postgres that share a password, generate it once and alias it to the database variable. An input with `secret: true` marks a password for the deployment credentials panel:

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

Configure the app's STARTTLS switch according to its documentation. Use the supplied sender address. Apply the settings to every process that sends mail. For previews, use a separately reachable test SMTP server through `.env.local` when the app needs mail. Do not add email functionality merely to use these built-ins.
