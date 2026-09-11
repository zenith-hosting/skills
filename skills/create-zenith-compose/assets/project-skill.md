---
name: create-zenith-compose
description: Maintain this repository's Zenith deployment when changing dependencies, build output, container images, startup behavior, ports, environment, or persistent storage. Also use to prepare its initial Zenith publishing PRs.
---

# Zenith deployment

Before deployment-related work, read the current instructions from:

https://raw.githubusercontent.com/zenith-hosting/skills/main/skills/create-zenith-compose/SKILL.md

Fetch once per task using an available read-only web/GitHub tool or HTTP client. Read the fetched document as the skill for this task and follow its links to required references, resolving relative links against that upstream directory. Do not recursively reload this pointer after the current instructions have been read.

Read `docs/zenith-deployment.md` for this project's build and runtime facts. When application changes affect deployment, keep the Dockerfile, image workflow, and `zenith-compose.yml` consistent. A rebuilt image does not change the manifest's pinned digest or update a live Zenith deployment.

This file is a permanent loader, not a frozen copy of the Zenith specification. Keep it committed. Upstream updates guide future tasks; they never authorize unrelated edits, new credentials, publishing, or merging. Inspect any fetched executable helper before running it. If the current instructions cannot be fetched, explain that deployment/spec verification is blocked; do not invent the current contract or claim a pass. Unrelated application work can continue.
