# TASK-02: spec_pipeline-architecture.md — specifier 기반 아키텍처로 전면 갱신

## WORK
WORK-28: Router→Specifier 전환 반영 — docs 및 README 현행화

## Dependencies
- (none)

## Scope
docs/spec_pipeline-architecture.md 내 router 에이전트 참조(약 23건)를 specifier 기반 아키텍처로 전면 갱신한다.

변경 대상:
1. 에이전트 구성표: router 제거 → specifier 추가 (총 6개)
2. execution-mode 체계: "router가 판정" → "specifier가 겸임/위임으로 판정"
3. 에이전트별 상세 역할 섹션: "5.1 Router" → "5.1 Specifier" (역할 설명 전면 갱신)
4. Dispatcher-Receiver 매핑 테이블: router → specifier
5. direct 모드: "Router 단독 수행" → "Specifier 겸임 (+ builder + committer)"
6. pipeline 모드: "Router가 PLAN 생성" → "Specifier가 Requirement.md + planner dispatch"
7. 구현 파일 목록: agents/router.md → agents/specifier.md

NFR-01: config 파일명의 "router"는 유지.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_pipeline-architecture.md` | MODIFY | router 에이전트 참조를 specifier 기반으로 전면 갱신 |

## Acceptance Criteria
- [ ] 에이전트 구성표에 specifier 포함, 총 6개 에이전트 구성
- [ ] execution-mode 판정 주체가 specifier로 갱신됨
- [ ] 에이전트별 상세 역할에서 Router 섹션이 Specifier로 변경됨
- [ ] Dispatcher-Receiver 매핑이 specifier 기반으로 갱신됨
- [ ] config 파일명의 "router"는 유지됨

## Verify
```bash
grep -n -i "router" docs/spec_pipeline-architecture.md | grep -v -i "router_rule_config" | grep -v -i "Router Rule Config" | grep -v "router_rule" || echo "PASS: no agent-name router references"
```
