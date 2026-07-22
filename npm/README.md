<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-GPLv3-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

Requirements Analysis & Development 6-Agent Full Pipeline + DAG-Based Orchestration + Sliding Window Context Management

**Universal Claude Task Manager** — A WORK-PIPELINE Agent that executes SDD (Specification-Driven Development) for Claude Code.
It formalizes user requirements into specifications,
builds execution plans (WORK) from those specs,
decomposes them into small tasks (TASK) and analyzes dependency graphs (DAG),
then automatically executes TASKs sequentially or in parallel based on dependencies.

Available as an **npm CLI** (`uctm`). Install once, use `[]`-tagged requests to trigger automated multi-agent pipelines.

**[한국어 문서 (Korean)](README_KO.md)**

---

## Quick Start

### npm CLI

```bash
npm install -g uctm
cd your-project
uctm init --lang en   # English agents
uctm init --lang ko   # 한국어 에이전트 (Korean — npm only)
uctm init             # Interactive language selection
```

`uctm init` automatically configures Bash permissions for agents in `settings.local.json` and installs `.claude-plugin` and `skills/` resources. No prompts required — the pipeline runs immediately after init.

### Start Using

Once installed, start Claude Code and use pipeline tags:

```
claude
> [new-feature] Add a hello world feature
```

Since `uctm init` automatically sets up permissions, the pipeline runs without additional prompts. If you need to bypass permissions in a CI/isolated environment:

```bash
claude --dangerously-skip-permissions
```

