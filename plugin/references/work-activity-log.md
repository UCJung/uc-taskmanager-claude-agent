# Work Activity Log

Records agent start/end events in `works/{WORK_ID}/work_{WORK_ID}.log`.

## Rules

1. **Timestamp**: Run `date -u +"%Y-%m-%dT%H:%M:%SZ"` via Bash to get real UTC time. Never use dummy values.
2. **Write method**: Use `Edit` tool to append. Do NOT use Bash for log writes.
3. **Entries**: Only START and DONE per agent role. No intermediate stages.

## Format

```
[YYYY-MM-DDTHH:MM:SSZ] AGENT_EVENT — description
```

## Required Entries

| Agent | START | DONE |
|-------|-------|------|
| specifier | `SPECIFIER_START — WORK-NN specifier started` | `SPECIFIER_DONE — WORK-NN specifier completed` |
| planner | `PLANNER_START — WORK-NN planner started` | `PLANNER_DONE — WORK-NN planner completed` |
| scheduler | `SCHEDULER_START — WORK-NN scheduler started` | `SCHEDULER_DONE — WORK-NN scheduler completed` |
| builder | `BUILDER_START — TASK-NN implement` | `BUILDER_DONE — TASK-NN complete` |
| verifier | `VERIFIER_START — TASK-NN verification` | `VERIFIER_DONE — TASK-NN verified` |
| committer | `COMMITTER_START — TASK-NN commit` | `COMMITTER_DONE — TASK-NN committed` |
