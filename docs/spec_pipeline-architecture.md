# Pipeline Architecture Spec

> uc-taskmanager — 에이전트 파이프라인 전체 구조 명세

---

## 1. 개요

uc-taskmanager는 Claude Code CLI 위에서 동작하는 **멀티 에이전트 작업 파이프라인 시스템**이다.
사용자의 요청을 분석하여 복잡도에 따라 세 가지 execution-mode 중 하나로 라우팅하고, 각 TASK를 에이전트 파이프라인으로 자동 처리한다.

---

## 2. 에이전트 구성

| 에이전트 | 역할 | 모델 레벨 |
|---------|------|---------|
| **router** | 사용자 요청 분석 → execution-mode 결정 및 실행 | 중간 |
| **planner** | WORK 생성 + TASK 분해 + DAG 설계 (full 모드 전용) | 높음 |
| **scheduler** | DAG 관리 + 파이프라인 실행 오케스트레이터 (full 모드 전용) | 중간 |
| **builder** | TASK 실제 구현 (파일 생성/수정) | 높음 |
| **verifier** | 구현 결과 검증 (acceptance criteria 확인) | 중간 |
| **committer** | result.md 작성 + git commit + 콜백 | 낮음 (저렴) |

---

## 3. execution-mode 3종 체계

router가 요청 복잡도를 평가하여 세 가지 모드 중 하나를 선택한다.

```
[] 태그 감지
     │
     ▼
  복잡도 평가
     │
     ├─ Trivial (1파일, ≤10줄)
     │   ▼
     │  direct ── Router 단독 수행 (서브에이전트 없음)
     │
     ├─ Simple (2~3파일, 또는 >10줄, 1~2단계)
     │   ▼
     │  pipeline ── Router → Builder → Verifier → Committer
     │
     └─ Complex (4+파일, 3+단계, 의존성 있음)
         ▼
        full ── Router → Planner → Scheduler → [B→V→C]×N
```

### 3.1 direct 모드

Router가 서브에이전트 없이 자신의 세션에서 전 과정을 직접 수행한다.

```
Router: WORK 파일 생성 → 코드 수정 → self-check → result.md 작성 → git commit → 콜백
```

- 서브에이전트 호출 비용(~12,500 토큰 세션 초기화) 없음
- PLAN.md에 `Execution-Mode: direct` 기록
- Router가 committer 역할까지 대행 (result.md + commit + COMMITTER DONE 콜백)

### 3.2 pipeline 모드

Router가 PLAN + TASK 파일을 생성한 후 서브에이전트를 순차 dispatch한다.

```
Router: PLAN 생성 → Builder dispatch → Verifier dispatch → Committer dispatch
```

- Router가 stage 콜백 대행 (BUILDER/VERIFIER/COMMITTER START/DONE)
- PLAN.md에 `Execution-Mode: pipeline` 기록
- `execution-mode="pipeline"` 속성을 dispatch XML에 포함

### 3.3 full 모드

Router가 planner에게 계획 수립을 위임하고, scheduler가 DAG 기반으로 파이프라인을 반복 실행한다.

```
Router → Planner → Scheduler → [Builder → Verifier → Committer] × N
```

- PLAN.md에 `Execution-Mode: full` 기록
- `execution-mode="full"` 속성을 dispatch XML에 포함
- 기본 모드: 계획 완료 후 사용자 승인 후 builder 단계 진입

### 3.4 Routing 기준표

| 기준 | direct | pipeline | full |
|------|:---:|:---:|:---:|
| 수정 파일 수 | 1 | 2~3 | 4+ |
| 변경 줄 수 | ≤10 | >10 | — |
| 범위 | 단일 수정 | 단일 모듈 | 복수 모듈 |
| DB 스키마 변경 | 없음 | 없음 | 있음 |
| TASK 의존성 | 없음 | 없음 | 순차/병렬 |
| 예상 단계 수 | 1 | 1~2 | 3+ |

---

## 4. WORK / TASK 파일 구조

모든 execution-mode에서 동일한 파일 구조를 사용한다 (불변 보장).

```
works/
  WORK-LIST.md                  # 전체 WORK 목록
  WORK-NN/
    PLAN.md                     # WORK 개요 + DAG (mini 또는 full)
    PROGRESS.md                 # scheduler 진행 상태 (full 모드만)
    TASK-XX.md                  # TASK 명세 (WORK prefix 없음)
    TASK-XX_progress.md         # 실시간 체크포인트 (builder/router 작성)
    TASK-XX_result.md           # 완료 보고서 (committer/router 작성)
```

파일명 규칙 상세는 `agents/file-content-schema.md` § 7 참조.

### 불변 보장 항목

모드에 무관하게 반드시 생성/전송되어야 하는 항목:

| 불변 항목 | direct 수행 주체 | pipeline/full 수행 주체 |
|-----------|:---------------:|:----------------------:|
| `works/WORK-NN/` 디렉토리 | Router | Router / Planner |
| `PLAN.md` (mini 또는 full) | Router | Router / Planner |
| `TASK-XX.md` 파일 | Router | Router / Planner |
| `TASK-XX_result.md` 생성 | **Router** | **Committer** |
| COMMITTER DONE 콜백 전송 | **Router** | **Committer** |
| `WORK-LIST.md` IN_PROGRESS 추가 | Router | Router |

---

## 5. TASK 파이프라인 흐름 (pipeline / full 공통)

각 TASK는 다음 순서로 실행된다:

