# Agent 테스트 가이드

> develop/ 의 agent/skill/hook 변경 후 파이프라인 동작을 검증하는 방법

## 개요

`claude -p` 옵션으로 별도 프로세스를 띄워 agent 파이프라인을 자동 실행하고, 결과를 모니터링한다.

## 1. 테스트 환경 구성

### 1.1 디렉토리 생성

```bash
TEST_DIR="/tmp/agent_test_NN"
DEVELOP="/c/rnd/agent/uc-taskmanager/develop"

mkdir -p "$TEST_DIR/.claude/agents" \
         "$TEST_DIR/.claude/.claude-plugin" \
         "$TEST_DIR/.claude/skills/sdd-pipeline/references" \
         "$TEST_DIR/.claude/hooks" \
         "$TEST_DIR/works"
```

### 1.2 파일 복사

```bash
# agents (6개) + references (6개) → .claude/agents/ (flat)
cp $DEVELOP/agents/*.md "$TEST_DIR/.claude/agents/"
cp $DEVELOP/references/*.md "$TEST_DIR/.claude/agents/"

# plugin.json
cp $DEVELOP/.claude-plugin/plugin.json "$TEST_DIR/.claude/.claude-plugin/"

# skills
cp -r $DEVELOP/skills/init "$TEST_DIR/.claude/skills/"
cp -r $DEVELOP/skills/work-pipeline "$TEST_DIR/.claude/skills/"
cp -r $DEVELOP/skills/work-status "$TEST_DIR/.claude/skills/"
cp $DEVELOP/skills/sdd-pipeline/SKILL.md "$TEST_DIR/.claude/skills/sdd-pipeline/"
cp $DEVELOP/references/*.md "$TEST_DIR/.claude/skills/sdd-pipeline/references/"

# hooks
cp $DEVELOP/hooks/*.sh "$TEST_DIR/.claude/hooks/" 2>/dev/null
chmod +x "$TEST_DIR/.claude/hooks/"*.sh 2>/dev/null
```

### 1.3 권한 + Hook 설정

```bash
cat > "$TEST_DIR/.claude/settings.local.json" << 'EOF'
{
  "permissions": {
    "allow": [
      "Read(/**)", "Edit(/**)", "Write(/**)", "Read(**)", "Edit(**)", "Write(**)",
      "Bash(ls:*)", "Bash(cat:*)", "Bash(mkdir:*)", "Bash(basename:*)",
      "Bash(find:*)", "Bash(wc:*)", "Bash(sort:*)", "Bash(tail:*)",
      "Bash(head:*)", "Bash(echo:*)", "Bash(printf:*)",
      "Bash(grep:*)", "Bash(sed:*)", "Bash(cut:*)", "Bash(tr:*)",
      "Bash(node:*)", "Bash(npm run:*)", "Bash(npm test:*)",
      "Bash(bun run:*)", "Bash(yarn:*)", "Bash(cargo:*)",
      "Bash(go build:*)", "Bash(go test:*)", "Bash(python:*)",
      "Bash(ruff:*)", "Bash(make:*)", "Bash(git:*)", "Bash(curl:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/work-status-sync.sh"
          }
        ]
      }
    ]
  }
}
EOF
```

### 1.4 Git 초기화

```bash
cd "$TEST_DIR" && git init && git add -A && git commit -m "init"
```

## 2. 테스트 실행

### 2.1 Direct 모드 (단순 요구사항, TASK 1개)

```bash
cd "$TEST_DIR" && env -u ANTHROPIC_API_KEY claude -p \
  "[new-feature] HTML과 JavaScript로 블럭깨기 게임을 만들어줘. Canvas 기반, 키보드 조작, 점수 표시. auto" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  >> /tmp/logs/agent_test_NN.jsonl 2>&1 &
```

### 2.2 Pipeline 모드 (복잡 요구사항, TASK 2개 이상)

