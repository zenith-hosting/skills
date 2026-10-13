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

The Compose skill bundles exact copies of the public schema, the development restrictions, and the local environment policy from Zenith's `contract` folder. Preview validation uses both schemas and the CLI's semantic checks. The dev schema alone does not define the complete document.

Refresh the public files from a checkout containing the intended contract revision:

```sh
node scripts/sync-contract.mjs /path/to/zenith-checkout
```

The helper copies only its three allowlisted files. It records the source Git commit and SHA-256 hashes in `skills/zenith-compose/references/contract-source.json`, and refuses modified source contract files. Review the resulting diff and keep the CLI's contract snapshots aligned with that revision. Edit the source contract rather than maintaining another specification in skill prose.
