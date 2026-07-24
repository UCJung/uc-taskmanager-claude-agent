# Context Handoff 정책

에이전트 간 슬라이딩 윈도우 컨텍스트 전달 규칙.

---

## 섹션 소비 매트릭스

orchestrator가 자식 spawn 시 `<ref-cache>`에 담을 섹션을 결정하는 기준표 → `xml-schema.md` § 4.

| § | 내용 | orch | spec | plan | build | verif |
|---|------|:----:|:----:|:----:|:-----:|:-----:|
| 1 | 슬라이딩 윈도우 | ✅ | | | ✅ | ✅ |
| 2 | Context-Handoff 4개 필드 | ✅ | | | ✅ | ✅ |
| 3 | 파이프라인 단계별 입출력 | | | | ✅ | ✅ |
| 4 | TASK 간 의존성 전달 | ✅ | | | ✅ | |
| 5 | Orchestrator 디스패치 | ✅ | | | | |
| 6 | 재시도 | ✅ | | | | |

---

## § 1. 슬라이딩 윈도우

| 단계 거리 | 상세 레벨 | 규칙 |
|-----------|----------|------|
| 직전 (1단계) | `FULL` | 4개 필드 모두 전달 |
| 2단계 전 | `SUMMARY` | `what` 필드만, 1-3줄 |
| 3단계+ | `DROP` | 생략 |

## § 2. Context-Handoff 4개 필드

| 필드 | FULL | SUMMARY | 내용 |
|------|:----:|:-------:|------|
| `what` | ✅ | ✅ | 변경/검증 요약 (2-5줄) |
| `why` | ✅ | ❌ | 결정 근거 (2-4줄) |
| `caution` | ✅ | ❌ | 주의사항, 조건부 완료 (1-3줄) |
| `incomplete` | ✅ | ❌ | 미완료 항목 (1-2줄, 없으면 "None") |

## § 3. 파이프라인 단계별 입출력

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

### 인라인 커밋 (orchestrator)

입력: Verifier context-handoff (FULL) + Builder context-handoff (SUMMARY) — 별도 자식 spawn 없이 orchestrator가 직접 사용

처리:
1. builder 성공 여부 확인 (context-handoff 상태 확인)
2. result.md 작성 + git commit

출력: `works/{WORK_ID}/TASK-XX_result.md` + git commit + 활동 로그 `STAGE_DONE — stage=commit`

## § 4. TASK 간 의존성 전달

- 직전 의존 TASK: context-handoff **FULL** (4개 필드 모두)
- 2단계 전: **SUMMARY** (what만)
- 3단계+: **DROP**

## § 5. Orchestrator 디스패치

TASK DAG 실행 중 다음 자식(중첩 spawn)의 프롬프트를 구성하는 주체는 **orchestrator**다 — dispatch XML을 만들어 자식 spawn 프롬프트에 포함한다.

```xml
<!-- Verifier: Builder FULL -->
<dispatch to="verifier">
  <context-handoff from="builder" detail-level="FULL">...</context-handoff>
</dispatch>

<!-- 인라인 커밋: orchestrator가 verifier FULL + builder SUMMARY를 직접 사용 (별도 dispatch 없음) -->

<!-- 다음 TASK Builder: 의존성 거리 적용 -->
<dispatch to="builder" task="TASK-YY">
  <previous-results>
    <context-handoff from="prev-task" task="TASK-XX" detail-level="FULL">...</context-handoff>
    <context-handoff from="prev-prev-task" task="TASK-WW" detail-level="SUMMARY"><what>...</what></context-handoff>
  </previous-results>
</dispatch>
```

## § 6. 재시도

1. 실패 원인: verifier FAIL / 변경 파일 없음
2. builder에 재디스패치
3. 최대 2회 재시도 (총 3회 시도). 3회 실패 → TASK FAILED, `<needs-decision>`으로 orchestrator에 상향(자식이 직접 파이프라인을 중단하지 않음)
