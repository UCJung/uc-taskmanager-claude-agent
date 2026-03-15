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
| `what` | O | O | 변경/검증 사항 요약 (2-5줄) |
| `why` | O | - | 의사결정 근거 (2-4줄) |
| `caution` | O | - | 주의사항, 조건부 완료 (1-3줄) |
| `incomplete` | O | - | 미완료 사항 (1-2줄, 없으면 "None") |

## 파이프라인 단계별 입/출력

| 에이전트 | 입력 | 출력 |
|---------|------|------|
| Builder | TASK spec + 의존 TASK result.md context-handoff (윈도우 적용) | context-handoff FULL |
| Verifier | TASK spec + Builder context-handoff (FULL) | context-handoff FULL |
| Committer | Verifier FULL + Builder SUMMARY + progress.md (gate) | result.md + git commit |

Committer gate: progress.md 존재 + Status=COMPLETED + Files changed 비어있지 않음
- Gate 실패 시 builder 재디스패치, 최대 2회 재시도 (총 3회). 3회 실패 시 TASK FAILED

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
```

## TASK 간 의존성 전달

의존 TASK 거리에 따라 슬라이딩 윈도우 적용:
- 직전 의존 TASK: context-handoff **FULL**
- 2단계 전: **SUMMARY** (what만)
- 3단계 이상: **DROP**
