# TASK-03 결과 — agent-flow.md 전면 재작성

- 상태: DONE (PASS) · FR: FR-3, FR-4, FR-7

## 변경
- `develop/references/agent-flow.md` — Main Claude=트리거+게이트 경계로 축소, "Orchestrator 내부 흐름"(STEP A~D) 신설, 단순/복잡 분기가 direct/pipeline/full 3-모드 대체, 게이트(고정 2종 + 동적 decision), 재개 규칙표(GATE_WAIT/DECISION_WAIT/STAGE_DONE), 스폰수·역할표 orchestrator 기준, scheduler 행 제거

## 검증
- grep orchestrator/SendMessage/TaskStop/GATE_WAIT/decision → 39 매치
- grep scheduler → 0
- orchestrator.md(TASK-01) 용어와 일치 확인
