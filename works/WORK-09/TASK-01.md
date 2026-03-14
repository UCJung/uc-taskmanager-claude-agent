# WORK-09-TASK-01: committer.md TaskCallback 조건부 curl 호출 추가

## WORK
WORK-09: CLAUDE.md 콜백 URL 기반 외부 시스템 결과 전달

## Dependencies
- WORK-09-TASK-00 (required)

## Scope

committer.md에 TaskCallback 조건부 curl 호출 로직을 추가한다. result.md 작성 + git commit 완료 후, CLAUDE.md에서 TaskCallback URL이 존재하면 결과를 HTTP POST로 전송한다.

### 추가할 워크플로우

1. **CLAUDE.md에서 설정 읽기**: shared-prompt-sections.md의 Task Callbacks 가이드에 따라 `TaskCallback` URL과 `CallbackToken`을 추출
2. **조건부 curl 호출**: URL이 존재할 때만 아래 페이로드를 POST 전송
3. **에러 처리**: curl 실패 시 경고만 출력하고 계속 진행 (커밋은 이미 완료된 상태)

### TaskCallback 페이로드 스키마

```json
{
  "workId": "WORK-XX",
  "taskId": "WORK-XX-TASK-NN",
  "status": "SUCCESS|PARTIAL|FAILED",
  "what": "구현한 내용 요약",
  "why": "구현 이유/배경",
  "caution": "주의사항 (없으면 빈 문자열)",
  "incomplete": "미완료 항목 (없으면 빈 문자열)",
  "filesChanged": ["path/to/file1", "path/to/file2"],
  "commitHash": "abc1234"
}
```

### 핵심 원칙
- curl 호출은 **git commit 이후**에 실행 (커밋 완료 보장)
- curl 실패해도 committer의 최종 상태는 성공으로 유지
- `CallbackToken`이 있으면 `Authorization: Bearer <token>` 헤더 추가

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/committer.md` | MODIFY | result.md 작성 + git commit 후 TaskCallback 조건부 curl 호출 섹션 추가 |

## Acceptance Criteria
- [ ] committer.md에 CLAUDE.md에서 TaskCallback URL 읽기 로직이 추가됨
- [ ] TaskCallback URL이 존재할 때만 curl POST를 호출하는 조건부 로직이 추가됨
- [ ] 페이로드에 workId, taskId, status, what, why, caution, incomplete, filesChanged, commitHash가 포함됨
- [ ] curl 실패 시 경고만 출력하고 committer 작업은 계속 진행하는 에러 처리가 명시됨
- [ ] CallbackToken이 있으면 Authorization 헤더를 포함하도록 명시됨
- [ ] curl 호출 타이밍이 git commit 이후임이 명확히 명시됨

## Verify
```bash
# TaskCallback 관련 키워드 존재 확인
grep "TaskCallback" agents/committer.md && echo "PASS: TaskCallback referenced" || echo "FAIL"
grep "curl" agents/committer.md && echo "PASS: curl command exists" || echo "FAIL"

# 페이로드 필드 확인
grep "workId" agents/committer.md && echo "PASS: workId in payload" || echo "FAIL"
grep "commitHash" agents/committer.md && echo "PASS: commitHash in payload" || echo "FAIL"
grep "filesChanged" agents/committer.md && echo "PASS: filesChanged in payload" || echo "FAIL"

# 에러 처리 확인 (경고만 출력)
grep -i "warn\|경고\|실패.*계속\|fail.*continue" agents/committer.md && echo "PASS: error handling documented" || echo "FAIL"
```
