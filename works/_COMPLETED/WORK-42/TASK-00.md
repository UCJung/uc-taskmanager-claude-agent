# TASK-00: Snake 게임 HTML 파일 생성

## WORK
WORK-42: Snake 게임

## Dependencies
(없음)

## Scope
HTML5 Canvas를 사용하여 단일 HTML 파일로 Snake 게임을 구현한다.
- 방향키로 뱀 조작
- 먹이(사과) 먹으면 뱀 길이 증가 + 점수 증가
- 벽 또는 자기 몸에 부딪히면 게임오버
- 게임오버 시 재시작 가능

## Files
| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-42/snake.html` | CREATE | Snake 게임 단일 HTML 파일 |

## Acceptance Criteria
- [ ] snake.html 파일이 존재한다
- [ ] 브라우저에서 열면 게임이 즉시 동작한다
- [ ] 방향키로 뱀을 조작할 수 있다
- [ ] 먹이를 먹으면 점수가 올라간다
- [ ] 게임오버 후 재시작할 수 있다

## Verify
```bash
test -f works/WORK-42/snake.html && echo "PASS" || echo "FAIL"
```
