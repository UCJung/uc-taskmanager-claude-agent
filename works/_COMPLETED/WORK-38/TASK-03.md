# TASK-03: CLAUDE.md Push 절차에 DONE 일괄 처리 단계 추가

## WORK
WORK-38: WORK-LIST 3단계 상태 분리 (IN_PROGRESS/DONE/COMPLETED)

## Dependencies
- TASK-00 (required)

## Scope
CLAUDE.md의 Push 절차에 DONE 상태 WORK를 COMPLETED로 일괄 전환하는 단계를 추가한다.

변경 내용:
1. Push 절차 기존 3단계(에이전트 동기화 → README 업데이트 → git push) 사이에 새 단계 삽입
2. 새 단계: "DONE WORK 일괄 완료 처리"
   - WORK-LIST.md에서 DONE 상태인 행을 모두 찾아 제거
   - 해당 WORK 폴더를 `works/_COMPLETED/`로 이동
   - 변경사항 스테이징
3. 최종 순서: 에이전트 동기화 → DONE 일괄 완료 → README 업데이트 → git push

## Files
| Path | Action | Description |
|------|--------|-------------|
| `CLAUDE.md` | MODIFY | Push 절차에 DONE → COMPLETED 일괄 처리 단계 추가 |

## Acceptance Criteria
- [ ] Push 절차에 "DONE WORK 일괄 완료 처리" 단계 존재
- [ ] _COMPLETED 이동 로직 설명 포함
- [ ] WORK-LIST.md에서 DONE 행 제거 설명 포함
- [ ] 기존 3단계(동기화, README, push) 유지

## Verify
```bash
grep -c "DONE" CLAUDE.md
grep -c "_COMPLETED" CLAUDE.md
```
