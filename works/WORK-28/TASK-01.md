# TASK-01: README_KO.md — router 참조를 specifier 기반으로 갱신

## WORK
WORK-28: Router→Specifier 전환 반영 — docs 및 README 현행화

## Dependencies
- (none)

## Scope
README_KO.md 내 router 에이전트 참조(약 12건)를 specifier 기반 아키텍처로 갱신한다.

변경 대상:
1. 에이전트 테이블: router 제거 → specifier 추가 (총 6개)
2. 파이프라인 다이어그램 (WORK Pipeline, pipeline mode, direct mode): specifier 기반으로 갱신
3. execution-mode 설명: "router가 선택" → "specifier가 판정" (겸임/위임 구조)
4. 저장소 구조: agents/ 하위를 ko/en 분리 구조로 갱신 (기존 플랫 구조 → ko/en 서브디렉토리)
5. 설치 확인: `# router, planner, ...` → `# specifier, planner, ...`
6. 빠른 시작 설명: "router가 요청을 분석" → "specifier가 요청을 분석"
7. --lang CLI 옵션: 설치 섹션에 --lang 옵션이 반영되어 있는지 확인/갱신
8. WORK-LIST.md 관리 주체: router → specifier
9. direct 모드: "router가 자체 세션에서 처리" → specifier 겸임 구조

NFR-01: config 파일명의 "router"는 유지.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README_KO.md` | MODIFY | router 에이전트 참조를 specifier 기반으로 전면 갱신 |

## Acceptance Criteria
- [ ] README_KO.md에서 "router"가 에이전트명으로 사용되지 않음 (config명 제외)
- [ ] 에이전트 테이블에 specifier 포함, 총 6개 에이전트 구성
- [ ] 파이프라인 다이어그램이 specifier 기반으로 갱신됨
- [ ] agents/ 저장소 구조가 ko/en 분리 구조로 표시됨
- [ ] --lang CLI 옵션이 설치 섹션에 반영됨

## Verify
```bash
grep -n -i "router" README_KO.md | grep -v -i "router_rule_config" | grep -v -i "Router Rule Config" | grep -v "router_rule" || echo "PASS: no agent-name router references"
```
