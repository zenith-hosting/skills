# Zenith skills

Agent skills for preparing, previewing, and publishing apps on [Zenith](https://zenith.hosting) with the [Zenith CLI](https://github.com/zenith-hosting/zenith-cli).

## Install

Install the collection in your app repository:

```sh
npx skills add zenith-hosting/skills
```

Select one skill with `--skill zenith-compose`, target an agent with `--agent codex`, or install globally with `--global`. The CLI's `zenith skills install` command installs the four skills from this repository.

| Skill | Use it to |
| --- | --- |
| [zenith-setup](skills/zenith-setup/SKILL.md) | Install the CLI, sign in, and initialise an app repository. |
| [zenith-compose](skills/zenith-compose/SKILL.md) | Adapt the Dockerfile and Compose manifest using the shared contract. |
| [zenith-test](skills/zenith-test/SKILL.md) | Check the project and exercise a live preview. |
| [zenith-publish](skills/zenith-publish/SKILL.md) | Submit a public GitHub commit and follow review feedback. |

`zenith-compose` replaces `create-zenith-compose`. Published source builds use the pinned GitHub commit; a separately published registry image is optional. A submission enters review before it becomes a live catalogue listing.

## Maintain the Compose contract

The Compose skill derives its developer schema from Zenith's `contract` folder using explicit allowlists for developer-facing Zenith fields. It bundles the development restrictions and local environment policy unchanged. Preview validation uses both schemas and the CLI's semantic checks. The dev schema alone does not define the complete document.

Refresh the public files from a checkout containing the intended contract revision:

```sh
node scripts/sync-contract.mjs /path/to/zenith-checkout
```

The helper reads only its three allowlisted source files. It filters Zenith fields against the developer allowlists and removes unused schema definitions before writing the skill's schema. New required fields outside those allowlists stop the sync for review. It records the source Git commit and hashes of both source and distributed files in `skills/zenith-compose/references/contract-source.json`, and refuses modified source contract files. Review contract changes and the developer allowlists together. Keep the CLI's validation snapshots aligned with the source revision.
