# Requirement — WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

> 요구사항 원본(정본): `TODO/todo_orchestrator-agent.md` — 본 문서는 그 요약이며, planner는 정본을 함께 참조한다.
> 생성일: 2026-07-21 · execution-mode: (planner가 복잡도로 판정)

## 목표

Claude Code v2.1.172+의 sub-agent 중첩 지원을 활용하여, 파이프라인 전체를 스스로 오케스트레이션하는 단일 **`orchestrator` 에이전트**를 도입한다. `[tag]` 메시지 → Main Claude가 orchestrator를 spawn → orchestrator가 specifier→(planner)→builder→verifier→committer를 **중첩 spawn**하고 WORK 내부 TASK 스케줄링·자율 의사결정까지 담당한다.

## 배경

현재 아키텍처는 "Subagents can't nest — Main Claude orchestrates everything" 제약 위에 있어, `scheduler`/`specifier`는 dispatch XML만 반환하고 실제 spawn·게이트·재개 로직이 Main Claude에 흩어져 있다(파이프라인이 specifier 이후 멈추는 트리거 실패 관측). 중첩이 정식 지원되므로 이 제약을 제거한다.

## 기능 요구사항 (FR)

- **FR-1** 신규 `orchestrator` 에이전트: `tools`에 spawn 도구(`Agent`) 포함, 입력 `mode=gated|auto`, STEP A(specifier)~B(planner)~C(TASK DAG build/verify/commit)~D(로그·콜백 일괄).
- **FR-2** `scheduler` 에이전트 삭제 및 DAG/재시도 로직을 orchestrator에 흡수(WORK 내부 TASK만).
- **FR-3** 승인 게이트: 기본 유지, "auto/자동으로" 시에만 생략. 게이트는 Main Claude 경계 처리 — orchestrator가 `<gate>` 반환·yield → 승인 → `SendMessage` 컨텍스트 유지 재개(폴백: 로그 re-spawn).
- **FR-4** 동적 의사결정: 고정 게이트 외에도 `<gate type="decision">`(배경+선택지+권고안)로 언제든 승인 요청. auto는 권고안 자동결정+기록.
- **FR-5** 생명주기/고스트 관리: orchestrator 핸들 1개만 능동 관리(파킹↔SendMessage↔`TaskStop`). 디스크(log+DECISIONS.md)가 소스 오브 트루스.
- **FR-6** 로그 기록 orchestrator 일괄: `STAGE_DONE`은 게이트 통과 후, yield 시 `GATE_WAIT`/`DECISION_WAIT` → cross-session 재개 시 미승인 게이트 스킵 방지. 자식은 로그/콜백 미기록.
- **FR-7** 참조/스킬/매니페스트 정합화: `agent-flow.md` 전면 재작성, `work-pipeline/SKILL.md` 간소화, `xml-schema`/`work-activity-log`/`file-content-schema`/`callback-protocol`/`context-policy` 개정, `plugin.json`(orchestrator 추가·scheduler 제거), `README.md` 갱신.
- **FR-8** 기존 자식 에이전트 수정: 보고 대상 "orchestrator"로, 모호점 시 `<needs-decision>` 반환, 로그/콜백 제거, description 트리거 문구 제거.

## 비기능/제약 (NFR)

- 원본 작업은 `develop/`에서만 수행, push 절차로 `plugin/`·`npm/` 동기화.
- 깊이 ≤5, 세션 sub-agent 한도(기본 200) 내.
- 기존 WORK 상태기계(`IN_PROGRESS→DONE→COMPLETED`) 및 재개(log 기반) 호환.
- 범위 밖: ref-cache 정상화, hook 인프라, 크로스-WORK 큐(별도 TODO).

## 인수 기준 (Acceptance)

- orchestrator가 nested로 specifier→…→committer를 spawn하여 WORK를 완주(headless auto)하고 산출물·커밋·WORK-LIST 전환이 생성됨.
- gated 모드에서 `<gate>` yield → SendMessage 재개 → TaskStop 종료가 동작.
- 동적 의사결정 에스컬레이션(gated=승인 / auto=자동결정+기록)이 동작.
- cross-session: GATE 파킹 중 세션 종료 후 재개 시 미승인 게이트가 스킵되지 않음.
- `scheduler.md` 제거 후 파이프라인 정상, plugin/npm 동기화 완료.
