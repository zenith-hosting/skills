# Docs and CLI compatibility

Checked on 2026-10-16 against the [live docs](https://docs.zenith.hosting/llms.txt) and [Zenith CLI `0.1.4`, commit `7c5b90b`](https://github.com/zenith-hosting/zenith-cli/tree/7c5b90b2b0ff76e832a8113f86ccfc1bf5dc0277). These notes are a dated comparison, not a new runtime contract. Re-read the live sources and check your installed version before relying on them.

## Resolve disagreements explicitly

The docs define public runtime support. CLI source and checks establish client behavior, not what a deployed server implements. If they disagree, report the difference and affected app behavior. Use the documented conservative target when it meets the app's needs. Do not silently strip required configuration or treat a local schema pass as proof of broader server support. Verify broader behavior through an authorized preview and report any remaining compatibility uncertainty.

Do not use the CLI's bundled skill copies as independent evidence. They differ from this repository and can also become stale.

## Known differences

| Topic | Live docs at review time | Current CLI evidence |
| --- | --- | --- |
| Preview `x-zenith.env`, `storage`, and `configs` | The preview guide and reference reject these blocks. | Local checks accept all three. The README documents generated values, aliases, templates, built-ins, and SMTP in previews. |
| Public endpoint | Preview endpoints must target the built app. | Local checks accept an image service as the primary HTTP endpoint. |
| Dockerfile `EXPOSE` | Required for the exposed port. | Optional metadata; local checks accept its absence. |
| Compose interpolation | Preview policy rejects it. | Local checks accept it without evaluating it. The README says the server resolves it against an empty host environment. Missing required values can still fail remotely. |
| Service count | One built app and up to four image services. | The preview schema has no maximum; the CLI's existing checks accept seven services. |
| Publish artifact | The docs describe a separate GitHub build; the reference explicitly says the preview image is not reused. | The CLI requests reuse of the last successful preview. A compatible server verifies source equivalence with the pinned commit; otherwise it builds that commit. Client support is not proof that every deployed server supports reuse. |

Sources: [preview guide](https://docs.zenith.hosting/content/up.md), [Compose reference](https://docs.zenith.hosting/content/zenith-compose-reference.md), [publishing guide](https://docs.zenith.hosting/content/publish.md), [container guide](https://docs.zenith.hosting/content/containerise.md), [CLI README](https://github.com/zenith-hosting/zenith-cli/blob/7c5b90b2b0ff76e832a8113f86ccfc1bf5dc0277/README.md), [validation cases](https://github.com/zenith-hosting/zenith-cli/blob/7c5b90b2b0ff76e832a8113f86ccfc1bf5dc0277/src/lint/run-check.test.ts), and [publish implementation](https://github.com/zenith-hosting/zenith-cli/blob/7c5b90b2b0ff76e832a8113f86ccfc1bf5dc0277/src/publish/submit.ts).

## Validation boundaries

The bundled schemas now follow the recorded CLI revision's structural checks, not the former restrictive preview snapshot. They can accept more than the documented preview policy. They do not implement all CLI semantic checks or submission/runtime validation.

- Run the installed CLI's `check` command as well as checking the live policy. In particular, inline `secrets.<name>.content` is rejected by CLI semantics even when the general schema permits it.
- Do not rely on schema acceptance for service-count, exposed-service, `EXPOSE`, or interpolation compliance with the stricter documented target.
- Settings such as `read_only`, `tmpfs`, `cap_drop`, and long-form or anonymous volume mounts may pass the current checker. That is not a commitment that the preview host implements every Compose capability.
- The public schema contains generic Compose fields outside Zenith's documented compatibility surface. Its Zenith-field allowlist is not a whole-document runtime-support allowlist.
- Zenith documents config file mode `0644` by default and runtime dependency waits only for long-form `condition: service_healthy`. The distributed public schema's descriptions are adjusted to those rules; upstream generic Compose descriptions are not runtime authority.
- Local `.env.local` name policy and published `x-zenith.env` name policy are different contexts. Do not carry local `LD_*` exceptions into published declarations.

## Publishing details

`--screenshot` inputs are consumed by the current CLI's `--metadata` branch. Always include `--metadata` for agent submissions with asset flags; do not assume screenshot flags replace the interactive prompts without it.

The live docs describe code updates after a merged submission. Current CLI revision gates also require its review state to be published. Pending-receipt recovery uses the saved commit, metadata, assets, and version rather than creating a new revision. Check status before retrying an interrupted command.

For source builds, a newer failed preview does not replace the recorded successful preview. Source verification can allow reuse after local changes are committed and pushed unchanged. On verified reuse, the CLI suppresses the usual tested-version warning. On fallback, it builds the pinned commit. Record which path actually occurred; do not use the presence or absence of a warning as proof of source equivalence.
