# WORK-07-TASK-05: 통합 검증 — 전체 파이프라인 흐름 일관성 확인

## WORK
WORK-07: 슬라이딩 윈도우 컨텍스트 전달 — result.md 재설계 및 파이프라인 안정성 강화

## Dependencies
- WORK-07-TASK-01 (required): scheduler.md 슬라이딩 윈도우 + 재시도 로직
- WORK-07-TASK-02 (required): builder.md progress.md 체크포인트 규칙
- WORK-07-TASK-03 (required): committer.md result.md 작성 + gate 역할
- WORK-07-TASK-04 (required): verifier.md context-handoff 기반 검증

## Scope

TASK-01~04에서 각각 수정한 에이전트 파일들이 전체적으로 일관되게 동작하는지 검증한다. 코드 구현이 아니라 문서 수준의 일관성 검증이다.

### 검증 항목

**1. context-handoff 흐름 일관성:**
- builder가 출력하는 context-handoff → verifier가 입력으로 참조하는 context-handoff가 일치하는가
- verifier가 출력하는 context-handoff → committer가 입력으로 참조하는 context-handoff가 일치하는가
- xml-schema.md의 context-handoff 정의와 각 에이전트의 사용이 일치하는가

**2. 슬라이딩 윈도우 적용 일관성:**
- scheduler.md의 윈도우 규칙(FULL/SUMMARY/DROP)이 context-policy.md와 일치하는가
- TASK 간 의존성 전달의 detail-level이 정책과 일치하는가

**3. result.md 작성 주체 일관성:**
- builder.md에서 result.md 작성 관련 지시사항이 완전히 제거되었는가
- committer.md에서 result.md 작성 로직이 올바르게 정의되었는가
- result.md의 What/Why/Caution/Incomplete 구조가 context-handoff와 일치하는가

**4. progress.md 체크포인트 흐름:**
- builder.md의 progress.md 작성 규칙이 명시되어 있는가
- committer.md의 gate 역할이 progress.md를 올바르게 참조하는가
- scheduler.md의 재시도 로직이 progress.md 기반 재개를 지원하는가

**5. 누락/모순 검출:**
- 에이전트 간 참조가 순환하지 않는가
- context-policy.md의 정의 중 어느 에이전트에도 구현되지 않은 항목이 없는가

### 불일치 발견 시 조치
- 불일치 사항을 목록으로 정리한다
- 해당 에이전트 파일을 직접 수정하여 일관성을 확보한다
- 수정 사항을 context-policy.md에도 반영한다

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/context-policy.md` | READ/MODIFY | 정책 문서 기준으로 일관성 검증, 필요 시 수정 |
| `agents/xml-schema.md` | READ/MODIFY | 스키마 정의와 실제 사용 일치 확인, 필요 시 수정 |
| `agents/scheduler.md` | READ/MODIFY | 슬라이딩 윈도우/재시도 로직 일관성 확인, 필요 시 수정 |
| `agents/builder.md` | READ/MODIFY | progress.md/context-handoff 규칙 일관성 확인, 필요 시 수정 |
| `agents/verifier.md` | READ/MODIFY | context-handoff 입출력 일관성 확인, 필요 시 수정 |
| `agents/committer.md` | READ/MODIFY | result.md 작성/gate 역할 일관성 확인, 필요 시 수정 |

## Acceptance Criteria
- [ ] builder → verifier → committer 간 context-handoff 흐름이 일관됨
- [ ] 슬라이딩 윈도우 규칙이 context-policy.md와 모든 에이전트에서 동일하게 적용됨
- [ ] result.md 작성 주체가 committer로 통일됨 (builder에 잔존 지시 없음)
- [ ] progress.md 흐름이 builder(작성) → committer(gate 확인) → scheduler(재시도 참조)로 일관됨
- [ ] xml-schema.md의 context-handoff 정의가 모든 에이전트에서 올바르게 사용됨
- [ ] 불일치 사항이 있을 경우 수정 완료됨

## Verify
```bash
# 1. context-handoff가 모든 에이전트에 존재하는지 확인
for f in scheduler builder verifier committer; do
  grep -q "context-handoff" agents/${f}.md && echo "PASS: ${f}.md has context-handoff" || echo "FAIL: ${f}.md missing context-handoff"
done

# 2. builder에서 result.md 작성 지시 제거 확인
grep -qi "result.md.*작성\|result.md.*생성\|write.*result.md\|create.*result.md" agents/builder.md && echo "FAIL: builder still writes result.md" || echo "PASS: builder result.md writing removed"

# 3. committer에서 result.md 작성 확인
grep -qi "result.md" agents/committer.md && echo "PASS: committer writes result.md" || echo "FAIL"

# 4. progress.md가 builder + committer + scheduler에서 참조되는지 확인
for f in builder committer scheduler; do
  grep -qi "progress.md" agents/${f}.md && echo "PASS: ${f}.md references progress.md" || echo "FAIL: ${f}.md missing progress.md reference"
done

# 5. 슬라이딩 윈도우 레벨이 scheduler + context-policy에 정의되어 있는지 확인
for f in scheduler context-policy; do
  grep -q "FULL" agents/${f}.md && grep -q "SUMMARY" agents/${f}.md && echo "PASS: ${f}.md has window levels" || echo "FAIL: ${f}.md missing window levels"
done

# 6. xml-schema.md에 context-handoff 정의 존재 확인
grep -q "context-handoff" agents/xml-schema.md && echo "PASS: xml-schema has context-handoff" || echo "FAIL"
grep -q "detail-level" agents/xml-schema.md && echo "PASS: xml-schema has detail-level" || echo "FAIL"
```
