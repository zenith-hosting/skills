# Zenith skills

Agent skills for publishing and maintaining apps on [Zenith](https://zenith.hosting).

## Install

Install the skill into the app repository, then ask your agent to use it:

```sh
npx skills add zenith-hosting/skills --skill create-zenith-compose
```

To target Codex explicitly, add `--agent codex`. A global installation is also supported with `--global`, but onboarding still adds a committed project-local loader for other contributors and future agents.

Installing downloads the skill; it does not commit files or open PRs. The first authorized skill run includes the permanent loader, agent-discovery pointers, and project deployment guidance in the onboarding PR. Do not leave those files as unexplained uncommitted installer output.

## Create and maintain Zenith Compose

`create-zenith-compose` prepares a public GitHub repository for Zenith. If needed, it opens a container-publishing PR, follows the resulting CI run after the owner merges, then opens the pinned `zenith-compose.yml` PR. Existing manifests select maintenance mode rather than being assumed current.

Local Docker and an installed GitHub CLI are optional. The agent uses an available authenticated GitHub tool and Git transport; required builds and runtime checks run in CI. Production images target `linux/amd64`. ARM local testing is a separate developer setup concern.

The committed `.agents/skills/create-zenith-compose/SKILL.md` is a small pointer to the current upstream skill and specification. Project agent instructions direct future agents to consult it for deployment-affecting changes. Remote changes take effect when an agent next reads the loader, not continuously or as an automatic deployment. CI checks and reviewed digest updates complement agent guidance.

Owners retain control of merges, any confirmed package-visibility change, and Zenith submission/release. Publishing a new image does not automatically update a pinned manifest or running customers.
