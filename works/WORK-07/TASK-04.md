# WORK-07-TASK-04: verifier.md context-handoff 기반 검증 규칙

## WORK
WORK-07: 슬라이딩 윈도우 컨텍스트 전달 — result.md 재설계 및 파이프라인 안정성 강화

## Dependencies
- WORK-07-TASK-00 (required): context-handoff 정책 및 4-필드 구조 정의 필요

## Scope

verifier.md에 2가지 주요 변경을 수행한다.

### 1. builder context-handoff 기반 검증

verifier는 builder의 context-handoff를 활용하여 더 효과적으로 검증한다:

**활용 방법:**
- `what` 필드: 실제 변경된 내용과 TASK spec의 Acceptance Criteria를 대조
- `caution` 필드: builder가 우려한 부분을 우선적으로 검증
- `incomplete` 필드: 미완료 사항이 TASK의 필수 요구사항에 해당하는지 확인

**검증 시 context-handoff 참조 순서:**
1. TASK spec의 Acceptance Criteria (최우선)
2. builder context-handoff의 what/caution/incomplete
3. Verify 명령 실행 결과

### 2. verifier context-handoff 출력

verifier도 자신의 context-handoff를 XML 응답에 포함하여 committer에게 전달한다:

```xml
<task-result status="pass">
  <context-handoff from="verifier">
    <what>{검증 결과 요약 — 통과/실패 항목}</what>
    <why>{검증 판단 근거 — 왜 pass/fail로 판정했는지}</why>
    <caution>{committer가 주의할 점 — 조건부 통과 사항 등}</caution>
    <incomplete>{검증하지 못한 항목 — 수동 확인 필요 사항}</incomplete>
  </context-handoff>
</task-result>
```

**verifier context-handoff 작성 규칙:**
- `what`: 검증 명령 실행 결과와 Acceptance Criteria 충족 여부
- `why`: pass/fail 판정의 구체적 근거
- `caution`: 자동 검증으로 확인 불가한 사항, 조건부 통과 항목
- `incomplete`: 환경 문제 등으로 실행하지 못한 검증 항목

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/verifier.md` | MODIFY | builder context-handoff 기반 검증 규칙 추가, verifier context-handoff 출력 규칙 추가 |

## Acceptance Criteria
- [ ] builder context-handoff의 what/caution/incomplete 활용 규칙이 명시됨
- [ ] 검증 시 context-handoff 참조 순서가 정의됨
- [ ] verifier의 context-handoff 출력 규칙이 XML 응답에 포함됨
- [ ] verifier context-handoff 4-필드(what/why/caution/incomplete) 작성 규칙이 명시됨
- [ ] 기존 검증 기능(Verify 명령 실행, Acceptance Criteria 확인)이 보존됨

## Verify
```bash
# context-handoff 기반 검증 규칙 확인
grep -q "context-handoff" agents/verifier.md && echo "PASS: context-handoff in verifier" || echo "FAIL"

# builder context-handoff 참조 확인
grep -qi "builder.*context-handoff\|builder.*handoff" agents/verifier.md && echo "PASS: builder handoff referenced" || echo "FAIL"

# verifier context-handoff 출력 확인
grep -qi "from=\"verifier\"\|from=.verifier" agents/verifier.md && echo "PASS: verifier handoff output defined" || echo "FAIL"

# 4-필드 확인
for field in what why caution incomplete; do
  grep -q "$field" agents/verifier.md && echo "PASS: $field in verifier" || echo "FAIL: $field missing"
done

# 기존 기능 보존 확인
grep -qi "Acceptance Criteria\|acceptance criteria" agents/verifier.md && echo "PASS: AC check preserved" || echo "FAIL"
grep -qi "Verify\|verify" agents/verifier.md && echo "PASS: verify commands preserved" || echo "FAIL"
```
