<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

**Universal Claude Task Manager** — A general-purpose task pipeline subagent system for Claude Code CLI.

Six subagents work across any project and any language, automatically handling **request routing → task decomposition → dependency management → code implementation → verification → commit**.

**[한국어 문서 (Korean)](README_KO.md)**

```
"[추가기능] Build a user authentication feature"
→ router decides WORK, planner creates WORK-01 with 5 TASKs, pipeline executes
```

---

## Concept: Three Execution Paths

The **router** analyzes every `[]`-tagged request and routes to one of three paths:

```
User Request
     │
     ▼
  ┌────────┐
  │ router │ ── no [] tag ──▶ handle directly (no pipeline)
  └───┬────┘
      │ [] tag detected
      ▼
  Assess complexity
      │
      ├─ Trivial (1 file, ≤10 lines)
      │   ▼
      │  S-TASK Direct ── router handles directly
      │                   (fastest, no subagent overhead)
      │
      ├─ Simple (2~3 files, or >10 lines)
      │   ▼
      │  S-TASK Pipeline ── builder → verifier → committer
      │                     (context-isolated, same quality as WORK)
      │
      └─ Complex (4+ files, 3+ steps, dependencies)
          ▼
         WORK ── planner → scheduler → [builder → verifier → committer] × N
                 (full planning + multi-task pipeline)
```

### WORK (Multi-Task)

A two-level hierarchy for complex features:

```
WORK (unit of work)       A single goal. The unit requested by the user.
└── TASK (unit of task)   An individual execution unit to achieve the WORK.
    └── result            Completion proof. Auto-generated after verification.
```

### S-TASK Pipeline (Single Task, Delegated)

Subagent-delegated path for moderate single tasks. Router stays clean.

```
router → builder(sonnet) → verifier(haiku) → committer(haiku)
```

### S-TASK Direct (Trivial)

Router handles everything in its own context. For 1-file, ≤10-line changes only.

```
router: Analyze → Implement → Self-verify → Commit
```

---

## Pipeline

### WORK Pipeline (Complex)

```
  router           planner          scheduler         builder          verifier         committer
 ┌────────┐      ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │Request  │────▶│Create    │────▶│Dependency │────▶│Code      │────▶│Build/Test│────▶│Result    │
 │Analysis │     │WORK/TASK │     │DAG + Order│     │Implement │     │Verify    │     │→ git     │
 └────────┘     └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                                                       │                │                │
                                                       └── Retry on fail┘                │
                                                          (max 3 times)                  │
                                                                         Next TASK loop ◀┘
```

### S-TASK Pipeline (Simple → Delegated)

```
  router            builder          verifier         committer
 ┌────────┐       ┌──────────┐     ┌──────────┐     ┌──────────┐
 │Request  │─────▶│Code      │────▶│Build/Test│────▶│Result    │
 │Analysis │      │Implement │     │Verify    │     │→ git     │
 └────────┘      └──────────┘     └──────────┘     └──────────┘
  (context clean)  (sonnet)         (haiku)           (haiku)
```

### S-TASK Direct (Trivial)

```
  router
 ┌──────────────────────────────────────┐
 │ Analyze → Implement → Verify → Commit │
 └──────────────────────────────────────┘
  (1 file, ≤10 lines — no subagent overhead)
```

### Agents

| Agent | Role | Model | Permission |
|-------|------|-------|------------|
| **router** | `[]` tag detection, 3-path routing (Direct/Pipeline/WORK), WORK-LIST.md management | **sonnet** | read + dispatch |
| **planner** | Create WORK + decompose TASKs + generate plan files | **opus** | read-only |
| **scheduler** | Manage DAG for a specific WORK + run pipeline | **haiku** | read + dispatch |
| **builder** | Code implementation + self-check (build/lint) | **sonnet** | full access |
| **verifier** | Build/lint/test verification (read-only, no source modification) | **haiku** | read + execute |
| **committer** | Generate result report → git commit → report next TASK | **haiku** | read + write + git |

---

## The `[]` Tag System

Prefix your request with a `[]` tag to trigger the pipeline:

| Tag | Meaning |
|-----|---------|
| `[추가기능]` | New feature |
| `[기능개선]` | Enhancement |
| `[오류수정]` / `[버그수정]` | Bug fix |
| `[WORK 시작]` | Always create new WORK (skip complexity check) |

