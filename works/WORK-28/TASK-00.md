# TASK-00: README.md — router 참조를 specifier 기반으로 갱신

## WORK
WORK-28: Router→Specifier 전환 반영 — docs 및 README 현행화

## Dependencies
- (none)

## Scope
README.md 내 router 에이전트 참조(약 31건)를 specifier 기반 아키텍처로 갱신한다.

변경 대상:
1. 에이전트 테이블: router 제거 → specifier 추가 (총 6개: specifier, planner, scheduler, builder, verifier, committer)
2. 파이프라인 다이어그램 (WORK Pipeline, pipeline mode, direct mode): specifier 기반으로 갱신
3. execution-mode 설명: "router가 선택" → "specifier가 판정" (겸임/위임 구조)
4. 저장소 구조: agents/ 하위를 ko/en 분리 구조로 갱신 (12 files each)
5. Verify 섹션: `# router, planner, ...` → `# specifier, planner, ...`
6. Quick Start 설명: "router가 요청을 분석" → "specifier가 요청을 분석"
7. WORK-LIST.md 관리 주체: router → specifier
8. direct 모드: "router가 자체 세션에서 처리" → specifier 겸임 + builder + committer 구조

NFR-01: `router_rule_config.json`, "Router Rule Config" 설정명 등 config 파일명의 "router"는 유지.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | router 에이전트 참조를 specifier 기반으로 전면 갱신 |

## Acceptance Criteria
- [ ] README.md에서 "router"가 에이전트명으로 사용되지 않음 (config명 제외)
- [ ] 에이전트 테이블에 specifier 포함, 총 6개 에이전트 구성
- [ ] 파이프라인 다이어그램이 specifier 기반으로 갱신됨
- [ ] agents/ 저장소 구조가 ko/en 분리 구조로 표시됨
- [ ] router_rule_config.json 관련 설명의 "router"는 유지됨

## Verify
```bash
# 에이전트명으로서의 router가 남아있지 않은지 확인 (config명 제외)
grep -n -i "router" README.md | grep -v -i "router_rule_config" | grep -v -i "Router Rule Config" | grep -v "router_rule" || echo "PASS: no agent-name router references"
```