```bash
cd "$TEST_DIR" && env -u ANTHROPIC_API_KEY claude -p \
  "[new-feature] HTML/JS Canvas 블럭깨기 게임을 만들어줘. 반드시 pipeline 모드로 실행해줘.

요구사항:
1. 게임 엔진: Canvas 렌더링, 60fps 게임 루프, 충돌 감지 시스템
2. UI/UX: 시작 화면, 게임 오버 화면, 점수판, 생명 표시
3. 게임플레이: 3단계 레벨, 파워업 아이템, 키보드+마우스 조작

auto" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  >> /tmp/logs/agent_test_NN.jsonl 2>&1 &
```

### 2.3 Full 모드 (멀티 도메인, 6+ TASK, DAG 병렬 분기)

```bash
cd "$TEST_DIR" && env -u ANTHROPIC_API_KEY claude -p \
  "[new-feature] 웹 기반 프로젝트 관리 대시보드를 만들어줘. 반드시 full 모드로 실행해줘.

요구사항:
1. 데이터 모델: 프로젝트, 태스크, 멤버 — JSON 파일 기반 저장
2. 백엔드 API: Node.js Express, REST CRUD
3. 프론트엔드: HTML/CSS/JS SPA, 프로젝트 목록/상세
4. 태스크 보드: 칸반 보드 UI, 드래그앤드롭, 필터링
5. 대시보드: 진행률 차트, 멤버별 분포, 기한 알림
6. 테스트: API 테스트 스크립트, 샘플 데이터 시딩

auto" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  >> /tmp/logs/agent_test_NN.jsonl 2>&1 &
```

> **주의**: full 모드는 scheduler가 DAG를 해석하여 builder→verifier→committer를 TASK별로
> 반복해야 하지만, Main Claude가 파이프라인을 우회하여 직접 구현하는 경우가 있다.
> 이 경우 커밋이 1개로 합쳐지고 result.md가 생성되지 않는다. (test-04에서 확인)
> `--output-format json` 로그로 Agent spawn 여부를 확인하여 원인을 특정할 수 있다.

### 2.4 WORK 재개 (중단된 파이프라인 계속)

```bash
cd "$TEST_DIR" && env -u ANTHROPIC_API_KEY claude -p \
  "WORK-01 계속 실행해줘. auto" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  > /tmp/logs/agent_test_NN_resume.json 2>&1 &
```

### 주요 옵션

| 옵션 | 설명 |
|------|------|
| `env -u ANTHROPIC_API_KEY` | API 키 환경변수 제거 → 로그인 세션 사용 (크레딧 우회) |
| `claude -p "..."` | 프롬프트 직접 전달, 비대화형 실행 |
| `--dangerously-skip-permissions` | 권한 확인 없이 자동 실행 |
| `--output-format json` | 전체 실행 이벤트(tool call, agent spawn 등) JSON 로그 출력 |
| `--verbose` | 상세 로그 활성화 |
| `auto` (프롬프트 끝) | 파이프라인 승인 게이트 자동 통과 |
| `> ... 2>&1 &` | 백그라운드 실행 + 로그 파일 기록 |

### 로그 기록 방식

#### 기본 (최종 응답만)

```bash
> /tmp/logs/agent_test_NN.log 2>&1
```

stdout에 최종 응답 텍스트만 출력. 중간 과정(tool call, agent dispatch)은 기록되지 않음.

#### 스트리밍 로그 (전체 이벤트 실시간 기록 — 권장)

```bash
--output-format stream-json >> /tmp/logs/agent_test_NN.jsonl 2>&1
```

모든 이벤트를 실시간으로 JSONL (줄 단위 JSON)로 **추가(append)** 출력:
- `type: "assistant"` — Claude 응답 (agent spawn 명령 포함)
- `type: "tool_use"` — tool call (Write, Edit, Bash, Agent 등)
- `type: "tool_result"` — tool 실행 결과
- `type: "result"` — 최종 결과 (`modelUsage` 포함)

