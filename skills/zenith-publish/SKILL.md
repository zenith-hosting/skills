---
name: zenith-publish
description: Submit an authorized public GitHub commit and accurate listing, then track Zenith review and updates.
---

# Zenith publish

Read the live [publishing guide](https://docs.zenith.hosting/content/publish.md), [quickstart](https://docs.zenith.hosting/content/quickstart.md), and [container guide](https://docs.zenith.hosting/content/containerise.md). This copied skill is not the source of truth. Check the CLI implementation and [compatibility notes](../zenith-compose/references/compatibility.md) where docs differ.

## Permission and source

Obtain explicit permission to submit this app. Login, GitHub connection, and prior Developer Agreement acceptance do not authorize every external action. Pushes, PR merges, image publishing, and registry visibility changes need their own explicit authority. Do not fabricate publication rights, identities, licenses, or screenshots.

Reuse authorized credentials; use [setup](../zenith-setup/SKILL.md) for browser/loopback login if needed. Zenith login does not connect GitHub. If linked accounts are ambiguous, use `--github-account-id <id>` (alias `--github-account`) or `ZENITH_GITHUB_ACCOUNT_ID` for the intended account.

The first submission needs Developer Agreement acceptance for the repository. Have an authorized person review it. Use `--accept-agreement` only with explicit authority to accept after that review, not as a routine headless flag. The CLI sets metadata `authorized: true`; this is a declaration, not evidence of actual permission.

Select a full 40-character SHA already pushed to a public GitHub repository. Verify that commit contains root `zenith-compose.yml`, root `Dockerfile` (even for image-only apps), and required source. Default source is GitHub `origin` and local HEAD; use `--owner`, `--repo`, and `--commit` to be explicit. Local dirty changes are not published. Do not push them without permission.

For new code, run `zenith check --upload-size` and an authorized [preview](../zenith-test/SKILL.md) as appropriate. Resolve preview-policy limits rather than treating a check as a runtime test. Image-only apps can publish but cannot use the one-built-app preview path. Record tested commit, dirty changes, flows, and differences from the selected SHA. A matching preview is recommended, not required by submission.

**Build compatibility:** current live publish/container docs describe a separate pinned-GitHub build. The inspected CLI sends the last successful preview session ID and handles `reusedPreview`. A compatible backend can verify preview source against the pinned commit and reuse its image, including a formerly dirty preview whose files now match. Without reusable evidence it falls back to building the pinned GitHub commit. Trust the actual artifact result, not matching HEAD alone. This is not an unconditional production reuse or runtime-equivalence guarantee. Keep `build: .` for a built app; no GHCR push is needed. Image-based services must be anonymously pullable.

## Listing and assets

Use accurate values in `listing.json`; replace the example identity, contact, and license with verified facts:

```json
{
  "productName": "Team Notes",
  "category": "Productivity",
  "description": "A shared notebook for small teams.",
  "detail": "Create, organize, and search team notes in a browser.",
  "maintainerName": "Team Notes maintainers",
  "contactEmail": "maintainer@example.com",
  "license": "MIT",
  "website": "",
  "supportUrl": "",
  "alternatives": [],
  "partnershipNotes": ""
}
```

Categories: `Business`, `Communication`, `Developer tools`, `Finance`, `Media`, `Productivity`, `Project management`, `Security`. Description: at most 300 characters. Detail: at most 1,000. JSON loading is not server validation.

Metadata and asset paths resolve from `--project` (default current directory). Icons and screenshots must be nonempty JPEG, PNG, or WebP, at most 2 MiB each. Supply at least one real app screenshot, not a synthetic image or placeholder. Repeated `--screenshot` flags replace all saved screenshots; the first is the cover. Omit replacements to retain saved screenshots. Omit `--icon` to retain the metadata/saved icon.

Run without a TTY, with `NO_COLOR=1`. Omit `--verbose` and do not set `ZENITH_VERBOSE=1`. Supply `--metadata`: screenshot flags are processed in the metadata-file branch, not the interactive listing branch. Flags alone do not avoid listing prompts. Plain output does not authorize submission or agreement acceptance.

After permission, source checks, and agreement acceptance:

```bash
export NO_COLOR=1
zenith publish --commit <full-sha> --metadata listing.json \
  --icon assets/icon.png --screenshot screenshots/home.png </dev/null
zenith publish status </dev/null
```

## State, recovery, and success

Run `zenith publish status` before revisions and after interruptions. Use implementation states, not a command name alone:

| State | Action |
| --- | --- |
| No prior submission | `zenith publish` creates a submission. |
| `in_progress` with review `changes_requested`, `rejected`, or `withdrawn` | `zenith publish resubmit` can revise code/listing after feedback. |
| `merged` with review `published` | `zenith publish update-code` requires a different SHA; `update-listing` keeps the previous pinned SHA. |
| Prior pinned receipt in either revision-eligible state above | `update-listing` may change listing only; it ignores a new `--commit`. Use `--metadata` for noninteractive updates. |
| In review or any other non-revisable state | Do not revise; inspect feedback and wait. |
| `receiptPending` with a saved recovery snapshot | Recover that receipt, not a new version. Check status first. |

Pending-receipt recovery preserves the saved commit, metadata, assets, and submission version. Replacement metadata, icon, and screenshot flags are ignored; a conflicting explicit commit is rejected. Do not retry an interrupted command with new content and assume it was applied. If the snapshot is unavailable, stop and report the recovery error. Submission modes still have their own eligibility checks.

If a build fails or times out, inspect the artifact ID, error, and dashboard details first. It may be a source, dependency, authorization, or platform problem; do not always change source. For a confirmed source fix, check/preview again as appropriate, then obtain any needed push authority and submit the correct SHA in an eligible state. A started build may still be running after the CLI stops waiting.

A completed build is not a successful submission. Keep the receipt and verify status. Report the exact command, repository, full SHA, preview evidence and differences, artifact/reuse result, receipt product ID, submission version, review status, and remaining errors. A push alone does not update a submission or deployment. Submission enters review; do not claim marketplace publication until status confirms it.
