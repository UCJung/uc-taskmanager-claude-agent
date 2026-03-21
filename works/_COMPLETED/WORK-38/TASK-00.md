# TASK-00: shared-prompt-sections.md § 8 DONE 상태 추가

## WORK
WORK-38: WORK-LIST 3단계 상태 분리 (IN_PROGRESS/DONE/COMPLETED)

## Dependencies
- (none)

## Scope
en/ko 양쪽 shared-prompt-sections.md의 § 8 WORK-LIST.md Update Rules를 수정한다.

변경 내용:
1. 상태 테이블에 `DONE` 행 추가 (마지막 TASK 완료 시, committer가 자동 변경)
2. `COMPLETED` 행 추가 (push 요청 시, Main Claude가 DONE 일괄 처리)
3. 규칙 설명 변경:
   - "WORK-LIST.md contains only IN_PROGRESS rows" → "WORK-LIST.md contains IN_PROGRESS and DONE rows"
   - committer: "remove row + move _COMPLETED" → "change IN_PROGRESS to DONE + fill completion date"
   - 새 규칙: "Main Claude: on push, remove DONE rows + move to _COMPLETED/"
4. 포맷 예시에 DONE 행 추가

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/en/shared-prompt-sections.md` | MODIFY | § 8 WORK-LIST.md Update Rules에 DONE/COMPLETED 상태 추가 |
| `agents/ko/shared-prompt-sections.md` | MODIFY | § 8 WORK-LIST.md 갱신 규칙에 DONE/COMPLETED 상태 추가 |

## Acceptance Criteria
- [ ] en § 8 상태 테이블에 IN_PROGRESS, DONE, COMPLETED 3행 존재
- [ ] ko § 8 상태 테이블에 IN_PROGRESS, DONE, COMPLETED 3행 존재
- [ ] committer 역할이 "IN_PROGRESS → DONE 변경"으로 기술
- [ ] Main Claude 역할이 "push 시 DONE → COMPLETED (행 제거 + _COMPLETED 이동)"으로 기술
- [ ] en/ko 내용 동기화 확인

## Verify
```bash
# DONE 상태가 § 8에 존재하는지 확인
grep -c "DONE" agents/en/shared-prompt-sections.md
grep -c "DONE" agents/ko/shared-prompt-sections.md
# COMPLETED 상태가 존재하는지 확인
grep -c "COMPLETED" agents/en/shared-prompt-sections.md
grep -c "COMPLETED" agents/ko/shared-prompt-sections.md
```
