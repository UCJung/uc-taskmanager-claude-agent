# TASK-00: WORK-LIST.md 갱신

## WORK
WORK-20: works 하위 파일 조사하여 WORK-LIST.md 갱신

## Dependencies
- (none)

## Scope
각 WORK 폴더의 PLAN.md에서 제목/생성일을 추출하고, TASK result 파일로 완료 여부를 판단하여 WORK-LIST.md를 재작성

## Files
| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-LIST.md` | MODIFY | WORK 목록 현행화 |

## Acceptance Criteria
- [ ] FS에 존재하는 모든 WORK가 WORK-LIST.md에 반영됨
- [ ] 각 WORK의 제목, 상태, 생성일이 정확함
- [ ] WORK-05 (FS 미존재) 처리 확인

## Verify
```bash
cat works/WORK-LIST.md
```
