# Context Handoff 정책

에이전트 간 슬라이딩 윈도우 컨텍스트 전달 규칙.

## 슬라이딩 윈도우

| 단계 거리 | 상세 레벨 | 규칙 |
|-----------|----------|------|
| 직전 (1단계) | `FULL` | 4개 필드 모두 전달 |
| 2단계 전 | `SUMMARY` | `what` 필드만, 1-3줄 |
| 3단계+ | `DROP` | 생략 |

## Context-Handoff 4개 필드

| 필드 | FULL | SUMMARY | 내용 |
|------|:----:|:-------:|------|
| `what` | ✅ | ✅ | 변경/검증 요약 (2-5줄) |
| `why` | ✅ | ❌ | 결정 근거 (2-4줄) |
| `caution` | ✅ | ❌ | 주의사항, 조건부 완료 (1-3줄) |
| `incomplete` | ✅ | ❌ | 미완료 항목 (1-2줄, 없으면 "None") |

## 파이프라인 단계별 입출력

### Builder

입력: TASK 스펙 + 의존 TASK result.md context-handoff (슬라이딩 윈도우)

출력:
```xml
<task-result status="PASS|FAIL">
  <context-handoff from="builder" detail-level="FULL">
    <what>변경 내용</what><why>근거</why><caution>주의사항</caution><incomplete>미완료 항목</incomplete>
  </context-handoff>
</task-result>
```

### Verifier

입력: TASK 스펙 + Builder context-handoff (FULL)

출력:
```xml
<task-result status="PASS|FAIL">
  <context-handoff from="verifier" detail-level="FULL">
    <what>검증 결과</what><why>판단 근거</why><caution>수동 확인 필요 항목</caution><incomplete>검증할 수 없었던 항목</incomplete>
  </context-handoff>
</task-result>
```

### Committer

입력: Verifier context-handoff (FULL) + Builder context-handoff (SUMMARY)

처리:
1. builder 성공 여부 확인 (context-handoff 상태 확인)
2. result.md 작성 + git commit

출력: → `{REFERENCES_DIR}/file-content-schema.md` § 3 참조

## TASK 간 의존성 전달

- 직전 의존 TASK: context-handoff **FULL** (4개 필드 모두)
- 2단계 전: **SUMMARY** (what만)
- 3단계+: **DROP**

## Orchestrator 디스패치

TASK DAG 실행 중 다음 자식(중첩 spawn)의 프롬프트를 구성하는 주체는 **orchestrator**다 — dispatch XML을 만들어 자식 spawn 프롬프트에 포함한다.

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

1. 실패 원인: 검증 FAIL / 변경 파일 없음
2. builder에 재디스패치
3. 최대 2회 재시도 (총 3회 시도). 3회 실패 → TASK FAILED, 파이프라인 중단
