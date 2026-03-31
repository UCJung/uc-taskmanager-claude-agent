# Agent Flow — Main Claude Orchestration Guide

> **All agent invocations are performed by Main Claude.**
> Sub-agents only return results (dispatch XML or task-result XML) after completing their work.
> Main Claude receives return values and invokes the next agent.

---

## Pipeline Flow

```
[] tag detected → invoke specifier
    │
    Check specifier return value
    │
    ├─ Assumed (direct) → specifier creates Requirement.md + PLAN.md + TASK-00
    │                      → returns builder dispatch XML
    │                      → execute § direct procedure
    │
    └─ Delegated (pipeline/full) → specifier creates Requirement.md only
                                    → returns planner dispatch XML
                                    → execute § planner-driven procedure
```

---

## Direct Mode (Specifier Assumes Planner)

```
1. Invoke specifier → creates Requirement.md + PLAN.md + TASK-00 + returns builder dispatch XML
2. ⛔ STOP — Present summary to user and WAIT for approval (do NOT invoke builder)
3. Invoke builder (dispatch XML as prompt) — includes self-check
4. Invoke verifier+committer (builder result as prompt) — verify then commit in one spawn
```

> Verifier+Committer combined: single spawn performs verification, then creates result.md and git commit.

---

## Pipeline Mode (Separate Planner Invocation)

```
1. Invoke specifier+planner (single spawn) → creates Requirement.md + PLAN.md + TASK-NN + determines execution-mode
2. ⛔ STOP — Present Requirement.md + PLAN.md + TASK list and WAIT for approval
3. For each TASK (ascending order):
   a. Invoke builder (per-TASK dispatch XML as prompt)
   b. Invoke verifier+committer (builder result as prompt) — verify then commit in one spawn
   c. If incomplete TASKs remain, continue to next TASK
```

> Specifier+Planner combined: specifier.md role first (Requirement.md), then planner.md role (PLAN.md + TASKs) in one spawn.
> Each TASK must complete the full builder → verifier+committer cycle before the next TASK starts.

---

## Full Mode (With Scheduler)

```
1. Invoke specifier+planner (single spawn) → Requirement.md + PLAN.md + TASKs + execution-mode: full
2. ⛔ STOP — Present Requirement.md + PLAN.md + TASK list and WAIT for approval
3. Invoke scheduler → DAG analysis + READY TASK + returns builder dispatch XML
4. Invoke builder (dispatch XML as prompt) → implementation
5. Invoke verifier+committer (builder result as prompt) → verify then commit in one spawn
6. If incomplete TASKs remain, return to step 3
```

Parallel execution: When scheduler returns multiple READY TASKs, invoke builders concurrently.

---

## Resuming Existing WORK

Resume pipeline for a WORK that already has PLAN.md + TASKs:

```
1. Read last line of works/{WORK_ID}/work_{WORK_ID}.log to determine current state
   Key rule: *_START = interrupted (redo that step), *_DONE = completed (move to next)

   - COMMITTER_DONE — TASK-NN  → TASK-NN completed, resume from next TASK
   - COMMITTER_START — TASK-NN → interrupted, redo verifier+committer for TASK-NN
   - VERIFIER_DONE — TASK-NN   → verified, resume with committer for TASK-NN
   - VERIFIER_START — TASK-NN  → interrupted, redo verifier+committer for TASK-NN
   - BUILDER_DONE — TASK-NN    → built, resume with verifier+committer for TASK-NN
   - BUILDER_START — TASK-NN   → interrupted, redo builder for TASK-NN
   - PLANNER_DONE              → planning done, start first TASK
   - PLANNER_START             → interrupted, redo specifier+planner
   - SPECIFIER_DONE            → specifier done, redo planner
   - SPECIFIER_START           → interrupted, redo specifier+planner
   - No log file               → start from scratch

2. For each remaining TASK:
   a. Invoke builder → implementation
   b. Invoke verifier+committer → verify then commit in one spawn
```

---

## Combined Agent Invocation

### Specifier+Planner (single spawn)

