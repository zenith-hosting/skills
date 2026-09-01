# Zenith skills

Agent skills for publishing apps on [Zenith](https://zenith.hosting).

## Install

Install the Zenith Compose skill into your current project:

```sh
npx skills add zenith-hosting/skills --skill create-zenith-compose
```

Install it globally:

```sh
npx skills add zenith-hosting/skills --skill create-zenith-compose --global
```

The CLI detects supported agents and lets you choose where to install the skill. To target Codex directly:

```sh
npx skills add zenith-hosting/skills --skill create-zenith-compose --agent codex
```

## Skills

### `create-zenith-compose`

Inspects an application repository and creates the root `zenith-compose.yml` Zenith needs for review. It can adapt an existing Compose stack or work from container documentation, Dockerfiles, release workflows, and startup code. If the project has no public image, it guides the owner through publishing one with GHCR first.

Update an installed copy with:

```sh
npx skills update create-zenith-compose
```
