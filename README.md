# uc-taskmanager (uctm)

**English** | [한국어](README.ko.md)

> An **SDD (Spec-Driven Development) WORK-PIPELINE subagent system** for Claude Code.
> A team of specialized agents autonomously orchestrates the full flow — requirements → design → build → verify → commit.

## 📖 Overview

**uc-taskmanager** turns a single development request into a fully automated pipeline that runs **from requirements analysis all the way to commit**.

When you type something like `[new-feature] Add a login feature`, the pipeline turns it into a **WORK (unit of work)**, decomposes it into multiple **TASKs**, and processes each stage with a dedicated agent — sequentially and in parallel.

The core ideas are **role separation** and **autonomous orchestration**. Instead of one giant agent doing everything, several agents — each with its own responsibility and model — collaborate.

| Agent | Responsibility | Model |
|-------|----------------|-------|
| **orchestrator** | Coordinates, schedules, and commits the whole pipeline | opus |
| **specifier** | Requirement specification (**What**) | opus |
| **planner** | Implementation design & TASK decomposition (**How**) | opus |
| **builder** | Actual code implementation + build self-check | sonnet |
| **verifier** | Independent, read-only verification (build/lint/test/acceptance) | haiku |

Pipeline flow:

```
User request
   │
   ▼
[orchestrator]  ← spawned once by Main Claude
   ├─ specifier   → Requirement.md (requirement spec)
   ├─ planner     → PLAN.md + TASK DAG (design & decomposition)
   └─ per TASK:
        builder   → code implementation
        verifier  → independent verification (PASS/FAIL)
        [commit]   → orchestrator writes result.md inline → git commit
   │
   ▼
WORK completion report
```

Every artifact is preserved under `works/WORK-NN/` — the requirement spec (`Requirement.md`), plan (`PLAN.md`), per-TASK spec/result (`TASK-NN.md`, `TASK-NN_result.md`), decision log (`DECISIONS.md`), and activity log (`work_WORK-NN.log`).

---

## 📂 Artifacts

The pipeline automatically generates a documented paper trail for every WORK — no manual note-taking required.

**Folder structure**

```
works/
├── WORK-LIST.md              # index & status of all WORKs
├── WORK-NN/                  # one folder per WORK
│   ├── Requirement.md        # requirement spec
│   ├── PLAN.md               # implementation plan
│   ├── TASK-01.md            # per-TASK spec (DAG node)
│   ├── TASK-01_result.md     # per-TASK result
│   ├── ...
│   ├── DECISIONS.md          # decision log
│   └── work_WORK-NN.log      # activity log (resume source)
└── _COMPLETED/               # archive of finished WORKs
```

**Artifacts produced per stage**

| Stage | Naming | Description |
|-------|--------|-------------|
| specifier | `Requirement.md` | Structured requirement spec (the What) |
| planner | `PLAN.md` | WORK-level implementation plan |
| planner | `TASK-NN.md` | Per-TASK spec — a node in the TASK DAG |
| builder → verifier → commit | `TASK-NN_result.md` | Per-TASK result, written inline by the orchestrator after verifier PASS |
| orchestrator | `DECISIONS.md` | Auto/user decision log with rationale |
| orchestrator | `work_WORK-NN.log` | Activity log driving idempotent resume |
| orchestrator | `WORK-LIST.md` | Global WORK list & status (IN_PROGRESS → DONE) |

---

## 🚀 Installation & Usage

### Install

**npm (recommended)**

```bash
# Global install
npm install -g uctm

# Install the pipeline into your project (agents, skills, references under .claude/)
uctm init

# Install globally (~/.claude/) for use across all projects
uctm init --global

# Refresh files after upgrading
uctm update
```

`uctm init` installs the agent definitions, skills, and references under your project's `.claude/`, and configures the Bash permissions the pipeline needs in `settings.local.json`.

### Usage

Start Claude Code and kick off new work with a **bracket tag**.

```bash
claude
```

```
[new-feature] Add a user profile editing feature
```

Supported trigger tags: `[new-feature]` · `[enhancement]` · `[bugfix]` · `[new-work]` · `[WORK start]` (or any custom bracket tag).

**Two execution modes**

| Mode | Description | Trigger |
|------|-------------|---------|
| **gated** (default) | Stops at **approval gates** after specifier and after planner, and presents options at each decision point | default |
| **auto** | Runs end-to-end with no gates, auto-deciding every judgment call from the recommended option and reporting afterward | include "auto" in the request |

```
[new-feature] Add a dark-mode toggle, run it automatically   ← auto mode
```

**Resuming interrupted work**

```
resume WORK-12    ·    continue WORK-12
```

The pipeline reads the activity log to determine where it stopped, **skips already-completed stages**, and continues. Even side-effecting steps like commits resume idempotently.

---

## ✨ Key Advantages

**1. DAG-based TASK scheduling**
TASK dependencies are interpreted as a DAG, so independent TASKs run **in parallel** while dependent ones keep their order — no unnecessary waiting.

