---
name: work-status
description: Shows WORK status (read-only). Use ONLY when the user asks to VIEW status — not to execute or resume. Matches queries like "WORK 목록", "상태 확인", "WORK-01 상태", "show status". Do NOT use for "실행", "계속", "resume" — those go to work-pipeline.
---

# WORK Status

Check and report the current status of WORKs and TASKs.

## How to Check

1. Read `works/WORK-LIST.md` for the master index of all WORKs
2. For a specific WORK, read last line of `works/WORK-NN/work_WORK-NN.log` for current progress
3. For a specific TASK, read `works/WORK-NN/TASK-NN_result.md` for completion details

## Status Values

| Status | Meaning |
|--------|---------|
| `IN_PROGRESS` | WORK created, TASKs being executed |
| `DONE` | All TASKs committed — committer auto-sets on last TASK |
| `COMPLETED` | Archived to `_COMPLETED/` — set during push |

## Display Format

```
WORK Status
  WORK-01: User Authentication    ✅ 5/5 completed
  WORK-02: Payment Integration    🔄 2/4 in progress
  WORK-03: Admin Dashboard        ⬜ 0/6 pending
```

## Arguments

Query: $ARGUMENTS
