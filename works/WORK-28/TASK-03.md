# TASK-03: spec_sliding-window-context.md + spec_callback-integration.md — router 참조 갱신

## WORK
WORK-28: Router→Specifier 전환 반영 — docs 및 README 현행화

## Dependencies
- (none)

## Scope
2개 설계 문서의 router 에이전트 참조를 specifier로 갱신한다.

### spec_sliding-window-context.md (약 4건)
1. direct 모드 설명: "Main Claude → router 단일 세션 내 처리" → specifier 겸임 구조
2. 구현 파일 목록: agents/router.md → agents/specifier.md
3. progress.md 선생성 규칙: "router를 통해" → "specifier를 통해"

### spec_callback-integration.md (약 3건)
1. 콜백 전송 주체 테이블: direct 모드 `Router` → `Specifier`
2. Callback Execution Flow: "Router 단독 수행" → "Specifier 겸임 수행"
3. Sequence diagram 참가자명: Router → Specifier
4. 하단 주석: "pipeline 모드의 Dispatcher는 Router" → "Specifier"

NFR-01: config 파일명의 "router"는 유지.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_sliding-window-context.md` | MODIFY | router 에이전트 참조를 specifier로 갱신 |
| `docs/spec_callback-integration.md` | MODIFY | 콜백 전송 주체 테이블 및 시퀀스 다이어그램의 router를 specifier로 갱신 |

## Acceptance Criteria
- [ ] spec_sliding-window-context.md에서 에이전트명 router가 specifier로 갱신됨
- [ ] spec_callback-integration.md의 콜백 전송 주체 테이블이 specifier로 갱신됨
- [ ] 시퀀스 다이어그램 참가자명이 Specifier로 갱신됨
- [ ] config 파일명의 "router"는 유지됨

## Verify
```bash
# sliding-window-context.md 확인
grep -n -i "router" docs/spec_sliding-window-context.md | grep -v -i "router_rule" || echo "PASS: sliding-window clean"
# callback-integration.md 확인
grep -n -i "router" docs/spec_callback-integration.md | grep -v -i "router_rule" || echo "PASS: callback clean"
```
