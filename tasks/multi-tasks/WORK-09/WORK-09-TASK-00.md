# WORK-09-TASK-00: shared-prompt-sections.md에 Task Callbacks 섹션 추가

## WORK
WORK-09: CLAUDE.md 콜백 URL 기반 외부 시스템 결과 전달

## Dependencies
- (없음)

## Scope

`agents/shared-prompt-sections.md`에 "Task Callbacks" 섹션을 추가한다. 이 섹션은 CLAUDE.md에서 콜백 설정을 읽는 방법과 설정 형식을 정의한다.

### CLAUDE.md 콜백 설정 형식

```markdown
## Task Callbacks
TaskCallback: http://localhost:3000/api/v1/runner/{{executionId}}/task-result
ProgressCallback: http://localhost:3000/api/v1/runner/{{executionId}}/task-progress
CallbackToken: <token>
```

### shared-prompt-sections.md에 추가할 내용

1. **설정 읽기 방법**: CLAUDE.md에서 `TaskCallback`, `ProgressCallback`, `CallbackToken` 값을 grep으로 추출하는 bash 스니펫
2. **조건부 실행 패턴**: URL이 존재할 때만 curl을 호출하는 가드 패턴
3. **에러 처리 원칙**: curl 실패 시 경고만 출력, 본 작업은 중단하지 않음
4. **공통 curl 호출 템플릿**: Authorization 헤더 포함한 POST 요청 템플릿

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/shared-prompt-sections.md` | MODIFY | Task Callbacks 섹션 추가 — 콜백 설정 읽기 가이드 및 curl 호출 템플릿 |

## Acceptance Criteria
- [ ] `agents/shared-prompt-sections.md`에 "Task Callbacks" 섹션이 추가됨
- [ ] `TaskCallback`, `ProgressCallback`, `CallbackToken` 설정 형식이 문서화됨
- [ ] CLAUDE.md에서 콜백 URL을 grep으로 추출하는 bash 스니펫이 포함됨
- [ ] 조건부 실행 가드 패턴(URL 존재 여부 확인)이 포함됨
- [ ] curl 실패 시 경고만 출력하는 에러 처리 원칙이 명시됨
- [ ] Authorization 헤더 포함한 공통 curl POST 템플릿이 포함됨

## Verify
```bash
# Task Callbacks 섹션 존재 확인
grep -c "Task Callbacks" agents/shared-prompt-sections.md | xargs -I{} test {} -ge 1 && echo "PASS: Task Callbacks section exists" || echo "FAIL"

# 핵심 키워드 존재 확인
grep "TaskCallback" agents/shared-prompt-sections.md && echo "PASS: TaskCallback documented" || echo "FAIL"
grep "ProgressCallback" agents/shared-prompt-sections.md && echo "PASS: ProgressCallback documented" || echo "FAIL"
grep "CallbackToken" agents/shared-prompt-sections.md && echo "PASS: CallbackToken documented" || echo "FAIL"

# curl 템플릿 존재 확인
grep "curl" agents/shared-prompt-sections.md && echo "PASS: curl template exists" || echo "FAIL"
```
