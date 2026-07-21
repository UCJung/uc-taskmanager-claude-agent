# TASK-04: work-pipeline/SKILL.md 간소화

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 트리거 스킬을 다단계 스폰 프로즈 없이 orchestrator 중심으로 간소화하되, 게이트 처리(승인·SendMessage·TaskStop)는 Main Claude에 남긴다 |
| 매핑 요구사항 | FR-3, FR-5, FR-7 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | TASK-01 완료 후 (orchestrator spawn 규약·mode 플래그 참조) |
| Phase | Phase 3 |

## Scope

`develop/skills/work-pipeline/SKILL.md`를 간소화한다.

- 유지: 트리거 감지(`[tag]`/resume), `REFERENCES_DIR` 유도, auto 감지("auto"/"자동으로").
- 다단계 스폰 프로즈 제거 → orchestrator 중심으로 단순화하되 **게이트 처리는 Main Claude에 남김**:
  - 비-auto: `orchestrator`를 `mode=gated`로 spawn하고 **agentId 보관** → `<gate>` 신호 수신 시(고정 게이트/`type="decision"`) 요약·선택지·권고안 제시 + 사용자 승인·결정 대기 → **`SendMessage(agentId, 결정)`으로 재개**(폴백: 로그 re-spawn). 최종 요약까지 반복 후 **`TaskStop(agentId)`으로 종료**. `type="decision"` 게이트는 `AskUserQuestion`으로 선택지+권고안 제시.
  - auto: `orchestrator`를 `mode=auto`로 **1회 spawn**, 게이트/의사결정 정지 없이 완주.
- 모든 최초 spawn 프롬프트 상단에 `REFERENCES_DIR` + `mode=` 포함. 재개는 name 아닌 **agentId** 사용.

**범위 밖**: 다른 3개 스킬(uctm-init, work-status, sdd-pipeline)은 이번 변경 대상 아님. agent-flow.md(TASK-03).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/skills/work-pipeline/SKILL.md` | MODIFY | orchestrator 단일 spawn + Main 경계 게이트(SendMessage/TaskStop) 중심으로 간소화 |

## Acceptance Criteria
- [ ] 트리거 감지 + REFERENCES_DIR 유도 + auto 감지가 유지됨
- [ ] 비-auto: mode=gated spawn + agentId 보관 + SendMessage 재개 + TaskStop 종료 흐름이 기술됨
- [ ] auto: mode=auto 1회 spawn 흐름이 기술됨
- [ ] `type="decision"` 게이트를 AskUserQuestion으로 제시함이 명시됨
- [ ] 개별 자식(specifier/planner/scheduler/builder…) 다단계 스폰 프로즈가 제거됨
- [ ] 재개 지정에 agentId 사용이 명시됨

## Verify
```bash
grep -nE "orchestrator|SendMessage|TaskStop|agentId" develop/skills/work-pipeline/SKILL.md
grep -ni "scheduler" develop/skills/work-pipeline/SKILL.md
```

---
