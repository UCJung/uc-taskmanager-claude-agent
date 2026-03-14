# Context Handoff Policy

슬라이딩 윈도우 컨텍스트 전달의 기반이 되는 정책 문서. 에이전트 간 정보 전달 시 어떤 항목을 FULL/SUMMARY/DROP으로 처리할지 규칙을 정의한다.

## 슬라이딩 윈도우 원칙

파이프라인 단계에 따라 이전 단계의 결과를 다음과 같이 전달한다:

| 단계 거리 | Detail Level | 규칙 | 예시 |
|---------|-------------|------|------|
| **직전 (1단계 전)** | `FULL` | 모든 필드 전달 (what, why, caution, incomplete) | verifier ← builder FULL |
| **2단계 전** | `SUMMARY` | what 필드만 1-3줄로 요약 | committer ← builder SUMMARY |
| **3단계 이상 전** | `DROP` | 전달하지 않음 | scheduler에서 TASK 간 의존성 시, 3단계 이상 이전 TASK는 생략 |

## Context-Handoff 4-필드 구조

각 에이전트가 출력하는 context-handoff는 다음 4개 필드를 포함한다:

### 1. `what` (무엇을 했는가)
- **정의**: 구체적으로 변경하거나 검증한 사항의 요약
- **내용**: 파일 생성/수정, 함수 추가, 설정 변경 등 실제 결과물
- **길이**: 2-5줄 (FULL), 1-2줄 (SUMMARY)
- **예시**:
  - Builder: "context-policy.md 신규 생성, xml-schema.md에 context-handoff 요소 4개 추가"
  - Verifier: "두 파일 모두 생성 확인, 슬라이딩 윈도우 규칙 3가지(FULL/SUMMARY/DROP) 정의 확인"

### 2. `why` (왜 그렇게 했는가)
- **정의**: 의사결정 근거, 구현/검증 방식 선택 이유
- **내용**: 기술적 근거, 대안 검토, 제약사항 설명
- **길이**: 2-4줄 (FULL only, SUMMARY에서는 생략)
- **예시**:
  - Builder: "슬라이딩 윈도우를 통해 TASK 간 의존성 시 토큰 낭비 최소화. 직전 단계는 FULL로 다음 단계 의사결정 지원, 2단계 전은 SUMMARY로 컨텍스트 유지, 3단계 이상은 DROP으로 불필요한 정보 제거"

### 3. `caution` (다음 에이전트가 주의할 점)
- **정의**: 미처 처리하지 못한 사항, 조건부 완료, 수동 검증 필요 부분
- **내용**: 환경 문제, 부분 완료, 의존성 이슈, 검증 불가 항목
- **길이**: 1-3줄 (FULL only, SUMMARY에서는 생략)
- **예시**:
  - Builder: "xml-schema.md 수정 시 기존 Dispatcher-Receiver Mapping 섹션과 context-handoff 요소 정의 간 순서를 주의할 것"
  - Verifier: "context-policy.md의 파이프라인 단계별 입/출력 매트릭스를 scheduler.md 구현 시 참고해야 함"

### 4. `incomplete` (미완료 사항)
- **정의**: 완료하지 못했거나 보류 중인 항목
- **내용**: 부분 완료, 환경 제약, 향후 개선 사항, 차기 TASK로 미룬 사항
- **길이**: 1-2줄 (FULL only, SUMMARY에서는 생략)
- **예시**:
  - Builder: "없음 — context-policy.md와 xml-schema.md 모두 완료"
  - Verifier: "없음 — 모든 acceptance criteria 충족"

---

## 파이프라인 단계별 입/출력 매트릭스

### Builder (TASK 구현)

**입력:**
- TASK spec (`TASK-XX.md`)
- 의존 TASK의 result.md에서 context-handoff 섹션 추출 (슬라이딩 윈도우 적용)

**처리:**
- TASK 명세에 따라 파일 생성/수정
- 중간 진행상태를 `TASK-XX_progress.md`에 실시간 기록

**출력:**
```xml
<task-result status="PASS|FAIL">
  <context-handoff from="builder">
    <what>변경 사항 요약</what>
    <why>의사결정 근거</why>
    <caution>주의사항</caution>
    <incomplete>미완료 사항</incomplete>
  </context-handoff>
</task-result>
```

### Verifier (구현 검증)

**입력:**
- TASK spec (`TASK-XX.md`)
- Builder의 context-handoff (FULL)
- Builder의 context-handoff를 바탕으로 TASK spec과 대조

**처리:**
- Builder context-handoff의 what/caution/incomplete 활용하여 우선순위 검증
- Acceptance Criteria 확인
- Verify 명령 실행

**출력:**
```xml
<task-result status="PASS|FAIL">
  <context-handoff from="verifier">
    <what>검증 결과 요약</what>
    <why>pass/fail 판정 근거</why>
    <caution>조건부 통과, 수동 확인 필요 사항</caution>
    <incomplete>자동 검증 불가 항목</incomplete>
  </context-handoff>
</task-result>
```

