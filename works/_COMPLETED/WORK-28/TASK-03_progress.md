# TASK-03 Progress

- Status: COMPLETED
- Started: 2026-03-20T00:00:00Z
- Updated: 2026-03-20T00:00:00Z
- Files changed:
  - `docs/spec_sliding-window-context.md` — MODIFY
  - `docs/spec_callback-integration.md` — MODIFY

## 변경 요약

### spec_sliding-window-context.md (6건)
1. 라인 116: `router를 호출하여` → `specifier를 겸임하여`
2. 라인 120: `router 단일 세션 내 처리` → `specifier 단일 세션 내 처리`
3. 라인 123: `router 세션:` → `specifier 세션:`
4. 라인 196: `direct 모드의 router` → `specifier`
5. 라인 226: `router를 통해` → `specifier를 통해`
6. 라인 250: `Main Claude가 호출한 router가` → `specifier가`
7. 라인 291: `Main Claude가 호출한 router가` → `specifier가`
8. 라인 320: `agents/router.md` → `agents/specifier.md`

### spec_callback-integration.md (8건)
1. 라인 18: direct 행 `Router` × 2 → `Specifier`
2. 라인 202: `Router 단독 수행` → `Specifier 겸임 수행`
3. 라인 205-224: sequence diagram 참가자 `Router` → `Specifier` (전체)
4. 라인 257: `pipeline 모드의 Dispatcher는 Router` → `Specifier`
5. 라인 295: `committer/router` → `committer/specifier`
6. 라인 333: `Committer/Router Results` → `Committer/Specifier Results`
7. 라인 356: `Builder/Router Checkpoints` → `Builder/Specifier Checkpoints`
8. 라인 513: `direct: Router` → `Specifier`
9. 라인 517: `agents/router.md` 참조 → `agents/specifier.md`
10. 라인 524: `agents/router.md` → `agents/specifier.md`

## 검증 결과
- `grep -n -i "router" docs/spec_sliding-window-context.md | grep -v "router_rule"` → PASS
- `grep -n -i "router" docs/spec_callback-integration.md | grep -v "router_rule"` → PASS
