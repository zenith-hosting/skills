---
name: zenith-setup
description: Install the Zenith CLI and prepare a local app for checking, preview, or publishing.
---

# Zenith setup

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
