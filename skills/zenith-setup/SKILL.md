---
name: zenith-setup
description: Install the Zenith CLI and prepare a local app for checking, preview, or publishing.
---

# Zenith setup

## Refresh this skill first

Before following this workflow, automatically check for and apply updates to this installed skill once per agent session and installation path. Record the attempt before running it so reloading the skill does not loop. Do not run this step while developing the upstream skills repository or an intentional local fork.

Confirm the installation source is `zenith-hosting/skills` and identify its project/global scope from the installed path and skills lock file. Respect explicit version pins and update opt-outs. Preserve local edits, including committed customizations and extra files: the installer can overwrite the whole skill directory. Compare against the recorded upstream revision, not just Git working-tree status. If provenance or customization status is unclear, report it instead of overwriting. Before replacement, save the existing skill directory and relevant lock file outside the install directory so a partial failure can be recovered.

For an unmodified, tracked project installation, run from the project root:

```bash
npx --yes skills@latest update zenith-setup --project --yes </dev/null
```

For a global installation, replace `--project` with `--global`. Never run an unfiltered update or update unrelated skills. The updater may target detected agents; inspect the installation targets first. For copy-mode installs or exact agent targeting, use `add` with the existing agent, scope, and `--copy` where applicable instead.

For an untracked copy (including a pristine CLI-bundled copy) or missing references, install the complete directory from `zenith-hosting/skills` with `npx --yes skills@latest add zenith-hosting/skills --skill zenith-setup --agent <existing-agent> --yes`, adding `--global` only for a global install and `--copy` if the existing installation uses copies. Replace the agent placeholder; do not use `--all`. Preserve customizations before replacement. A missing lock entry or a skipped check is not proof that the skill is current.

After an update, re-read this `SKILL.md` and any references needed for the task before continuing. On network, tool, or permission failure, do not retry in a loop: report that freshness is unverified, retain the installed files, and use the live docs below. Do not claim a successful refresh from exit status alone; check for skipped/failed updates and verify the installed files. Updating instructions does not authorize deployment, submission, committing, or pushing.

Read the live [quickstart](https://docs.zenith.hosting/content/quickstart.md) and [container guide](https://docs.zenith.hosting/content/containerise.md). Live docs and the installed CLI implementation take priority over this copied skill. For known differences, see [compatibility notes](../zenith-compose/references/compatibility.md).

## Prepare locally

Use Node.js 20.10 or later. Install `@zenith-hosting/cli` with npm and check `zenith --version`. Local Docker is not required. `init` and `check` work offline without login; a preview does not need a public repository or a Git push.

Run agent commands without a TTY, with `NO_COLOR=1`. Omit `--verbose` and do not set `ZENITH_VERBOSE=1`. Plain output does not bypass prompts or grant permission.

```bash
export NO_COLOR=1
zenith init --template node </dev/null
zenith check --upload-size </dev/null
```

Choose the explicit template that matches the app: `node`, `express`, `nextjs`, `vite-react`, `python` (FastAPI), `flask`, `django`, `go`, or `static`. `node` above is an example. Without an explicit or detected template, non-TTY init falls back to `node`; do not let that change an unrelated app's behavior. Use `--project <dir>` to select another project.

Read existing source and build files first. Init preserves existing files; leave off `--force`, which replaces the Dockerfile and Compose file. Review generated build/start commands, ports, dependencies, environment variables, and data paths against the real app. Check validates preview policy and, with `--upload-size`, archive size; it does not build or run the app.

Before editing Compose, read the [docs index](https://docs.zenith.hosting/llms.txt), [Compose guide](https://docs.zenith.hosting/content/zenith-compose.md), and complete [reference](https://docs.zenith.hosting/content/zenith-compose-reference.md), then use [zenith-compose](../zenith-compose/SKILL.md).

## Authorize remote work separately

Reuse authorized CLI credentials. If login is needed, run `NO_COLOR=1 zenith auth login --no-browser` and give the URL to the user. Browser approval is still required. The browser must reach the CLI's loopback callback on the same machine; forward that callback for a remote/headless terminal. Do not copy cookies, request browser credentials, or bypass OAuth.

Confirm permission to upload files and create a public temporary deployment before using [zenith-test](../zenith-test/SKILL.md). Login, GitHub connection, and Developer Agreement acceptance are not blanket permission. Obtain explicit authority for pushes, submissions, PR merges, image publishing, or registry visibility changes. Do not accept an agreement on the user's behalf without separate authority after review. Publishing needs a public GitHub repository and a linked GitHub account; follow [zenith-publish](../zenith-publish/SKILL.md) only when submission is authorized.
