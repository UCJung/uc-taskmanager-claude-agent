# 콜백

**orchestrator가** CE7 API를 통해 서버에 STAGE 단위 START/DONE/FAILED 이벤트를 **일괄 발신**한다. 개별 자식 에이전트(specifier/planner/builder/verifier/committer)는 콜백을 직접 전송하지 않는다.

**활성화 조건:** 
1. CLAUDE.md에 Callback_URL 이 설정된 경우
2. 설정정보가 없을 경우 **모든 콜백 생략**

**CALLBACK_URL 및 CALLBACK_TOKEN 확인 방법:**
1. CLAUDE.md에 Callback_URL 및 Callback_TOKEN 확인

**전송 시점 (orchestrator 기준):**
- **START**: 각 STAGE(자식 에이전트) 중첩 spawn 직전 — 활동 로그 `STAGE_START` 기록과 함께 orchestrator가 발신
- **DONE**: 각 STAGE 완료 시(게이트가 있는 단계는 게이트 통과 후) — 활동 로그 `STAGE_DONE` 기록과 함께 orchestrator가 발신
- **FAILED**: 복구 불가능한 실패 시(예: 재시도 3회 실패로 해당 TASK를 FAILED 처리) — orchestrator가 발신

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

**STAGE별 docs 포함 (실제 파일 내용을 포함해야함, orchestrator가 해당 STAGE 콜백 발신 시 첨부):**
- stage=specifier DONE: `"docs": {"requirementContent": "<Requirement.md 내용>"}`
- stage=planner DONE: `"docs": {"planContent": "<PLAN.md 내용>"}`
- stage=builder START: `"docs": {"taskContent": "<TASK-NN.md 내용>"}`
- stage=committer DONE: `"docs": {"resultContent": "<TASK-NN_result.md 내용>"}`

**토큰 사용량** (DONE 이벤트에 추가):
```json
{"inputTokens": 1234, "outputTokens": 567, "cacheCreationTokens": 890, "cacheReadTokens": 456}
```
콜백 실패 시 계속 진행.