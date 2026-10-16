---
name: zenith-setup
description: Prepare a public app repository and install the Zenith CLI before testing or publishing.
---

# Zenith setup

Zenith includes outbound app email in previews and published apps. Use the platform SMTP relay through `x-zenith.env` for verification, password resets, invitations, and notifications. Read [the Compose email configuration](../zenith-compose/SKILL.md#email-is-part-of-the-platform); no separate provider account is required.

Install Node.js 20.10 or later and `@zenith-hosting/cli` from npm. Check `zenith --version`, then run `zenith auth login` once in the developer's browser. The account must have its GitHub identity connected before publishing. Do not ask for or store browser credentials in the repository.

You do not need Docker installed locally; Zenith builds and runs containers on the platform, so use `zenith up` for previews.

In the project root, run `zenith init`. In a new empty directory, select a tested framework starter. In an existing repo, inspect the generated Dockerfile and Compose file against the app's actual build, startup command, port, data services, and environment variables. Preserve existing working files. Run `zenith check` after adapting them.

Read `zenith-compose` when adapting Compose, `zenith-test` for a live preview, and `zenith-publish` before submission.
