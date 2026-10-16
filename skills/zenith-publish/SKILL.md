---
name: zenith-publish
description: Submit a public GitHub app commit to Zenith and follow its review with the CLI.
---

# Zenith publish

Zenith includes outbound app email in previews and published apps. Use the platform SMTP relay through `x-zenith.env` for verification, password resets, invitations, and notifications. Read [the Compose email configuration](../zenith-compose/SKILL.md#email-is-part-of-the-platform); no separate provider account is required.

Complete browser sign-in, GitHub connection, and one-time Developer Agreement acceptance for this app on the developer's account. An authorized agent can then prepare and submit from the CLI. Ensure the GitHub repository and selected commit are public, and pin a full commit SHA that exists on GitHub. Commit and push `zenith-compose.yml`, the Dockerfile, and app source. Keep `build: .` for a built app. Zenith reuses the last successful preview image when the backend verifies that its source matches the pinned GitHub commit. Otherwise, it builds that commit. The developer does not need to publish an image to GHCR. Supply a real screenshot of the running app, not a placeholder or synthetic image.

Run `zenith publish --commit <full-sha> --metadata listing.json --icon assets/icon.png --screenshot path.png` from the repository. The metadata file supplies listing fields, and screenshots may be repeated. Icons and screenshots accept JPEG, PNG, or WebP files up to 2 MB each. Relative paths resolve from `--project`. Omit `--icon` to keep the icon from the metadata file or saved submission. Read any warning that the submitted commit differs from the last preview. A preview of uncommitted changes can be reused after those exact changes are committed and pushed. Publishing never includes uncommitted source. Reuse requires the matching backend release. The CLI waits for the image and reports whether it reused the preview or built from GitHub. If it fails, fix the source, push a new commit, and run the command again. Keep the returned receipt. Use `zenith publish status` for review status and feedback. `zenith publish resubmit` retries a rejected submission, `zenith publish update-code` submits a different commit, and `zenith publish update-listing` changes only listing data while retaining the last pinned commit. These commands accept the same relevant metadata, icon, and screenshot flags.

For a noninteractive first submission, provide the required listing fields in `listing.json`; the screenshot flag supplies the image and the CLI records the authorization declaration:

```json
{
  "productName": "Example app",
  "category": "Productivity",
  "description": "A short, factual description of the app.",
  "detail": "What the app does and who it serves.",
  "maintainerName": "Your name or team",
  "contactEmail": "you@example.com",
  "license": "MIT",
  "website": "https://github.com/owner/repo",
  "supportUrl": "https://github.com/owner/repo/issues",
  "alternatives": [],
  "partnershipNotes": ""
}
```

Use a real contact address and the app's actual license. Accepted categories are Business, Communication, Developer tools, Finance, Media, Productivity, Project management, and Security. The short description is at most 300 characters; the detail is at most 1,000.

A submission enters review. It is not a live catalogue listing until approved and published.
