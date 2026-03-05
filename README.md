<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

**Universal Claude Task Manager** — A general-purpose task pipeline subagent system for Claude Code CLI.

Five subagents work across any project and any language, automatically repeating the cycle of **task decomposition → dependency management → code implementation → verification → commit**.

**[한국어 문서 (Korean)](README_KO.md)**

```
"Build a user authentication feature. Plan it."
→ Creates WORK-01, decomposes into 5 TASKs, executes in order
```

---

## Concept: WORK → TASK

uc-taskmanager manages work in a **two-level hierarchy**.

```
WORK (unit of work)       A single goal. The unit requested by the user.
└── TASK (unit of task)   An individual execution unit to achieve the WORK.
    └── result            Completion proof. Auto-generated after verification passes.
```

```
tasks/multi-tasks/
├── WORK-01/                        ← "User Authentication"
│   ├── PLAN.md                     ← Plan + dependency graph
│   ├── PROGRESS.md                 ← Progress tracking (auto-updated)
│   ├── WORK-01-TASK-00.md          ← Project initialization
│   ├── WORK-01-TASK-00-result.md   ← Completion report (= proof of completion)
│   ├── WORK-01-TASK-01.md          ← DB schema
│   ├── WORK-01-TASK-01-result.md
│   └── ...
│
├── WORK-02/                        ← "Payment Integration"
│   ├── PLAN.md
│   ├── WORK-02-TASK-00.md
│   └── ...
│
└── WORK-03/                        ← "Admin Dashboard"
    └── ...
```

Each WORK is independent. There are no cross-WORK dependencies, and you can selectively execute any WORK.

---

## Pipeline

```
  planner          scheduler         builder          verifier         committer
 ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │Create    │────▶│Dependency │────▶│Code      │────▶│Build/Test│────▶│Result    │
 │WORK/TASK │     │DAG + Order│     │Implement │     │Verify    │     │→ git     │
 └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                                       │                │                │
                                       └── Retry on fail┘                │
                                          (max 3 times)                  │
                                                         Next TASK loop ◀┘
```

| Agent | Role | Model | Permission |
|-------|------|-------|------------|
| **router** | Route requests → WORK (multi-TASK) or S-TASK (single) | **sonnet** | read + dispatch |
| **planner** | Create WORK + decompose TASKs + generate plan files | **opus** | read-only |
| **scheduler** | Manage DAG for a specific WORK + run pipeline | **haiku** | read + dispatch |
| **builder** | Code implementation + self-check | **sonnet** | full access |
| **verifier** | Build/lint/test verification (no source modification) | **haiku** | read + execute |
| **committer** | Generate result report → git commit → guide next TASK | **haiku** | read + write + git |

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

### 1. Create WORK (Planning)

```
> Build a user authentication feature. Plan it.
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

### 2. Execute WORK

```
> Run WORK-01 pipeline
```

The scheduler executes only WORK-01's TASKs in order.

### 3. Add Another WORK

```
> Add a payment feature. Plan it.
```

The planner creates WORK-02. It is completely independent from WORK-01.

### 4. Execute a Specific WORK

```
> Run WORK-02 pipeline
```

Executes only WORK-02 without touching WORK-01.

### 5. Check Overall Status

```
> WORK list
```

```
WORK Status
   WORK-01: User Authentication    ✅ 5/5 completed
   WORK-02: Payment Integration    🔄 2/4 in progress
   WORK-03: Admin Dashboard        ⬜ 0/6 pending
```

### 6. Auto Mode

```
> Run WORK-02 automatically
```

### 7. Resume After Interruption

```
> Resume WORK-02
```

---

## Example Session

```
User: Build a comment feature for the blog system. Plan it.

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

User: Approve

Claude: [planner → files created]
  ✅ tasks/multi-tasks/WORK-03/ created
  Start with "Run WORK-03 pipeline"

User: Run WORK-03 pipeline

Claude: [scheduler]
  WORK-03: Comment Feature (0/5)
     Next: WORK-03-TASK-00 — Comment model + migration
     Type "approve" to start.

User: Approve

Claude: [builder → verifier → committer]
  builder: Created Comment model, ran migration
  verifier: Build ✅ Lint ✅ Tests ✅
  committer: feat(WORK-03-TASK-00): Comment model + migration [a1b2c3d]

  WORK-03 progress: 1/5
     ██░░░░░░░░ 20%

  Next:
     - WORK-03-TASK-01: Comment CRUD API
     - WORK-03-TASK-03: Frontend comment component (parallelizable)

User: Continue

  ...repeats...

  WORK-03 completed! 5 tasks, 5 commits
```

---

## Why This Approach?

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

### WORK Isolation

Since WORKs are isolated:
- Failure in WORK-01 does not affect WORK-02
- You can selectively re-run a specific WORK
- Plan multiple features independently and execute in any order

---

## Output Language

Output language is resolved from **CLAUDE.md** in your project. No manual configuration is needed after first setup.

```
1. Check CLAUDE.md for "Language: xx"
   ├─ Found → use that language
   └─ Not found ↓

2. Ask: "Would you like to set the output language? (e.g., ko, en, ja)"
   ├─ User specifies → write to CLAUDE.md + use it
   └─ User declines ↓

3. Auto-detect system locale
   - Windows: PowerShell → [CultureInfo]::CurrentCulture.TwoLetterISOLanguageName
   - Linux/Mac: locale → LANG=ko_KR.UTF-8 → ko
   → Write detected language to CLAUDE.md as default
```

Once set, the language is stored in CLAUDE.md and never asked again:

```markdown
## Language
ko
```

All agents read from PLAN.md first, then CLAUDE.md, then fall back to `en`:

```
Priority: PLAN.md > Language: → CLAUDE.md ## Language → en (default)
```

| Item | Detected Language | Always English |
|------|:-:|:-:|
| PLAN.md titles/descriptions | ✅ | |
| TASK file titles/descriptions | ✅ | |
| Result reports | ✅ | |
| File names, paths, commands | | ✅ |
| Git commit messages | | ✅ |
| Code comments | | ✅ (project convention) |

---

## Customization

Place a file with the same name in `.claude/agents/` to override.

| What | File | Section |
|------|------|---------|
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
│   ├── router.md            ← Route requests (WORK vs S-TASK)
│   ├── planner.md           ← Create WORK + decompose TASKs
│   ├── scheduler.md         ← Run pipeline per WORK
│   ├── builder.md           ← Code implementation
│   ├── verifier.md          ← Verification (read-only)
│   └── committer.md         ← Result report → git commit
├── .claude/
│   └── agents/              ← Active agents (used by this project)
│       └── (same as above)
└── tasks/
    └── multi-tasks/         ← WORK directories (auto-generated)
        ├── WORK-01/
        ├── WORK-02/
        └── ...
```

---

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git initialized (`git init`)
- No other dependencies.

---

## License

MIT