No `[]` tag = handled directly without pipeline.

---

## File Structure

```
tasks/
├── multi-tasks/
│   ├── WORK-LIST.md                    ← Master list of all WORKs (managed by router)
│   ├── WORK-01/                        ← "User Authentication"
│   │   ├── PLAN.md                     ← Plan + dependency graph
│   │   ├── PROGRESS.md                 ← Progress tracking (auto-updated)
│   │   ├── WORK-01-TASK-00.md          ← Task specification
│   │   ├── WORK-01-TASK-00-result.md   ← Completion report (= proof of done)
│   │   ├── WORK-01-TASK-01.md
│   │   └── ...
│   └── WORK-02/
│       └── ...
│
└── simple-tasks/
    ├── S-TASK-00001-result.md          ← Single task results
    └── ...
```

### WORK-LIST.md

The router maintains `tasks/multi-tasks/WORK-LIST.md` as the master index:

| WORK ID | Title | Status | Created |
|---------|-------|--------|---------|
| WORK-01 | User Authentication | COMPLETED | 2026-03-01 |
| WORK-02 | Payment Integration | IN_PROGRESS | 2026-03-05 |

- **IN_PROGRESS**: router checks this before creating new WORKs
- **COMPLETED**: updated after git push

---

## Installation

### Global (available across all projects)

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git
cp uc-taskmanager-claude-agent/agents/*.md ~/.claude/agents/
```

### Per-Project

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git /tmp/uc-tm
mkdir -p .claude/agents
cp /tmp/uc-tm/agents/*.md .claude/agents/
rm -rf /tmp/uc-tm
git add .claude/agents/ && git commit -m "chore: add uc-taskmanager agents"
```

### Verify

```bash
claude
> /agents
# router, planner, scheduler, builder, verifier, committer → confirm all 6
```

---

## Usage

### Trivial Fix (S-TASK Direct)

```
> [버그수정] Fix typo in login error message
```

Router detects a trivial 1-line fix → handles directly. No subagent overhead.

### Quick Task (S-TASK Pipeline)

```
> [버그수정] Fix the login button not responding on mobile
```

Router detects a moderate fix (multiple lines, 2 files) → delegates to builder → verifier → committer. Router context stays clean.

### Complex Feature (WORK)

#### 1. Create WORK (Planning)

```
> [추가기능] Build a user authentication feature. Plan it.
```

The planner analyzes the project and creates WORK-01:

```
WORK-01: User Authentication

  WORK-01-TASK-00: Project initialization        ← no dependencies
  WORK-01-TASK-01: DB schema design              ← TASK-00
  WORK-01-TASK-02: JWT auth API                  ← TASK-01
  WORK-01-TASK-03: User CRUD                     ← TASK-02
  WORK-01-TASK-04: Tests + documentation         ← TASK-03

  Do you approve this plan?
```

#### 2. Execute WORK

```
> Run WORK-01 pipeline
```

The scheduler executes WORK-01's TASKs in dependency order.

#### 3. Add to Existing WORK

If WORK-01 is IN_PROGRESS, the router asks:
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
> Run WORK-02-TASK-02
```

The scheduler reads the TASK file directly and dispatches builder → verifier → committer.

#### 7. Force WORK Creation (Skip Complexity Check)

Use the `[WORK 시작]` tag to always create a new WORK regardless of complexity:

```
> [WORK 시작] Refactor the auth module
```

#### 8. Handle Failure / Retry

If a TASK fails during the pipeline, the scheduler retries up to 3 times automatically.
If it still fails, you can inspect the result file and retry manually:

```
> WORK-02-TASK-01 failed. Retry it.
```

Or fix the issue and re-run:

```
> Fix the issue in src/auth.ts, then retry WORK-02-TASK-01
```

#### 9. Add a TASK to an In-Progress WORK

```
> [기능개선] Add rate limiting to the auth API
```

If WORK-02 is `IN_PROGRESS`, the router asks:
> "WORK-02 (Auth Module) is in progress. Add as a new TASK, or create a new WORK?"

#### 10. Check Individual TASK Status

```
> Show WORK-02 progress
> What's the status of WORK-03-TASK-02?
```

The scheduler reads `PROGRESS.md` and `result.md` files to report current state.

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
User: [추가기능] Build a comment feature for the blog system.

Claude: [router → WORK path]
  Complexity: 4+ files, DB schema change, multiple modules
  → Creating new WORK

Claude: [planner]
  Project analysis
     Tech Stack: Next.js + Prisma + PostgreSQL
     Existing code: Post CRUD done, Auth done

  WORK-03: Comment Feature

  WORK-03-TASK-00: Comment model + migration          ← no dependencies
  WORK-03-TASK-01: Comment CRUD API                   ← TASK-00
  WORK-03-TASK-02: Nested comments (self-relation)    ← TASK-01
  WORK-03-TASK-03: Frontend comment component         ← TASK-00 (parallelizable)
  WORK-03-TASK-04: Integration + notifications        ← TASK-02, TASK-03

  Do you approve?

User: Approve. Run automatically.

Claude: [scheduler → auto mode]
  WORK-03-TASK-00 → builder → verifier ✅ → committer [a1b2c3d]
  WORK-03-TASK-01 → builder → verifier ✅ → committer [d4e5f6g]
  WORK-03-TASK-02 → builder → verifier ✅ → committer [h7i8j9k]
  WORK-03-TASK-03 → builder → verifier ✅ → committer [l0m1n2o]
  WORK-03-TASK-04 → builder → verifier ✅ → committer [p3q4r5s]

  🎉 WORK-03 completed! 5 tasks, 5 commits
```

---

## Why This Approach?

### WORK ID Assignment Strategy

WORK IDs are assigned based on a **filesystem-first approach**:

1. **Filesystem Source**: The planner scans `tasks/multi-tasks/` directory to find existing WORK directories and determines the next WORK ID based on the latest directory found.
2. **MEMORY.md NOT used**: Project memory (MEMORY.md) is never referenced for WORK numbering. Only the filesystem is the authoritative source.
3. **Consistency Check**: The router validates WORK ID consistency by checking both the filesystem and WORK-LIST.md before dispatching to the planner.

This ensures:
- No duplicate WORK IDs even if MEMORY.md is stale or corrupted
- Reliable resumption across sessions
- Clear traceability: WORK-NN directly corresponds to `tasks/multi-tasks/WORK-NN/`

### Context Isolation

Each subagent runs in an independent context. Even if the builder creates 50 files using 20,000 tokens, the scheduler only receives a 3-line summary.

```
scheduler's context after 5 TASKs:

  PLAN.md (loaded once)                              ~500 tokens
  WORK-01-TASK-00 result: "20 files, PASS"           ~200 tokens
  WORK-01-TASK-01 result: "15 files, PASS"           ~200 tokens
  WORK-01-TASK-02 result: "8 files, PASS"            ~200 tokens
  WORK-01-TASK-03 result: "12 files, PASS"           ~200 tokens
  WORK-01-TASK-04 result: "5 files, PASS"            ~200 tokens
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

### Three-Path Routing

The router matches effort to complexity:
- **S-TASK Direct**: 1-line typo fix — no subagent overhead, instant
- **S-TASK Pipeline**: Moderate fix — delegated to subagents, router context stays clean
- **WORK**: Complex features — full planning, decomposition, and tracking

Consecutive S-TASK Pipelines keep the router at ~1,000 tokens regardless of how many tasks are processed, versus ~15K+ tokens if the router handled everything directly.

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
| Routing criteria | `router.md` | Three-Path Routing |
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
├── README.md                ← English (default)
├── README_KO.md             ← Korean
├── LICENSE
├── agents/                  ← Distribution: copy these to install
│   ├── router.md            ← Request routing (WORK vs S-TASK)
│   ├── planner.md           ← Create WORK + decompose TASKs
│   ├── scheduler.md         ← Run pipeline per WORK
│   ├── builder.md           ← Code implementation
│   ├── verifier.md          ← Verification (read-only)
│   └── committer.md         ← Result report → git commit
└── tasks/
    ├── multi-tasks/         ← WORK directories (auto-generated)
    │   ├── WORK-LIST.md     ← Master index
    │   ├── WORK-01/
    │   └── ...
    └── simple-tasks/        ← S-TASK results (auto-generated)
```

---

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git initialized (`git init`)
- No other dependencies.

---

## Optional: MCP Configuration

### Serena MCP — Disable Auto Browser Launch

If you use [Serena MCP](https://github.com/oraios/serena), it opens a web dashboard in your browser on every startup. To disable this, add `--open-web-dashboard False` to your `~/.claude.json`:

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

## License

MIT
