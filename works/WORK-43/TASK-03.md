# TASK-03: 점수 계산, 타이머, 게임 플로우

## WORK
WORK-43: Boggle Game (보글 게임)

## Dependencies
- TASK-01 (required)
- TASK-02 (required)

## Scope
Boggle 공식 점수 규칙을 적용한 점수 계산 시스템, 3분 카운트다운 타이머, 게임 종료 처리(입력 비활성화 + 최종 결과 표시), New Game 재시작, 찾은 단어 목록 UI를 통합하여 완전한 게임 플로우를 완성한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-43/game/game.js` | MODIFY | 점수 계산(공식 규칙), 3분 타이머, 게임 상태 관리(playing/ended), 재시작, 단어 목록 관리 |
| `works/WORK-43/game/style.css` | MODIFY | 게임 종료 오버레이, 찾은 단어 목록 스타일, 타이머 긴급 표시 |
| `works/WORK-43/game/index.html` | MODIFY | 게임 종료 오버레이/모달 마크업 (필요 시) |

## Acceptance Criteria
- [ ] 점수가 Boggle 공식 규칙에 따라 계산된다 (3-4글자=1점, 5글자=2점, 6글자=3점, 7글자=5점, 8+글자=11점)
- [ ] 3분 카운트다운 타이머가 동작한다
- [ ] 타이머 종료 시 게임이 끝나고 입력이 비활성화된다
- [ ] 최종 점수와 찾은 단어 목록이 표시된다
- [ ] New Game 버튼으로 새 보드가 생성되고 게임이 초기화된다
- [ ] 찾은 단어 목록이 실시간으로 업데이트된다

## Verify
```bash
# 점수 계산 로직 확인
grep -q "score\|Score\|SCORE" works/WORK-43/game/game.js && echo "PASS: score logic" || echo "FAIL"
# 타이머 로직 확인
grep -q "timer\|Timer\|countdown\|setInterval" works/WORK-43/game/game.js && echo "PASS: timer logic" || echo "FAIL"
# 게임 재시작 확인
grep -q "newGame\|restart\|resetGame\|New Game" works/WORK-43/game/game.js && echo "PASS: restart logic" || echo "FAIL"
# index.html에서 브라우저 테스트
test -f works/WORK-43/game/index.html && echo "PASS: game playable" || echo "FAIL"
```
