# File Content Schema

파이프라인 산출물 파일 포맷 단일 정의.

## COMPLIANCE

| 생성 파일 | 준수 섹션 | 위반 시 결과 |
|-----------|-----------|-------------|
| `PLAN.md` | § 1 | `parsePlanMd()` 파싱 실패, scheduler 동작 불가 |
| `TASK-XX.md` | § 2 | `parseTaskFilename()` DB 등록 누락 |
| `TASK-XX_progress.md` | § 3 | committer gate FAIL |
| `TASK-XX_result.md` | § 4 | context-handoff 누락 |
| `TASK-XX_result.md` (direct) | § 5 | result.md 인식 실패 |
| `PROGRESS.md` | § 6 | scheduler 진행률 추적 불가 |

---

## § 0. Requirement.md

경로: `works/{WORK_ID}/Requirement.md`

```markdown
# Requirement — WORK-NN

## Original Request
> 사용자가 입력한 그대로

## Functional Requirements (기능 요구사항)
- FR-01: ...
- FR-02: ...

## Non-Functional Requirements (비기능 요구사항)
- NFR-01: ...

## Acceptance Criteria
- [ ] 검증 가능한 기준들
```

생성 주체: Specifier (모든 요청에 필수)

---

## § 1. PLAN.md

경로: `works/{WORK_ID}/PLAN.md`

```markdown
# WORK-01: {제목}

> Created: {YYYY-MM-DD}
> 요구사항: {REQ-XXX | 사용자 요청 텍스트}
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

### TASK-01: {title}
- **Depends on**: TASK-00
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

| 시점 | Status |
|------|--------|
| planner 템플릿 | `PENDING` |
| builder 착수 | `STARTED` |
| 파일 변경 중 | `IN_PROGRESS` |
| 완료 | `COMPLETED` |

committer gate: 파일 존재 + `Status: COMPLETED` + Files changed 비어있지 않음

---

## § 4. TASK-XX_result.md (full / pipeline)

경로: `works/{WORK_ID}/TASK-XX_result.md`

```markdown
# TASK-XX Result

> WORK: {WORK_ID} — {title}
> Completed: {YYYY-MM-DD HH:MM}
> Status: **DONE**

{## Summary | ## 요약 | ## サマリー}
{1-2줄}

{## Completed Checklist | ## 완료 체크리스트 | ## 完了チェックリスト}
- [x] {item}

{## Verification Results | ## 검증 결과 | ## 検証結果}
- Build: ✅
- Lint: ✅
- Tests: ✅ (N passed)

{## Files Changed | ## 변경 파일 | ## 変更ファイル}
### Created
- `path` — {description}

{## Issues Encountered | ## 발생 이슈 | ## 発生した問題}
None

{## Notes for Subsequent Tasks | ## 후속 TASK 참고사항 | ## 後続タスクへの注記}
None

{## Context Handoff | ## 컨텍스트 핸드오프 | ## コンテキスト引き継ぎ}

### Builder Context (SUMMARY)
{builder what 필드 1-3줄}

### Verifier Context (FULL)
{verifier context-handoff 4개 필드}
```

| 섹션 | en | ko | ja |
|------|----|----|-----|
| Summary | `## Summary` | `## 요약` | `## サマリー` |
| Completed Checklist | `## Completed Checklist` | `## 완료 체크리스트` | `## 完了チェックリスト` |
| Verification Results | `## Verification Results` | `## 검증 결과` | `## 検証結果` |
| Files Changed | `## Files Changed` | `## 변경 파일` | `## 変更ファイル` |
| Issues Encountered | `## Issues Encountered` | `## 발생 이슈` | `## 発生した問題` |
| Notes for Subsequent Tasks | `## Notes for Subsequent Tasks` | `## 후속 TASK 참고사항` | `## 後続タスクへの注記` |
| Context Handoff | `## Context Handoff` | `## 컨텍스트 핸드오프` | `## コンテキスト引き継ぎ` |

---

## § 5. TASK-XX_result.md (direct 모드)

```markdown
# TASK-00 Result

> WORK: WORK-NN — {제목}
> Completed: {YYYY-MM-DD HH:MM}
> Execution-Mode: direct
> Status: **DONE**

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
| TASK-00 | {title} | ✅ Done | abc1234 | 12min |
| TASK-01 | {title} | 🔄 In Progress | — | — |

## Log
- [10:00] TASK-00 started
- [10:12] TASK-00 verified ✅, committed abc1234
```

---

## § 7. 파일명 규칙

| 종류 | 형식 | 생성 주체 |
|------|------|----------|
| 요구사항 | `Requirement.md` | specifier |
| WORK 계획 | `PLAN.md` | planner / specifier |
| TASK 계획 | `TASK-NN.md` | planner / specifier |
| TASK 진행 | `TASK-NN_progress.md` | planner / specifier(템플릿) / builder(갱신) |
| TASK 결과 | `TASK-NN_result.md` | committer |
| WORK 진행 | `PROGRESS.md` | scheduler |

`WORK-NN-TASK-NN.md` 형식 금지 → `parseTaskFilename()` 인식 불가.
