# File Content Schema

uc-taskmanager 파이프라인이 생성하는 모든 파일의 내용 포맷을 정의한다.

**Referenced by**: planner.md, router.md, builder.md, committer.md, scheduler.md, context-policy.md, xml-schema.md

---

## COMPLIANCE — 파일 생성 시 반드시 준수 (REQUIRED)

이 문서를 읽은 에이전트는 **해당 파일을 생성할 때 반드시 아래 규격을 따라야 한다**.
규격을 벗어난 포맷은 scheduler, runner.ts, committer gate 오류를 유발한다.

| 생성 파일 | 준수 섹션 | 위반 시 결과 |
|-----------|-----------|-------------|
| `PLAN.md` | § 1 | `parsePlanMd()` 파싱 실패, scheduler 동작 불가 |
| `TASK-XX.md` | § 2 | `parseTaskFilename()` DB 등록 누락 |
| `TASK-XX_progress.md` | § 3 | committer gate FAIL (Status/Files changed 검사) |
| `TASK-XX_result.md` | § 4 | 슬라이딩 윈도우 context-handoff 누락 |
| `TASK-XX_result.md` (direct) | § 5 | result.md 인식 실패 |
| `PROGRESS.md` | § 6 | scheduler 진행률 추적 불가 |

---

## § 1. PLAN.md : **아래의 규칙을 필수로 지켜야 한다.**

**생성 주체**: planner (full mode), router (direct/pipeline mode)
**경로**: `works/{WORK_ID}/PLAN.md`

```markdown
# WORK-01: {WORK 제목}

> Created: {YYYY-MM-DD}
> 요구사항: {REQ-XXX | N/A}
> Execution-Mode: {direct | pipeline | full}
> Project: {detected project name}
> Tech Stack: {detected stack}
> Language: {resolved language code}
> Status: PLANNED

## Goal
{사용자의 요청을 1-2문장으로 요약}

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
- **Scope**: {description}
```

### CRITICAL: 메타정보 필드 7개 필수

PLAN.md 제목 바로 아래 `>` 블록에 다음 7개 필드가 모두 있어야 한다. 하나라도 누락되면 scheduler 동작 불가 및 runner `parsePlanMd()` 파싱 실패.

| 필드 | 필수 | 설명 |
|------|------|------|
| `> Created:` | ✅ | 생성일 (YYYY-MM-DD) |
| `> 요구사항:` | ✅ | `REQ-XXX` 또는 `N/A` |
| `> Execution-Mode:` | ✅ | `direct` / `pipeline` / `full` |
| `> Project:` | ✅ | 프로젝트명 |
| `> Tech Stack:` | ✅ | 감지된 기술 스택 |
| `> Language:` | ✅ | 해결된 언어 코드 (`ko`, `en` 등) |
| `> Status:` | ✅ | 항상 `PLANNED`로 시작 |

### PLAN.md 제목 파싱 규칙

```
# WORK-NN: 제목      ← 올바른 형식
# PLAN WORK-NN: 제목 ← 금지 (PLAN 키워드 포함 시 parsePlanMd() 오류)
```

runner.ts `parsePlanMd()` 함수가 `# WORK-NN: 제목` 패턴을 파싱한다.

---

## § 2. TASK-XX.md

**생성 주체**: planner (full mode), router (direct/pipeline mode)
**경로**: `works/{WORK_ID}/TASK-XX.md`

> runner.ts `parseTaskFilename()` 정규식: `/^TASK-(\d+)\.md$/`
> **WORK prefix 포함 금지** — `WORK-NN-TASK-XX.md` 형식은 DB 등록 누락 발생

```markdown
# TASK-XX: {title}

## WORK
{WORK_ID}: {WORK title}

## Dependencies
- TASK-YY (required)

## Scope
{detailed description}

## Files
| Path | Action | Description |
|------|--------|-------------|
| `src/auth/auth.module.ts` | CREATE | 인증 모듈 |

## Acceptance Criteria
- [ ] {criterion 1}
- [ ] {criterion 2}

## Verify
```bash
{verification commands}
```
```

---

## § 3. TASK-XX_progress.md

**생성 주체**: planner (템플릿 초기 생성), builder (실시간 갱신)
**경로**: `works/{WORK_ID}/TASK-XX_progress.md`
**구분자**: 언더스코어 (`_`)

```markdown
# TASK-XX Progress

- Status: {STARTED | IN_PROGRESS | COMPLETED}
- Started: {ISO 8601 timestamp}
- Updated: {ISO 8601 timestamp}
- Files changed:
  - `path/to/file` — {CREATE | MODIFY | DELETE}
  - `path/to/another/file` — CREATE
```

### 상태 전이

| 시점 | Status |
|------|--------|
| 작업 시작 전 (planner 템플릿) | `PENDING` |
| builder 착수 직후 | `STARTED` |
| 파일 변경 중 | `IN_PROGRESS` |
| 모든 작업 완료 | `COMPLETED` |

