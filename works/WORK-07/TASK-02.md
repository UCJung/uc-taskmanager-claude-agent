# WORK-07-TASK-02: builder.md progress.md 실시간 체크포인트 규칙

## WORK
WORK-07: 슬라이딩 윈도우 컨텍스트 전달 — result.md 재설계 및 파이프라인 안정성 강화

## Dependencies
- WORK-07-TASK-00 (required): context-handoff 정책 및 4-필드 구조 정의 필요

## Scope

builder.md에서 2가지 주요 변경을 수행한다.

### 1. result.md 작성 책임 제거

기존에 builder가 작성하던 result.md 생성 로직을 제거한다. result.md는 이제 committer가 작성한다.

**제거 대상:**
- builder.md 내 result.md 작성 관련 섹션/지시사항
- result.md 템플릿 또는 포맷 정의

### 2. progress.md 실시간 체크포인트 규칙 추가

builder가 작업 중간 진행상태를 `tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX-progress.md`에 실시간 기록하는 규칙을 추가한다.

**체크포인트 기록 시점:**
- 작업 시작 시: status=STARTED, 시작 시각 기록
- 주요 파일 생성/수정 완료 시: 변경된 파일 목록 업데이트
- 작업 완료 시: status=COMPLETED, 종료 시각 기록

**progress.md 포맷:**
```markdown
# {WORK_ID}-TASK-XX Progress

- Status: {STARTED|IN_PROGRESS|COMPLETED}
- Started: {timestamp}
- Updated: {timestamp}
- Files changed:
  - `path/to/file` — {action: CREATE|MODIFY|DELETE}
```

### 3. context-handoff 출력 규칙 추가

builder의 XML 응답에 context-handoff 4-필드를 포함하도록 출력 규칙을 추가한다:

```xml
<task-result status="success">
  <context-handoff from="builder">
    <what>{변경 사항 요약}</what>
    <why>{의사결정 근거}</why>
    <caution>{주의사항}</caution>
    <incomplete>{미완료 사항}</incomplete>
  </context-handoff>
</task-result>
```

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/builder.md` | MODIFY | result.md 작성 제거, progress.md 체크포인트 규칙 추가, context-handoff 출력 규칙 추가 |

## Acceptance Criteria
- [ ] builder.md에서 result.md 작성 관련 지시사항이 제거됨
- [ ] progress.md 체크포인트 기록 규칙이 명시됨 (시작/중간/완료)
- [ ] progress.md 파일 경로 규칙이 명시됨
- [ ] progress.md 포맷(Status/Started/Updated/Files changed)이 정의됨
- [ ] context-handoff 4-필드 출력 규칙이 XML 응답에 포함됨
- [ ] 기존 빌드 기능(코드 구현, 테스트 실행 등)이 보존됨

## Verify
```bash
# result.md 작성 제거 확인 (result.md 생성 지시가 없어야 함)
# 주의: "result" 단어 자체가 아닌 "result.md를 작성/생성" 패턴을 확인
grep -qi "result.md.*작성\|result.md.*생성\|write.*result.md\|create.*result.md" agents/builder.md && echo "FAIL: result.md writing still exists" || echo "PASS: result.md writing removed"

# progress.md 체크포인트 규칙 확인
grep -qi "progress.md\|체크포인트\|checkpoint" agents/builder.md && echo "PASS: progress.md rules added" || echo "FAIL"
grep -qi "STARTED\|IN_PROGRESS\|COMPLETED" agents/builder.md && echo "PASS: status values defined" || echo "FAIL"

# context-handoff 출력 규칙 확인
grep -q "context-handoff" agents/builder.md && echo "PASS: context-handoff in builder" || echo "FAIL"
for field in what why caution incomplete; do
  grep -q "$field" agents/builder.md && echo "PASS: $field in builder" || echo "FAIL: $field missing"
done
```
