# Agent Flow — Main Claude Orchestration Guide

> **All agent invocations are performed by Main Claude.**
> Subagents only return results (dispatch XML or task-result XML) after completing their work.
> Main Claude receives the return values and invokes the next agent.

---

## Execution Mode Decision

```
[] tag detected → invoke router
    │
    Check router return value (execution-mode)
    │
    ├─ direct   → router handles everything (no additional invocations)
    ├─ pipeline → Execute § pipeline procedure
    └─ full     → Execute § full procedure
```

---

## direct Mode

Router handles everything on its own. No additional invocations by Main Claude.

---

## pipeline Mode

```
1. Invoke router → creates PLAN.md + TASK-00.md + returns builder dispatch XML
2. Invoke builder (dispatch XML as prompt)
3. Invoke verifier (builder result as prompt)
4. Invoke committer (verifier result as prompt)
```

---

## full Mode

```
1. Invoke router → creates WORK directory + returns planner dispatch XML
2. Invoke planner (dispatch XML as prompt) → creates PLAN.md + TASK files
3. Invoke scheduler → DAG analysis + READY TASK + returns builder dispatch XML
4. Invoke builder (dispatch XML as prompt) → implementation
5. Invoke verifier (builder result as prompt) → verification
6. Invoke committer (verifier result as prompt) → commit
7. If incomplete TASKs remain, return to step 3
```

Parallel execution: If scheduler returns multiple READY TASKs, invoke builders concurrently.

---

## Agent Role Summary

| Agent | Return Value | Invoked By |
|-------|-------------|------------|
| router | execution-mode + dispatch XML | Main Claude |
| planner | PLAN.md/TASK file creation completion report | Main Claude |
| scheduler | READY TASK + dispatch XML | Main Claude |
| builder | task-result XML (includes context-handoff) | Main Claude |
| verifier | task-result XML | Main Claude |
| committer | task-result XML + commit hash | Main Claude |

---

## Bash CLI Execution (Server Automation)

Method to run pipeline independently without an interactive session. `claude -p` acts as Main Claude.

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
| `env -u CLAUDECODE` | Bypass nested execution blocking |
| `env -u ANTHROPIC_API_KEY` | Use subscription auth (Max) instead of API key |
| `--dangerously-skip-permissions` | Skip permission prompts for unattended execution |
| `--output-format stream-json --verbose` | Streaming for real-time monitoring |

Resume interrupted pipeline:
```bash
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p \
  "Resume WORK-XX pipeline." \
  --dangerously-skip-permissions
```

Verification result (WORK-24): `claude -p` → 9 Task tool invocations → full auto-completion of router/planner/scheduler/builder/verifier/committer confirmed.

---

## Context Transfer (Sliding Window)

| Distance | Level | Content |
|----------|-------|---------|
| Immediate predecessor | FULL | what + why + caution + incomplete |
| 2 steps back | SUMMARY | what only, 1-2 lines |
| 3+ steps back | DROP | Not transmitted |
