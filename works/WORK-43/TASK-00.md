# TASK-00: 보드 UI 및 기본 구조

## WORK
WORK-43: Boggle Game (보글 게임)

## Dependencies
- (none)

## Scope
HTML/CSS/JS 기본 파일 구조를 생성하고, 4x4 격자 보드를 렌더링한다. Boggle 공식 주사위 기반으로 랜덤 알파벳을 배치하며, 모바일/데스크탑 반응형 레이아웃을 구현한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-43/game/index.html` | CREATE | 메인 HTML — 보드, 점수판, 타이머, 단어 목록 영역 레이아웃 |
| `works/WORK-43/game/style.css` | CREATE | 반응형 CSS — CSS Grid 기반 4x4 격자, 모바일 미디어쿼리 |
| `works/WORK-43/game/game.js` | CREATE | 게임 코어 — 보드 생성, Boggle 주사위 알파벳 배치, DOM 렌더링 |

## Acceptance Criteria
- [ ] index.html을 브라우저에서 열면 4x4 격자 보드가 표시된다
- [ ] 각 셀에 랜덤 알파벳이 표시된다 (Boggle 주사위 분포 기반)
- [ ] 모바일(400px 이하)과 데스크탑에서 모두 정상 표시된다
- [ ] 점수판, 타이머, 단어 목록 영역의 레이아웃이 배치되어 있다 (기능은 후속 TASK)

## Verify
```bash
# HTML 파일 존재 확인
test -f works/WORK-43/game/index.html && echo "PASS: index.html exists" || echo "FAIL"
test -f works/WORK-43/game/style.css && echo "PASS: style.css exists" || echo "FAIL"
test -f works/WORK-43/game/game.js && echo "PASS: game.js exists" || echo "FAIL"

# 기본 구조 확인
grep -q "grid" works/WORK-43/game/style.css && echo "PASS: grid layout" || echo "FAIL"
grep -q "Boggle\|boggle" works/WORK-43/game/index.html && echo "PASS: boggle title" || echo "FAIL"
```
