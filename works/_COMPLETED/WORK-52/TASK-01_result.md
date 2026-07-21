# TASK-01 결과 — 신규 orchestrator.md 작성 (핵심)

- 상태: DONE (PASS)
- 대상 FR: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6

## 변경 파일
- `develop/agents/orchestrator.md` (CREATE, 239줄)

## 구성
- frontmatter: `name: orchestrator`, `model: opus`, `tools: Agent, Task, Read, Write, Edit, Bash, Glob, Grep, mcp__serena__*` (spawn 토큰 Agent/Task 병기 — TASK-08 스모크 확정 대상)
- §3-1 사전작업(STARTUP 레퍼런스 6종, mode 파싱, 재개 판정표, ORCHESTRATOR_START)
- §3-2 STEP A(specifier)~B(planner)~C(TASK DAG, 재시도≤3/병렬)~D(로그·콜백 일괄)
- §3-3 게이트/동적 의사결정(mode 처리표, 고정 게이트 2종, `<gate type="decision">` 에스컬레이션, 판단기준 5종)
- §3-4 컨텍스트 핸드오프(FULL/SUMMARY/DROP)
- §3-5 제약, §3-6 출력(게이트 yield / 최종 요약)

## 검증
- `grep ^name: orchestrator` / `mode=gated|auto` / `Agent|Task` / `STAGE_DONE` 전부 매치(핵심 용어 28곳)
- TASK-00 계약(신호/이벤트/DECISIONS.md)과 용어 일치 확인