### committer Gate 조건

committer는 다음 세 조건을 모두 확인한다:
1. 파일이 존재하는가?
2. `Status: COMPLETED` 인가?
3. `Files changed` 목록이 비어있지 않은가?

조건 불충족 시 `FAIL` 반환 → scheduler가 builder 재시도.

---

## § 4. TASK-XX_result.md (full / pipeline 모드)

**생성 주체**: committer
**경로**: `works/{WORK_ID}/TASK-XX_result.md`
**구분자**: 언더스코어 (`_`)

> runner.ts가 이 파일을 읽어 `WorkTask.resultContent`에 저장한다.

```markdown
# TASK-XX Result

> WORK: {WORK_ID} — {WORK title}
> Completed: {YYYY-MM-DD HH:MM}
> Status: **DONE**

{## Summary | ## 요약 | ## サマリー}
{1-2 line description}

{## Completed Checklist | ## 완료 체크리스트 | ## 完了チェックリスト}
- [x] {item 1}
- [x] {item 2}

{## Verification Results | ## 검증 결과 | ## 検証結果}
- Build: ✅
- Lint: ✅
- Tests: ✅ ({N} passed)
- Task-specific: ✅

{## Files Changed | ## 변경 파일 | ## 変更ファイル}
### Created
- `path/to/file` — {description}

### Modified
- `path/to/file` — {what changed}

{## Issues Encountered | ## 발생 이슈 | ## 発生した問題}
{problems and resolutions, or "None"}

{## Notes for Subsequent Tasks | ## 후속 TASK 참고사항 | ## 後続タスクへの注記}
{notes, or "None"}

{## Context Handoff | ## 컨텍스트 핸드오프}

### Builder Context (SUMMARY)
{builder context-handoff what 필드, 1-3줄}

### Verifier Context (FULL)
{verifier context-handoff 4개 필드 전체}
```

### 언어별 섹션 헤더 매핑

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

## § 5. TASK-XX_result.md (direct 모드 최소 포맷)

**생성 주체**: router (direct 모드에서 committer 역할 대행)
**경로**: `works/{WORK_ID}/TASK-XX_result.md`

```markdown
# TASK-00 Result

> WORK: WORK-NN — {제목}
> Completed: {YYYY-MM-DD HH:MM}
> Execution-Mode: direct
> Status: **DONE**
> Commit: {hash}

## 요약
{1줄 변경 요약}

## 변경 파일
- `{path/to/file}` — {변경 내용}

## 검증
- Build: PASS (self-check)
- Lint: PASS (self-check)
```

> **§4와의 차이**: direct 모드는 committer 서브에이전트 없이 router가 직접 생성.
> Context Handoff 섹션 생략, 검증은 self-check 결과만 기재.

---

## § 6. PROGRESS.md (WORK 전체 진행)

**생성 주체**: scheduler
**경로**: `works/{WORK_ID}/PROGRESS.md`

```markdown
# {WORK_ID} Progress

> WORK: {title}
> Last updated: {timestamp}
> Mode: manual | auto

| TASK | Title | Status | Commit | Duration |
|------|-------|--------|--------|----------|
| TASK-00 | {title} | ✅ Done | abc1234 | 12min |
| TASK-01 | {title} | 🔄 In Progress | — | — |
| TASK-02 | {title} | ⏳ Blocked | — | — |

## Log
- [10:00] TASK-00 started
- [10:12] TASK-00 verified ✅, committed abc1234
```

---

## § 7. 파일명 규칙 요약

| 파일 종류 | 형식 | 예시 | 생성 주체 |
|-----------|------|------|----------|
| WORK 계획 | `PLAN.md` | `works/WORK-03/PLAN.md` | planner / router |
| TASK 계획 | `TASK-NN.md` | `works/WORK-03/TASK-00.md` | planner / router |
| TASK 진행 | `TASK-NN_progress.md` | `works/WORK-03/TASK-00_progress.md` | planner(템플릿) / builder(갱신) |
| TASK 결과 | `TASK-NN_result.md` | `works/WORK-03/TASK-00_result.md` | committer / router(direct) |
| WORK 진행 | `PROGRESS.md` | `works/WORK-03/PROGRESS.md` | scheduler |

**CRITICAL**: `TASK-NN.md` 형식만 허용. `WORK-NN-TASK-NN.md` 형식은 runner.ts `parseTaskFilename()` 인식 불가 → WorkTask DB 등록 누락.

---

## Version

- **Created**: 2026-03-15
- **Purpose**: 파이프라인 산출물 파일 포맷 단일 정의 — 분산된 포맷 정의를 통합
- **Referenced by**: planner.md §PLAN.md Format, builder.md §Progress, committer.md §Step1, scheduler.md §Progress File, router.md §direct mode, context-policy.md §Committer 출력, xml-schema.md §direct mode
