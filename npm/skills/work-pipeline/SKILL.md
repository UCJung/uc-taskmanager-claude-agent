---
name: work-pipeline
description: Triggers the WORK-PIPELINE. Use this skill when (1) user request starts with a [] tag (e.g., [new-feature], [bugfix]), or (2) user asks to resume/continue a WORK (e.g., "WORK-01 계속실행", "resume WORK-01", "WORK-01 실행", "continue WORK-01").
---

# WORK-PIPELINE Trigger

Read `../../references/agent-flow.md` and follow the orchestration flow.

## Trigger Detection

**New WORK** — message starts with `[...]` tag:
- `[new-feature]`, `[enhancement]`, `[bugfix]`, `[new-work]`, `[WORK start]`
- Or any custom tag in square brackets

**Resume WORK** — message mentions existing WORK-ID with execution intent:
- "WORK-XX 계속실행", "WORK-XX 실행", "resume WORK-XX", "continue WORK-XX"
- "파이프라인 재개", "WORK 계속"
- → Follow agent-flow.md § Resuming Existing WORK

## References Directory (CRITICAL)

When this skill is triggered, Claude Code provides the "Base directory for this skill" as an absolute path.
Derive the **REFERENCES_DIR** from it:

```
REFERENCES_DIR = {Base directory}/../../references
```

You MUST pass this absolute path to **every sub-agent invocation** (specifier, planner, scheduler, builder, verifier, committer).
Include it at the top of the prompt text:

```
REFERENCES_DIR={absolute_path}
```

Sub-agents need this path to read their reference files. Without it, they cannot find the files and will loop.

## Callback Info Passthrough

If the user's prompt contains `CALLBACK_URL=...` and `CALLBACK_TOKEN=...`, extract these values and pass them to **every sub-agent invocation** alongside REFERENCES_DIR:

```
CALLBACK_URL={url}
CALLBACK_TOKEN={token}
```

**Main Claude (this skill) must NEVER send callbacks itself.** Only sub-agents send callbacks.

## Pipeline Flow

1. **Spawn specifier agent** (via Agent tool) — analyzes the requirement, creates `works/WORK-NN/Requirement.md`, determines execution-mode (direct/pipeline/full)
2. **⛔ STOP — Present the specifier's output summary to the user and WAIT for explicit approval.** Do NOT call the next agent until the user approves. Show what was created (Requirement.md, PLAN.md if direct mode, TASK files) and ask "Proceed?"
3. **Follow the execution-mode** returned by specifier:
   - `direct`: spawn builder (Agent tool) → spawn verifier+committer (single Agent tool, see agent-flow.md § Combined Agent Invocation)
   - `pipeline`: for each TASK → spawn builder → spawn verifier+committer (repeat per TASK)
   - `full`: spawn planner → **⛔ STOP for 2nd approval** → spawn scheduler → scheduler handles [builder → verifier+committer] × N

## ⚠️ CRITICAL: Agent Spawn Rules

- **EVERY agent MUST be spawned via the Agent tool.** Main Claude must NEVER implement code, create files, run git commands, or perform any agent's work directly.
- In direct mode: spawn specifier → spawn builder → spawn verifier+committer (**3 Agent tool calls**).
- verifier+committer is a **single spawn** that performs both roles in sequence (see agent-flow.md).
- If specifier returns builder dispatch XML, pass it to the builder agent — do NOT execute it yourself.

## Auto Mode

If the user's message ends with "auto" or "자동으로", skip ALL approval steps and execute the entire pipeline automatically. This is the ONLY case where approval gates can be skipped.

## Arguments

User requirement: $ARGUMENTS
