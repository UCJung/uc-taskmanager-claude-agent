# TASK-01: 신규 orchestrator.md 작성 (핵심)

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 파이프라인 전체를 중첩 spawn으로 자율 오케스트레이션하는 단일 orchestrator 에이전트 정의 파일을 신설한다 (프로젝트의 핵심 산출물) |
| 매핑 요구사항 | FR-1, FR-2, FR-3, FR-4, FR-5, FR-6 |
| 우선순위 | Must |
| 예상 규모 | L |
| 의존관계 | TASK-00 완료 후 (신규 XML 신호·로그 이벤트·DECISIONS.md 계약 참조) |
| Phase | Phase 2 |

## Scope

`develop/agents/orchestrator.md`를 신규 작성한다. 기존 에이전트 문체(역할→수행업무→수행절차→출력) 유지.

- **frontmatter**: `name: orchestrator`, `model: opus`, `tools: Agent, Read, Write, Edit, Bash, Glob, Grep, mcp__serena__*` — **중첩 spawn 도구 반드시 포함**. 이 런타임의 spawn 토큰이 `Agent`인지 `Task`인지 미확정이므로 안전하게 둘 다 나열 검토(주석/note로 TASK-08 스모크 확정 대상임을 남김).
- **입력 플래그** `mode=gated|auto` (Main Claude 전달) 처리 규칙 기술.
  - `gated`: 고정 게이트(① specifier 후, ② planner 후 — 복잡 WORK) 통과 직후 `<gate type="stage">`+요약 반환 후 **yield(파킹)**. 자율 판단상 사용자 결정 필요 시 어느 단계에서든 `<gate type="decision">`(배경+선택지+권고안) 반환·yield. 승인은 Main Claude가 처리하며, **SendMessage로 컨텍스트 유지 재개**(폴백: 로그+DECISIONS.md 기반 re-spawn). 재개 시 주입된 결정 반영.
  - `auto`: 게이트/의사결정 정지 없이 전 구간 완주. 모든 판단 지점 권고안 자동결정 + 결과보고서 `## 자동 결정 사항` + DECISIONS.md 기록.
- **의사결정 에스컬레이션 규칙**: 자식이 `<needs-decision>` 반환 시 gated→`<gate type="decision">`로 상향, auto→권고안 자동결정+기록. 판단 기준(요구 다의성/설계 트레이드오프/범위 초과/파괴적 변경/재시도 3회 실패) 예시 포함.
- **STEP A**: specifier 중첩 spawn → WORK 생성(폴더/Requirement.md/IN_PROGRESS 행/LAST_WORK_ID), 복잡도·모드 판정 수신. gated면 `GATE_WAIT` 기록 후 [GATE-1] 반환·yield.
- **STEP B**: 복잡 WORK면 planner 중첩 spawn → PLAN.md+TASK DAG. 단순 WORK는 specifier 단일 TASK 사용(기존 direct/pipeline 분기를 내부 branch로 대체). gated면 `GATE_WAIT` 기록 후 [GATE-2] 반환·yield.
- **STEP C (scheduler 흡수, 게이트 없음)**: `work_{WORK}.log` 기반 DAG 해석 → READY(오름차순) 결정 → TASK별 builder→verifier→committer 중첩 spawn. verifier/committer FAIL 시 builder 최대 3회 재시도. 복수 READY면 builder 병렬 spawn.
- **STEP D (로그·콜백 일괄)**: 모든 활동 로그/콜백을 orchestrator가 기록. `STAGE_START`=자식 spawn 전, `STAGE_DONE`=(게이트 있으면) 게이트 통과 후, yield 시 `GATE_WAIT`/`DECISION_WAIT`, 결정 확정 시 `DECISION`. 자식은 로그/콜백 미기록.
- **재개 로직**: `*_START`=중단(재실행)/`STAGE_DONE`=완료(다음) + `GATE_WAIT`(자식 재실행 없이 게이트만 재제시)/`DECISION_WAIT`(PENDING 결정 재제시). execution-mode는 WORK 메타에서 승계.
- **컨텍스트 핸드오프**: 슬라이딩 윈도우(직전 FULL/2단계 SUMMARY/3+ DROP)를 자식 프롬프트 구성 시 적용.
- **STARTUP**: `{REFERENCES_DIR}/`에서 file-content-schema, shared-prompt-sections, xml-schema, work-activity-log, callback-protocol, context-policy 읽기.
- **출력**: 최종 WORK 요약 + `## 자동 결정 사항` 목록을 Main Claude에 반환.

**범위 밖**: scheduler.md 삭제(TASK-02), plugin.json 등록(TASK-06). 이 TASK는 파일 신설만.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/agents/orchestrator.md` | CREATE | orchestrator 에이전트 정의(frontmatter + 역할/수행업무/STEP A~D/재개/핸드오프/출력) |

## Acceptance Criteria
- [ ] frontmatter에 spawn 도구(`Agent`, 필요 시 `Task` 병기)와 `model: opus` 포함, `name: orchestrator`
- [ ] `mode=gated|auto` 두 모드 처리 규칙이 명시됨
- [ ] STEP A~D가 각각 spawn 대상·게이트·로그 이벤트와 함께 기술됨
- [ ] 고정 게이트 2종 + 동적 `<gate type="decision">` 발생 규칙과 에스컬레이션이 포함됨
- [ ] 재개 로직(GATE_WAIT/DECISION_WAIT/STAGE_DONE)과 `STAGE_DONE`=게이트 통과 후 규칙이 반영됨
- [ ] 자식이 로그/콜백을 쓰지 않고 orchestrator가 일괄 기록한다는 원칙 명시
- [ ] TASK-00에서 정의한 XML 신호·DECISIONS.md와 용어/필드가 일치

## Verify
```bash
grep -n "^name: orchestrator" develop/agents/orchestrator.md
grep -nE "mode=gated|mode=auto|gated\|auto" develop/agents/orchestrator.md
grep -nE "Agent|Task" develop/agents/orchestrator.md
grep -n "STAGE_DONE" develop/agents/orchestrator.md
```

---
