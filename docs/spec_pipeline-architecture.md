# Pipeline Architecture Spec

> uc-taskmanager — 에이전트 파이프라인 전체 구조 명세

---

## 1. 개요

uc-taskmanager는 Claude Code CLI 위에서 동작하는 **멀티 에이전트 작업 파이프라인 시스템**이다.
사용자의 요청을 WORK → TASK 2단계로 분해하고, 각 TASK를 에이전트 파이프라인으로 자동 처리한다.

---

## 2. 에이전트 구성

| 에이전트 | 역할 | 모델 레벨 |
|---------|------|---------|
| **router** | 사용자 요청 분석 → WORK/S-TASK 분기 | 중간 |
| **planner** | WORK 생성 + TASK 분해 + DAG 설계 | 높음 |
| **scheduler** | DAG 관리 + 파이프라인 실행 오케스트레이터 | 중간 |
| **builder** | TASK 실제 구현 (파일 생성/수정) | 높음 |
| **verifier** | 구현 결과 검증 (acceptance criteria 확인) | 중간 |
| **committer** | result.md 작성 + git commit + gate 역할 | 낮음 (저렴) |

---

## 3. 계층 구조

```
사용자 요청
  └─ router
       ├─ WORK 흐름: planner → scheduler
       │                         └─ TASK 파이프라인 반복
       │                              ├─ builder
       │                              ├─ verifier
       │                              └─ committer
       └─ S-TASK 직접: builder → verifier → committer
```

---

## 4. WORK / TASK 파일 구조

```
tasks/multi-tasks/
  WORK-LIST.md                  # 전체 WORK 목록
  WORK-XX/
    PLAN.md                     # WORK 개요 + DAG
    PROGRESS.md                 # scheduler 진행 상태
    WORK-XX-TASK-NN.md          # TASK 명세 (planner 작성)
    WORK-XX-TASK-NN-progress.md # 실시간 체크포인트 (builder 작성)
    WORK-XX-TASK-NN-result.md   # 완료 보고서 (committer 작성)
```

---

## 5. TASK 파이프라인 흐름

각 TASK는 다음 순서로 실행된다:

```
scheduler
  │
  ├─ [1] builder 디스패치
  │       └─ 구현 수행
  │       └─ progress.md 실시간 기록
  │       └─ context-handoff 생성 후 반환
  │
  ├─ [2] verifier 디스패치
  │       └─ builder context-handoff 기반 타겟 검증
  │       └─ acceptance criteria 확인
  │       └─ context-handoff 생성 후 반환
  │
  └─ [3] committer 디스패치
          └─ [Gate] progress.md 존재 + COMPLETED 확인
          └─ Gate 실패 → scheduler에 FAIL 반환 → builder 재디스패치
          └─ Gate 통과 → result.md 작성 + git commit
```

---

## 6. 에이전트 간 통신 포맷

에이전트 간 데이터는 **구조화된 XML**로 전달된다. 상세 스키마는 `agents/xml-schema.md` 참조.

### 디스패치 (scheduler → 하위 에이전트)

```xml
<dispatch to="builder" work="WORK-XX" task="WORK-XX-TASK-NN">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
    <plan-file>tasks/multi-tasks/WORK-XX/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>tasks/multi-tasks/WORK-XX/WORK-XX-TASK-NN.md</file>
    <title>TASK 제목</title>
    <action>implement</action>
  </task-spec>
  <context-handoff from="prev-task" task="WORK-XX-TASK-NN" detail-level="FULL">
    ...
  </context-handoff>
</dispatch>
```

### 결과 반환 (하위 에이전트 → scheduler)

```xml
<task-result work="WORK-XX" task="WORK-XX-TASK-NN" agent="builder" status="PASS">
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

---

## 7. 비정상 종료 대응

| 상황 | 감지 방법 | 대응 |
|------|---------|------|
| builder 세션 크래시 | committer가 progress.md 없음 감지 | scheduler가 builder 재디스패치 |
| builder 작업 미완료 | progress.md Status ≠ COMPLETED | scheduler가 builder 재디스패치 (progress.md 포함) |
| 재시도 3회 초과 | scheduler 카운터 | TASK FAILED 마킹 + 파이프라인 중단 |

builder가 재시작될 때 **progress.md의 마지막 체크포인트부터 이어서 작업**한다.

---

## 8. DAG 의존성 관리

PLAN.md에 정의된 TASK 간 의존성을 scheduler가 DAG로 관리한다.

```
TASK-00 (의존 없음) → 즉시 실행
TASK-01 (TASK-00 의존) → TASK-00 완료 후 실행
TASK-02 (TASK-01 의존) → TASK-01 완료 후 실행
TASK-03, TASK-04 (TASK-00 의존) → TASK-00 완료 후 병렬 실행 가능
```

의존성이 있는 TASK를 실행할 때, scheduler는 선행 TASK의 context-handoff를 **슬라이딩 윈도우 규칙**에 따라 전달한다. (`spec_sliding-window-context.md` 참조)

---

## 9. 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| XML 스키마 | `agents/xml-schema.md` | 에이전트 간 통신 포맷 상세 |
| 컨텍스트 정책 | `agents/context-policy.md` | 슬라이딩 윈도우 정책 상세 |
| 슬라이딩 윈도우 설계 | `docs/spec_sliding-window-context.md` | 토큰 절감 설계 |

---

*최초 작성: 2026-03-12 | WORK-07 기반*
