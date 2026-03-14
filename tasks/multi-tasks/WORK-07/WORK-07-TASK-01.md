# WORK-07-TASK-01: scheduler.md 슬라이딩 윈도우 + TASK 간 의존성 전달 + 재시도 로직

## WORK
WORK-07: 슬라이딩 윈도우 컨텍스트 전달 — result.md 재설계 및 파이프라인 안정성 강화

## Dependencies
- WORK-07-TASK-00 (required): context-handoff 정책 및 xml-schema.md 정의 필요

## Scope

scheduler.md에 3가지 주요 로직을 추가한다.

### 1. 슬라이딩 윈도우 디스패치 로직

scheduler가 builder/verifier/committer를 호출할 때, 이전 단계 결과를 슬라이딩 윈도우 규칙에 따라 전달한다:

**파이프라인 내 윈도우 (builder → verifier → committer):**
- verifier 호출 시: builder context-handoff = FULL
- committer 호출 시: verifier context-handoff = FULL, builder context-handoff = SUMMARY

**디스패치 XML에 detail-level 속성 적용:**
```xml
<dispatch to="committer" work="{WORK_ID}" task="{TASK_ID}">
  <context-handoff from="verifier" detail-level="FULL">...</context-handoff>
  <context-handoff from="builder" detail-level="SUMMARY">...</context-handoff>
</dispatch>
```

### 2. TASK 간 의존성 context-handoff 전달

TASK-02가 TASK-01에 의존하는 경우, TASK-01의 result.md에서 context-handoff를 추출하여 TASK-02의 builder에게 전달한다:

- 직전 의존 TASK: FULL
- 2단계 전 의존 TASK: SUMMARY
- 3단계 이상 전: DROP

### 3. committer FAIL 시 재시도 로직

committer가 FAIL을 반환한 경우(progress.md 미존재/미완료 등):
1. scheduler가 해당 TASK의 builder를 재디스패치한다
2. 재디스패치 시 기존 progress.md를 전달하여 builder가 이어서 작업할 수 있게 한다
3. 최대 재시도 횟수를 정의한다 (예: 2회)
4. 재시도 초과 시 TASK를 FAILED로 마킹하고 사용자에게 보고한다

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/scheduler.md` | MODIFY | 슬라이딩 윈도우 디스패치, TASK 간 의존성 전달, 재시도 로직 추가 |

## Acceptance Criteria
- [ ] 슬라이딩 윈도우 규칙(FULL/SUMMARY/DROP)이 디스패치 섹션에 명시됨
- [ ] 파이프라인 내 단계별 detail-level이 정의됨 (verifier←builder:FULL, committer←verifier:FULL, committer←builder:SUMMARY)
- [ ] TASK 간 의존성 context-handoff 전달 규칙이 명시됨
- [ ] committer FAIL 시 builder 재디스패치 로직이 명시됨
- [ ] progress.md 기반 재개(resume) 지시사항이 재디스패치에 포함됨
- [ ] 최대 재시도 횟수와 FAILED 마킹 규칙이 명시됨
- [ ] 기존 기능(DAG Resolution, WORK Identification, Progress File 관리)이 보존됨

## Verify
```bash
# 슬라이딩 윈도우 규칙 확인
grep -q "FULL\|SUMMARY\|DROP" agents/scheduler.md && echo "PASS: sliding window levels in scheduler" || echo "FAIL"
grep -q "detail-level" agents/scheduler.md && echo "PASS: detail-level in scheduler" || echo "FAIL"

# context-handoff 전달 확인
grep -q "context-handoff" agents/scheduler.md && echo "PASS: context-handoff in scheduler" || echo "FAIL"

# 재시도 로직 확인
grep -qi "retry\|재시도\|재디스패치" agents/scheduler.md && echo "PASS: retry logic in scheduler" || echo "FAIL"
grep -qi "progress.md" agents/scheduler.md && echo "PASS: progress.md referenced in scheduler" || echo "FAIL"

# 기존 핵심 섹션 보존 확인
grep -q "DAG Resolution" agents/scheduler.md && echo "PASS: DAG Resolution preserved" || echo "FAIL"
grep -q "WORK Identification" agents/scheduler.md && echo "PASS: WORK Identification preserved" || echo "FAIL"
```
