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

Prepares a public GitHub repository for Zenith with two small PRs. If the app has no public image, the skill containerizes it and opens a GHCR publishing PR. After that merges, it verifies the image, creates `zenith-compose.yml`, and opens the second PR. The owner only merges the PRs and makes a new GHCR package public when GitHub requires it.

Update an installed copy with:

```sh
npx skills update create-zenith-compose
```
