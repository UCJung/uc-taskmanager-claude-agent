---
name: work-pipeline
description: Triggers the WORK-PIPELINE when a user request starts with a [] tag (e.g., [new-feature], [bugfix], [WORK start]). Use this skill whenever you detect a [] tag at the beginning of a user message.
---

# WORK-PIPELINE Trigger

When the user's message starts with a `[]` tag, start the WORK-PIPELINE by reading `../skills/sdd-pipeline/references/agent-flow.md` and following the orchestration flow.

## Trigger Detection

Any message starting with `[...]` triggers this pipeline:
- `[new-feature]`, `[enhancement]`, `[bugfix]`, `[new-work]`, `[WORK start]`
- Or any custom tag in square brackets

## Pipeline Flow

1. **Call specifier agent** — analyzes the requirement, creates `works/WORK-NN/Requirement.md`, determines execution-mode (direct/pipeline/full)
2. **Wait for user approval** of the requirement specification
3. **Follow the execution-mode** returned by specifier:
   - `direct`: specifier handles everything, then call committer
   - `pipeline`: call builder → verifier → committer in sequence
   - `full`: call planner → scheduler → [builder → verifier → committer] × N

## Auto Mode

If the user's message ends with "auto" or "자동으로", skip approval steps and execute the entire pipeline automatically.

## Arguments

User requirement: $ARGUMENTS
