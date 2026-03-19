<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-GPLv3-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

**Universal Claude Task Manager** — A general-purpose task pipeline subagent system for Claude Code CLI.

**[한국어 문서 (Korean)](README_KO.md)**

---

## Quick Start

```bash
npm install -g uctm
cd your-project
uctm init --lang en   # English agents
uctm init --lang ko   # 한국어 에이전트
uctm init             # Interactive language selection
```

Then start Claude Code and use pipeline tags:

```
claude
> [new-feature] Add a hello world feature
```

To run without permission prompts (file creation, shell commands, etc.), use bypass mode:

```bash
claude --dangerously-skip-permissions
```

> **Warning**: Only use bypass mode in isolated environments or when you trust the pipeline fully. See [Claude Code Permissions](https://code.claude.com/docs/en/permissions) for details.

That's it. The specifier analyzes your request, plans the work, and executes through isolated subagent pipelines.

---

## Why This Project Exists

The pitfalls of **vibe coding** with AI agents are already well known. You hand your brain to the AI, the code gets written, but nothing remains — no requirements, no execution plan, no design rationale. The software you built cannot be maintained because it was never truly *yours* to begin with.

**SDD (Specification-Driven Development)** flips the value hierarchy:

> Code is no longer the asset.
> **Requirements → Architecture → Design** — these are the real assets now.
> Code is just the output.

uc-taskmanager was built to solve this. When you provide a requirement as input, the system:

1. **Plans** — creates an execution plan with dependency graphs
2. **Decomposes** — breaks the plan into concrete TASKs
3. **Executes** — runs each TASK through isolated Claude AI subagents (build → verify → commit)
4. **Accumulates** — every requirement, plan, and result is preserved as a traceable artifact

Each step runs in an **isolated subagent pipeline**, so your context stays clean and every decision is documented.

---

Six subagents work across any project and any language, automatically handling **request routing → task decomposition → dependency management → code implementation → verification → commit**.

```
"[new-feature] Build a user authentication feature"
→ specifier decides WORK, planner creates WORK-01 with 5 TASKs, pipeline executes
```

---

## Usage

### Trivial Fix (direct mode)

```
> [bugfix] Fix typo in login error message
```

Main Claude calls specifier, which selects `execution-mode: direct`. Specifier itself (acting as builder) implements the change + committer commits. Creates WORK-NN directory + PLAN + result.md + commit.

### Quick Task (pipeline mode)

```
> [bugfix] Fix the login button not responding on mobile
```

Main Claude calls specifier, which selects `execution-mode: pipeline` and creates PLAN. Then Main Claude calls builder → verifier → committer in sequence.

### Complex Feature (WORK)

#### 1. Create WORK (Planning)

```
> [new-feature] Build a user authentication feature. Plan it.
```

The planner analyzes the project and creates WORK-01:

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

The scheduler executes WORK-01's TASKs in dependency order.

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

#### 6. Run a Specific TASK

Skip to a specific TASK within a WORK (e.g., retry after a failure):

```
> Run WORK-02: TASK-02
```

The scheduler returns the next TASK, then Main Claude calls builder → verifier → committer in sequence.

#### 7. Force WORK Creation (Skip Complexity Check)

Use the `[new-work]` tag to always create a new WORK regardless of complexity:

```
> [new-work] Refactor the auth module
```

#### 8. Handle Failure / Retry

If a TASK fails during the pipeline, the scheduler retries up to 3 times automatically.
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

The scheduler reads `PROGRESS.md` and `result.md` files to report current state.

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

### npm (Recommended)

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
mkdir -p .claude/agents
cp /tmp/uc-tm/agents/en/*.md .claude/agents/   # or agents/ko/ for Korean
rm -rf /tmp/uc-tm
git add .claude/agents/ && git commit -m "chore: add uc-taskmanager agents"
```

### Verify

```bash
claude
> /agents
# specifier, planner, scheduler, builder, verifier, committer → confirm all 6
```

---

## Concept: Three Execution Modes

Main Claude detects the `[]` tag and calls the **specifier** subagent, which selects one of three `execution-mode` values:

```
User Request → Main Claude (orchestrator)
                    │
                    ▼
              ┌───────────┐
              │ specifier │ (called by Main Claude)
              └─────┬─────┘
                    │
              execution-mode returned
                    │
      ├─ direct  (no build/test required)
      │   → specifier acts as builder + Main Claude calls committer
      │
      ├─ pipeline  (build/test required, single domain, sequential)
      │   → Main Claude calls: builder → verifier → committer (in sequence)
      │
      └─ full  (multi-domain / complex DAG / new module / 5+ tasks)
          → Main Claude calls: planner → scheduler → [builder → verifier → committer] × N
```

All three modes output to `works/WORK-NN/` and guarantee `result.md` + `COMMITTER DONE` callback.

### WORK (Multi-Task, full mode)

A two-level hierarchy for complex features:

```
WORK (unit of work)       A single goal. The unit requested by the user.
└── TASK (unit of task)   An individual execution unit to achieve the WORK.
    └── result            Completion proof. Auto-generated after verification.
```

### pipeline mode (Single Task, Delegated)

Subagent-delegated path for moderate single tasks. Main Claude calls each agent in sequence. Specifier stays clean.

```
Main Claude → builder(sonnet) → verifier(haiku) → committer(haiku)
              (each called individually by Main Claude)
```

### direct mode (Trivial)

Main Claude calls specifier, which determines direct mode and implements the change itself. Main Claude then calls committer.

```
Main Claude → specifier: Analyze → Implement → Self-verify → [back to Main Claude]
Main Claude → committer: Commit → result.md
```

---

## Pipeline

### WORK Pipeline (Complex)

> Subagents cannot nest — Main Claude (CLI terminal) orchestrates every call.

```
                               Main Claude (orchestrator)
                    ┌─────────────┼──────────────────────┐
                    │             │                       │
  specifier        planner          scheduler         builder          verifier         committer
 ┌──────────┐    ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │Request   │────▶│Create   │────▶│Dependency│────▶│Code      │────▶│Build/Test│────▶│Result    │
 │Analysis  │     │WORK/TASK│     │DAG+Order │     │Implement │     │Verify    │     │→ git     │
 └──────────┘    └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                                                        │                │                │
                                                        └── Retry on fail┘                │
                                                           (max 3 times)                  │
                                                                          Next TASK loop ◀┘
```

### pipeline mode (Simple → Delegated)

```
  specifier         builder          verifier         committer
 ┌──────────┐      ┌──────────┐     ┌──────────┐     ┌──────────┐
 │PLAN      │─────▶│Code      │────▶│Build/Test│────▶│Result    │
 │+TASK     │      │Implement │     │Verify    │     │→ git     │
 └──────────┘      └──────────┘     └──────────┘     └──────────┘
                    (sonnet)         (haiku)           (haiku)
              ← each called by Main Claude →
```

### direct mode (Trivial)

```
  specifier                                          committer
 ┌──────────────────────────────────┐               ┌──────────┐
 │ Analyze → Implement → Self-check │──────────────▶│Commit    │
 └──────────────────────────────────┘               │→ result  │
  (no build/test required)                          └──────────┘
```

### Agents

| Agent | Role | Model | Permission | MCP |
|-------|------|-------|------------|-----|
| **specifier** | `[]` tag detection, execution-mode판정(direct/pipeline/full), PLAN생성, WORK-LIST관리, direct 모드 구현(builder 겸임) | **opus** | read + dispatch + write | Serena(direct 코드수정), sequential-thinking(복잡도판정) |
| **planner** | Create WORK + decompose TASKs + generate PLAN.md(Execution-Mode:full) + pre-create progress templates | **opus** | read-only | Serena(코드베이스탐색), sequential-thinking(TASK분해) |
| **scheduler** | Manage DAG for a specific WORK + run pipeline with sliding window context | **haiku** | read + dispatch | — |
| **builder** | Code implementation + progress.md checkpoint recording | **sonnet** | full access | Serena(심볼단위탐색/편집) |
| **verifier** | Progress gate (Status=COMPLETED) → build/lint/test verification (read-only) | **haiku** | read + execute | — |
| **committer** | Gate check (progress.md) → write result.md → git commit → COMMITTER DONE callback | **haiku** | read + write + git | — |

---

## File Structure

```
works/
├── WORK-LIST.md                      ← Master list of all WORKs (managed by specifier)
├── WORK-01/                          ← "User Authentication"
│   ├── PLAN.md                       ← Plan + dependency graph
│   ├── PROGRESS.md                   ← Progress tracking (auto-updated)
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

### WORK-LIST.md

The specifier maintains `works/WORK-LIST.md` as the master index:

| WORK ID | Title | Status | Created |
|---------|-------|--------|---------|
| WORK-01 | User Authentication | COMPLETED | 2026-03-01 |
| WORK-02 | Payment Integration | IN_PROGRESS | 2026-03-05 |

| Status | Meaning |
|--------|---------|
| `IN_PROGRESS` | TASKs in progress — not yet pushed |
| `COMPLETED` | All TASKs committed + git push done |

- **IN_PROGRESS**: specifier checks this before creating new WORKs
- **COMPLETED**: updated at `git push` time — **not by agents**

#### git push Procedure

When you ask Claude to push (`"push this"`, `"git push"`), Claude handles the full sequence automatically:

```
1. Open works/WORK-LIST.md
2. Find all IN_PROGRESS WORKs
3. Change status → COMPLETED, update date
4. git add works/WORK-LIST.md
5. git commit -m "chore: update WORK-LIST — WORK-XX COMPLETED"
6. git push
```

> **Agents (builder / committer / scheduler) never update WORK-LIST to COMPLETED.**
> COMPLETED is only set at push time. If an agent outputs `🎉 WORK complete!`, that is a status message — not a WORK-LIST update.

---

## Tips

### Keep CLAUDE.md Up to Date

The language setting and project context live in `CLAUDE.md`. Agents read this on every invocation — keeping it accurate reduces back-and-forth.

### Use `[]` Tags Consistently

Requests without `[]` tags are handled directly by Claude without routing. If you want guaranteed pipeline behavior, always use a tag.

### Parallel TASKs

The planner creates dependency-aware TASK graphs. Independent TASKs (same `blockedBy` set) can be dispatched concurrently by the scheduler — mention it when approving:

```
> Approve. Run independent tasks in parallel.
```

### Resume After Context Reset

If Claude loses context mid-pipeline, you can always resume:

```
> Resume WORK-02 from where it stopped
```

The scheduler reads `PROGRESS.md` to determine the last completed TASK and continues.

---

## Example Session

```
User: [new-feature] Build a comment feature for the blog system.

Claude: [specifier → WORK path]
  Complexity: 4+ files, DB schema change, multiple modules
  → Creating new WORK

Claude: [planner]
  Project analysis
     Tech Stack: Next.js + Prisma + PostgreSQL
     Existing code: Post CRUD done, Auth done

  WORK-03: Comment Feature

  WORK-03: TASK-00: Comment model + migration          ← no dependencies
  WORK-03: TASK-01: Comment CRUD API                   ← TASK-00
  WORK-03: TASK-02: Nested comments (self-relation)    ← TASK-01
  WORK-03: TASK-03: Frontend comment component         ← TASK-00 (parallelizable)
  WORK-03: TASK-04: Integration + notifications        ← TASK-02, TASK-03

  Do you approve?

User: Approve. Run automatically.

Claude: [scheduler → auto mode]
  WORK-03: TASK-00 → builder → verifier ✅ → committer [a1b2c3d]
  WORK-03: TASK-01 → builder → verifier ✅ → committer [d4e5f6g]
  WORK-03: TASK-02 → builder → verifier ✅ → committer [h7i8j9k]
  WORK-03: TASK-03 → builder → verifier ✅ → committer [l0m1n2o]
  WORK-03: TASK-04 → builder → verifier ✅ → committer [p3q4r5s]

  🎉 WORK-03 completed! 5 tasks, 5 commits
```

---

## Why This Approach?

### Agent File Design

All agent files (`agents/*.md`) are written with a single principle: **core content only, no decoration**. Descriptions, emphasis markers, and redundant examples have been removed. The result is ~1,600 lines total across all agents — less than half the original size — while covering the same functional scope.

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

Each subagent runs in an independent context. Even if the builder creates 50 files using 20,000 tokens, the scheduler only receives a 3-line summary.

```
scheduler's context after 5 TASKs:

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

### Router Rule Config (`.agent/router_rule_config.json`)

The specifier reads `.agent/router_rule_config.json` from the project root to determine routing criteria. If the file is absent, the specifier uses its built-in defaults.

**File location:**
```
{project-root}/.agent/router_rule_config.json
```

**JSON structure:**
```json
{
  "$schema": "http://uc-taskmanager.local/schemas/specifier-rules/v1.0.json",
  "version": "1.1.0",
  "description": "Specifier execution-mode decision criteria. Customize per project.",
  "decision_flow": [
    "1. build_test_required? → false → direct",
    "2. single_domain + sequential DAG → pipeline",
    "3. any full_conditions met → full"
  ],
  "rules": {
    "direct": {
      "criteria": {
        "build_test_required": false,
        "note": "File/line count irrelevant. If no build/test needed → direct (text edits, config changes, simple substitutions)"
      }
    },
    "pipeline": {
      "criteria": {
        "build_test_required": true,
        "single_domain_only": true,
        "max_tasks": 5,
        "dag_complexity": "sequential"
      }
    },
    "full": {
      "criteria": {
        "any_of": [
          "task_count > 5",
          "dag_complexity == complex (2+ dependency levels)",
          "multi_domain == true (BE + FE simultaneously)",
          "new_module == true (design → implement → verify multi-phase)",
          "partial_rollback_needed == true"
        ]
      }
    }
  },
  "customization_guide": {
    "doc-heavy projects (md edits)": "Widen direct scope. Most build_test_required=false cases → direct",
    "code-heavy projects": "Center on pipeline/full. Simple bug fixes → pipeline, multi-domain → full",
    "max_tasks tuning": "Adjust pipeline max_tasks between 3–7 based on team size or context limits"
  }
}
```

**Key fields:**
| Field | Description |
|-------|-------------|
| `rules.direct.criteria.build_test_required` | `false` → specifier handles implementation, then committer commits |
| `rules.pipeline.criteria.max_tasks` | Max task count before escalating to full (default: 5) |
| `rules.pipeline.criteria.dag_complexity` | `sequential` only; complex DAG → escalates to full |
| `rules.full.criteria.any_of` | List of conditions — any match triggers full mode |

**Fallback behavior:** If `.agent/router_rule_config.json` is absent or malformed, the specifier falls back to its built-in defaults (equivalent to the structure above).

**Per-project customization example:**

For a documentation-heavy project where most changes are text edits:
```json
{
  "rules": {
    "direct": {
      "criteria": { "build_test_required": false }
    },
    "pipeline": {
      "criteria": { "max_tasks": 3, "single_domain_only": true, "dag_complexity": "sequential" }
    }
  }
}
```

For a monorepo with strict build requirements:
```json
{
  "rules": {
    "pipeline": {
      "criteria": { "max_tasks": 7 }
    },
    "full": {
      "criteria": {
        "any_of": ["task_count > 7", "multi_domain == true"]
      }
    }
  }
}
```

### Three Execution Modes

The specifier matches effort to complexity via `execution-mode`:
- **direct**: 1-line typo fix — Main Claude calls specifier, which implements the change itself + committer commits. Minimal subagent overhead.
- **pipeline**: Moderate fix — Main Claude calls builder → verifier → committer in sequence. Main Claude only orchestrates, minimizing its own context usage
- **full**: Complex features — full planning, decomposition, and tracking

All three modes output to `works/WORK-NN/` with identical artifact structure (PLAN.md + result.md + COMMITTER DONE callback), ensuring Runner integration works regardless of mode.

### Structured Agent Communication

Instead of ambiguous natural language prompts, agents communicate using structured XML format:

**Dispatch Format** (Caller → Receiver):
```xml
<dispatch to="builder" work="WORK-03" task="TASK-00" execution-mode="pipeline">
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
    <file action="created" path="agents/shared-prompt-sections.md">Common sections with cache_control</file>
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

See `agents/xml-schema.md` for complete format, and `agents/shared-prompt-sections.md` for cacheable sections.

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

### External System Callback (Optional)

uc-taskmanager is generic by default. To integrate with an external system (e.g., a CI/CD backend), add callback URLs to `CLAUDE.md`:

```markdown
## Task Callbacks
TaskCallback: http://localhost:3000/api/v1/runner/{{executionId}}/task-result
ProgressCallback: http://localhost:3000/api/v1/runner/{{executionId}}/task-progress
CallbackToken: <your-token>
```

- **No config** → works as-is, no external calls made
- **TaskCallback** → committer POSTs result after each TASK commit
- **ProgressCallback** → builder POSTs checkpoint after each progress.md update
- Callback failures are non-fatal — a warning is printed and the pipeline continues

See `docs/spec_callback-integration.md` for payload schema and implementation guide.

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
| Routing criteria | `specifier.md` | 3-2. Execution-Mode 결정 |
| Approval policy | `scheduler.md` | Phase 1: User Approval |
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
├── package.json             ← npm package config (uctm)
├── bin/cli.mjs              ← CLI entry point (uctm init/update)
├── lib/                     ← CLI implementation (constants, init, update)
├── README.md                ← English (default)
├── README_KO.md             ← Korean
├── CLAUDE.md                ← Project-level Claude instructions (push procedure, language, agent call rules)
├── LICENSE
├── agents/                  ← Distribution: copy these to install
│   ├── ko/                  ← Korean agent prompts (12 files)
│   │   ├── specifier.md, planner.md, scheduler.md, builder.md,
│   │   ├── verifier.md, committer.md, agent-flow.md,
│   │   ├── context-policy.md, xml-schema.md, shared-prompt-sections.md,
│   │   ├── file-content-schema.md, work-activity-log.md
│   └── en/                  ← English agent prompts (12 files, same structure)
├── .agent/                  ← Per-project configuration
│   └── router_rule_config.json  ← Router execution-mode decision criteria
├── docs/                    ← Design specifications
│   ├── spec_pipeline-architecture.md       ← Pipeline structure & agent roles (v1.2)
│   ├── spec_pipeline-architecture_v1.1.md  ← Pipeline architecture spec v1.1
│   ├── spec_sliding-window-context.md      ← Sliding window context design
│   ├── spec_callback-integration.md        ← External system callback integration
│   ├── pipeline-architecture-visual.html   ← Interactive pipeline visualization
│   └── sliding-window-context-visual.html  ← Interactive sliding window visualization
├── _TODO/                   ← Pending tasks and experiments
│   └── bash-cli-pipeline-automation.md ← Server automation via claude -p (verified)
└── works/                   ← WORK directories (auto-generated)
    ├── WORK-LIST.md          ← Master index
    ├── WORK-01/              ← all modes output here (direct/pipeline/full)
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
