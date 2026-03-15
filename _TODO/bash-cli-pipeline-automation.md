# TODO: Bash CLI 기반 파이프라인 자동화 — 검증 완료, 구현 단계

> 작성일: 2026-03-15
> 검증 완료: 2026-03-16
> 상태: **검증 완료** — 구현 단계 진입 가능

---

## 검증 결과 요약

**`claude -p`로 full 모드 파이프라인이 사람 개입 없이 자동 완주됨** ✅

WORK-24에서 실제 검증:
```
router (opus) → planner (sub-agent) → scheduler → builder → verifier → committer
  TASK-00: ce8ed6d ✅
  TASK-01: 2aa5d0b ✅
```

| 체크리스트 | 결과 |
|-----------|------|
| `claude -p`에서 Task tool로 sub-agent 호출 | ✅ 9회 호출 확인 |
| full 파이프라인 사람 개입 없이 완주 | ✅ TASK 2개 모두 커밋 |
| Activity Log 정상 기록 | ✅ `work_WORK-24.log` |
| stdout stream-json 모니터링 | ✅ 435줄 로그, 실시간 확인 |
| 구독 인증(Max) 사용 | ✅ `apiKeySource: "none"` |

---

## 실행 방법 (검증된 명령)

### 기본 실행

```bash
cd /c/rnd/agent/uc-taskmanager

env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p \
  "[WORK 시작] {작업 내용}. full 모드로 실행하라." \
  --dangerously-skip-permissions \
  --output-format stream-json \
  --verbose \
  2>&1 | tee /tmp/pipeline.log
```

### 모니터링

```bash
# 터미널 1 — 파이프라인 실행 (백그라운드)
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p "..." \
  --dangerously-skip-permissions \
  --output-format stream-json --verbose \
  2>&1 | tee /tmp/pipeline.log &

# 터미널 2 — 실시간 모니터링
tail -f /tmp/pipeline.log | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        d = json.loads(line)
        t = d.get('type','')
        if t == 'assistant':
            for c in d.get('message',{}).get('content',[]):
                if c.get('type') == 'text':
                    print('[TEXT]', c['text'][:100])
                elif c.get('type') == 'tool_use':
                    print('[TOOL]', c['name'], str(c.get('input',{}))[:150])
        elif t == 'result':
            print('[DONE]', d.get('result','')[:200])
    except: pass
"

# 터미널 3 — Activity Log
tail -f works/WORK-XX/work_WORK-XX.log
```

---

## 핵심 기술 사항

### 1. 환경변수 unset 필수

```bash
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p "..."
```

| 환경변수 | unset 이유 |
|---------|-----------|
| `CLAUDECODE` | Claude Code 중첩 실행 차단 우회 |
| `ANTHROPIC_API_KEY` | API 키 과금 대신 구독 인증(Max) 사용 |

### 2. 인증 확인

```bash
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude auth status
# → { "authMethod": "claude.ai", "subscriptionType": "max" }
```

### 3. init 메시지에서 도구 확인

stream-json 첫 줄에 `"tools": ["Task", ...]` 포함 여부로 Task tool 사용 가능 확인.

### 4. 중단된 파이프라인 재개

TASK가 COMPLETED인데 커밋이 안 된 경우:
```bash
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p \
  "WORK-XX의 TASK-YY가 COMPLETED 상태인데 커밋이 안 되어 있다. committer를 호출하여 마무리하라." \
  --dangerously-skip-permissions
```

---

## 목표 아키텍처

```
서버 / cron / webhook
  └── env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p "[WORK 시작] ..." \
        --dangerously-skip-permissions \
        --output-format stream-json --verbose \
        | tee pipeline.log
          │
          claude -p 프로세스 (Main Claude 역할)
            ├── agent-flow.md 참조
            ├── router: execution-mode 판정 + WORK 생성
            ├── planner: PLAN.md + TASK 파일 생성 (full 모드)
            ├── scheduler: DAG 분석 + 순서 결정
            └── 각 TASK에 대해:
                  Task tool → builder (구현)
                  Task tool → verifier (검증)
                  Task tool → committer (커밋)
```

---

## 후속 작업 (구현 단계)

- [ ] `agents/agent-flow.md` 업데이트 — Bash CLI 실행 경로 추가
- [ ] `docs/` 에 서버 자동화 운영 가이드 작성
- [ ] 서버 실행 스크립트 작성 (`scripts/run-pipeline.sh`)
- [ ] `--agent router` 옵션 테스트 (`.claude/agents/router.md` 로드 여부)
- [ ] 에러 발생 시 자동 재시도 로직 검토
- [ ] `--max-turns` 옵션으로 장시간 실행 제한 설정

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `agents/agent-flow.md` | Main Claude 오케스트레이션 흐름 |
| `agents/router.md` | 최상위 오케스트레이터 |
| `agents/scheduler.md` | DAG 기반 TASK 실행 관리 |
| `.claude/agents/` | 전역 에이전트 정의 |
| `docs/spec_pipeline-architecture_v1.1.md` | 파이프라인 아키텍처 스펙 |
| `works/WORK-24/` | 검증에 사용된 WORK (full 모드 완주) |
