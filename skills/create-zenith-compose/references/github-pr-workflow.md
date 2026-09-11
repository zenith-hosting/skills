# GitHub pull request workflow

Use this for onboarding and maintenance. Preserve the owner's checkout and existing GitHub work.

## Discover access before editing

Require a public GitHub repository, but not a particular CLI. Use an available authenticated GitHub connector/API for metadata, branches, commits, PRs, Actions runs/logs, and artifacts. Use normal Git over an already-working SSH or HTTPS transport where available. `gh` is an optional convenient equivalent:

```sh
gh auth status
gh repo view --json nameWithOwner,url,visibility,defaultBranchRef
git status --short
git fetch origin DEFAULT_BRANCH
```

Determine the real owner, visibility, and default branch. Check that the available route can publish a branch, open a PR, and write `.github/workflows` before preparing that workflow. A working `gh` login does not prove workflow-write permission. If HTTPS credentials cannot write workflows but existing Git SSH access can, use SSH; do not change the user's global credentials or remote unnecessarily. Do not request a PAT or broader scopes when an existing supported route works.

If no authenticated GitHub route exists, explain the one missing setup action. Do not require installing `gh` if the agent's connector can do the work. File preparation may continue without authentication when useful, but do not claim a PR exists or publication was verified. Local Docker is not required; CI is the required build/boot verification route.

## Resume instead of duplicating

Inspect open, closed, and merged Zenith PRs and workflow results. Prefer existing `zenith/containerize`, `zenith/compose`, or `zenith/update` branches when appropriate. Update an open PR when work remains; otherwise return its URL and the next owner action. Inspect why an earlier PR was closed before choosing a suffixed branch. Never force-push over someone else's work.

Base new work on the latest remote default branch. If the checkout is dirty or on another branch, use a temporary worktree when Git is available. Never stash, discard, or commit unrelated work. Remove a temporary worktree only after its work is pushed and it is clean; otherwise preserve and report its path.

## Commit and open the PR

Review the diff and stage exact owned paths. Include the persistent skill loader, relevant agent pointers/lock entry, deployment document, and checks in the appropriate onboarding PR. Include related docs or CI changes with maintenance updates. Do not use blanket staging in a dirty repository.

Use concise conventional commit/PR titles such as `feat: publish container image`, `feat: add Zenith deployment`, or `chore: update Zenith image`. Push the phase branch; never push the default branch. Use the available GitHub API/connector or `gh pr create` against the detected default branch.

The PR body names the behavior changed, actual verification and any missing checks, and the one owner action needed. Keep following available CI results and resolving repository/workflow failures within the authorized task. After an owner merge, automatically inspect the resulting publish run and continue the next phase while the session is active. Do not make the owner run registry commands or diagnose logs the agent can inspect.

Never merge or enable auto-merge. At an owner boundary, report one concrete action: merge the named ready PR, approve a confirmed GitHub setting, or return to Zenith after the repository is verified. Do not predict a private-package problem, ask for an extra skill invocation inside a continuing session, or silently create another PR when the existing one can be updated.
