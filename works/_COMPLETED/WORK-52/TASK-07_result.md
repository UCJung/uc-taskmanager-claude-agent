# TASK-07 결과 — README.md 재작성

- 상태: DONE (PASS) · FR: FR-7

## 변경
- `README.md` — "Subagents can't nest" 문장 2개 제거, Pipeline/Flow·Why This Approach·모드/스폰표·Agents표를 orchestrator 중심 중첩 흐름으로 재서술
- Three Execution Modes → Orchestrator Modes(Gated/Auto), 게이트(고정+동적)/SendMessage/TaskStop/DECISIONS.md 섹션 추가
- scheduler → orchestrator 전면 치환

## 검증
- grep "can't nest|cannot nest" → 0
- grep scheduler → 0, orchestrator → 66
- router_rule_config.json 내 "full mode"는 specifier 내부 복잡도 라벨(범위 밖, 매핑 주석 추가)