- Model: opus
- Prompt: "Role 1 — Specifier (specifier.md): create Requirement.md. Role 2 — Planner (planner.md): create PLAN.md + TASKs. Execute sequentially. Each role sends its own START/DONE callback + activity log."
- Returns: Requirement.md + PLAN.md + TASK files + execution-mode

### Verifier+Committer (single spawn)

- Model: haiku
- Prompt: "Role 1 — Verifier (verifier.md): verify build/lint/test. Role 2 — Committer (committer.md): create result.md + git commit. If verification FAILS, skip Role 2. Each role sends its own START/DONE callback + activity log."
- On PASS: verification result + commit hash
- On FAIL: verification failure only (no commit)

---

## Agent Role Summary

| Agent | Role | Model | Combined With |
|-------|------|-------|---------------|
| specifier | Requirement analysis | opus | + planner (pipeline/full) |
| planner | PLAN + TASK decomposition | opus | combined into specifier spawn |
| scheduler | DAG management + dispatch | haiku | standalone |
| builder | Code implementation | sonnet | standalone |
| verifier | Build/lint/test verification | haiku | + committer |
| committer | Result report + git commit | haiku | combined into verifier spawn |

---

## Sub-agent Spawn Count by Mode

| Mode | Spec+Plan | Scheduler | Builder | Veri+Commit | Total |
|------|:---------:|:---------:|:-------:|:-----------:|:-----:|
| direct | 1 (assumed) | — | 1 | 1 | **3** |
| pipeline (N TASKs) | 1 (combined) | — | N | N | **1 + 2N** |
| full (N TASKs) | 1 (combined) | 1 | N | N | **2 + 2N** |

**Before vs After (6 TASKs):**

| | Before | After | Reduction |
|---|:---:|:---:|:---:|
| Spawns | 2 + 3×6 = 20 | 2 + 2×6 = 14 | **-30%** |

---

## Approval Gates (CRITICAL)

> **MUST STOP and wait for explicit user approval before invoking the next agent.**
> Do NOT proceed until the user says "approve", "승인", "proceed", "go ahead", or equivalent.
> The only exception is auto mode — when the user's original message contains "auto" or "자동으로".

| Mode | Approvals | Timing | What to show user |
|------|:---------:|--------|-------------------|
| direct | 1 | After Specifier completes | Requirement.md + PLAN.md + TASK-00.md summary |
| pipeline/full | 1 | After Specifier+Planner completes | Requirement.md + PLAN.md + TASK list |
| auto-approve | 0 | — | Skip all approval gates |

> Note: pipeline/full now has **1 approval** (not 2), since specifier and planner run in one spawn.

**How to request approval:**
1. Present a summary of what the specifier+planner created (files, scope, execution-mode)
2. Ask: "Proceed?" or equivalent
3. **WAIT for user response** — do NOT invoke builder until approved

---

## References Directory Passing (REQUIRED)

Main Claude MUST pass the references directory path to every sub-agent invocation.
This allows sub-agents to locate their reference files regardless of installation method (npm or plugin).

**How to pass:**
- Prepend `REFERENCES_DIR={absolute_path}` at the top of the prompt for every Task tool call
- For npm installations: use `.claude/references` (default, resolved from project root)
- For plugin installations: derive from the skill's "Base directory" (`{base_dir}/../../references`)

**Example:**
```
REFERENCES_DIR=C:/Users/me/.claude/plugins/cache/uc-taskmanager/abc123/references

<dispatch to="builder" ...>
  ...
</dispatch>
```

If REFERENCES_DIR is not available (e.g., npm installation without plugin), sub-agents fall back to `.claude/references/`.

---

## Context Handoff (Sliding Window)

| Distance | Level | Content |
|----------|-------|---------|
| Previous | FULL | what + why + caution + incomplete |
| 2 steps back | SUMMARY | what 1-2 lines |
| 3+ steps | DROP | Not passed |

---

## Reference Loading

Each sub-agent reads its own reference files from `{REFERENCES_DIR}/` at startup. Main Claude does NOT read reference files — only `agent-flow.md`.
