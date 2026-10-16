---
name: zenith-test
description: Validate and run a live Zenith preview from a prepared repository.
---

# Zenith test

Zenith includes outbound app email in previews and published apps. Use the platform SMTP relay through `x-zenith.env` for verification, password resets, invitations, and notifications. Read [the Compose email configuration](../zenith-compose/SKILL.md#email-is-part-of-the-platform); no separate provider account is required.

When the app uses email, verify the existing mail flow in the preview with a recipient approved for the test. Use the supplied sender and STARTTLS credentials.

Run `zenith check --upload-size` from the project root, fix errors, then run `zenith up`. Exercise the returned URL, including sign-in, database writes, and any background work the app requires. Use `zenith logs --source build` or `zenith logs --source runtime` for failures. `zenith down` explicitly stops the preview.

Each account has one live preview. A new preview of the same repository replaces its predecessor only after the new one is ready. If the live preview belongs to another repository, choose explicitly whether to replace it. Queue estimates describe time until building starts, not time until the URL is ready. Closing the CLI cancels a queued test; once building starts it continues. A ready preview remains until expiry or `zenith down`.

Record the commit actually tested. A later source change should be noted when publishing, but a matching preview is not required to submit.
