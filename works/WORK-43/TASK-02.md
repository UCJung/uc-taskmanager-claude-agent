# TASK-02: 영어 사전 및 단어 검증

## WORK
WORK-43: Boggle Game (보글 게임)

## Dependencies
- TASK-00 (required)

## Scope
경량 영어 사전 데이터를 JS 파일에 내장하고, 입력된 단어의 유효성을 검증한다. Trie 또는 Set 자료구조를 사용하여 빠른 검색을 지원하며, 최소 3글자 이상 단어만 허용하고 중복 입력을 방지한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-43/game/dictionary.js` | CREATE | 영어 사전 데이터 (경량 단어 목록) + Trie/Set 기반 검색 로직 |
| `works/WORK-43/game/game.js` | MODIFY | 단어 제출 시 사전 검증 호출, 중복 입력 방지 로직 |
| `works/WORK-43/game/index.html` | MODIFY | dictionary.js script 태그 추가 |

## Acceptance Criteria
- [ ] 유효한 영어 단어(사전에 존재)만 인정된다
- [ ] 3글자 미만 단어는 거부된다
- [ ] 이미 찾은 단어는 중복 제출 시 거부된다
- [ ] 사전에 최소 5,000개 이상의 영어 단어가 포함되어 있다
- [ ] 사전 검색이 즉각적이다 (체감 지연 없음)

## Verify
```bash
# dictionary.js 존재 확인
test -f works/WORK-43/game/dictionary.js && echo "PASS: dictionary.js exists" || echo "FAIL"
# 사전 데이터 포함 확인
grep -c "\"[a-z]" works/WORK-43/game/dictionary.js | awk '{if ($1 > 100) print "PASS: dictionary has words"; else print "FAIL: too few words"}'
# 검증 로직 확인
grep -q "isValidWord\|checkWord\|dictionary\|DICTIONARY" works/WORK-43/game/game.js && echo "PASS: validation logic" || echo "FAIL"
```
