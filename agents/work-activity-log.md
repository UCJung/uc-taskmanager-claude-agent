# Work Activity Log

각 에이전트가 `works/{WORK_ID}/work_{WORK_ID}.log`에 작업 진행 상황을 기록한다.

## 기록 시점

| 시점 | 기록 내용 |
|------|----------|
| 프롬프트 수신 시 | 수신한 프롬프트 메시지 내용 |
| 작업 진행 시 | 작업 항목 및 내용 |
| 작업 완료 시 | 타 Agent에 전송한 프롬프트 메시지 |
| Callback 호출 시 | URL, 성공 여부, Payload, Response |

## log_work 함수

```bash
AGENT_NAME="ROUTER"  # 각 에이전트에서 설정

log_work() {
  local WORK_ID="$1" AGENT="$2" STAGE="$3" DESC="$4"
  mkdir -p "works/${WORK_ID}"
  printf '[%s]_%s_%s_%s\n' \
    "$(date '+%Y-%m-%dT%H:%M:%S')" "$AGENT" "$STAGE" "$DESC" \
    >> "works/${WORK_ID}/work_${WORK_ID}.log"
}
```

## STAGE 테이블

| STAGE | 시점 | 설명 예시 |
|-------|------|-----------|
| `INIT` | WORK_ID 결정 후 | `WORK-NN 생성 — Execution-Mode: direct/pipeline/full` |
| `REF` | STARTUP 참조 직후 | `참조: CLAUDE.md, agents/file-content-schema.md` |
| `PLAN` | PLAN.md + TASK 파일 생성 완료 | `PLAN.md, TASK-00.md 생성 완료` |
| `IMPL` | direct 모드 코드 구현 시작 | `코드 구현 시작 — 참조: {파일 목록}` |
| `BUILD` | self-check 통과 | `빌드/린트 통과` |
| `COMMIT` | git commit 완료 | `commit {hash}` |
| `DISPATCH` | pipeline/full dispatch | `Builder dispatch` 또는 `Planner dispatch` |

STARTUP에서 읽은 파일과 이후 탐색한 파일을 누적하여 `REF` 단계에서 기록.
