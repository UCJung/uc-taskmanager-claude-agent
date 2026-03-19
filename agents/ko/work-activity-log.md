# Work Activity Log

각 에이전트가 WORK 진행 상황을 `works/{WORK_ID}/work_{WORK_ID}.log` 파일에 기록하는 규칙을 정의한다.

---

# 1. 작업 단계 및 로그 기록 내용
* 최초 실행 시 : 수신한 프롬프트 메시지** Agent 시작 시 수신한 프롬프트 메시지 내용 (Required 필수)
* Callback 호출 시 : 호출한 Callback URL, 성공여부, Payload, Respoonse (Required 필수)
* 작업 진행 시 : 작업항목 및 작업내용 
* 수행작업 완료 시 : 타 Agent에 전송한 프롬프트 메시지** Agent 시작 시 수신한 프롬프트 메시지 내용 (Required 필수)

## log_work 함수

```bash
AGENT_NAME="SPECIFIER"  # 각 에이전트 파일에서 적절히 설정

log_work() {
  local WORK_ID="$1" AGENT="$2" STAGE="$3" DESC="$4"
  mkdir -p "works/${WORK_ID}"
  printf '[%s]_%s_%s_%s\n' \
    "$(date '+%Y-%m-%dT%H:%M:%S')" "$AGENT" "$STAGE" "$DESC" \
    >> "works/${WORK_ID}/work_${WORK_ID}.log"
}
```

---

## STAGE 테이블

| STAGE | 시점 | 설명 예시 |
|-------|------|-----------|
| `INIT` | WORK_ID 결정 후 | `WORK-NN 생성 — Execution-Mode: direct/pipeline/full` |
| `REF` | STARTUP 참조 직후 | `참조: CLAUDE.md, .agent/router_rule_config.json, agents/file-content-schema.md` |
| `PLAN` | PLAN.md + TASK 파일 생성 완료 | `PLAN.md, TASK-00.md 생성 완료` |
| `IMPL` | direct 모드 코드 구현 시작 | `코드 구현 시작 — 참조: {수정 대상 파일 목록}` |
| `BUILD` | self-check 통과 | `빌드/린트 통과` |
| `COMMIT` | git commit 완료 | `commit {hash}` |
| `DISPATCH` | pipeline/full dispatch | `Builder dispatch` 또는 `Planner dispatch` |

---

## 참조 자료 수집 규칙

STARTUP에서 읽은 파일과 이후 탐색한 파일을 누적 추적하여 `REF` 단계에서 한 번에 기록.
