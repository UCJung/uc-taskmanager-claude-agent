# 파일 내용 스키마

파이프라인 산출물 파일 형식의 단일 정의 소스.

## 준수사항

| 생성 파일 | 참조 섹션 | 위반 시 결과 |
|-----------|----------|-------------|
| `Requirement.md` | § 0 |  |
| `PLAN.md` | § 1 | `parsePlanMd()` 파싱 실패, scheduler 작동 불가 |
| `TASK-XX.md` | § 2 | `parseTaskFilename()` DB 등록 누락 |
| `TASK-XX_result.md` | § 3 | context-handoff 누락 |
| `TASK-XX_result.md` (direct) | § 4 | result.md 인식 실패 |

---

## § 0. Requirement.md

경로: `works/{WORK_ID}/Requirement.md`

```markdown
# Requirement — WORK-NN

## Original Request
> 사용자의 정확한 입력

## Functional Requirements
- FR-01: ...
- FR-02: ...

## Non-Functional Requirements
- NFR-01: ...

## Acceptance Criteria
- [ ] 검증 가능한 기준
```

생성 주체: Specifier (모든 요청에 필수)

---

## § 1. PLAN.md

경로: `works/{WORK_ID}/PLAN.md`

```markdown
# WORK-01: {제목}

> Created: {YYYY-MM-DD}
> Requirement: {REQ-XXX | 사용자 요청 텍스트}
> Execution-Mode: {direct | pipeline | full}
> Project: {프로젝트 이름}
> Tech Stack: {스택}
> Language: {lang_code}
> Status: PLANNED

## 목표
{1-2문장}

## Task 의존성 그래프
{ASCII 다이어그램}

## Tasks

### TASK-00: {제목}
- **Depends on**: (없음)
- **Scope**: {설명}
- **Files**:
  - `path/to/file` — {설명}

### TASK-01: {제목}
- **Depends on**: TASK-00
```

제목 형식: `# WORK-NN: title` — `# PLAN WORK-NN:` 금지 (`parsePlanMd()` 오류)

---

## § 2. TASK-XX.md

경로: `works/{WORK_ID}/TASK-XX.md`

> `parseTaskFilename()` regex: `/^TASK-(\d+)\.md$/` — WORK 접두사 금지

```markdown
# TASK-XX: {제목}

## WORK
{WORK_ID}: {WORK 제목}

## Dependencies
- TASK-YY (필수)

## Scope
{설명}

## Files
| Path | Action | Description |
|------|--------|-------------|
| `src/file.ts` | CREATE | 설명 |

## Acceptance Criteria
- [ ] {기준}

## Verify
```bash
{검증 명령}
```
```

---

## § 3. TASK-XX_result.md (full / pipeline)

경로: `works/{WORK_ID}/TASK-XX_result.md`

```markdown
# TASK-XX Result

> WORK: {WORK_ID} — {제목}
> Completed: {YYYY-MM-DD HH:MM}
> Status: **DONE**

{## Summary | ## 요약 | ## サマリー}
{1-2줄}

{## Completed Checklist | ## 완료 체크리스트 | ## 完了チェックリスト}
- [x] {항목}

{## Verification Results | ## 검증 결과 | ## 検証結果}
- Build: ✅
- Lint: ✅
- Tests: ✅ (N passed)

{## Files Changed | ## 변경 파일 | ## 変更ファイル}
### Created
- `path` — {설명}

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

## § 4. TASK-XX_result.md (direct 모드)

```markdown
# TASK-00 Result

> WORK: WORK-NN — {제목}
> Completed: {YYYY-MM-DD HH:MM}
> Execution-Mode: direct
> Status: **DONE**

## 요약
{1줄}

## 변경 파일
- `{path}` — {설명}

## 검증
- Build: PASS (self-check)
- Lint: PASS (self-check)
```

---

## § 5. 파일 이름 규칙

| 유형 | 형식 | 생성 주체 |
|------|------|-----------|
| 요구사항 | `Requirement.md` | specifier |
| WORK 계획 | `PLAN.md` | planner / specifier |
| TASK 계획 | `TASK-NN.md` | planner / specifier |
| TASK 결과 | `TASK-NN_result.md` | committer |
| 활동 로그 | `work_WORK-NN.log` | 모든 에이전트 (추가) |

`WORK-NN-TASK-NN.md` 형식 금지 → `parseTaskFilename()`이 인식할 수 없음.
