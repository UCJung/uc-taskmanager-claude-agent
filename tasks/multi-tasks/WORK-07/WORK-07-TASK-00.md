# WORK-07-TASK-00: context-handoff 정책 문서 + xml-schema.md 수정

## WORK
WORK-07: 슬라이딩 윈도우 컨텍스트 전달 — result.md 재설계 및 파이프라인 안정성 강화

## Dependencies
- (none)

## Scope

슬라이딩 윈도우 컨텍스트 전달의 기반이 되는 정책 문서를 신규 생성하고, xml-schema.md에 context-handoff 관련 요소를 추가한다.

### 1. context-policy.md 신규 생성

`agents/context-policy.md`에 다음 내용을 정의한다:

**슬라이딩 윈도우 원칙:**
- 직전 단계 결과: `FULL` (원본 그대로 전달)
- 2단계 전 결과: `SUMMARY` (what + status만, 1-3줄)
- 3단계 이상 전: `DROP` (전달하지 않음)

**context-handoff 4-필드 구조:**
- `what`: 무엇을 했는가 (변경 사항 요약)
- `why`: 왜 그렇게 했는가 (의사결정 근거)
- `caution`: 다음 에이전트가 주의할 점
- `incomplete`: 미완료/보류 사항

**파이프라인 단계별 입/출력 매트릭스:**
- builder 입력: TASK spec + 의존 TASK의 context-handoff(윈도우 적용)
- builder 출력: context-handoff(what/why/caution/incomplete) → verifier로
- verifier 입력: builder의 FULL context-handoff + TASK spec
- verifier 출력: 검증 결과 context-handoff → committer로
- committer 입력: verifier FULL + builder SUMMARY + progress.md
- committer 출력: result.md (context-handoff 구조 포함)

**TASK 간 의존성 전달 규칙:**
- 의존하는 TASK의 result.md에서 context-handoff 섹션을 추출
- 슬라이딩 윈도우 규칙에 따라 detail-level 적용

### 2. xml-schema.md 수정

기존 xml-schema.md에 다음을 추가한다:

**context-handoff 요소:**
```xml
<context-handoff from="{agent}" detail-level="{FULL|SUMMARY|DROP}">
  <what>{변경 사항 요약}</what>
  <why>{의사결정 근거}</why>
  <caution>{주의사항}</caution>
  <incomplete>{미완료 사항}</incomplete>
</context-handoff>
```

**detail-level 속성:**
- `FULL`: 4개 필드 모두 포함
- `SUMMARY`: what 필드만 1-2줄로 요약
- `DROP`: 요소 자체를 생략

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/context-policy.md` | CREATE | 슬라이딩 윈도우 컨텍스트 전달 정책 문서 |
| `agents/xml-schema.md` | MODIFY | context-handoff 요소 및 detail-level 속성 추가 |

## Acceptance Criteria
- [ ] `agents/context-policy.md` 파일이 존재한다
- [ ] 슬라이딩 윈도우 원칙(FULL/SUMMARY/DROP)이 정의되어 있다
- [ ] context-handoff 4-필드(what/why/caution/incomplete)가 정의되어 있다
- [ ] 파이프라인 단계별 입/출력 매트릭스가 정리되어 있다
- [ ] TASK 간 의존성 전달 규칙이 명시되어 있다
- [ ] xml-schema.md에 context-handoff 요소가 추가되어 있다
- [ ] xml-schema.md에 detail-level 속성(FULL/SUMMARY/DROP)이 정의되어 있다

## Verify
```bash
# context-policy.md 존재 확인
test -f agents/context-policy.md && echo "PASS: context-policy.md exists" || echo "FAIL"

# 슬라이딩 윈도우 정의 확인
grep -c "FULL\|SUMMARY\|DROP" agents/context-policy.md | xargs -I{} test {} -ge 3 && echo "PASS: sliding window levels defined" || echo "FAIL"

# 4-필드 구조 확인
for field in what why caution incomplete; do
  grep -q "$field" agents/context-policy.md && echo "PASS: $field field defined" || echo "FAIL: $field missing"
done

# xml-schema.md에 context-handoff 요소 확인
grep -q "context-handoff" agents/xml-schema.md && echo "PASS: context-handoff in xml-schema" || echo "FAIL"
grep -q "detail-level" agents/xml-schema.md && echo "PASS: detail-level in xml-schema" || echo "FAIL"
```
