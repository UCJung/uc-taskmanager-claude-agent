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

---

## ref-cache Chain Propagation

`<ref-cache>` carries pre-loaded reference file contents through the pipeline, eliminating redundant disk reads in each sub-agent.

### Rules

1. **First agent (typically specifier)** — no ref-cache available on dispatch. Reads reference files from `REFERENCES_DIR` normally.

2. **Agent returns task-result** — if the agent supports ref-cache, it includes `<ref-cache>` in its task-result XML containing all reference files it loaded.

3. **Main Claude propagates ref-cache** — when dispatching the next agent, copy the `<ref-cache>` block from the previous task-result into the new dispatch XML unchanged.

4. **Receiving agent skips file reads** — when `<ref-cache>` is present in the dispatch XML, the agent reads reference content from `<ref>` elements instead of reading files from disk.

5. **Missing ref-cache** — if a task-result does not contain `<ref-cache>` (agent does not support it yet), omit `<ref-cache>` from the next dispatch. The receiving agent falls back to reading files from disk.

### Flow Example

```
specifier (no ref-cache in) → reads files → returns task-result with <ref-cache>
  ↓ Main Claude copies <ref-cache> into dispatch
planner (ref-cache in) → skips file reads → returns task-result with <ref-cache>
  ↓ Main Claude copies <ref-cache> into dispatch
builder (ref-cache in) → skips file reads → returns task-result with <ref-cache>
  ↓ Main Claude copies <ref-cache> into dispatch
verifier → committer → ...
```

### Phase 2: Selective Section Delivery

Instead of passing full reference files, Main Claude extracts only the sections each agent needs. This reduces dispatch token size by 50-70%.

**Main Claude reads reference files once at pipeline start**, then delivers condensed `<ref-cache>` per agent using this mapping:

| Agent | shared-prompt-sections | file-content-schema | xml-schema | context-policy | work-activity-log |
|-------|:---:|:---:|:---:|:---:|:---:|
| **specifier** | §1,§7,§8,§9,§11 | §0,§1,§2,§3 | §1,§3 | — | full |
| **planner** | §1,§2,§11 | §1,§2,§3 | — | — | full |
| **scheduler** | §4,§8,§10 | §1,§6 | §1,§3,§4,§5 | full | full |
| **builder** | §1,§2,§10,§12 | §2,§3 | §1,§2,§4 | Builder section | full |
| **verifier** | §1,§2,§12 | — | §1,§2,§4 | Verifier section | full |
| **committer** | §1,§2,§8,§10 | §3,§4,§5,§6,§7 | §1,§2,§4 | Committer+Retry | full |

**Delivery format**: Condense each `<ref key="">` to contain only the needed sections, not the full file. Use one-line summaries for simple rules, keep full content only for templates and code blocks.

### Constraints

- **ref-cache does not replace REFERENCES_DIR** — always pass `REFERENCES_DIR` (or `<references-dir>`) in every dispatch regardless of ref-cache presence, for backward compatibility.
- **Agents may still read files** — if ref-cache content is insufficient, agents fall back to reading from disk.
