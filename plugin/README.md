# uc-taskmanager

**Universal Claude Task Manager** — A WORK-PIPELINE Agent that executes SDD (Specification-Driven Development) for Claude Code.

It formalizes user requirements into specifications, builds execution plans (WORK), decomposes them into tasks (TASK) with dependency graphs (DAG), then automatically executes TASKs through a 6-agent pipeline.

Install from the Claude Marketplace — no terminal, no CLI setup required.

---

## What It Does

uc-taskmanager gives Claude Code a structured, multi-agent pipeline for handling software tasks of any complexity. Instead of doing everything in one long conversation, requests are routed through isolated subagents — keeping context clean, results traceable, and quality consistent.

Prefix any request with a `[]` tag to trigger the pipeline:

```
> [new-feature] Add user authentication
> [bugfix] Fix the login button on mobile
> [enhancement] Add rate limiting to the API
```

---

## How It Works

```
User Request with [] tag
        │
        ▼
    Specifier ──── analyzes requirement, creates Requirement.md
        │           determines execution-mode
        │
   ┌────┼────────────────┐
   ▼    ▼                ▼
 direct  pipeline         full
   │    │                │
   │    ▼                ▼
   │  Planner          Planner ── TASK decomposition + DAG
   │    │                │
   │    ▼                ▼
   │  Main Claude      Scheduler ── DAG-based orchestration
   │    │                │
   ▼    ▼                ▼
  Builder → Verifier → Committer  (× N for full mode)
```

---

## Agents

6 pipeline agents work together through Main Claude orchestration:

| Agent | Role | Model |
|-------|------|-------|
| **specifier** | Analyzes user request → creates `Requirement.md` → determines execution-mode (direct/pipeline/full). In direct mode, also acts as Planner. | opus |
| **planner** | Reads `Requirement.md` → creates WORK plan + decomposes into TASKs with dependency DAG | opus |
| **scheduler** | Manages DAG → selects READY TASKs → dispatches builder/verifier/committer pipeline | haiku |
| **builder** | Implements code changes, records progress checkpoints, runs self-check (build + lint) | sonnet |
| **verifier** | Verifies build / lint / test / acceptance criteria (read-only, never modifies code) | haiku |
| **committer** | Gates on verification → writes `result.md` → git commit → updates WORK status to DONE | haiku |

---

## Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| **work-pipeline** | `[]` tag in user message | Triggers the full WORK-PIPELINE (specifier → planner → scheduler → builder → verifier → committer) |
| **work-status** | "WORK list", "show status" | Shows WORK progress and TASK completion status |
| **uctm-init** | `/uctm-init`, "uctm 초기화" | Initializes project: creates `works/`, updates `CLAUDE.md`, configures Bash permissions in `settings.local.json` |

---

## Installation