```
dispatcher (Router 또는 Scheduler)
  │
  ├─ [1] builder dispatch
  │       └─ 구현 수행
  │       └─ progress.md 실시간 기록
  │       └─ context-handoff 생성 후 반환
  │
  ├─ [2] verifier dispatch
  │       └─ builder context-handoff 기반 타겟 검증
  │       └─ acceptance criteria 확인
  │       └─ context-handoff 생성 후 반환
  │
  └─ [3] committer dispatch
          └─ [Gate] progress.md 존재 + COMPLETED 확인
          └─ Gate 실패 → dispatcher에 FAIL 반환 → builder 재dispatch
          └─ Gate 통과 → result.md 작성 + git commit + COMMITTER DONE 콜백
```

---

## 6. 에이전트 간 통신 포맷

에이전트 간 데이터는 **구조화된 XML**로 전달된다. 상세 스키마는 `agents/xml-schema.md` 참조.

### dispatch (dispatcher → 하위 에이전트)

```xml
<dispatch to="builder" work="WORK-NN" task="WORK-NN-TASK-XX"
          execution-mode="pipeline|full">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
    <plan-file>works/WORK-NN/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/WORK-NN/TASK-XX.md</file>
    <title>TASK 제목</title>
    <action>implement</action>
  </task-spec>
  <context-handoff from="prev-task" task="WORK-NN-TASK-XX" detail-level="FULL">
    ...
  </context-handoff>
</dispatch>
```

### 결과 반환 (하위 에이전트 → dispatcher)

```xml
<task-result work="WORK-NN" task="WORK-NN-TASK-XX" agent="builder" status="PASS">
  <summary>요약</summary>
  <files-changed>
    <file action="created" path="...">설명</file>
  </files-changed>
  <context-handoff from="builder" detail-level="FULL">
    <what>변경 사항</what>
    <why>의사결정 근거</why>
    <caution>주의사항</caution>
    <incomplete>미완료</incomplete>
  </context-handoff>
</task-result>
```

### dispatch 속성 요약 (v1.3)

| 속성 | 값 | 설명 |
|------|----|------|
| `to` | builder, verifier, committer, planner, scheduler | 수신 에이전트 |
| `work` | WORK-NN | WORK 식별자 (stask 속성 폐지됨) |
| `task` | WORK-NN-TASK-XX | TASK 식별자 |
| `execution-mode` | direct, pipeline, full | 에이전트 동작 수준. 생략 시 `full`로 간주 |

---

## 7. 비정상 종료 대응

| 상황 | 감지 방법 | 대응 |
|------|---------|------|
| builder 세션 크래시 | committer가 progress.md 없음 감지 | dispatcher가 builder 재dispatch |
| builder 작업 미완료 | progress.md Status ≠ COMPLETED | dispatcher가 builder 재dispatch (progress.md 포함) |
| 재시도 3회 초과 | dispatcher 카운터 | TASK FAILED 마킹 + 파이프라인 중단 |

builder가 재시작될 때 **progress.md의 마지막 체크포인트부터 이어서 작업**한다.

---

## 8. DAG 의존성 관리 (full 모드)

PLAN.md에 정의된 TASK 간 의존성을 scheduler가 DAG로 관리한다.

```
TASK-00 (의존 없음) → 즉시 실행
TASK-01 (TASK-00 의존) → TASK-00 완료 후 실행
TASK-02 (TASK-01 의존) → TASK-01 완료 후 실행
TASK-03, TASK-04 (TASK-00 의존) → TASK-00 완료 후 병렬 실행 가능
```

의존성이 있는 TASK를 실행할 때, scheduler는 선행 TASK의 context-handoff를 **슬라이딩 윈도우 규칙**에 따라 전달한다. (`spec_sliding-window-context.md` 참조)

---

## 9. MCP 도구 통합 (SDD v1.3)

### Router MCP 도구

| 도구 | 용도 |
|------|------|
| `mcp__sequential-thinking__sequentialthinking` | 복잡도 판정이 애매할 때 (direct vs pipeline, pipeline vs full 경계) 단계별 분석 |
| `mcp__serena__*` | direct 모드에서 Router가 직접 코드 수정 시 심볼 단위 접근으로 토큰 절감 |

### Planner MCP 도구

| 도구 | 용도 |
|------|------|
| `mcp__sequential-thinking__sequentialthinking` | TASK 수 4개 이상이거나 의존성이 복잡할 때 TASK 분해 보조 |
| `mcp__serena__*` | Discovery Process에서 기존 코드 구조 파악 시 파일 전체 읽기 대신 사용 |

---

## 10. 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| XML 스키마 | `agents/xml-schema.md` | 에이전트 간 통신 포맷 상세 (execution-mode 속성 포함) |
| 컨텍스트 정책 | `agents/context-policy.md` | 슬라이딩 윈도우 정책 상세 |
| 파이프라인 산출물 포맷 | `agents/file-content-schema.md` | PLAN.md / TASK 파일 / progress.md / result.md 포맷 단일 정의 |
| 슬라이딩 윈도우 설계 | `docs/spec_sliding-window-context.md` | 토큰 절감 설계 |
| 콜백 통합 | `docs/spec_callback-integration.md` | 외부 시스템 콜백 연동 |

---

*최초 작성: 2026-03-12 | WORK-07 기반*
*갱신: 2026-03-14 | WORK-10 — SDD v1.3 execution-mode 3종 체계 반영 (S-TASK 폐지)*
*갱신: 2026-03-15 | WORK-19 — 파일명 규칙 현행화 (TASK-XX_progress.md / TASK-XX_result.md), file-content-schema.md 참조 추가*
