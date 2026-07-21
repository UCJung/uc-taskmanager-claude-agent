# TASK-02: scheduler.md 삭제 + 잔여 레퍼런스 정합화

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | scheduler 에이전트를 제거하고, 스케줄러/개별-자식 기록 전제를 orchestrator 기준으로 참조하는 나머지 레퍼런스를 정합화한다 |
| 매핑 요구사항 | FR-2, FR-6, FR-7 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01 완료 후 (DAG/재시도 로직이 orchestrator STEP C로 이전됐음을 전제) |
| Phase | Phase 3 |

## Scope

1. `develop/agents/scheduler.md` — **삭제**. DAG/재시도/진행보고 로직은 orchestrator STEP C(TASK-01)로 이전 완료.
2. `develop/references/context-policy.md` — "Scheduler 디스패치" 절 및 Main Claude 핸드오프 서술을 **orchestrator 기준**으로 수정(dispatch 예시의 주체·문구 갱신). 슬라이딩 윈도우 규칙 자체는 유지.
3. `develop/references/callback-protocol.md` — 콜백 발신 주체를 개별 자식 → **orchestrator 일괄**(STAGE 단위 START/DONE을 orchestrator가 발신)로 변경. Agent별 docs 항목은 STAGE 매핑으로 유지 서술.
4. `develop/references/shared-prompt-sections.md` — 자동결정 기록 관례 1항 추가(권고안 자동결정 시 DECISIONS.md/결과보고서 기록). WORK-LIST 규칙(§8)은 유지. § 4 Discovery 스크립트의 이벤트 명칭이 신규 로그 체계(TASK-00)와 상충하면 orchestrator 이벤트 기준으로 정합화.

**범위 밖**: agent-flow.md(TASK-03), work-pipeline/SKILL.md(TASK-04), plugin.json(TASK-06), xml-schema/work-activity-log/file-content-schema(TASK-00). README(TASK-07).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/agents/scheduler.md` | DELETE | DAG 로직 orchestrator STEP C 흡수로 불필요 |
| `develop/references/context-policy.md` | MODIFY | Scheduler 디스패치/Main Claude 핸드오프 → orchestrator 기준 |
| `develop/references/callback-protocol.md` | MODIFY | 콜백 발신 주체 orchestrator 일괄로 변경 |
| `develop/references/shared-prompt-sections.md` | MODIFY | 자동결정 기록 관례 추가, Discovery 이벤트 정합화 |

## Acceptance Criteria
- [ ] `develop/agents/scheduler.md` 파일이 존재하지 않음
- [ ] context-policy.md에 "Scheduler 디스패치" 잔여 표현이 orchestrator로 대체됨
- [ ] callback-protocol.md가 orchestrator 일괄 발신을 명시
- [ ] shared-prompt-sections.md에 자동결정 기록 관례가 추가되고 WORK-LIST 규칙은 유지됨
- [ ] Discovery 스크립트(§4)의 이벤트 명칭이 신규 로그 체계와 모순되지 않음

## Verify
```bash
test ! -f develop/agents/scheduler.md && echo "scheduler.md removed"
grep -ni "scheduler" develop/references/context-policy.md
grep -ni "orchestrator" develop/references/callback-protocol.md
```

---
