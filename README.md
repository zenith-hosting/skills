# Zenith skills

Agent skills for preparing, previewing, and publishing apps on [Zenith](https://zenith.hosting) with the [Zenith CLI](https://github.com/zenith-hosting/zenith-cli).

## Install

Install the collection in your app repository:

```sh
npx skills add zenith-hosting/skills
```

Select one skill with `--skill zenith-compose`, target an agent with `--agent codex`, or install globally with `--global`.

Separately, `zenith init` adds the four skill files bundled with the installed CLI package under `.agents/skills/`, preserving existing skill files. It does not fetch this repository or refresh its references. The current CLI has no `zenith skills install` command. Install this collection as a complete skill directory, including Compose references; do not replace only its `SKILL.md`.

| Skill | Use it to |
| --- | --- |
| [zenith-setup](skills/zenith-setup/SKILL.md) | Install the CLI, sign in, and initialise an app repository. |
| [zenith-compose](skills/zenith-compose/SKILL.md) | Adapt the Dockerfile and Compose manifest using the shared contract. |
| [zenith-test](skills/zenith-test/SKILL.md) | Check the project and exercise a live preview. |
| [zenith-publish](skills/zenith-publish/SKILL.md) | Submit a public GitHub commit and follow review feedback. |

`zenith-compose` replaces `create-zenith-compose`. Published source builds use the pinned GitHub commit; a separately published registry image is optional. A submission enters review before it becomes a live catalogue listing.

## Sources of truth

Read the [live docs index](https://docs.zenith.hosting/llms.txt) and relevant guides before acting. The docs and [CLI implementation](https://github.com/zenith-hosting/zenith-cli) are authoritative, not these skills or the CLI's bundled skill copies. The docs define public runtime support; local CLI checks do not prove server support.

See [known docs–CLI differences](skills/zenith-compose/references/compatibility.md) before relying on preview features or image reuse. Report unresolved differences and record the installed CLI version. Do not silently choose a copied schema over live documentation.

## Maintain the Compose contract

The Compose skill derives structural snapshots from the public CLI's `src/lint/` files. It filters developer-facing Zenith fields, including migration-only `env.legacy`, and retains the CLI's preview schema and local environment policy. The preview schema alone does not define the complete document. Both schemas still need CLI semantic checks and the live docs' runtime/submission rules. Generic Compose schema acceptance is not a compatibility promise.

Refresh the public files from a checkout containing the intended contract revision:

```sh
node scripts/sync-contract.mjs /path/to/zenith-cli-checkout
```

The helper reads only `src/lint/compose.schema.json`, `src/lint/dev-compose.schema.json`, and `src/lint/dev-env-policy.json`. It filters Zenith fields and prunes unused definitions. It adjusts config-mode and dependency-ordering descriptions to the documented Zenith behavior. New required fields outside the allowlists or changed description targets stop synchronization for review.

It records the source repository, Git commit, paths, and source/distribution hashes in `skills/zenith-compose/references/contract-source.json`, and refuses modified source files. Provenance proves where a snapshot came from, not that it matches a deployed service.

When updating, review the live docs, CLI semantic checks, field allowlists, compatibility notes, and examples together. Run the helper twice to check deterministic output and verify the recorded hashes. Keep the CLI-bundled skills aligned in a separate CLI change; updating this repository does not update an installed CLI or existing app repositories.