1. Open [Claude Marketplace](https://claude.ai/marketplace)
2. Search for **uc-taskmanager**
3. Click **Install Plugin**
4. Open Claude Code — agents are immediately available
5. Run `/uctm-init` to set up `works/` directory, `CLAUDE.md` agent rules, and Bash permissions

The `/uctm-init` step configures `settings.local.json` with the permissions agents need (file read/write, git, build commands), so the pipeline runs without permission prompts.

---

## Usage

### Quick Start

Once installed, prefix any request with a `[]` tag:

```
> [bugfix] Fix typo in the error message
> [new-feature] Build a comment system for the blog
> [enhancement] Add pagination to the user list
```

### Execution Modes

The specifier automatically selects the right mode based on requirement complexity:

| Mode | When | What Happens |
|------|------|--------------|
| `direct` | FR 1-2, simple acceptance criteria | Specifier acts as Planner → creates Requirement.md + PLAN.md + TASK → dispatches Builder |
| `pipeline` | FR 3+, build/test required, single domain | Specifier → Planner → Main Claude runs Builder → Verifier → Committer |
| `full` | Multi-domain, complex DAG, 5+ TASKs | Specifier → Planner → Scheduler → [Builder → Verifier → Committer] × N |

### Auto Mode

Add "auto" or "자동으로" at the end to skip approval steps:

```
> [new-feature] Add dark mode auto
```

### WORK Pipeline Example

```
> [new-feature] Build user authentication

Claude: [specifier]
  Requirement.md created — FR-01: JWT auth, FR-02: Login UI, FR-03: Tests
  Execution-mode: full
  Approve?

> Approve

Claude: [planner]
  WORK-01: User Authentication
  TASK-00: DB schema + migration      ← no dependencies
  TASK-01: JWT auth API               ← depends on TASK-00
  TASK-02: Frontend login form        ← depends on TASK-00 (parallel with TASK-01)
  TASK-03: Integration tests          ← depends on TASK-01, TASK-02

  Approve this plan?

> Approve. Run automatically.

Claude: TASK-00 → builder ✅ → verifier ✅ → committer [a1b2c3]
        TASK-01 → builder ✅ → verifier ✅ → committer [d4e5f6]
        TASK-02 → builder ✅ → verifier ✅ → committer [g7h8i9]
        TASK-03 → builder ✅ → verifier ✅ → committer [j0k1l2]
        WORK-01 → DONE ✅
```

### Status Check

```
> WORK list
> Show WORK-01 progress
```

### Resume After Interruption

```
> Resume WORK-02 from where it stopped
```

The scheduler reads `PROGRESS.md` to find the last completed TASK and continues.

---

## Supported Tags

| Tag | Meaning |
|-----|---------|
| `[new-feature]` | New feature |
| `[enhancement]` | Enhancement to existing feature |
| `[bugfix]` | Bug fix |
| `[refactoring]` | Refactoring |
| `[new-work]` | Always create new WORK |
| Any `[custom-tag]` | Works with any tag in square brackets |

No `[]` tag = Claude handles the request directly without pipeline routing.

---

## Output Files

All pipeline runs output to `works/WORK-NN/`:

```
works/
├── WORK-LIST.md              ← Master index (LAST_WORK_ID header + status table)
├── _COMPLETED/               ← Archived completed WORKs
└── WORK-NN/
    ├── Requirement.md        ← Requirement specification (specifier creates)
    ├── PLAN.md               ← Plan + dependency graph (7 metadata fields)
    ├── PROGRESS.md           ← Scheduler progress tracking (full mode)
    ├── TASK-XX.md            ← Task specification
    ├── TASK-XX_progress.md   ← Builder checkpoint (real-time)
    ├── TASK-XX_result.md     ← Completion report (committer writes)
    └── work_WORK-NN.log      ← Activity log (all agents)
```

### WORK Status Lifecycle

| Status | Set By | Meaning |
|--------|--------|---------|
| `IN_PROGRESS` | Specifier | WORK created, TASKs being executed |
| `DONE` | Committer | All TASKs committed (automatic on last TASK) |
| `COMPLETED` | Push procedure | Archived to `_COMPLETED/` |

---

## Requirements

- [Claude Code CLI](https://code.claude.com)
- Git initialized in your project (`git init`)
- No other dependencies

---

## Notes

- **English agents only** — this Plugin ships English agents. For Korean agents (`--lang ko`) or per-project customization, use the [npm CLI](https://www.npmjs.com/package/uctm) instead.
- **Override agents** — place a file with the same name in `.claude/agents/` to override any plugin agent for your project.
- **Run `/uctm-init` first** — configures permissions so the pipeline runs without prompts. Without init, agents will trigger permission requests for file writes, git commands, and build tools.
- **Bypass mode** — alternatively, `claude --dangerously-skip-permissions` skips all permission prompts (only use in trusted environments).

---

## License

GPL-3.0 — [UCJung](https://github.com/UCJung) · [Repository](https://github.com/UCJung/uc-taskmanager-claude-agent)
