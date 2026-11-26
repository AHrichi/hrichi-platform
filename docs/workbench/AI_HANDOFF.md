# AI handoff: Project Workbench (hrichi-platform)

A briefing for whichever AI agent picks up the Project Workbench. It assumes no memory of earlier sessions. [AGENTS.md](../../AGENTS.md) has the protocol; the plan is [technical-design.md](technical-design.md).

Last updated 2026-11-26: **Phase 0 only. The plan is written and waits for the owner's approval. No feature code exists.**

## 0. Resume in five minutes

1. **Branch:** `docs/project-workbench-plan` (from `origin/main` at `f91cf0f`). It holds only this file, the plan and a row in `AGENTS.md`.
2. **Read** [technical-design.md](technical-design.md), especially §7 (slices) and §10 (open questions).
3. **Don't start W1** until the owner has approved the plan and answered §10, or told you to use the defaults written there.

## 1. What this is

A place where the owner saves project ideas and grows each one into a complete build plan: dossier, tasks and budget, simulation, a 3D viewer, a canvas of IoT boards, and a Learn tab. The first project it must carry end to end is a DIY laser tag system.

## 2. Status

| Phase                      | State                             |
| -------------------------- | --------------------------------- |
| Phase 0: plan              | **Written, waiting for approval** |
| W1 Idea capture            | Not started                       |
| W2a Dossier                | Not started                       |
| W2b AI drafting            | Not started                       |
| W3 Tasks and budget        | Not started                       |
| W4 3D viewer               | Not started                       |
| W5a Canvas and boards      | Not started                       |
| W5b Hardware and telemetry | Not started                       |
| W6 Simulation              | Not started                       |
| W7 Learn                   | Not started                       |
| W8 Go-live (optional)      | Not started                       |

**Verified:** library licences, versions, dates and sizes on 2026-11-26 (npm registry, Bundlephobia, GitHub API; §3 and §11 of the plan).

**Not verified yet:** Foblex Flow and the Wokwi elements inside this repo's zoneless build and strict CSP (first job of W5a); esptool-js against a real board (W5b).

## 6. Next step

When the owner approves: write ADR-0032 from the plan with their answers, then start W1 on `feat/workbench-w1-ideas`. Copy file shapes from SerraCalc (`apps/products/serracalc/web`, `libs/products/serracalc/*`) and the Learning Engine.