**2. Sliding-window context management**
Each agent receives the previous stage in FULL, two stages back as a SUMMARY, and anything older DROPped. Long pipelines stay alive without context blow-up.

**3. ref-cache — read references once**
The orchestrator reads the shared reference docs **exactly once** and hands each child only the sections it needs. Children never re-read the docs, eliminating token waste.

**4. Verification independence**
The verifier re-runs build/lint/test/acceptance **independently in read-only mode**. Because the implementer (builder) and verifier are separated, implementation can never rubber-stamp itself.

**5. Gates & automatic decisions**
At judgment points — ambiguous requirements, design trade-offs, scope overruns, irreversible changes — gated mode presents options to the user, while auto mode decides from the recommendation and records the rationale in `DECISIONS.md`.

**6. Idempotent resume**
All progress is written to the activity log (`work_WORK-NN.log`), so an interrupted session resumes at the exact right point — with no duplicated or skipped commits.

**7. Cost optimization via model tiering**
Heavy reasoning (requirements, design) runs on opus, implementation on sonnet, and verification on haiku — balancing **quality against cost**.

**8. Automatic artifact generation**
Every stage writes its output to disk — requirement spec, plan, per-TASK results, decision log, and activity log — giving you a complete, reviewable paper trail without any manual note-taking. See [Artifacts](#-artifacts).

---

## 🧩 Configuration Files

`uctm init` installs the following under `.claude/`:

```
.claude/
├── agents/       # pipeline agent definitions
│   ├── orchestrator.md
│   ├── specifier.md
│   ├── planner.md
│   ├── builder.md
│   └── verifier.md
├── references/   # shared rule/schema docs — read once by the orchestrator
│   ├── agent-flow.md
│   ├── context-policy.md
│   ├── file-content-schema.md
│   ├── operation-guide.md
│   ├── shared-prompt-sections.md
│   ├── work-activity-log.md
│   └── xml-schema.md
└── skills/       # user-triggerable skills
    ├── uctm-init/
    ├── work-pipeline/
    ├── work-status/
    └── sdd-pipeline/
```

**`agents/` — pipeline agent definitions**

| File | Description |
|------|-------------|
| `orchestrator.md` | Autonomously orchestrates the whole pipeline via nested spawns; handles scheduling, gates, and inline commit |
| `specifier.md` | Creates the requirement spec (the What) |
| `planner.md` | Turns requirements into design + TASK DAG (the How) |
| `builder.md` | Implements a TASK's code + build self-check |
| `verifier.md` | Independent read-only verification (build/lint/test/acceptance) |

**`references/` — shared rule/schema docs** (the orchestrator reads these once and distributes sections to children via ref-cache)

| File | Description |
|------|-------------|
| `agent-flow.md` | Main Claude's role guide — trigger & gate boundaries, degraded mode |
| `context-policy.md` | Sliding-window context handoff rules + retry policy |
| `file-content-schema.md` | Single source of truth for artifact file formats & naming |
| `operation-guide.md` | Operation Guide overlay contract — how a per-project guide drives external-system integration |
| `shared-prompt-sections.md` | Common reusable prompt sections (output language, status detection, WORK-LIST, Bash rules) |
| `work-activity-log.md` | Activity-log event rules driving idempotent resume |
| `xml-schema.md` | Inter-agent XML protocol (ref-cache, gate, needs-decision, task-result) |

**`skills/` — user-triggerable skills**

| File | Description |
|------|-------------|
| `uctm-init/` | Initialize uctm for the project (creates `works/`, configures Bash permissions) |
| `work-pipeline/` | Trigger the WORK-PIPELINE (starts orchestration) |
| `work-status/` | Show WORK status (read-only) |
| `sdd-pipeline/` | Internal reference bundle for the pipeline agents (not user-facing) |

---

## 🔗 Operation Guide overlay (optional)

uctm's file-based pipeline is a **mechanical substrate**. A project may layer its own operating
procedure on top by declaring an **operation guide** in its `CLAUDE.md`:

```
## OperationGuide
docs/[GUIDE]_RND_OPERATION.md
```

When declared, the `work-pipeline` skill passes the guide's absolute path to the orchestrator
(`OPERATION_GUIDE=…`, same pattern as `REFERENCES_DIR=`). The guide is treated as a **policy overlay**:

- **orchestrator** records pipeline execution history at stage boundaries (run / step / artifact / finish),
  using the tools the guide specifies (supported backend: `ucpm-mcp`).
- **Main Claude** performs lifecycle work at the boundaries — requirement/state transitions, IA/TC
  registration, test & release.
- If the guide's tools are unavailable, calls **gracefully skip** and fall back to the activity log,
  to be backfilled later. Projects with no `## OperationGuide` run exactly as before.

uctm ships **no project-specific procedure** — only the discovery + overlay contract
(`references/operation-guide.md`). Each project authors its own guide.

---

## 📄 License

GPL-3.0 · [UCJung](https://github.com/UCJung/uc-taskmanager-claude-agent)
