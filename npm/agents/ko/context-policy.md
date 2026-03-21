# Context Handoff Policy

에이전트 간 슬라이딩 윈도우 컨텍스트 전달 규칙.

## 슬라이딩 윈도우

| 단계 거리 | Detail Level | 규칙 |
|---------|-------------|------|
| 직전 (1단계) | `FULL` | 4개 필드 모두 전달 |
| 2단계 전 | `SUMMARY` | `what` 필드만 1-3줄 |
| 3단계 이상 | `DROP` | 생략 |

## Context-Handoff 4-필드

| 필드 | FULL | SUMMARY | 내용 |
|------|:----:|:-------:|------|
| `what` | ✅ | ✅ | 변경/검증 사항 요약 (2-5줄) |
| `why` | ✅ | ❌ | 의사결정 근거 (2-4줄) |
| `caution` | ✅ | ❌ | 주의사항, 조건부 완료 (1-3줄) |
| `incomplete` | ✅ | ❌ | 미완료 사항 (1-2줄, 없으면 "None") |

## 파이프라인 단계별 입/출력

### Builder

입력: TASK spec + 의존 TASK result.md context-handoff (슬라이딩 윈도우)

출력:
```xml
<task-result status="PASS|FAIL">
  <context-handoff from="builder" detail-level="FULL">
    <what>변경 사항</what><why>근거</why><caution>주의</caution><incomplete>미완료</incomplete>
  </context-handoff>
</task-result>
```

### Verifier

입력: TASK spec + Builder context-handoff (FULL)

출력:
```xml
<task-result status="PASS|FAIL">
  <context-handoff from="verifier" detail-level="FULL">
    <what>검증 결과</what><why>판정 근거</why><caution>수동 확인</caution><incomplete>검증 불가 항목</incomplete>
  </context-handoff>
</task-result>
```

### Committer

입력: Verifier context-handoff (FULL) + Builder context-handoff (SUMMARY) + progress.md (gate)

처리:
1. progress.md gate: 존재 + Status=COMPLETED + Files changed 비어있지 않음
2. Gate 통과 → result.md 작성 + git commit
3. Gate 실패 → FAIL 반환 (scheduler 재시도 트리거)

출력: → `{REFERENCES_DIR}/file-content-schema.md` § 4 참조

## TASK 간 의존성 전달

- 직전 의존 TASK: context-handoff **FULL** (4개 필드)
- 2단계 전: **SUMMARY** (what만)
- 3단계 이상: **DROP**

## Scheduler 디스패치

```xml
<!-- Verifier: Builder FULL -->
<dispatch to="verifier">
  <context-handoff from="builder" detail-level="FULL">...</context-handoff>
</dispatch>

<!-- Committer: Verifier FULL + Builder SUMMARY -->
<dispatch to="committer">
  <context-handoff from="verifier" detail-level="FULL">...</context-handoff>
  <context-handoff from="builder" detail-level="SUMMARY"><what>...</what></context-handoff>
</dispatch>

<!-- 다음 TASK Builder: 의존성 거리 적용 -->
<dispatch to="builder" task="TASK-YY">
  <previous-results>
    <context-handoff from="prev-task" task="TASK-XX" detail-level="FULL">...</context-handoff>
    <context-handoff from="prev-prev-task" task="TASK-WW" detail-level="SUMMARY"><what>...</what></context-handoff>
  </previous-results>
</dispatch>
```

## Committer 재시도

1. 실패 원인: progress.md 미존재 / Status≠COMPLETED / Files changed 없음
2. 기존 progress.md 포함하여 builder 재디스패치
3. 최대 2회 재시도 (총 3회). 3회 실패 → TASK FAILED, 파이프라인 중단
