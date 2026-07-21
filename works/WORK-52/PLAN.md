# WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

> Created: 2026-07-21
> Requirement: works/WORK-52/Requirement.md (정본: TODO/todo_orchestrator-agent.md)
> Execution-Mode: full
> Project: uc-taskmanager-claude-agent
> Tech Stack: Claude Code Agent 정의 (Markdown 프롬프트 + JSON manifest), Bash/PowerShell 검증
> Language: ko
> Status: PLANNED

## 목표

Claude Code v2.1.172+의 sub-agent 중첩 지원을 활용해, `[tag]` 1회 → Main Claude가 `orchestrator`를 1회 spawn → orchestrator가 specifier→(planner)→builder→verifier→committer를 중첩 spawn하고 WORK 내부 TASK DAG 스케줄링·게이트·자율 의사결정·로그를 일괄 담당하도록 파이프라인을 재구성한다. 기존 `scheduler`는 삭제하고 DAG 로직을 orchestrator에 흡수한다.

## 설계

### 1. 아키텍처 방향

- **접근 방식**: 기존 수정 + 신규 1개(`orchestrator.md`) 구축. 기존 6-에이전트 체계를 "Main Claude가 모든 것을 조정" → "orchestrator가 중첩 spawn으로 조정"으로 전환.
- **구조**: 계층형 중첩 오케스트레이션. Main(depth 0, 트리거·게이트 경계) → orchestrator(depth 1, 흐름제어·DAG·의사결정) → 자식(depth 2, specifier/planner/builder/verifier/committer, 순수 산출물 반환). 깊이 ≤5 이내로 안전.
- **데이터 흐름**:
  - `[tag]/resume` → work-pipeline SKILL → Main Claude가 `orchestrator`를 `mode=gated|auto`로 spawn(REFERENCES_DIR 전달).
  - orchestrator STEP A(specifier)→B(planner, 복잡 시)→C(TASK DAG: builder→verifier→committer, 재시도≤3)→D(로그·콜백 일괄).
  - 게이트/의사결정은 Main Claude 경계에서만 처리: orchestrator가 `<gate>` 반환·yield(파킹) → Main Claude가 승인/결정 → `SendMessage(agentId)`로 컨텍스트 유지 재개(폴백: 로그+DECISIONS.md 기반 re-spawn) → 완료 시 `TaskStop`.
  - 디스크(`work_{WORK}.log` + `DECISIONS.md`)가 소스 오브 트루스 → cross-session 재개 시 미승인 게이트(STAGE_DONE 없음)는 절대 스킵되지 않음.

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | 있음 (문서/규약 스키마) |
| 마이그레이션 필요 | 없음 (신규 WORK부터 적용, 기존 WORK 상태기계 호환 유지) |
| 변경 내용 | XML 스키마 신규 요소 `<gate type="stage\|decision">`/`<needs-decision>`/`<decision>`; 활동 로그 이벤트 체계 개정(`ORCHESTRATOR_START/DONE`, `STAGE_START/DONE`, `GATE_WAIT`, `DECISION_WAIT`, `DECISION`); 신규 산출물 `works/{WORK}/DECISIONS.md`(항목별 시각/단계/배경/선택지/권고안/확정값/결정주체/상태 PENDING\|RESOLVED) |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| Main↔orchestrator spawn | Agent 도구 | `mode=gated\|auto` + REFERENCES_DIR 프롬프트 헤더 | FR-1, FR-3 |
| orchestrator→Main 정지 신호 | XML | `<gate type="stage\|decision" work stage>` (decision은 context/options/recommended 하위) | FR-3, FR-4 |
| 자식→orchestrator 상향 신호 | XML | `<needs-decision>` (배경+선택지+권고안) | FR-4, FR-8 |
| 게이트 재개 | SendMessage(agentId) | 컨텍스트 유지 재개 / 폴백: 로그 re-spawn | FR-3, FR-5 |
| 결정 기록 | 파일 | `works/{WORK}/DECISIONS.md` + 로그 `DECISION`(주체 user\|auto) | FR-4, FR-6 |

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | 원본은 develop/에서만, push로 plugin/·npm 동기화 | 모든 TASK는 develop/ 대상. TASK-08에서 동기화·검증 별도 수행 (push 절차 준용) |
| NFR-02 | 깊이 ≤5, 세션 sub-agent 한도(200) 내 | Main(0)→orch(1)→자식(2). 대형 WORK(N TASK×3)도 파킹 핸들 1개 원칙으로 여유. 검증 TASK에서 점검 |
| NFR-03 | 기존 WORK 상태기계(IN_PROGRESS→DONE→COMPLETED) 및 log 재개 호환 | WORK-LIST 규칙(shared-prompt §8) 유지. `STAGE_DONE`=게이트 통과 후 규칙으로 재개 정합성 확보 |
| NFR-04 | 범위 밖(ref-cache/hook/크로스-WORK 큐) 미포함 | 각 TASK scope에서 명시적 제외. ref-cache-protocol.md는 이번 변경 대상 아님 |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-00 | 스키마 레퍼런스 정합화 (xml/log/schema) | 없음 | 1 | Must | FR-4, FR-6, FR-7 | M |
| TASK-01 | 신규 orchestrator.md 작성 (핵심) | TASK-00 | 2 | Must | FR-1, FR-2, FR-3, FR-4, FR-5, FR-6 | L |
| TASK-02 | scheduler.md 삭제 + 잔여 레퍼런스 정합화 | TASK-01 | 3 | Must | FR-2, FR-6, FR-7 | M |
| TASK-03 | agent-flow.md 전면 재작성 | TASK-00, TASK-01 | 3 | Must | FR-3, FR-4, FR-7 | M |
| TASK-04 | work-pipeline/SKILL.md 간소화 | TASK-01 | 3 | Must | FR-3, FR-5, FR-7 | S |
| TASK-05 | 자식 에이전트 5종 수정 | TASK-01 | 3 | Must | FR-8, FR-6 | M |
| TASK-06 | plugin.json 갱신 | TASK-02 | 3 | Must | FR-2, FR-7 | S |
| TASK-07 | README.md 재작성 | TASK-01, TASK-03, TASK-06 | 4 | Must | FR-7 | L |
| TASK-08 | plugin/npm 동기화 + E2E 검증 | TASK-02,03,04,05,06,07 | 5 | Must | NFR-01, NFR-02, FR-1 | M |

