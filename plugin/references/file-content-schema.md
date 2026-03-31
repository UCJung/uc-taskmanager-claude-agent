# File Content Schema

Single source of truth for pipeline artifact file formats.

## COMPLIANCE

| Generated File | Reference Section | Violation Consequence |
|----------------|-------------------|----------------------|
| `PLAN.md` | § 1 | `parsePlanMd()` parsing failure, scheduler inoperable |
| `TASK-XX.md` | § 2 | `parseTaskFilename()` DB registration missed |
| `TASK-XX_result.md` | § 3 | context-handoff missing |
| `TASK-XX_result.md` (direct) | § 4 | result.md recognition failure |

---

## § 0. Requirement.md

Path: `works/{WORK_ID}/Requirement.md`

```markdown
# Requirement — WORK-NN

## Original Request
> User's exact input

## Functional Requirements
- FR-01: ...
- FR-02: ...

## Non-Functional Requirements
- NFR-01: ...

## Acceptance Criteria
- [ ] Verifiable criteria
```

Created by: Specifier (mandatory for all requests)

---

## § 1. PLAN.md

Path: `works/{WORK_ID}/PLAN.md`

```markdown
# WORK-01: {title}

> Created: {YYYY-MM-DD}
> Requirement: {REQ-XXX | user request text}
> Execution-Mode: {direct | pipeline | full}
> Project: {project name}
> Tech Stack: {stack}
> Language: {lang_code}
> Status: PLANNED

## Goal
{1-2 sentences}

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

Title format: `# WORK-NN: title` — `# PLAN WORK-NN:` is prohibited (`parsePlanMd()` error)

---

## § 2. TASK-XX.md

Path: `works/{WORK_ID}/TASK-XX.md`

> `parseTaskFilename()` regex: `/^TASK-(\d+)\.md$/` — WORK prefix prohibited

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
| `src/file.ts` | CREATE | description |

## Acceptance Criteria
- [ ] {criterion}

## Verify
```bash
{verification commands}
```
```

---

## § 3. TASK-XX_result.md (full / pipeline)

Path: `works/{WORK_ID}/TASK-XX_result.md`

```markdown
# TASK-XX Result

> WORK: {WORK_ID} — {title}
> Completed: {YYYY-MM-DD HH:MM}
> Status: **DONE**

{## Summary | ## 요약 | ## サマリー}
{1-2 lines}

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
{builder what field 1-3 lines}

### Verifier Context (FULL)
{verifier context-handoff 4 fields}
```

| Section | en | ko | ja |
|---------|----|----|-----|
| Summary | `## Summary` | `## 요약` | `## サマリー` |
| Completed Checklist | `## Completed Checklist` | `## 완료 체크리스트` | `## 完了チェックリスト` |
| Verification Results | `## Verification Results` | `## 검증 결과` | `## 検証結果` |
| Files Changed | `## Files Changed` | `## 변경 파일` | `## 変更ファイル` |
| Issues Encountered | `## Issues Encountered` | `## 발생 이슈` | `## 発生した問題` |
| Notes for Subsequent Tasks | `## Notes for Subsequent Tasks` | `## 후속 TASK 참고사항` | `## 後続タスクへの注記` |
| Context Handoff | `## Context Handoff` | `## 컨텍스트 핸드오프` | `## コンテキスト引き継ぎ` |

---

## § 4. TASK-XX_result.md (direct mode)

```markdown
# TASK-00 Result

> WORK: WORK-NN — {title}
> Completed: {YYYY-MM-DD HH:MM}
> Execution-Mode: direct
> Status: **DONE**

## Summary
{1 line}

## Files Changed
- `{path}` — {description}

## Verification
- Build: PASS (self-check)
- Lint: PASS (self-check)
```

---

## § 5. File Naming Rules

| Type | Format | Created By |
|------|--------|------------|
| Requirement | `Requirement.md` | specifier |
| WORK plan | `PLAN.md` | planner / specifier |
| TASK plan | `TASK-NN.md` | planner / specifier |
| TASK result | `TASK-NN_result.md` | committer |
| Activity log | `work_WORK-NN.log` | all agents (append) |

`WORK-NN-TASK-NN.md` format prohibited → `parseTaskFilename()` cannot recognize it.
