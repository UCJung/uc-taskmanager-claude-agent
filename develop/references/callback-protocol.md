# 콜백

각 에이전트가 CE7 API를 통해 서버에 START/DONE/FAILED 이벤트를 전송

**활성화 조건:** 
1. CLAUDE.md에 Callback_URL 이 설정된 경우
2. 설정정보가 없을 경우 **모든 콜백 생략**

**CALLBACK_URL 및 CALLBACK_TOKEN 확인 방법:**
1. CLAUDE.md에 Callback_URL 및 Callback_TOKEN 확인

**전송 시점:**
- **START**: 에이전트 실행 시작 시 (STARTUP 이후)
- **DONE**: 맨 마지막, task-result XML 반환 직전
- **FAILED**: 복구 불가능한 실패 시, FAIL task-result 반환 직전

**전송 방법** (단일 curl 명령):
```bash
curl -s --connect-timeout 3 --max-time 5 -X POST "$CALLBACK_URL" \
  -H "Authorization: Bearer $CALLBACK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"BUILDER","event":"START","workId":"WORK-09","taskId":"TASK-01"}' \
  2>/dev/null || true
```

- `--connect-timeout 3`: 연결 대기 최대 3초
- `--max-time 5`: 전체 요청 최대 5초
- `|| true`: 실패해도 에이전트 실행 계속

**Agent별 docs 포함 (실제 파일 내용을 포함해야함):**
- specifier DONE: `"docs": {"requirementContent": "<Requirement.md 내용>"}`
- planner DONE: `"docs": {"planContent": "<PLAN.md 내용>"}`
- builder START: `"docs": {"taskContent": "<TASK-NN.md 내용>"}`
- committer DONE: `"docs": {"resultContent": "<TASK-NN_result.md 내용>"}`

**토큰 사용량** (DONE 이벤트에 추가):
```json
{"inputTokens": 1234, "outputTokens": 567, "cacheCreationTokens": 890, "cacheReadTokens": 456}
```
콜백 실패 시 계속 진행.