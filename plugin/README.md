# uc-taskmanager

**Universal Claude Task Manager** — A general-purpose task pipeline subagent system for Claude Code CLI.

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

## Agents

The plugin includes 6 pipeline agents and 6 support files:

### Pipeline Agents

| Agent | Role |
|-------|------|
| **specifier** | Detects `[]` tags, selects execution mode (direct / pipeline / full), creates plans |
| **planner** | Creates WORK + decomposes into TASKs, generates PLAN.md with dependency graph |
| **scheduler** | Manages DAG for a WORK, runs the builder → verifier → committer pipeline |
| **builder** | Implements code changes, records progress checkpoints |
| **verifier** | Runs build / lint / test verification (read-only) |
| **committer** | Gates on progress.md completion → writes result.md → git commit |

### Support Files

| File | Purpose |
|------|---------|
| `agent-flow.md` | Pipeline orchestration rules — how Main Claude calls each agent |
| `file-content-schema.md` | Single source of truth for all file formats (PLAN.md, TASK.md, progress.md, result.md) |
| `shared-prompt-sections.md` | Cacheable shared sections — reduces repeated token cost up to 90% |
| `context-policy.md` | Sliding window context transfer rules between agents |
| `work-activity-log.md` | Activity log format for builder stage tracking |
| `xml-schema.md` | XML communication format for dispatch and task-result messages |

---

## Installation

1. Open [Claude Marketplace](https://claude.ai/marketplace)
2. Search for **uc-taskmanager**
3. Click **Install Plugin**
4. Open Claude Code — agents are immediately available

No configuration required. The plugin works out of the box.

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

The specifier automatically selects the right mode based on complexity:

| Mode | When | What Happens |
|------|------|--------------|
| `direct` | Simple change, no build/test needed | Specifier implements + committer commits |
| `pipeline` | Moderate task, build/test required | builder → verifier → committer |
| `full` | Complex feature, multi-domain, 5+ tasks | planner → scheduler → [builder → verifier → committer] × N |

### WORK Pipeline (Complex Features)

```
> [new-feature] Build user authentication

Claude: [planner]
  WORK-01: User Authentication
  TASK-00: DB schema + migration      ← no dependencies
  TASK-01: JWT auth API               ← TASK-00
  TASK-02: Frontend login form        ← TASK-00 (parallel)
  TASK-03: Integration tests          ← TASK-01, TASK-02

  Approve this plan?

> Approve. Run automatically.

Claude: TASK-00 → builder ✅ → verifier ✅ → committer [a1b2c3]
        TASK-01 → builder ✅ → verifier ✅ → committer [d4e5f6]
        ...
```

### Status Check

```
> WORK list
> Show WORK-01 progress
> What is the status of WORK-02: TASK-03?
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
| `[new-work]` | Always create new WORK (skips complexity check) |

No `[]` tag = Claude handles the request directly without pipeline routing.

---

## Output Files

All pipeline runs output to `works/WORK-NN/`:

```
works/
├── WORK-LIST.md              ← Master index of all WORKs
└── WORK-01/
    ├── PLAN.md               ← Plan + dependency graph
    ├── PROGRESS.md           ← Live progress tracking
    ├── TASK-00.md            ← Task specification
    ├── TASK-00_progress.md   ← Builder checkpoint (real-time)
    ├── TASK-00_result.md     ← Completion report (committer writes)
    └── ...
```

Every decision is preserved as a traceable artifact — requirements, plans, results, and git commits.

---

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git initialized in your project (`git init`)
- No other dependencies

---

## Notes

- **English agents only** — this Marketplace Plugin ships English agents. For Korean agents (`--lang ko`) or per-project customization, use the [npm CLI](https://www.npmjs.com/package/uctm) instead.
- **Override agents** — place a file with the same name in `.claude/agents/` to override any plugin agent for your project.
- **Bypass mode** — to skip permission prompts (file creation, shell commands): `claude --dangerously-skip-permissions` (only use in trusted environments)

---

## License

GPL-3.0 — [UCJung](https://github.com/UCJung) · [Repository](https://github.com/UCJung/uc-taskmanager-claude-agent)
