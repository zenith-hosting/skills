# GitHub pull request workflow

Use this procedure for both phases. The goal is a reviewable PR without disturbing the owner's current work.

## Discover and resume

Require a Git repository with an `origin` hosted on GitHub and a working `gh` login. Determine the repository and default branch instead of assuming names:

```sh
gh auth status
gh repo view --json nameWithOwner,url,visibility,defaultBranchRef
git status --short
git fetch origin DEFAULT_BRANCH
```

Require `visibility` to be `PUBLIC` before making changes. Inspect existing open and merged PRs before creating a branch. Use `zenith/containerize` for the image phase and `zenith/compose` for the compose phase when those names are free. If a matching PR is open, fetch and work from that PR's head branch. Update it only when work remains. If it is ready, return its URL. If a same-named PR was closed without merging, inspect why and choose a suffixed branch rather than force-pushing over old work.

Base each phase on the latest `origin/DEFAULT_BRANCH`. If the owner's checkout has unrelated changes or is on another branch, use a temporary Git worktree from that ref. Never stash, discard, or commit their changes.

Remove a clean temporary worktree after its branch is pushed and the PR is open. If work is incomplete or the worktree is dirty, preserve it and report its path instead of deleting work.

## Commit and push

Review the diff and stage explicit phase-owned paths. Do not use a blanket `git add .` in a dirty repository. The container PR may include a minimal runtime or source change when the app otherwise binds to localhost or cannot start inside the image. Name that change in the PR body.

Use conventional commits:

- container phase: `feat: publish container image`
- compose phase: `feat: add Zenith deployment`

Push the phase branch with `git push -u origin BRANCH`. Do not push directly to the default branch and do not force-push.

## Open the PR

Open each PR against the detected default branch with `gh pr create`. Use the matching conventional commit text as the title. The body should say what changed, what was verified, and what the owner needs to do after merging.

Return the PR URL. The owner action should be one sentence:

- first PR: merge it, then continue this skill so it can verify the image and open the Zenith Compose PR;
- second PR: merge it, then return to Zenith and select the repository again.

Never merge either PR. Never enable auto-merge. Do not create a third PR when an existing phase PR can be updated.
