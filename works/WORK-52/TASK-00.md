# TASK-00: 스키마 레퍼런스 정합화 (xml-schema / work-activity-log / file-content-schema)

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | orchestrator가 사용할 데이터 계약(신호 XML·로그 이벤트·DECISIONS.md)을 먼저 확정해 후속 TASK가 참조할 단일 소스를 만든다 |
| 매핑 요구사항 | FR-4, FR-6, FR-7 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

세 개의 레퍼런스 파일에 orchestrator 아키텍처의 "데이터 계약"을 정의한다. 이후 orchestrator.md(TASK-01)와 나머지 문서가 이를 참조한다.

1. `develop/references/xml-schema.md`
   - dispatch/task-result의 디스패처 라벨을 Main Claude → **orchestrator**로 변경.
   - 신규 `<gate type="stage|decision" work="WORK-NN" stage="specifier|planner|...">` 정의 추가. `type="decision"`은 `<context>`/`<options>`/`<recommended>` 하위 요소 포함(배경·선택지·권고안). orchestrator→Main Claude 정지 신호임을 명시.
   - 신규 `<needs-decision>` 정의 추가 — 자식 에이전트→orchestrator 상향 신호(배경+선택지+권고안).
   - 신규 `<decision>` 정의 추가 — 확정 결정 기록(user 승인분/auto 자동결정분 공통), DECISIONS.md/로그 반영.
2. `develop/references/work-activity-log.md`
   - 기록 주체를 **orchestrator로 일원화**(개별 자식 로그 표 제거/대체).
   - 이벤트 체계 개정: `ORCHESTRATOR_START/DONE`, `STAGE_START`(자식 spawn 전)/`STAGE_DONE`(게이트 있으면 게이트 통과 후), `GATE_WAIT — stage=X`, `DECISION_WAIT`, `DECISION`(주체 user|auto), execution-mode 헤더.
   - **`STAGE_DONE`=게이트 통과 후 기록** 규칙과 그것이 재개 판정(미승인 게이트 스킵 방지) 근거임을 명시.
3. `develop/references/file-content-schema.md`
   - `works/{WORK}/DECISIONS.md` 포맷 신설(§ 신규): 항목별 시각/단계/배경/선택지/권고안/**확정값**/결정주체(user 승인|auto)/**상태(PENDING|RESOLVED)**. 게이트 yield 시 PENDING, 승인/자동결정 시 RESOLVED. 재개가 PENDING을 재제시하는 근거임을 명시.
   - § 5 파일 이름 규칙 표에 `DECISIONS.md`(생성 주체 orchestrator) 추가.

**범위 밖**: ref-cache-protocol.md, callback-protocol.md(TASK-05… 실제 callback은 TASK-02), context-policy.md(TASK-02). PLAN/TASK/Requirement 기존 양식은 손대지 않음(파서 호환 유지).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/references/xml-schema.md` | MODIFY | 디스패처 라벨 orchestrator화 + `<gate>`/`<needs-decision>`/`<decision>` 신규 정의 |
| `develop/references/work-activity-log.md` | MODIFY | 이벤트 체계 개정(orchestrator 일괄), STAGE_DONE=게이트 후 규칙 명시 |
| `develop/references/file-content-schema.md` | MODIFY | DECISIONS.md 포맷 신설 + 파일 이름 규칙 표 갱신 |

## Acceptance Criteria
- [x] xml-schema.md에 `<gate>`, `<needs-decision>`, `<decision>` 세 요소가 예시 XML과 함께 정의됨
- [x] `<gate type="decision">`에 context/options/recommended 하위 요소가 문서화됨
- [x] work-activity-log.md의 이벤트 표가 orchestrator 기준으로 개정되고 `GATE_WAIT`/`DECISION_WAIT`/`DECISION` 포함
- [x] `STAGE_DONE`은 게이트 통과 후 기록한다는 규칙이 명시됨
- [x] file-content-schema.md에 DECISIONS.md 포맷(상태 PENDING|RESOLVED 포함)이 신설됨
- [x] 기존 PLAN.md/TASK-XX.md 양식(§1, §2)과 파서 정규식 설명은 변경되지 않음

## Verify
```bash
grep -n "needs-decision" develop/references/xml-schema.md
grep -n "GATE_WAIT" develop/references/work-activity-log.md
grep -n "DECISIONS.md" develop/references/file-content-schema.md
```

---
