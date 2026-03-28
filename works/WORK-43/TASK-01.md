# TASK-01: 드래그 입력 시스템

## WORK
WORK-43: Boggle Game (보글 게임)

## Dependencies
- TASK-00 (required)

## Scope
마우스 드래그 및 터치 드래그로 인접 셀(가로/세로/대각선 8방향)을 연결하여 단어를 입력하는 시스템을 구현한다. 선택 경로의 시각적 피드백(하이라이트, 선 연결), 현재 선택 중인 단어 표시, 경로 유효성(인접성 검증 + 동일 셀 중복 방문 금지)을 포함한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-43/game/game.js` | MODIFY | 드래그 입력 로직 — mousedown/mousemove/mouseup + touchstart/touchmove/touchend 이벤트 핸들링 |
| `works/WORK-43/game/style.css` | MODIFY | 선택 셀 하이라이트, 드래그 경로 시각적 피드백 스타일 |

## Acceptance Criteria
- [ ] 마우스 드래그로 인접 셀을 연결하여 단어를 만들 수 있다
- [ ] 터치 드래그(모바일)로도 동일하게 동작한다
- [ ] 인접하지 않은 셀로는 이동할 수 없다
- [ ] 이미 선택한 셀을 다시 방문할 수 없다
- [ ] 선택 중인 셀이 시각적으로 하이라이트된다
- [ ] 현재 만들고 있는 단어가 화면에 표시된다

## Verify
```bash
# 이벤트 핸들러 존재 확인
grep -q "mousedown\|pointerdown" works/WORK-43/game/game.js && echo "PASS: mouse events" || echo "FAIL"
grep -q "touchstart\|pointerdown" works/WORK-43/game/game.js && echo "PASS: touch events" || echo "FAIL"
# 인접성 검증 로직 확인
grep -q "adjacent\|isAdjacent\|neighbor" works/WORK-43/game/game.js && echo "PASS: adjacency check" || echo "FAIL"
```
