# WORK-09-TASK-02: builder.md ProgressCallback 조건부 curl 호출 추가

## WORK
WORK-09: CLAUDE.md 콜백 URL 기반 외부 시스템 결과 전달

## Dependencies
- WORK-09-TASK-00 (required)

## Scope

builder.md에 ProgressCallback 조건부 curl 호출 로직을 추가한다. progress.md 체크포인트 업데이트 후, CLAUDE.md에서 ProgressCallback URL이 존재하면 진행 상태를 HTTP POST로 전송한다.

### 추가할 워크플로우

1. **CLAUDE.md에서 설정 읽기**: shared-prompt-sections.md의 Task Callbacks 가이드에 따라 `ProgressCallback` URL과 `CallbackToken`을 추출
2. **조건부 curl 호출**: URL이 존재할 때만 아래 페이로드를 POST 전송
3. **에러 처리**: curl 실패 시 경고만 출력하고 구현 작업은 계속 진행

### ProgressCallback 페이로드 스키마

```json
{
  "workId": "WORK-XX",
  "taskId": "WORK-XX-TASK-NN",
  "status": "IN_PROGRESS|COMPLETED|FAILED",
  "checklist": [
    {"item": "파일 분석 완료", "done": true},
    {"item": "핵심 로직 구현", "done": true},
    {"item": "테스트 작성", "done": false}
  ],
  "currentReasoning": "현재까지 작업 내용 요약"
}
```

### 핵심 원칙
- curl 호출은 **progress 체크포인트 업데이트 후**에 실행
- curl 실패해도 builder의 구현 작업은 중단하지 않음
- `CallbackToken`이 있으면 `Authorization: Bearer <token>` 헤더 추가
- 체크포인트마다 호출하므로 여러 번 호출될 수 있음

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/builder.md` | MODIFY | progress 체크포인트 업데이트 후 ProgressCallback 조건부 curl 호출 섹션 추가 |

## Acceptance Criteria
- [ ] builder.md에 CLAUDE.md에서 ProgressCallback URL 읽기 로직이 추가됨
- [ ] ProgressCallback URL이 존재할 때만 curl POST를 호출하는 조건부 로직이 추가됨
- [ ] 페이로드에 workId, taskId, status, checklist, currentReasoning이 포함됨
- [ ] curl 실패 시 경고만 출력하고 builder 작업은 계속 진행하는 에러 처리가 명시됨
- [ ] CallbackToken이 있으면 Authorization 헤더를 포함하도록 명시됨
- [ ] curl 호출 타이밍이 progress 체크포인트 업데이트 후임이 명확히 명시됨

## Verify
```bash
# ProgressCallback 관련 키워드 존재 확인
grep "ProgressCallback" agents/builder.md && echo "PASS: ProgressCallback referenced" || echo "FAIL"
grep "curl" agents/builder.md && echo "PASS: curl command exists" || echo "FAIL"

# 페이로드 필드 확인
grep "workId" agents/builder.md && echo "PASS: workId in payload" || echo "FAIL"
grep "checklist" agents/builder.md && echo "PASS: checklist in payload" || echo "FAIL"
grep "currentReasoning" agents/builder.md && echo "PASS: currentReasoning in payload" || echo "FAIL"

# 에러 처리 확인
grep -i "warn\|경고\|실패.*계속\|fail.*continue" agents/builder.md && echo "PASS: error handling documented" || echo "FAIL"
```
