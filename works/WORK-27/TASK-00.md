# TASK-00: agents/ko, agents/en 에이전트 파일 일괄 변경

## WORK
WORK-27: COMPLETED 자동 변경 + PLAN.md 요구사항 필드 개선

## Dependencies
- (none)

## Scope

### 변경 1: COMPLETED 변경 시점
- shared-prompt-sections.md (ko/en): S8에서 COMPLETED를 "git push 시에만" -> "마지막 TASK 완료 시 committer가 자동 변경"으로 수정. committer/scheduler 금지 규칙 제거.
- committer.md (ko/en): WORK-LIST.md COMPLETED 금지 규칙 제거. 대신 마지막 TASK일 때 COMPLETED로 변경하는 로직 추가 (3-9 결과보고 부분 및 제약사항).
- router.md (ko/en): "COMPLETED 변경: git push 시에만" 규칙 제거.
- CLAUDE.md: Push 절차에서 "WORK-LIST.md 업데이트 — IN_PROGRESS WORK를 COMPLETED로 변경 후 커밋" 단계 제거.

### 변경 2: PLAN.md 요구사항 필드
- file-content-schema.md (ko/en): S1에서 `{REQ-XXX | N/A}` -> `{REQ-XXX | 사용자 요청 텍스트}` 변경
- shared-prompt-sections.md (ko/en): S7 요구사항 필드 설명 변경
- planner.md (ko/en): 3-9 요구사항 코드 기록에서 N/A -> 사용자 요청 텍스트

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/ko/shared-prompt-sections.md` | MODIFY | S8 COMPLETED 규칙 변경 + S7 요구사항 필드 변경 |
| `agents/en/shared-prompt-sections.md` | MODIFY | S8 COMPLETED 규칙 변경 + S7 요구사항 필드 변경 |
| `agents/ko/committer.md` | MODIFY | COMPLETED 자동 변경 로직 추가 |
| `agents/en/committer.md` | MODIFY | COMPLETED 자동 변경 로직 추가 |
| `agents/ko/router.md` | MODIFY | COMPLETED push 규칙 제거 |
| `agents/en/router.md` | MODIFY | COMPLETED push 규칙 제거 |
| `agents/ko/file-content-schema.md` | MODIFY | 요구사항 필드 N/A -> 사용자 요청 텍스트 |
| `agents/en/file-content-schema.md` | MODIFY | 요구사항 필드 N/A -> 사용자 요청 텍스트 |
| `agents/ko/planner.md` | MODIFY | REQ 기록 규칙 변경 |
| `agents/en/planner.md` | MODIFY | REQ 기록 규칙 변경 |
| `CLAUDE.md` | MODIFY | Push 절차 WORK-LIST 단계 제거 |

## Acceptance Criteria
- [ ] ko/en shared-prompt-sections.md S8: COMPLETED 시점이 "마지막 TASK 완료 시 committer 자동 변경"
- [ ] ko/en committer.md: 마지막 TASK 완료 시 WORK-LIST.md COMPLETED 변경 로직 존재
- [ ] ko/en router.md: COMPLETED push 시점 규칙 제거됨
- [ ] ko/en file-content-schema.md S1: 요구사항 필드에 N/A 대신 사용자 요청 텍스트 안내
- [ ] ko/en planner.md: REQ 없을 때 사용자 요청 텍스트 기록
- [ ] CLAUDE.md Push 절차에서 WORK-LIST COMPLETED 단계 제거됨

## Verify
```bash
# COMPLETED 규칙 변경 확인
grep -n "COMPLETED" agents/ko/shared-prompt-sections.md
grep -n "COMPLETED" agents/en/shared-prompt-sections.md
grep -n "COMPLETED" agents/ko/committer.md
grep -n "COMPLETED" agents/en/committer.md

# N/A 제거 확인 (요구사항 필드)
grep -n "N/A" agents/ko/file-content-schema.md
grep -n "N/A" agents/en/file-content-schema.md
grep -n "N/A" agents/ko/planner.md
grep -n "N/A" agents/en/planner.md
```