## Task 의존성 그래프

```
Phase 1        Phase 2         Phase 3                          Phase 4      Phase 5
TASK-00 ─────▶ TASK-01 ─┬────▶ TASK-02 ───────────▶ TASK-06 ─┐
   │             │       ├────▶ TASK-03 ────────────────────┼─▶ TASK-07 ─▶ TASK-08
   └─────────────┘       ├────▶ TASK-04 ────────────────────┤              ▲
   (00도 03에 직접 의존)  ├────▶ TASK-05 ────────────────────┼──────────────┘
                         └──────(02,03,04,05,06 모두 08에 수렴)
```

- 병렬 가능: **TASK-02, TASK-03, TASK-04, TASK-05** (모두 TASK-01 완료 후 동시 실행 가능; TASK-03은 TASK-00에도 의존). TASK-06은 TASK-02 완료 후.

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | spawn 도구 토큰 불확실(`Agent` vs `Task`) | 높 | 높 | 완화 — orchestrator frontmatter에 후보 명시 + TASK-08 스모크 테스트로 확정 | TODO §116, §184 명시 |
| R-02 | cross-session 재개 시 미승인 게이트 스킵 (정합성 핵심) | 중 | 높 | 회피 — `STAGE_DONE`=게이트 통과 후 기록 규칙을 log 스키마(TASK-00)+orchestrator(TASK-01)에 이중 명시 | 검증 3에서 확인 |
| R-03 | scheduler/Main Claude 참조 누락(여러 파일 산재) | 중 | 중 | 완화 — TASK-08에서 grep 스윕으로 잔여 참조 0 확인 | README 15+ 라인 |
| R-04 | SendMessage/TaskStop headless 동작 미검증 | 중 | 중 | 수용+완화 — gated는 대화형 전제, TASK-08 대화형 검증 절차 명시 | TODO 참고 §208 |
| R-05 | plugin/npm 미동기화로 배포본 불일치 | 중 | 중 | 회피 — TASK-08을 별도 게이트로 분리, push 절차 준용 | NFR-01 |
| R-06 | 문서 분량 과다로 1 TASK 초과(orchestrator/README) | 중 | 낮 | 완화 — scope 경계 명확화, 필요 시 후속 세션 분할 | L 규모 태스크 2건 |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| orchestrator 신규 도입 | FR-1 | TASK-01 (+TASK-00) | orchestrator가 nested spawn으로 WORK 완주 | 수동확인 + TASK-08 headless 스모크 |
| scheduler 삭제·DAG 흡수 | FR-2 | TASK-01, TASK-02, TASK-06 | scheduler.md 제거 후 파이프라인 정상 | grep(잔여 0) + JSON parse |
| 승인 게이트 유지·auto 생략 | FR-3 | TASK-01, TASK-03, TASK-04 | gated: gate yield→SendMessage 재개→TaskStop | 대화형 검증 |
| 동적 의사결정 | FR-4 | TASK-00, TASK-01 | `<gate type="decision">`/auto 자동결정+기록 | 검증 2c |
| 생명주기/고스트 관리 | FR-5 | TASK-01, TASK-04 | 파킹 핸들 1개, SendMessage/TaskStop 동작 | 대화형 검증 |
| 로그 orchestrator 일괄 | FR-6 | TASK-00, TASK-01, TASK-05 | STAGE_DONE=게이트 후, 자식 로그 미기록 | 로그 스키마 리뷰 + 재개 테스트 |
| 참조/스킬/매니페스트 정합화 | FR-7 | TASK-00,02,03,04,06,07 | 참조 정합, 잔여 scheduler/nest 참조 0 | grep 스윕 |
| 자식 에이전트 수정 | FR-8 | TASK-05 | 보고 대상 orchestrator, needs-decision, 로그 제거 | 문서 리뷰 |
| develop→plugin/npm 동기화 | NFR-01 | TASK-08 | 3자 diff 없음 | diff 확인 |
| 깊이/한도 | NFR-02 | TASK-08 | 깊이 ≤5, 한도 여유 | 검증 4 |

---

## 자체 검증 체크리스트

- [x] 모든 FR(1~8)이 최소 1개 Task에 매핑됨
- [x] 모든 NFR이 설계 또는 Task에 반영됨
- [x] Task 간 순환 의존 없음 (DAG 비순환 확인)
- [x] 제약조건 내 실현 가능 (문서/규약 변경, 런타임 신기능 검증 TASK 포함)
- [x] 각 Task에 완료 조건(Verify)이 있음
- [x] 리스크가 식별되고 대응 전략이 있음 (R-01~R-06)
- [x] 실행 순서가 의존관계와 일치함 (Phase 1→5)

---
