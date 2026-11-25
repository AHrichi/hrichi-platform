# Agent instructions (hrichi-platform)

Shared instructions for every AI coding agent working in this repo: Claude Code, Antigravity, Codex, Cursor and others. `CLAUDE.md` and `GEMINI.md` point here; keep the rules in this one file.

The owner switches between agents mid-project. Any agent must be able to stop at any moment and another must be able to pick up from the repo alone, with no chat history. The protocol below makes that safe.

## 1. Where the state lives

| What                                                        | Where                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Platform architecture and rules                             | `docs/architecture.md`, `docs/adr/` (one ADR per significant decision) |
| **System Design course: current status, branch, next task** | `docs/system-design/AI_HANDOFF.md` (read it first)                     |
| System Design course: design, contracts, phases             | `docs/system-design/technical-design.md`                               |
| System Design course: writing lessons                       | `docs/system-design/lesson-authoring.md`                               |
| Learning Engine                                             | `docs/learning-engine/AI_HANDOFF.md`, `technical-design.md`            |
| **Greenhouse Labor Planner: status, branch, next task**     | `docs/greenhouse/AI_HANDOFF.md`, ADR-0026                              |
| **SerraCalc (greenhouse engineering): status, next task**   | `docs/serracalc/AI_HANDOFF.md`, ADR-0027                               |

The repo and these docs are the only memory. Don't rely on anything an earlier agent "knew".

## 2. Starting a session

1. `git fetch origin`, then read the hand-off for your area: section 0 names the working branch, section 2 the status, section 6 the next task.
2. Check where you are: `git status`, `git worktree list`, `git branch -vv`. If the working branch is checked out in another folder, someone else may be using it: work in that folder only if the owner says so, otherwise branch from its tip in your own folder.
3. Look for uncommitted work in the main checkout (`git -C <main checkout> status`). Uncommitted files belong to whoever made them. Never edit, stage, restore or delete them; ask the owner.
4. `pnpm install --frozen-lockfile`, then run the hand-off's "check it's green" command before changing anything.

## 3. While working

- **Small commits**, in conventional commit style (`feat(system-design): …`, `fix(…)`, `test(…)`, `docs(…)`). Each commit should lint, test and build.
- **Follow the hard rules** in the area's technical design (§0 for System Design): module boundaries, tokens-only `.scss`, logical properties, no `innerHTML`, no `@angular/animations`, reduced motion, axe-clean, typed copy files.
- **Don't weaken accessibility to quiet axe.** Fix the markup.
- **Only one agent per branch or checkout at a time.** Parallel work goes on separate branches, merged later.
- **Shared resources:**
  - The e2e needs ports 4200 and 4302–4314. Don't stop servers you didn't start. If a port is taken, say which process holds it and ask the owner.
  - Don't install global tools or change system settings.
- **Never commit secrets** (`.env.render`, tokens, chat ids). Never print them.

## 4. Stopping: always leave the repo ready to switch

Do this whenever you finish a task, hit a blocker, or the owner says to stop or switch:

1. **Commit everything**, even half-done work, as `wip(<scope>): <what is half done>`. Nothing valuable may stay uncommitted.
2. **Update the hand-off in the same push:**
   - §0: the working branch;
   - §2: the status table row, plus the "Verified" and "Not verified yet" lists;
   - §6: the exact next step.
3. **Push the branch** (`git push -u origin <branch>`). A branch that is only local can't be resumed elsewhere.
4. **Report to the owner:** the branch, the last commit, what is verified, what isn't, and the next step.

The next agent should be able to start from §2 above with nothing else.

## 5. Commands that matter

```bash
pnpm install --frozen-lockfile
pnpm nx run-many -t lint test build -p <projects> --output-style=static
pnpm exec stylelint "<paths>/**/*.scss"
pnpm nx format:check            # fix with: pnpm exec prettier --write <paths>
pnpm check:zoneless
node tools/scripts/export-graph.mjs   # after adding or rewiring projects; commit graph.json
```

**System Design e2e:** free the ports first, then run it as CI does:

```bash
CI=1 pnpm exec playwright test -c apps/portfolio/shell-e2e/playwright.config.mts apps/portfolio/shell-e2e/src/system-design.spec.ts --reporter=line
```

Without `CI=1`, the shell's dev server fails in a worktree, and `nx e2e shell-e2e` can hang. `--testFile` doesn't work with this Vitest setup; put the filter after `--`.