### Committer (git 커밋 + result.md 작성)

**입력:**
- Verifier의 context-handoff (FULL)
- Builder의 context-handoff (SUMMARY로 변환)
- `TASK-XX_progress.md` (gate 역할: 존재/COMPLETED 확인)

**처리:**
1. Gate 역할: progress.md 확인
   - 파일 존재하는가?
   - Status = COMPLETED인가?
   - Files changed 목록 비어있지 않은가?
2. Gate 통과 시: result.md 작성 + git commit
3. Gate 실패 시: FAIL 반환 (scheduler의 재시도 트리거)

**출력:**
```markdown
# TASK-XX Result

## Status
SUCCESS | PARTIAL

## What
Builder와 Verifier의 context-handoff를 종합하여 무엇이 변경되었는지 기술

## Why
구현 의사결정 근거

## Caution
다음 TASK 또는 후속 작업 시 주의할 점

## Incomplete
미완료 사항

## Files Changed
- `path/to/file` (created|modified|deleted)

## Commit
{commit hash}: {message}
```

---

## TASK 간 의존성 전달 규칙

TASK-02가 TASK-01에 의존하는 경우:

1. **직전 의존 TASK (TASK-01)**: result.md의 context-handoff를 **FULL**로 전달
   - 4개 필드 모두 포함
   - Builder가 의사결정 시 필요한 모든 정보 제공

2. **2단계 전 의존 TASK (TASK-00)**: result.md의 context-handoff를 **SUMMARY**로 전달
   - what 필드만 1-3줄 요약
   - 전체 흐름 이해는 되나 상세한 판단은 불필요

3. **3단계 이상 전**: **DROP** (전달하지 않음)
   - 해당 TASK의 context-handoff를 생략
   - 의존성 체인이 길어질 수록 토큰 절감 효과 증대

### 예시

```
TASK-00 → TASK-01 → TASK-02 → TASK-03

TASK-03 builder 입력:
- TASK-02 context-handoff: FULL (직전)
- TASK-01 context-handoff: SUMMARY (2단계 전)
- TASK-00 context-handoff: DROP (3단계 전)
```

---

## Scheduler의 슬라이딩 윈도우 디스패치 로직

### 파이프라인 내 단계별 detail-level

Builder → Verifier → Committer 3단계 내에서:

```xml
<!-- Verifier 호출 시: Builder context-handoff = FULL -->
<dispatch to="verifier">
  <context-handoff from="builder" detail-level="FULL">...</context-handoff>
</dispatch>

<!-- Committer 호출 시 -->
<dispatch to="committer">
  <context-handoff from="verifier" detail-level="FULL">...</context-handoff>
  <context-handoff from="builder" detail-level="SUMMARY">...</context-handoff>
</dispatch>
```

### TASK 간 의존성 detail-level 적용

Scheduler가 다음 TASK의 builder에 의존 정보를 전달할 때:

```xml
<dispatch to="builder" work="{WORK_ID}" task="TASK-YY">
  <!-- TASK-02 result.md context-handoff: FULL (직전) -->
  <context-handoff from="prev-task" task="TASK-02" detail-level="FULL">...</context-handoff>

  <!-- TASK-01 result.md context-handoff: SUMMARY (2단계 전) -->
  <context-handoff from="prev-prev-task" task="TASK-01" detail-level="SUMMARY">...</context-handoff>

  <!-- TASK-00: DROP (3단계 이상) -->
</dispatch>
```

---

## Committer 재시도 로직 (scheduler 측면)

Committer가 FAIL을 반환하는 경우:

1. **실패 원인 분석:**
   - progress.md 미존재 → Builder 비정상 종료
   - progress.md Status ≠ COMPLETED → Builder 작업 미완료
   - Files changed 비어있음 → Builder 변경 없음

2. **재디스패치:**
   - 기존 progress.md를 Builder 입력에 포함
   - Builder가 progress.md에서 마지막 체크포인트 읽고 이어서 작업

3. **재시도 횟수:**
   - 최대 2회 재시도 (총 3회 시도)
   - 3회 실패 시 TASK를 FAILED로 마킹하고 파이프라인 중단

---

## 주의사항

1. **Context-handoff는 선택 사항이 아님** — 모든 에이전트가 4-필드 구조로 출력해야 함
2. **Incomplete = 안 함이 아님** — 의존 에이전트가 어디서 시작해야 할지 알 수 있어야 함
3. **SUMMARY는 최소한 무엇이 변경되었는지만** — why/caution/incomplete는 생략
4. **DROP은 철저히** — 3단계 이상 전의 정보를 굳이 남겨두면 토큰 낭비
5. **progress.md는 중간 체크포인트** — Builder 재시도 시 신뢰성 극대화