> **중요**: `>` (덮어쓰기)가 아닌 `>>` (추가)를 사용한다.
> 스트리밍 중 버퍼 flush로 파일이 재작성될 수 있으므로 append 모드가 안전하다.

**Agent 실행 여부 추적:**

```bash
LOG="/tmp/logs/agent_test_NN.jsonl"

# Agent tool 호출 확인 (어떤 agent가 spawn되었는지)
grep '"Agent"' "$LOG" | wc -l

# Skill 호출 확인
grep -oE '"skill":"[^"]*"' "$LOG"

# Bash tool로 실행된 git commit 확인
grep -oE '"command":"git commit[^"]*"' "$LOG"
```

**모델 사용량 분석 (최종 result 이벤트에 포함):**

```bash
# modelUsage에서 모델별 사용량 확인
grep '"modelUsage"' "$LOG" | grep -oE '"claude-[^"]*":\{[^}]*\}'
```

| 모델 | 대응 Agent | 사용 의미 |
|------|-----------|----------|
| `claude-opus-4-6` | specifier, planner | 요구사항 분석/설계 실행됨 |
| `claude-sonnet-4-6` | builder | 코드 구현 실행됨 |
| `claude-haiku-4-5` | scheduler, verifier, committer | 파이프라인 오케스트레이션 실행됨 |

3개 모델이 모두 사용되었으면 파이프라인이 정상 동작한 것. opus만 사용되었으면 Main Claude가 직접 구현한 것.

**병렬 spawn 확인:**

Main Claude가 builder를 호출하므로, Agent tool call 순서로 병렬 여부를 판단할 수 있다:

```bash
# Agent tool call 순서 + 타임스탬프 추출
grep -E '"Agent"|"subagent_type"' "$LOG"

# builder가 연이어 호출되었으면 → 병렬 spawn (DAG 독립 TASK)
# builder → verifier → committer → builder 순이면 → 순차 실행
```

## 3. 모니터링

### 3.1 파이프라인 진행 상태 (파일 기반)

```bash
# WORK 생성 확인
cat "$TEST_DIR/works/WORK-LIST.md"

# PLAN 확인 (실행 모드, TASK 목록)
cat "$TEST_DIR/works/WORK-01/PLAN.md"

# TASK별 진행 상태
for f in "$TEST_DIR/works/WORK-01"/TASK-*_progress.md; do
  echo "--- $(basename $f) ---"
  head -3 "$f"
done

# result 파일 존재 확인
ls "$TEST_DIR/works/WORK-01"/TASK-*_result.md

# git commit 이력
cd "$TEST_DIR" && git log --oneline
```

### 3.2 실행 이벤트 분석 (stream-json 로그)

```bash
LOG="/tmp/logs/agent_test_NN.jsonl"

# 1. Agent spawn 여부 + 순서
grep -oE '"subagent_type":"[^"]*"' "$LOG" | cat -n

# 2. Skill 호출 확인
grep -oE '"skill":"[^"]*"' "$LOG"

# 3. 전체 tool call 종류별 횟수
grep -oE '"tool_name":"[^"]*"' "$LOG" | sort | uniq -c | sort -rn

# 4. git commit 실행 내역
grep -oE '"command":"git commit[^"]*"' "$LOG"

# 5. 파일 생성/수정 내역
grep -oE '"file_path":"[^"]*"' "$LOG" | sort -u

# 6. 모델별 사용량 (최종 result 이벤트)
grep '"modelUsage"' "$LOG" | grep -oE '"claude-[^"]*":\{[^}]*\}'

# 7. 병렬 spawn 여부 (builder 연속 호출 확인)
grep -E '"Agent"|"subagent_type"' "$LOG"
```

### 3.3 최종 검증 체크리스트

