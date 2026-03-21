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
4. Invoke committer (builder result as prompt)
```

> Verifier skipped: Builder performs self-check (build/lint), so separate verification is unnecessary for a single TASK.

---

## Pipeline Mode (Separate Planner Invocation)

```
1. Invoke specifier → creates Requirement.md + returns planner dispatch XML
2. ⛔ STOP — Present Requirement.md summary and WAIT for planning approval
3. Invoke planner (dispatch XML as prompt) → creates PLAN.md + TASK-NN + determines execution-mode
4. ⛔ STOP — Present PLAN.md + TASK list and WAIT for development approval
5. Invoke builder (per-TASK dispatch XML as prompt)
6. Invoke verifier (builder result as prompt)
7. Invoke committer (verifier result as prompt)
```

---

## Full Mode (With Scheduler)

```
1. Invoke specifier → creates Requirement.md + returns planner dispatch XML
2. ⛔ STOP — Present Requirement.md summary and WAIT for planning approval
3. Invoke planner → PLAN.md + TASK decomposition + execution-mode: full
4. ⛔ STOP — Present PLAN.md + TASK list and WAIT for development approval
5. Invoke scheduler → DAG analysis + READY TASK + returns builder dispatch XML
6. Invoke builder (dispatch XML as prompt) → implementation
7. Invoke verifier (builder result as prompt) → verification
8. Invoke committer (verifier result as prompt) → commit
9. If incomplete TASKs remain, return to step 5
```

Parallel execution: When scheduler returns multiple READY TASKs, invoke builders concurrently.

---

## Resuming Existing WORK

Resume pipeline for a WORK that already has PLAN.md + TASKs:

```
1. Invoke scheduler → check READY TASKs + return builder dispatch XML
2. Execute builder → verifier → committer in sequence
3. If incomplete TASKs remain, return to step 1
```

---

## Agent Role Summary

| Agent | Return Value | Invoked By |
|-------|-------------|------------|
| specifier | Requirement.md + (when assumed) PLAN.md/TASK + dispatch XML | Main Claude |
| planner | PLAN.md/TASK files created + execution-mode | Main Claude |
| scheduler | READY TASK + dispatch XML | Main Claude |
| builder | task-result XML (including context-handoff) | Main Claude |
| verifier | task-result XML | Main Claude |
| committer | task-result XML + commit hash | Main Claude |

---

## Sub-agent Invocation Count by Mode

| Mode | Specifier | Planner | Scheduler | Builder | Verifier | Committer | Total |
|------|:---------:|:-------:|:---------:|:-------:|:--------:|:---------:|:-----:|
| direct | O (assumed) | X | X | O | X | O | **3** |
| pipeline | O | O | X | O | O | O | **5** |
| full | O | O | O | O | O | O | **6** |

---

## Approval Gates (CRITICAL)

> **MUST STOP and wait for explicit user approval before invoking the next agent.**
> Do NOT proceed until the user says "approve", "승인", "proceed", "go ahead", or equivalent.
> The only exception is auto mode — when the user's original message contains "auto" or "자동으로".

| Mode | Approvals | Timing | What to show user |
|------|:---------:|--------|-------------------|
| direct | 1 | After Specifier completes | Requirement.md + PLAN.md + TASK-00.md summary |
| pipeline/full | 2 | After Specifier → After Planner | 1st: Requirement.md summary, 2nd: PLAN.md + TASK list |
| auto-approve | 0 | — | Skip all approval gates |

**How to request approval:**
1. Present a summary of what the specifier/planner created (files, scope, execution-mode)
2. Ask: "Proceed?" or equivalent
3. **WAIT for user response** — do NOT invoke builder/planner until approved

---

## Bash CLI Execution (Server Automation)

Run the pipeline independently without a conversation session. `claude -p` acts as Main Claude.

```bash
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p \
  "[new-work] {task description}" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  --verbose \
  2>&1 | tee /tmp/pipeline.log
```

| Option | Purpose |
|--------|---------|
| `env -u CLAUDECODE` | Bypass nested execution block |
| `env -u ANTHROPIC_API_KEY` | Use subscription auth (Max) instead of API key |
| `--dangerously-skip-permissions` | Skip permission prompts for unattended execution |
| `--output-format stream-json --verbose` | Streaming for real-time monitoring |

Resume interrupted pipeline:
```bash
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p \
  "Resume WORK-XX pipeline." \
  --dangerously-skip-permissions
```

---

## References Directory Passing (REQUIRED)

Main Claude MUST pass the references directory path to every sub-agent invocation.
This allows sub-agents to locate their reference files regardless of installation method (npm or plugin).

**How to pass:**
- Prepend `REFERENCES_DIR={absolute_path}` at the top of the prompt for every Task tool call
- For npm installations: use `.claude/agents` (default, resolved from project root)
- For plugin installations: derive from the skill's "Base directory" (`{base_dir}/../sdd-pipeline/references`)

**Example:**
```
REFERENCES_DIR=C:/Users/me/.claude/plugins/cache/uc-taskmanager/abc123/skills/sdd-pipeline/references

<dispatch to="builder" ...>
  ...
</dispatch>
```

If REFERENCES_DIR is not available (e.g., npm installation without plugin), sub-agents fall back to `.claude/agents/`.

---

## Context Handoff (Sliding Window)

| Distance | Level | Content |
|----------|-------|---------|
| Previous | FULL | what + why + caution + incomplete |
| 2 steps back | SUMMARY | what 1-2 lines |
| 3+ steps | DROP | Not passed |
