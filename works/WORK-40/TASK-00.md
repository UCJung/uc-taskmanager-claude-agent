# TASK-00: Snake 게임 단일 HTML 파일 구현

## WORK
WORK-40: Snake 게임 HTML 구현

## Dependencies
- (없음)

## Scope
Canvas 기반 Snake 게임을 단일 HTML 파일로 구현한다. HTML, CSS, JavaScript를 모두 하나의 파일에 포함한다.

구현 항목:
- HTML5 Canvas를 사용한 게임 렌더링
- 방향키(화살표)로 뱀 조작
- 랜덤 위치에 먹이 생성
- 먹이 획득 시 뱀 길이 증가 + 점수 증가
- 벽 충돌 및 자기 몸 충돌 감지 → 게임 오버
- 게임 오버 화면 + 재시작 기능
- 점수 표시 UI

## Files
| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-40/snake.html` | CREATE | Snake 게임 단일 HTML 파일 |

## Acceptance Criteria
- [ ] 브라우저에서 파일을 열면 Snake 게임이 즉시 실행된다
- [ ] 방향키로 뱀을 상하좌우로 조작할 수 있다
- [ ] 먹이를 먹으면 뱀이 길어지고 점수가 증가한다
- [ ] 벽 또는 자기 몸에 충돌하면 게임 오버 처리된다
- [ ] 게임 오버 후 재시작이 가능하다

## Verify
```bash
# 파일 존재 확인
test -f works/WORK-40/snake.html && echo "PASS" || echo "FAIL"
# HTML 구조 확인
grep -q "<canvas" works/WORK-40/snake.html && echo "PASS: canvas found" || echo "FAIL: no canvas"
```
