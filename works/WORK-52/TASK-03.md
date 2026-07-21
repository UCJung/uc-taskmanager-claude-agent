# TASK-03: agent-flow.md 전면 재작성

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | Main Claude 오케스트레이션 가이드를 "Main은 트리거만, orchestrator가 내부 흐름 담당"으로 전면 재서술한다 |
| 매핑 요구사항 | FR-3, FR-4, FR-7 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-00, TASK-01 완료 후 (로그 이벤트/게이트 신호 및 orchestrator STEP 정의 참조) |
| Phase | Phase 3 |

## Scope

`develop/references/agent-flow.md`를 전면 재작성한다.

- **Main Claude 역할 축소**: `[tag]`/resume 감지 → orchestrator **1회 spawn**(REFERENCES_DIR·`mode=gated|auto` 전달) → 게이트 처리(승인/결정 제시·SendMessage 재개·TaskStop 종료) → 최종 보고 릴레이. **직접 다른 에이전트를 spawn하지 않음**.
- **신설 "Orchestrator 내부 흐름" 절**: STEP A~D, 단순/복잡 내부 분기(기존 direct/pipeline/full 3표 대체), 재개 규칙, 슬라이딩 윈도우.
- **Spawn 수 표**를 orchestrator 기준으로 갱신(Main→orchestrator 1 + 내부 자식 spawn).
- **승인 게이트 절 유지·개정**: 게이트는 Main Claude 경계 처리 → orchestrator가 `<gate>` 반환 → Main 승인/결정 → SendMessage 재개(폴백 로그 re-spawn). "auto"/"자동으로" 시에만 정지 생략(1회 완주). 고정 게이트(specifier 후/planner 후) + **동적 의사결정 게이트(`type="decision"`, 어느 단계에서든)** 두 종류 모두 문서화.
- **기존 WORK 재개 절**: 로그 마지막 이벤트 기준 재개 판정을 신규 이벤트 체계(`GATE_WAIT`/`DECISION_WAIT`/`STAGE_DONE`/`*_START`)로 갱신.
- 에이전트 역할 요약 표에서 scheduler 제거, orchestrator 추가.

**범위 밖**: SKILL.md(TASK-04), 자식 에이전트(TASK-05), README(TASK-07).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/references/agent-flow.md` | REWRITE | Main=트리거+게이트 경계, Orchestrator 내부 흐름 신설, 모드/스폰 표 및 재개 규칙 갱신 |

## Acceptance Criteria
- [ ] Main Claude가 orchestrator를 1회 spawn하고 직접 다른 에이전트를 spawn하지 않음이 명시됨
- [ ] "Orchestrator 내부 흐름" 절(STEP A~D + 단순/복잡 분기)이 존재
- [ ] direct/pipeline/full 3-모드 표가 orchestrator 중심(gated/auto)으로 대체됨
- [ ] 고정 게이트 + 동적 의사결정 게이트 두 종류가 문서화됨
- [ ] 재개 판정이 신규 로그 이벤트(GATE_WAIT/DECISION_WAIT/STAGE_DONE)를 사용
- [ ] scheduler 참조가 제거되고 orchestrator로 대체됨

## Verify
```bash
grep -n "orchestrator" develop/references/agent-flow.md
grep -ni "scheduler" develop/references/agent-flow.md
grep -nE "type=\"decision\"|GATE_WAIT" develop/references/agent-flow.md
```

---