| 확인 항목 | 명령어 | 기대값 |
|----------|--------|--------|
| WORK-LIST 상태 | `grep "WORK-01" works/WORK-LIST.md` | `DONE` |
| 전체 TASK result 존재 | `ls works/WORK-01/TASK-*_result.md \| wc -l` | TASK 수와 동일 |
| git commit 수 | `git log --oneline \| wc -l` | TASK 수 + 1 (init) |
| 산출물 존재 | `ls *.html` or `ls src/` | 파일 존재 |
| Agent spawn 확인 | `grep "subagent_type" *.jsonl` | specifier, builder 등 |
| 모델 사용 확인 | `grep "modelUsage" *.jsonl` | opus + sonnet + haiku 3개 모두 |
| 최종 결과 | `grep '"subtype":"success"' *.jsonl` | 존재 |

## 4. 트러블슈팅

### Credit balance is too low

API 키 환경변수가 설정되어 있을 때 발생. `env -u ANTHROPIC_API_KEY`로 제거.

### Hook이 파이프라인을 방해

Hook 스크립트 오류가 모든 Bash PostToolUse에서 발생하면 파이프라인이 중단될 수 있다.

**확인 방법:**
```bash
# hook 단독 테스트
echo '{"tool_input":{"command":"ls"},"cwd":"/tmp/test"}' | bash .claude/hooks/work-status-sync.sh
echo "exit: $?"
```

**주의사항:**
- `jq` 미설치 환경 → grep/sed로 JSON 파싱
- `grep -P` (Perl regex) → `grep -oE` (Windows/MSYS2 호환)
- hook은 반드시 `exit 0`으로 종료 (0 이외 반환 시 동작 차단)

### WORK-LIST가 IN_PROGRESS로 남음

`work-status-sync.sh` hook이 설정되어 있는지 확인.
설정되어 있다면 hook 스크립트가 정상 동작하는지 단독 테스트.

### Full 모드에서 파이프라인이 기대대로 동작하지 않음

**증상**: PLAN.md에 `Execution-Mode: full`이지만 커밋이 1개, result.md가 0개.

**원인 분석 방법**:

1. `--output-format json` 로그의 `modelUsage` 확인:
   - opus + sonnet + haiku 3개 모두 → 파이프라인 정상 동작
   - opus만 → Main Claude가 직접 구현 (파이프라인 우회)

2. `--output-format stream-json` 로그로 상세 추적:
   ```bash
   # Agent spawn 확인
   grep -oE '"subagent_type":"[^"]*"' /tmp/logs/agent_test_NN.jsonl
   # Agent tool 호출 횟수
   grep -c '"tool_name":"Agent"' /tmp/logs/agent_test_NN.jsonl
   ```

3. 파일 기반 간접 확인:
   - `PROGRESS.md` 미생성 → Scheduler 미실행
   - `TASK-*_result.md` 0개 → Committer 미실행
   - 커밋 메시지 `feat:` (TASK 번호 없음) → Committer 미실행

**대응**:
- agent-flow.md의 full 모드 오케스트레이션 지시를 더 명확하게 강화
- 또는 scheduler 직접 호출: `"WORK-01 실행해줘. scheduler를 통해 파이프라인 실행. auto"`

## 5. 테스트 이력

| 테스트 | 모드 | 결과 | 비고 |
|--------|------|------|------|
| test-01 | direct | ✅ 완주 | index.html 457줄, 커밋 1개 |
| test-02 | pipeline (4 TASK) | ✅ 완주 (⚠️ WORK-LIST DONE 누락) | hook 미적용 |
| test-03 | pipeline (2 TASK) | ✅ 완주 | hook 적용, DONE 자동 전환 확인 |
| test-04 | full (6 TASK, DAG 병렬) | ⚠️ 파이프라인 우회 | 커밋 1개, result.md 0개. text 로그만 있어 원인 특정 불가 |
| test-05 | full (6 TASK, DAG 병렬) | ✅ 완주 | `--output-format json` 사용. 커밋 6개, result 6개, DONE 자동전환. modelUsage로 3개 모델(opus/sonnet/haiku) 모두 사용 확인 |
