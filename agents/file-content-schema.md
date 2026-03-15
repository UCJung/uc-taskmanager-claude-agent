# File Content Schema

파이프라인 산출물 파일 포맷 단일 정의.

## COMPLIANCE

| 생성 파일 | 준수 섹션 |
|-----------|-----------|
| `PLAN.md` | § 1 |
| `TASK-XX.md` | § 2 |
| `TASK-XX_progress.md` | § 3 |
| `TASK-XX_result.md` | § 4 |
| `TASK-XX_result.md` (direct) | § 5 |
| `PROGRESS.md` | § 6 |

---

## § 1. PLAN.md

경로: `works/{WORK_ID}/PLAN.md`

```markdown
# WORK-01: {제목}

> Created: {YYYY-MM-DD}
> 요구사항: {REQ-XXX | N/A}
> Execution-Mode: {direct | pipeline | full}
> Project: {project name}
> Tech Stack: {stack}
> Language: {lang_code}
> Status: PLANNED

## Goal
{1-2문장}

## Task Dependency Graph
{ASCII diagram}

## Tasks

### TASK-00: {title}
- **Depends on**: (none)
- **Scope**: {description}
- **Files**:
  - `path/to/file` — {description}
```

제목 형식: `# WORK-NN: 제목` — `# PLAN WORK-NN:` 금지 (`parsePlanMd()` 오류)

---

## § 2. TASK-XX.md

경로: `works/{WORK_ID}/TASK-XX.md`

> `parseTaskFilename()` 정규식: `/^TASK-(\d+)\.md$/` — WORK prefix 금지

```markdown
# TASK-XX: {title}

## WORK
{WORK_ID}: {WORK title}

## Dependencies
- TASK-YY (required)

## Scope
{description}

## Files
| Path | Action | Description |
|------|--------|-------------|
| `src/file.ts` | CREATE | 설명 |

## Acceptance Criteria
- [ ] {criterion}

## Verify
```bash
{verification commands}
```
```

---

## § 3. TASK-XX_progress.md

경로: `works/{WORK_ID}/TASK-XX_progress.md`

```markdown
# TASK-XX Progress

- Status: {PENDING | STARTED | IN_PROGRESS | COMPLETED}
- Started: {ISO 8601}
- Updated: {ISO 8601}
- Files changed:
  - `path/to/file` — {CREATE | MODIFY | DELETE}
```

Status 전이: `PENDING` → `STARTED` → `IN_PROGRESS` → `COMPLETED`

committer gate: 파일 존재 + `Status: COMPLETED` + Files changed 비어있지 않음

---

## § 4. TASK-XX_result.md (full / pipeline)

경로: `works/{WORK_ID}/TASK-XX_result.md`

섹션 헤더는 PLAN.md `> Language:` 기준으로 해당 언어로 작성.

```markdown
# TASK-XX Result

> WORK: {WORK_ID} — {title}
> Completed: {YYYY-MM-DD HH:MM}
> Status: **DONE**

## Summary
{1-2줄}

## Completed Checklist
- [x] {item}

## Verification Results
- Build: PASS
- Lint: PASS
- Tests: PASS (N passed)

## Files Changed
### Created
- `path` — {description}

## Issues Encountered
None

## Notes for Subsequent Tasks
None

## Context Handoff

### Builder Context (SUMMARY)
{builder what 필드 1-3줄}

### Verifier Context (FULL)
{verifier context-handoff 4개 필드}
```

---

## § 5. TASK-XX_result.md (direct 모드)

```markdown
# TASK-00 Result

> WORK: WORK-NN — {제목}
> Completed: {YYYY-MM-DD HH:MM}
> Execution-Mode: direct
> Status: **DONE**
> Commit: {hash}

## 요약
{1줄}

## 변경 파일
- `{path}` — {내용}

## 검증
- Build: PASS (self-check)
- Lint: PASS (self-check)
```

---

## § 6. PROGRESS.md

경로: `works/{WORK_ID}/PROGRESS.md`

```markdown
# {WORK_ID} Progress

> WORK: {title}
> Last updated: {timestamp}
> Mode: manual | auto

| TASK | Title | Status | Commit | Duration |
|------|-------|--------|--------|----------|
| TASK-00 | {title} | Done | abc1234 | 12min |

## Log
- [10:00] TASK-00 started
- [10:12] TASK-00 verified, committed abc1234
```

---

## § 7. 파일명 규칙

| 종류 | 형식 | 생성 주체 |
|------|------|----------|
| WORK 계획 | `PLAN.md` | planner / router |
| TASK 계획 | `TASK-NN.md` | planner / router |
| TASK 진행 | `TASK-NN_progress.md` | planner(템플릿) / builder(갱신) |
| TASK 결과 | `TASK-NN_result.md` | committer / router(direct) |
| WORK 진행 | `PROGRESS.md` | scheduler |

`WORK-NN-TASK-NN.md` 형식 금지 — `parseTaskFilename()` 인식 불가.