> **Warning**: Only use bypass mode in isolated environments or when you trust the pipeline fully. See [Claude Code Permissions](https://code.claude.com/docs/en/permissions) for details.

The agents analyze your request, plan the work, and execute through isolated subagent pipelines.

---

## What Makes This Pipeline Different

### 1. Procedures Must Be Executed Properly and Recorded

* Rather than focusing on *writing better code* (like TDD or DDD), this agent focuses on **executing development procedures properly**.
* It systematizes the full pipeline: **Requirement (user) → Specification → WORK Plan → Per-TASK Execution Plan → Per-TASK Execution/Verification/Completion → Per-TASK Result Storage** (WORK PIPELINE)
* The result: end-to-end records from requirement to delivery, providing full traceability.

**How to work with this AI Agent:**

* **Start**: Give a prompt starting with `[]` to trigger the WORK-PIPELINE
```
[game-dev] Build a brick breaker game in HTML
```

* **Requirement Analysis**: Main Claude spawns a single `orchestrator` agent (`mode=gated` by default), which nests a `specifier` call to analyze your requirement. Orchestrator pauses at **[GATE-1]** and returns a summary for approval. Review `works/WORK-NN/Requirement.md` and type **"approve"** to proceed.
```
{Requirement specification content}
If you approve Requirement.md, orchestrator will nest-spawn the Planner to create PLAN.md + TASK decomposition.
Let me know if you want to modify anything.
```

* **WORK Execution Plan**: Orchestrator nests a `planner` call to build an execution plan, then pauses again at **[GATE-2]**. Review `works/WORK-NN/PLAN.md` and `TASK-NN.md`, then type **"approve"** to proceed.
```
WORK-31 Development Approval Request

  Project folder structure reorganization ~~~~~~~ / ########

  ┌─────────┬─────────────────────────┐
  │  Item   │        Details          │
  ├─────────┼─────────────────────────┤
  │ TASKs   │ 6 (TASK-00 ~ TASK-05)  │
  └─────────┴─────────────────────────┘

  DAG Structure

  TASK-00 (move agents/ en files → en/ subdirectory)
     ├─→ TASK-01 (~~~~~~~~~~~~) ─→ TASK-03 (#########)
     ├─→ TASK-02 (create plugin/) ─→ TASK-04 (????????)
     └─────────────────────────────────→ TASK-05 ($$$$$$$$$)

  - TASK-01/02 parallel, TASK-03/04 parallel, TASK-05 final integration
  - If approved, orchestrator schedules the TASK DAG itself and nest-spawns builder → verifier → committer for each TASK — no further approval gates in this phase.

  Proceed?
```
* Per-TASK: build → verify → commit repeats automatically for each TASK, all inside the same nested orchestrator run.
```
● TASK-05 committed. Updating PROGRESS.md and finalizing WORK-31.
```
* When TASKs complete, verify via `works/WORK-NN/TASK-NN_result.md` and actual testing.
```
  push, merge
```

**Want to rollback?** Type `WORK-NN rollback`. Commit hashes are stored in the files, so only that WORK's changes are reverted.

**Too much ceremony for a simple button rename?**
```
[WORK start] Change the submit button label to "Send" — auto
```
Add "auto" to run orchestrator in `mode=auto` — it completes the entire WORK in one nested spawn with **zero approval gates**, and records every judgment call it had to make on your behalf in `works/WORK-NN/DECISIONS.md` and the final report's `## 자동 결정 사항` section.

### 2. Token Economy

I'm cost-conscious (honestly). So this agent applies four token-saving strategies:

**(1) Serena MCP for codebase analysis.**
The agent prioritizes [Serena MCP](https://github.com/oraios/serena) for code exploration — reading symbols instead of entire files. (Huge thanks to the Serena team.)

**(2) A single nested orchestrator instead of per-stage round-trips.** The WORK-PIPELINE has up to 6 agent stages. Instead of Main Claude calling each stage one at a time, Main Claude spawns a single `orchestrator` agent **once**, which nests specifier → planner → builder → verifier → committer as sub-spawns of its own (Claude Code sub-agent nesting, depth 2). The orchestrator schedules the TASK DAG itself instead of round-tripping through Main Claude for every stage. See [Concept: Orchestrator Modes](#concept-orchestrator-modes-gated-vs-auto).

**(3) Structured XML communication.** Even with nesting, every hop between agents is still a text boundary — gate summaries and hand-offs are still just blobs of text.
* Whichever side receives it has to parse it again. So we standardized the communication format as XML.
* Every bit helps.
* (This also made agent log monitoring much easier.) See [Structured Agent Communication](#structured-agent-communication).

**(4) Sliding Window Context Transfer.** Agent A finishes and tells B what it did. B finishes and tells C what A did plus what B did. But does C really need A's full details? So B passes its own work in full to C, and summarizes A's work. **One degree of separation = just a name and phone number** — you don't need to know their personality. If curious, just ask them directly. Testing shows ~20-30% token savings. See [Sliding Window Context Transfer](#sliding-window-context-transfer).

**"Why not skip agents entirely and do everything in one session?"** See [Context Isolation](#context-isolation). In long sessions, AI gradually loses coherence — like sudden memory loss mid-conversation. Strict context isolation prevents this and directly impacts output quality.

### 3. Dependency-Aware Parallel Execution

TASKs within a WORK have dependency management via DAG. Parallel execution only happens when TASKs have no mutual dependencies — meaning no source code conflicts from concurrent edits.

I've also built a **requirement management system** that integrates with this pipeline. It manages requirements per project. Queue up requirements before bed, and by morning they're all developed — your to-do list just shifts to *reviewing* instead of *coding*. WORKs execute in parallel across projects too (cross-project dependencies don't exist).

### What's Next

Currently designing a **RAG-based system** to store accumulated artifacts and query similar past requirements during specification analysis — for faster and more accurate requirement decomposition. (If enough data accumulates, who knows — maybe a fine-tuned LLM behind an MCP someday.)

> **Tip for prompting AI agents**: Think of it like SQL WHERE clause ordering (developers only). The first condition should narrow the dataset the most — and if it hits an index, even better. That's why I maintain a glossary with terms and source code entry points, and have the agent reference it. My tokens are precious.

---

Six subagents work across any project and any language, automatically handling **request routing → task decomposition → dependency management → code implementation → verification → commit**.

```
"[new-feature] Build a user authentication feature"
→ specifier decides WORK, planner creates WORK-01 with 5 TASKs, pipeline executes
```

---

## Usage

### Small Fix

```
> [bugfix] Fix typo in login error message
```

Main Claude spawns `orchestrator` once (`mode=gated` by default). Orchestrator nests specifier → **[GATE-1]** → planner → **[GATE-2]** → builder → verifier → committer. Creates WORK-NN directory + PLAN + result.md + commit — all inside the same orchestrator run. Every WORK takes this path, so even a one-line change is planned and recorded.

### Feature (WORK)

#### 1. Create WORK (Planning)

```
> [new-feature] Build a user authentication feature. Plan it.
```

Orchestrator nests specifier → planner, which analyzes the project and creates WORK-01:

```
WORK-01: User Authentication

  WORK-01: TASK-00: Project initialization        ← no dependencies
  WORK-01: TASK-01: DB schema design              ← TASK-00
  WORK-01: TASK-02: JWT auth API                  ← TASK-01
  WORK-01: TASK-03: User CRUD                     ← TASK-02
  WORK-01: TASK-04: Tests + documentation         ← TASK-03

  Do you approve this plan?
```

#### 2. Execute WORK

```
> Run WORK-01 pipeline
```

Orchestrator's internal DAG scheduling (STEP C) executes WORK-01's TASKs in dependency order, nesting builder → verifier → committer for each TASK — this phase has no approval gates.

#### 3. Add to Existing WORK

If WORK-01 is IN_PROGRESS, the specifier asks:
> "WORK-01 (User Authentication) is in progress. Add as a new TASK or create a new WORK?"

#### 4. Check Status

```
> WORK list
```

```
WORK Status
   WORK-01: User Authentication    ✅ 5/5 completed
   WORK-02: Payment Integration    🔄 2/4 in progress
   WORK-03: Admin Dashboard        ⬜ 0/6 pending
```

#### 5. Auto Mode / Resume

```
> Run WORK-02 automatically
> Resume WORK-02
```

"automatically" triggers `mode=auto` — orchestrator completes in a single nested spawn without gates. "Resume" reattaches to the parked orchestrator via `SendMessage` (context preserved), or falls back to a fresh nested re-spawn reconstructed from `work_{WORK}.log` if the handle was lost.

#### 6. Run a Specific TASK

Skip to a specific TASK within a WORK (e.g., retry after a failure):

```
> Run WORK-02: TASK-02
```

Orchestrator's DAG scheduling (STEP C) identifies the next READY TASK, then nests builder → verifier → committer in sequence.

#### 7. Force WORK Creation (Skip Complexity Check)

Use the `[new-work]` tag to always create a new WORK regardless of complexity:

```
> [new-work] Refactor the auth module
```

#### 8. Handle Failure / Retry

If a TASK fails during the pipeline, orchestrator re-dispatches builder up to 3 times automatically (STEP C). If all 3 attempts fail, it escalates via `<needs-decision>` — a `<gate type="decision">` in `mode=gated`, or an auto-decision recorded in `DECISIONS.md` in `mode=auto`.
If it still fails, you can inspect the result file and retry manually:

```
> WORK-02: TASK-01 failed. Retry it.
```

Or fix the issue and re-run:

```
> Fix the issue in src/auth.ts, then retry WORK-02: TASK-01
```

#### 9. Add a TASK to an In-Progress WORK

```
> [enhancement] Add rate limiting to the auth API
```

If WORK-02 is `IN_PROGRESS`, the specifier asks:
> "WORK-02 (Auth Module) is in progress. Add as a new TASK, or create a new WORK?"

#### 10. Check Individual TASK Status

```
> Show WORK-02 progress
> What's the status of WORK-03: TASK-02?
```

Orchestrator reads `PROGRESS.md` and `result.md` files to report current state.

---

## The `[]` Tag System

Prefix your request with a `[]` tag to trigger the pipeline:

| Tag | Meaning |
|-----|---------|
| `[new-feature]` | New feature |
| `[enhancement]` | Enhancement |
| `[bugfix]` | Bug fix |
| `[new-work]` | Always create new WORK (skip complexity check) |

No `[]` tag = handled directly without pipeline.

To register this rule in your project, add the following to your `CLAUDE.md`:

```markdown
## Agent 호출 규칙

`[]` 태그로 시작하는 요청 → specifier 에이전트 호출 (WORK 파이프라인 시작)
```

This ensures Claude automatically delegates `[]`-tagged requests to the specifier agent without manual invocation.

---

## Installation

### npm CLI

```bash
npm install -g uctm

# Per-project (copies agents + config + updates CLAUDE.md)
cd your-project
uctm init --lang en          # English agents
uctm init --lang ko          # 한국어 에이전트
uctm init                    # Interactive language selection

# Global (copies agents to ~/.claude/agents/)
uctm init --global --lang en

# Update agents after upgrading uctm (--lang required)
uctm update --lang en
```

### Manual

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git /tmp/uc-tm
mkdir -p .claude/agents .claude/references
cp /tmp/uc-tm/npm/agents/*.md .claude/agents/          # 6 agents (orchestrator, specifier, planner, builder, verifier, committer)
cp /tmp/uc-tm/npm/references/*.md .claude/references/   # 7 reference files
rm -rf /tmp/uc-tm
git add .claude/agents/ .claude/references/ && git commit -m "chore: add uc-taskmanager agents"
```

### Local Plugin Test

```bash
# Test plugin locally
claude --plugin-dir ./
```

### Verify

```bash
claude
> /agents
# orchestrator, specifier, planner, builder, verifier, committer → confirm all 6
```

---

## Concept: Orchestrator Modes (Gated vs Auto)

Main Claude detects the `[]` tag and spawns a single **orchestrator** subagent, passing `mode=gated` (default) or `mode=auto` (when the request contains "auto"/"자동으로"). Orchestrator nests every other agent itself — Main Claude never calls specifier/planner/builder/verifier/committer directly:

```
User Request → Main Claude
                    │
                    ▼ spawn once, mode=gated|auto
              ┌──────────────┐
              │ orchestrator │  ← TASK DAG scheduling + gate/decision mediation
              └──────┬───────┘
                     │ nested spawn (depth 2)
                     ▼
              specifier → Requirement.md          ← [GATE-1]
                     │
              planner   → PLAN.md + TASK DAG      ← [GATE-2]
                     │
              STEP C: DAG-ordered [builder → verifier → committer] × N (parallel where READY)
```

- `mode=gated`: pauses with `<gate type="stage">` after specifier (**[GATE-1]**) and after planner (**[GATE-2]**); also pauses anytime with `<gate type="decision">` (background + options + recommendation) when orchestrator or a nested child needs a user call. Main Claude relays the gate, waits for approval/choice, then resumes the parked orchestrator with `SendMessage` (falls back to a log-based re-spawn if the handle is gone).
- `mode=auto`: **one spawn, zero gates** — every judgment point is resolved with the recommended option and logged to `works/{WORK}/DECISIONS.md` plus the final report's `## 자동 결정 사항` section.
- Execution (STEP C: builder → verifier → committer) never gates on the user — only WORK creation (specifier) and planning (planner) do.

**Sub-agent Spawn Count:**

| Main → Orchestrator | → Specifier | → Planner | → Builder | → Verifier | → Committer | Total |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 1 | N | N | N | **3 + 3N** |

`gated` vs `auto` doesn't change the spawn count — only whether execution pauses for approval (see [Approval Gates, Nested Autonomy, and DECISIONS.md](#approval-gates-nested-autonomy-and-decisionsmd) below, `agent-flow.md` § 4).

Every WORK outputs to `works/WORK-NN/` and guarantees `result.md` + `DECISIONS.md`.

### WORK and TASK

A two-level hierarchy:

```
WORK (unit of work)       A single goal. The unit requested by the user.
└── TASK (unit of task)   An individual execution unit to achieve the WORK.
    └── result            Completion proof. Auto-generated after verification.
```

Orchestrator nests planner once, then loops builder → verifier → committer per TASK in DAG order.

```
orchestrator → planner(opus, nested)                 → PLAN.md + TASK DAG
             → [builder(sonnet) → verifier(haiku) → committer(haiku)] × N   ← STEP C, no gates
              (each nested spawn made by orchestrator, not Main Claude)
```

---

## Pipeline

### WORK Pipeline (Nested)

> Main Claude spawns `orchestrator` **once**. Every other call below is a *nested* sub-agent spawn made by orchestrator itself — Main Claude is not in this loop.

```
Main Claude ── spawn once (mode=gated|auto) ──▶ orchestrator
                                                      │  nested spawn (depth 2)
                    ┌─────────────┬──────────────────┴──────────────────┐
                    │             │                                     │
  specifier        planner                    builder          verifier         committer
 ┌──────────┐    ┌─────────┐               ┌──────────┐     ┌──────────┐     ┌──────────┐
 │Request   │────▶│Create   │──────────────▶│Code      │────▶│Build/Test│────▶│Result    │
 │Analysis  │     │WORK/TASK│               │Implement │     │Verify    │     │→ git     │
 └────┬─────┘     └────┬────┘               └────┬─────┘     └────┬─────┘     └────┬─────┘
      │                │                         │                │                │
 [GATE-1]          [GATE-2]                      └── Retry on fail┘                │
 (gated mode        (gated mode                     (max 3 times, then             │
  only; yield        only; yield                    <needs-decision> escalation)   │
  + SendMessage       + SendMessage)                                Next READY TASK loop ◀┘
  to resume)                              (orchestrator schedules the DAG itself — STEP C, no gate)
```

- `mode=gated` (default): pause + yield at **[GATE-1]** (after specifier) and **[GATE-2]** (after planner); resume via `SendMessage(agentId, decision)`, fallback to log-based re-spawn.
- `mode=auto`: no gates — orchestrator completes the entire diagram in one spawn and records any judgment calls to `DECISIONS.md`.
- STEP C (the builder → verifier → committer loop) never gates on the user, in either mode.

### Stage Detail

```
  specifier   →  planner  →  [builder → verifier → committer] × N
 ┌──────────┐   ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌────────────┐
 │Request   │──▶│PLAN     │──▶│Code      │─▶│Build/Test│─▶│Result→ git │
 │Analysis  │   │+TASK DAG│   │Implement │  │Verify    │  │            │
 └──────────┘   └─────────┘   └──────────┘  └──────────┘  └────────────┘
   (opus)          (opus)       (sonnet)       (haiku)        (haiku)
              ← all nested spawns made by orchestrator →
```

### Agents

Six agents work together in a clean, isolated pipeline — Main Claude spawns only `orchestrator`; orchestrator nests the rest:

| Agent | Role | Model | Permission | MCP | Spawn |
|-------|------|-------|------------|-----|-------|
| **orchestrator** | Nests specifier→(planner)→builder→verifier→committer; schedules the TASK DAG (STEP C); mediates fixed/dynamic gates; batch-records the activity log | **opus** | read + nested spawn | Serena (optional) | spawned **once** by Main Claude per WORK |
| **specifier** | `[]` tag detection, requirement analysis, complexity assessment, WORK-LIST management, returns dispatch XML | **opus** | read + dispatch | Serena (codebase exploration), sequential-thinking (complexity check) | nested by orchestrator |
| **planner** | Create WORK + decompose TASKs + generate PLAN.md + pre-create progress templates | **opus** | read-only | Serena (codebase exploration), sequential-thinking (task decomposition) | nested by orchestrator |
| **builder** | Code implementation + progress.md checkpoint recording | **sonnet** | full access | Serena (symbol-level explore/edit) | nested by orchestrator, per TASK |
| **verifier** | Progress gate (Status=COMPLETED) → build/lint/test verification (read-only) | **haiku** | read + execute | — | nested by orchestrator, per TASK |
| **committer** | Gate check (progress.md) → write result.md → git commit | **haiku** | read + write + git | — | nested by orchestrator, per TASK |

> Activity-log recording is done **once, by orchestrator**, on behalf of the agent it just nested — child agents do not write logs themselves.

### Support Files (included in Plugin)

In addition to the 6 pipeline agents, the plugin includes 6 support files. **Only the orchestrator reads them** — child agents receive the sections they need via ref-cache (see below).
These are located in `plugin/references/` (synced from `develop/references/`); when installed via npm they land in `.claude/references/`:

| File | Purpose |
|------|---------|
| `agent-flow.md` | Pipeline orchestration rules — Main Claude's trigger/gate boundary + orchestrator's internal nested-spawn flow |
| `context-policy.md` | Sliding window context transfer rules between agents |
| `file-content-schema.md` | Single source of truth for all file formats (PLAN.md, TASK.md, progress.md, result.md) |
| `shared-prompt-sections.md` | Shared prompt sections reused across agents |
| `work-activity-log.md` | Activity log format for builder stage tracking |
| `xml-schema.md` | XML communication format for dispatch and task-result messages — also the normative ref-cache protocol (§ 4) |

Each of the five files consumed via ref-cache (`context-policy`, `file-content-schema`, `shared-prompt-sections`, `work-activity-log`, `xml-schema`) carries a **section consumption matrix** at the top, declaring which agents need which `§` sections. That matrix is what the orchestrator slices against.

---

## File Structure

```
works/
├── WORK-LIST.md                      ← Master list of all WORKs (managed by specifier)
├── WORK-01/                          ← "User Authentication"
│   ├── PLAN.md                       ← Plan + dependency graph
│   ├── PROGRESS.md                   ← Progress tracking (auto-updated)
│   ├── work_WORK-01.log               ← Orchestrator activity log (STAGE_*/GATE_WAIT/DECISION_WAIT/DECISION)
│   ├── DECISIONS.md                  ← Auto-decisions + resolved gate decisions (PENDING to RESOLVED)
│   ├── TASK-00.md                    ← Task specification
│   ├── TASK-00_progress.md           ← Real-time checkpoint (builder writes)
│   ├── TASK-00_result.md             ← Completion report (committer writes)
│   ├── TASK-01.md
│   └── ...
└── WORK-02/
    └── ...
```

### File Naming Convention

| File | Naming Rule |
|------|-------------|
| Task spec | `TASK-NN.md` (no prefix) |
| Progress checkpoint | `TASK-NN_progress.md` (underscore separator) |
| Completion report | `TASK-NN_result.md` |
| Plan | `PLAN.md` |
| Work progress | `PROGRESS.md` |
| Activity log | `work_{WORK_ID}.log` (orchestrator writes; drives gate resume) |
| Decision log | `DECISIONS.md` (auto-decisions + user-approved decisions, `PENDING`/`RESOLVED`) |

### WORK-LIST.md

The specifier maintains `works/WORK-LIST.md` as the master index:

| WORK ID | Title | Status | Created |
|---------|-------|--------|---------|
| WORK-01 | User Authentication | DONE | 2026-03-01 | 2026-03-01 |
| WORK-02 | Payment Integration | IN_PROGRESS | 2026-03-05 | |

| Status | Meaning |
|--------|---------|
| `IN_PROGRESS` | WORK created, TASKs in progress |
| `DONE` | All TASKs committed — set automatically by committer on last TASK |
| `COMPLETED` | Archived to `_COMPLETED/` — set during push procedure |

- **IN_PROGRESS**: specifier checks this before creating new WORKs
- **DONE**: committer automatically changes IN_PROGRESS → DONE when the last TASK completes
- **COMPLETED**: during push, DONE WORKs are batch-processed — rows removed from WORK-LIST and folders moved to `works/_COMPLETED/`

#### git push Procedure

When you ask Claude to push (`"push this"`, `"git push"`), Claude handles the full sequence automatically:

```
1. Agent sync — copy develop/ source to npm/ and plugin/
2. DONE WORK batch completion — remove DONE rows from WORK-LIST, move folders to _COMPLETED/
3. Check README.md — update if changes are missing
4. git push
```

> **DONE is set by committer** when the last TASK completes. **COMPLETED** happens at push time when DONE WORKs are archived to `_COMPLETED/`.

---

## Tips

### Keep CLAUDE.md Up to Date

The language setting and project context live in `CLAUDE.md`. Agents read this on every invocation — keeping it accurate reduces back-and-forth.

### Use `[]` Tags Consistently

Requests without `[]` tags are handled directly by Claude without routing. If you want guaranteed pipeline behavior, always use a tag.

### Parallel TASKs

The planner creates dependency-aware TASK graphs. Independent TASKs (same `blockedBy` set) are dispatched concurrently by orchestrator's DAG scheduling (STEP C) — mention it when approving:

```
> Approve. Run independent tasks in parallel.
```

### Resume After Context Reset

If Claude loses context mid-pipeline, you can always resume:

```
> Resume WORK-02 from where it stopped
```

Orchestrator reads `work_{WORK}.log` (and `PROGRESS.md`) to determine the last completed stage/TASK and continues — reattaching via `SendMessage` if its parked handle is still alive, or a fresh nested re-spawn reconstructed from the log otherwise. An unresolved `GATE_WAIT`/`DECISION_WAIT` is always re-presented rather than skipped.

---

## Example Session

```
User: [new-feature] Build a comment feature for the blog system.

Claude: [Main Claude spawns orchestrator once, mode=gated]

Claude: [orchestrator nests specifier → WORK path]
  Complexity: 4+ files, DB schema change, multiple modules → Large
  → Creating new WORK

  [GATE-1] Requirement approved — continuing to planner

Claude: [orchestrator nests planner]
  Project analysis
     Tech Stack: Next.js + Prisma + PostgreSQL
     Existing code: Post CRUD done, Auth done

  WORK-03: Comment Feature

  WORK-03: TASK-00: Comment model + migration          ← no dependencies
  WORK-03: TASK-01: Comment CRUD API                   ← TASK-00
  WORK-03: TASK-02: Nested comments (self-relation)    ← TASK-01
  WORK-03: TASK-03: Frontend comment component         ← TASK-00 (parallelizable)
  WORK-03: TASK-04: Integration + notifications        ← TASK-02, TASK-03

  [GATE-2] Do you approve this plan?

User: Approve.

Claude: [orchestrator resumed via SendMessage → STEP C: DAG execution, no further gates]
  WORK-03: TASK-00 → builder → verifier ✅ → committer [a1b2c3d]
  WORK-03: TASK-01 → builder → verifier ✅ → committer [d4e5f6g]
  WORK-03: TASK-02 → builder → verifier ✅ → committer [h7i8j9k]
  WORK-03: TASK-03 → builder → verifier ✅ → committer [l0m1n2o]
  WORK-03: TASK-04 → builder → verifier ✅ → committer [p3q4r5s]

  🎉 WORK-03 completed! 5 tasks, 5 commits
  ## 자동 결정 사항: 없음 (both gates required explicit approval)
```

---

## Why This Approach?

### Agent File Design

All agent files (`agents/*.md`) are written with a single principle: **core content only, no decoration**. Descriptions, emphasis markers, and redundant examples have been removed. The result is ~1,600 lines total across all agents — less than half the original size — while covering the same functional scope.

Agent prompts avoid pipe (`|`) commands in Bash sequences for cross-platform compatibility (Windows, Linux, macOS). Each command runs as a single call without shell pipelines.

Each agent file follows a consistent four-section structure:

```
## 1. 역할 (Role)
   Agent's purpose and responsibility declaration.
   Single paragraph stating what the agent is and what it owns.

## 2. 수행업무 (Responsibilities)
   Flat table of owned tasks.
   | 업무 (Task) | 설명 (Description) |

## 3. 업무수행단계 및 내용 (Execution Steps)
   Step-by-step procedure for each task listed in § 2.
   Always starts with a STARTUP block listing required files to read on boot.
   References file formats via file-content-schema.md (single source of truth).
   References inter-agent communication via xml-schema.md.

## 4. 제약사항 및 금지사항 (Constraints and Prohibitions)
   Immutable rules the agent must always follow.
   Written as a flat prohibition/constraint list.
```

`file-content-schema.md` is the single authoritative definition for all file formats (PLAN.md, TASK.md, progress.md, result.md). Agents reference it instead of embedding format specs inline — eliminating duplication across 6 agent files.

### ref-cache: Reference File Caching

Without caching, every agent re-reads 3-5 shared reference files at startup — roughly 40+ reads across a 3-TASK pipeline. **ref-cache** makes the orchestrator the single reader:

1. **Orchestrator** reads the 5 reference files once at startup, and parses each file's section consumption matrix
2. **Before every nested spawn**, it slices out only the `§` sections that specific child needs and assembles a `<ref-cache>` with a `sections="..."` attribute per file
3. **Child agents never touch disk** for references — reading anything under `{REFERENCES_DIR}` is prohibited. Each child cross-checks the received `sections` against its own required-section list, and escalates a `<needs-decision>` if anything is missing rather than falling back to a disk read

The protocol is normatively defined in `references/xml-schema.md` § 4. The per-agent section mapping lives in the **section consumption matrix at the top of each reference file** — not in a separate mapping document, so a file and its distribution rules stay together.

**Design target** (3-TASK WORK):
- Reference file reads: ~42 → **5** (orchestrator startup only)
- Token usage: reduced proportionally to section slicing — each child receives only its own sections instead of whole files

### WORK ID Assignment Strategy

WORK IDs are assigned based on a **filesystem-first approach**:

1. **Filesystem Source**: The planner scans `works/` directory to find existing WORK directories and determines the next WORK ID based on the latest directory found.
2. **MEMORY.md NOT used**: Project memory (MEMORY.md) is never referenced for WORK numbering. Only the filesystem is the authoritative source.
3. **Consistency Check**: The specifier validates WORK ID consistency by checking both the filesystem and WORK-LIST.md before dispatching to the planner.

This ensures:
- No duplicate WORK IDs even if MEMORY.md is stale or corrupted
- Reliable resumption across sessions
- Clear traceability: WORK-NN directly corresponds to `works/WORK-NN/`

### Context Isolation

Each subagent runs in an independent context. Even if the builder creates 50 files using 20,000 tokens, orchestrator (which nested it) only receives a 3-line summary via the sliding-window context-handoff.

```
orchestrator's context after 5 TASKs:

  PLAN.md (loaded once)                              ~500 tokens
  WORK-01: TASK-00 result: "20 files, PASS"           ~200 tokens
  WORK-01: TASK-01 result: "15 files, PASS"           ~200 tokens
  WORK-01: TASK-02 result: "8 files, PASS"            ~200 tokens
  WORK-01: TASK-03 result: "12 files, PASS"           ~200 tokens
  WORK-01: TASK-04 result: "5 files, PASS"            ~200 tokens
  ────────────────────────────────────────
  Total: ~1,500 tokens (stays flat)
```

### Single Session vs uc-taskmanager

| | Single Session | uc-taskmanager |
|---|---|---|
| Context per TASK | All code + logs stacked | Summary only (~200 tokens) |
| After 10 TASKs | 50K~100K tokens, quality degrades | ~3K tokens, quality stable |
| Failure recovery | Start over | Resume from last result file |
| Tracking | Scroll chat history | File-based (PLAN.md, result.md) |
| Verification | Manual | Automated (build/lint/test) |

### Approval Gates, Nested Autonomy, and DECISIONS.md

Main Claude spawns `orchestrator` exactly once per WORK; orchestrator alone decides when to nest specifier/planner/builder/verifier/committer, and when to pause and ask a human. Since nested sub-agents cannot prompt the user directly, **every approval or decision is surfaced at the Main Claude boundary**:

- **Fixed gates** (`<gate type="stage">`) — exactly two, and only in `mode=gated` (the default): **[GATE-1]** right after specifier (Requirement.md ready), and **[GATE-2]** right after planner (PLAN.md + TASK DAG ready).
- **Dynamic gates** (`<gate type="decision">`) — raised by orchestrator or any nested child, at *any* point (design trade-off, scope creep, destructive change, 3 failed retries, ambiguous requirement…), carrying `<context>` + `<options>` + `<recommended>`.
- At a gate, orchestrator **yields (parks)** rather than exiting. Main Claude presents the gate, waits for the human, then resumes the parked orchestrator with `SendMessage(agentId, decision)` — context is preserved, no re-reading of files. If the handle is lost (new session, crashed terminal), Main Claude re-spawns orchestrator with the `WORK_ID`; orchestrator replays `work_{WORK}.log` and re-presents the exact same unresolved gate — **an unapproved gate is never silently skipped**, because `STAGE_DONE` is only ever written *after* the gate resolves.
- Once the final report lands, Main Claude calls `TaskStop(agentId)` to release the parked handle.
- `mode=auto` ("auto"/"자동으로" in the request) skips every gate: orchestrator resolves each judgment point with its own recommended option and completes in a single spawn.

Every decision — whether a human approved it or orchestrator auto-resolved it — is written to `works/{WORK_ID}/DECISIONS.md` (status `PENDING` while parked, `RESOLVED` once settled) and summarized in the final report's `## 자동 결정 사항` section. STEP C itself (the builder → verifier → committer TASK loop) never gates, in either mode — it's the part of the pipeline nobody needs to approve.

Both modes (gated/auto) output to `works/WORK-NN/` with identical artifact structure (PLAN.md + result.md + `DECISIONS.md`), ensuring downstream integration works regardless of mode.

### Structured Agent Communication

Instead of ambiguous natural language prompts, agents communicate using structured XML format:

**Dispatch Format** (Caller → Receiver):
```xml
<dispatch to="builder" work="WORK-03" task="TASK-00">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
    <plan-file>works/WORK-03/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/WORK-03/TASK-00.md</file>
    <title>공통 시스템 프롬프트 섹션 식별 및 XML 스키마 설계</title>
    <action>implement</action>
  </task-spec>
  <cache-hint sections="output-language-rule,build-commands"/>
</dispatch>
```

**Result Format** (Receiver → Caller):
```xml
<task-result work="WORK-03" task="TASK-00" agent="builder" status="PASS">
  <summary>Created shared-prompt-sections.md and xml-schema.md</summary>
  <files-changed>
    <file action="created" path="references/shared-prompt-sections.md">Common sections with cache_control</file>
  </files-changed>
  <verification>
    <check name="file_existence" status="PASS">Both files created</check>
  </verification>
</task-result>
```

**Benefits**:
- **Clarity**: Explicit XML structure eliminates ambiguous natural language ("Pass the context" ← confusing vs. `<context>` ← explicit)
- **Lower Output Tokens**: Agents don't generate clarification questions; receivers parse XML directly
- **Prompt Caching**: Common sections (Output Language Rule, Build Commands) are marked with Anthropic API `cache_control`, saving up to **90% on repeated tokens**
- **Scalability**: Cache hit rates improve with WORK count (5 TASKs at ~0.03 tokens/token vs 2K+ tokens without cache)

See `references/xml-schema.md` for complete format, and `references/shared-prompt-sections.md` for cacheable sections.

### Sliding Window Context Transfer

Each subagent starts with an empty context — the cost of isolation. The **sliding window** system minimizes token waste when passing context between agents and across dependent TASKs.

**Rule**: the further back, the less detail:

| Distance | Detail Level | Content |
|----------|-------------|---------|
| Immediate predecessor | `FULL` | what + why + caution + incomplete |
| 2 steps back | `SUMMARY` | what only (1–3 lines) |
| 3+ steps back | `DROP` | not transmitted |

Each agent outputs a **context-handoff** — a structured reasoning document, not just a result log:

```xml
<context-handoff from="builder" detail-level="FULL">
  <what>auth.ts modified — added JWT silent refresh logic</what>
  <why>Previous code returned 401 immediately on expiry. Silent refresh improves UX.</why>
  <caution>Coupled to session.ts setSession(). Changes there may cause side effects.</caution>
  <incomplete>Unit tests not written. Verifier should check.</incomplete>
</context-handoff>
```

**Result responsibility shift**: builder focuses on implementation only, writing a `progress.md` checkpoint. The **committer** synthesizes builder + verifier context-handoffs into the final `result.md`. This prevents result files from being skipped when builder is context-pressured.

**Estimated token savings**: ~48% on a 3-TASK dependency chain vs. the naive approach of passing full results forward.

See `docs/spec_sliding-window-context.md` for full design details.

---

## Output Language

Output language is resolved from **CLAUDE.md** in your project. No manual configuration needed after first setup.

```
1. Check CLAUDE.md for "Language: xx"
   ├─ Found → use that language
   └─ Not found ↓

2. Ask: "Would you like to set the output language? (e.g., ko, en, ja)"
   ├─ User specifies → write to CLAUDE.md + use it
   └─ User declines ↓

3. Auto-detect system locale → write to CLAUDE.md as default
```

Once set, stored in CLAUDE.md and never asked again. Priority: `PLAN.md > CLAUDE.md > en`

By default, **all output** including git commit messages and code comments uses the configured language:

| Item | Default | Override |
|------|---------|----------|
| PLAN.md / TASK descriptions | Language | — |
| Result reports | Language | — |
| Git commit messages (title/body) | Language | `CommitLanguage: en` |
| Code comments | Language | `CommentLanguage: en` |
| Commit type prefix (`feat`, `fix`...) | Always English | — |
| File names, paths, commands | Always English | — |

### Per-Category Override

Add to CLAUDE.md to override specific categories:

```markdown
## Language
ko
CommitLanguage: en
CommentLanguage: en
```

This gives you `ko` for plans/reports but `en` for commits and code comments — useful for open-source projects or global teams.

---

## Customization

Place a file with the same name in `.claude/agents/` to override.

| What | File | Section |
|------|------|---------|
| Complexity criteria | `specifier.md` | 4. 역할 결정 |
| Approval gates / mode handling | `orchestrator.md` | 3-3. 게이트 및 동적 의사결정 |
| TASK DAG scheduling / retries | `orchestrator.md` | STEP C: TASK DAG 실행 |
| Commit message format | `committer.md` | Step 3: Stage + Commit |
| Verification steps | `verifier.md` | Verification Pipeline |
| Task granularity | `planner.md` | Task Decomposition Rules |
| Build/lint commands | `builder.md` + `verifier.md` | Self-Check / Step 1-2 |
| Output language | `planner.md` | Output Language Rule |

---

## Supported Stacks

Auto-detected from project files. No configuration needed.

| File | Stack |
|------|-------|
| `package.json` | Node.js / TypeScript / React / NestJS / Next.js |
| `pyproject.toml` / `setup.py` | Python / FastAPI / Django |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `build.gradle` / `pom.xml` | Java / Kotlin |
| `Gemfile` | Ruby |
| `Makefile` | Generic |

---

## Repository Structure

```
uc-taskmanager/
├── develop/                 ← Source of truth (edit here)
│   ├── agents/              ← 6 agent prompts (language-agnostic)
│   │   ├── orchestrator.md  ← Nested spawn coordinator: specifier→(planner)→builder→verifier→committer, TASK DAG scheduling, gates/decisions, batch log
│   │   ├── specifier.md     ← [] tag detection + requirement analysis
│   │   ├── planner.md       ← WORK creation + TASK decomposition
│   │   ├── builder.md       ← Code implementation
│   │   ├── verifier.md      ← Build/lint/test verification
│   │   └── committer.md     ← git commit + result.md
│   ├── references/          ← 6 support files (read by the orchestrator only)
│   │   ├── agent-flow.md          ← Pipeline orchestration rules
│   │   ├── context-policy.md      ← Sliding window context rules
│   │   ├── file-content-schema.md ← File format definitions
│   │   ├── shared-prompt-sections.md ← Shared reusable sections
│   │   ├── work-activity-log.md   ← Activity log format
│   │   └── xml-schema.md          ← XML communication format + ref-cache protocol (§ 4)
│   ├── skills/              ← Skill definitions (sdd-pipeline, uctm-init, work-pipeline, work-status)
│   └── .claude-plugin/
│       └── plugin.json      ← Plugin manifest source (name, version, agents array)
├── npm/                     ← npm package (published as `uctm`)
│   ├── agents/              ← Synced from develop/agents/
│   ├── references/          ← Synced from develop/references/ (7 files)
│   ├── skills/              ← Synced from develop/skills/ (4 SKILL.md)
│   ├── bin/cli.mjs          ← CLI entry point (uctm init/update)
│   ├── lib/                 ← CLI implementation (constants.mjs, init.mjs, update.mjs)
│   ├── .claude-plugin/
│   │   └── plugin.json      ← Synced from develop/.claude-plugin/plugin.json
│   ├── README.md            ← Synced from README.md (exposed on npmjs.com)
│   ├── package.json         ← npm package config
│   ├── .npmignore
│   └── LICENSE
├── plugin/                  ← Claude Plugin (Marketplace)
│   ├── agents/              ← Synced from develop/agents/
│   ├── references/          ← Synced from develop/references/
│   ├── skills/              ← Plugin skills
│   │   ├── sdd-pipeline/
│   │   │   └── SKILL.md     ← Skill manifest
│   │   ├── uctm-init/
│   │   │   └── SKILL.md     ← /uctm-init (setup works/, CLAUDE.md, permissions)
│   │   ├── work-pipeline/
│   │   │   └── SKILL.md
│   │   └── work-status/
│   │       └── SKILL.md
│   └── .claude-plugin/
│       └── plugin.json      ← Plugin manifest (name, version, agents array)
├── .claude/                 ← Local Claude settings (not committed)
│   └── settings.local.json
├── README.md                ← English (default, this file)
├── README_KO.md             ← Korean
├── CLAUDE.md                ← Project-level Claude instructions (push procedure, language, agent call rules)
├── LICENSE
├── docs/                    ← Design specifications
│   ├── spec_pipeline-architecture_v1.3.md  ← Pipeline architecture v1.3 (ref-cache, Specifier-based)
│   ├── spec_sliding-window-context.md      ← Sliding window context design
│   ├── spec_SDD_with_ucagent_requirement.md ← SDD v1.5 requirement management system design
│   ├── pipeline-architecture-v1.3-visual.html ← Interactive pipeline visualization (with ref-cache tab)
│   ├── SDD-requirement-visual.html         ← Interactive SDD visualization (with ref-cache tab)
│   ├── sliding-window-context-visual.html  ← Interactive sliding window visualization
│   └── _archive/                           ← Legacy docs (Router-based)
└── works/                   ← WORK directories (auto-generated)
    ├── WORK-LIST.md          ← Master index
    ├── WORK-01/              ← every WORK outputs here
    └── ...
```

---

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git initialized (`git init`)
- No other dependencies.

---

## Optional: MCP Configuration

### Serena MCP — Symbol-Level Code Navigation

Special thanks to the [Oraios](https://github.com/oraios) team for building and open-sourcing [Serena](https://github.com/oraios/serena). Their symbol-level code navigation tools make a real difference in reducing token usage and improving edit precision for AI agents.

The **builder** agent integrates with [Serena MCP](https://github.com/oraios/serena) for symbol-level code exploration. When Serena is available, builder follows this exploration hierarchy instead of reading entire files:

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `list_dir` | Directory structure (replaces `find`) |
| 2 | `get_symbols_overview` | File symbol map before any file read |
| 3 | `find_symbol(depth=1)` | Class/module method list |
| 4 | `find_symbol(include_body=true)` | Precise body read for target symbol only |
| 5 | `find_referencing_symbols` | Impact analysis before editing |
| 6 | `Read` | Last resort when above tools are insufficient |

This reduces read tokens by 30–50% on large codebases by reading only the symbols needed, not entire files.

#### Disable Auto Browser Launch

Serena opens a web dashboard in your browser on every startup. To disable this, add `--open-web-dashboard False` to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--context", "ide-assistant",
        "--project", ".",
        "--open-web-dashboard", "False"
      ]
    }
  }
}
```

The dashboard is still available at `http://localhost:PORT` — it just won't auto-open on startup.

---

## The Bigger Picture

This agent is designed to work with an **SDD-based requirement management and automated development system** — a server application that links requirement management → automated development → plans and artifacts. The full system architecture is documented in [`docs/spec_SDD_with_ucagent_requirement.md`](docs/spec_SDD_with_ucagent_requirement.md). Use it as a reference to build your own system tailored to your needs.

---

## License

GPL-3.0
