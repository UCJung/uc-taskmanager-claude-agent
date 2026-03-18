# uc-taskmanager MCP Server Integration Guide

## Prerequisites

- Node.js >= 18.0.0
- MCP Server 빌드 완료 (`mcp-server/dist/index.js`)
- Claude Desktop 또는 Claude Code CLI 설치

```bash
# Build MCP Server
cd mcp-server && npm install && npm run build
```

---

## 1. Claude Desktop 연동

### 1.1 설정 파일 위치

| OS | 경로 |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

### 1.2 설정 추가

`claude_desktop_config.json`의 `mcpServers` 섹션에 추가:

```json
{
  "mcpServers": {
    "uc-taskmanager": {
      "command": "node",
      "args": [
        "C:/rnd/agent/uc-taskmanager/mcp-server/dist/index.js"
      ],
      "env": {
        "MCP_PROJECT_ROOT": "C:/path/to/your-project",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

> **MCP_PROJECT_ROOT**: 파이프라인 대상 프로젝트의 루트 경로. `works/` 디렉토리가 이 경로 하위에 생성된다.

### 1.3 연동 확인

1. Claude Desktop 재시작
2. 도구 아이콘(망치)에서 `uc-taskmanager` 도구 15개가 표시되는지 확인
3. 테스트 명령: `list_works` 도구 호출 → WORK 목록 반환 확인

### 1.4 사용 가능한 도구 (15개)

| Category | Tools |
|----------|-------|
| Pipeline | `create_work`, `execute_work`, `approve_plan`, `resume_work` |
| Task | `get_next_task`, `execute_task`, `retry_task`, `approve_task` |
| Git | `commit_work`, `push_work` |
| Monitor | `list_works`, `get_work_status`, `get_task_result`, `get_pipeline_log`, `sync_callbacks` |

### 1.5 사용 가능한 리소스 (5개)

| URI | 설명 |
|-----|------|
| `work://list` | WORK-LIST.md 전체 목록 |
| `work://{work_id}/plan` | 특정 WORK의 PLAN.md |
| `work://{work_id}/progress` | PROGRESS.md |
| `work://{work_id}/task/{task_id}` | TASK 명세 파일 |
| `work://{work_id}/task/{task_id}/result` | TASK 결과 파일 |

### 1.6 사용 가능한 프롬프트 (6개)

`router`, `planner`, `scheduler`, `builder`, `verifier`, `committer`

각 프롬프트는 에이전트 md 파일 + 참조문서를 자동 병합하여 반환한다.

---

## 2. Claude Code CLI 연동

### 2.1 MCP 서버 등록

```bash
# 등록
claude mcp add uc-taskmanager \
  -e MCP_PROJECT_ROOT=/path/to/your-project \
  -- node /path/to/uc-taskmanager/mcp-server/dist/index.js

# 확인
claude mcp list

# 제거 (필요 시)
claude mcp remove uc-taskmanager
```

### 2.2 자동 등록 스크립트

`scripts/mcp-register.sh` 사용:

```bash
# 기본 사용 (현재 디렉토리를 프로젝트로, project scope)
./scripts/mcp-register.sh

# 특정 프로젝트 지정
./scripts/mcp-register.sh /path/to/your-project

# user scope로 등록 (모든 프로젝트에서 사용)
./scripts/mcp-register.sh /path/to/your-project user

# 등록 해제
./scripts/mcp-register.sh --remove
```

등록 시 프로젝트 루트에 `.mcp.json` 파일이 생성된다 (project scope 기준).

### 2.3 연동 확인

```bash
# MCP 도구 목록 확인
claude mcp list

# Claude Code 세션에서 테스트
claude
> list_works 도구를 호출해줘
```

---

## 3. 기존 [태그] 방식과의 공존

### 3.1 두 가지 모드

uc-taskmanager는 두 가지 방식으로 파이프라인을 실행할 수 있다:

| 방식 | 트리거 | 동작 |
|------|--------|------|
| **Agent 방식** (기존) | `[추가기능] ...`, `[버그수정] ...` 등 `[]` 태그 | CLAUDE.md → agent-flow.md → 서브에이전트 Task 호출 |
| **MCP 방식** (신규) | MCP 도구 직접 호출 (`create_work`, `execute_work` 등) | MCP 클라이언트 → MCP Server → 파일 생성/조회 |

### 3.2 공존 원칙

1. **파일 구조 동일**: 두 방식 모두 `works/WORK-XX/` 디렉토리에 동일한 파일 형식으로 산출물 생성
2. **충돌 없음**: Agent 방식은 서브에이전트가 직접 파일을 생성/수정, MCP 방식은 MCP 도구가 파일 생성/조회
3. **혼합 사용 가능**: Agent 방식으로 WORK를 생성한 후 MCP 도구로 상태 조회 가능 (반대도 가능)
4. **CLAUDE.md 규칙 유지**: `[]` 태그로 시작하는 요청은 여전히 agent-flow.md 파이프라인이 처리

### 3.3 Fallback 동작

MCP 서버 연결이 실패하면:
- `[]` 태그 방식은 영향 없이 동작 (서브에이전트는 MCP 의존 없음)
- MCP 도구 호출만 실패하므로, Claude가 기존 Agent 방식으로 자동 전환 가능

### 3.4 권장 사용 패턴

| 시나리오 | 권장 방식 |
|---------|----------|
| Claude Code CLI 대화형 세션 | `[]` 태그 Agent 방식 (기존과 동일) |
| Claude Desktop에서 파이프라인 실행 | MCP 도구 방식 |
| 외부 시스템(Runner)에서 자동 실행 | MCP 도구 방식 |
| 파이프라인 상태 모니터링 | MCP 도구 (`list_works`, `get_work_status`) |
| 단일 TASK 수동 제어 | MCP 도구 (`get_next_task`, `execute_task`) |

---

## 4. 환경 변수

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_PROJECT_ROOT` | 파이프라인 대상 프로젝트 루트 | MCP 서버 위치에서 자동 탐지 |
| `MCP_GLOBAL_AGENTS_DIR` | 전역 에이전트 디렉토리 | `~/.claude/agents` |
| `MCP_TRANSPORT` | Transport 모드 (`stdio` / `http`) | `stdio` |
| `CALLBACK_ENABLED` | 웹훅 콜백 활성화 | `false` |
| `TASK_CALLBACK_URL` | Task 완료 콜백 URL | — |
| `PROGRESS_CALLBACK_URL` | 진행 상태 콜백 URL | — |
| `STAGE_CALLBACK_URL` | 파이프라인 스테이지 콜백 URL | — |
| `CALLBACK_TOKEN` | 콜백 인증 토큰 (`X-Runner-Api-Key` 헤더) | — |
| `CALLBACK_TIMEOUT_MS` | 콜백 타임아웃 (ms) | `5000` |

---

## 5. 트러블슈팅

### MCP 서버가 연결되지 않음
```bash
# 빌드 확인
cd mcp-server && npm run build

# 직접 실행 테스트
node mcp-server/dist/index.js
# "uc-taskmanager MCP Server running on stdio" 출력되면 정상
```

### 도구가 표시되지 않음
- Claude Desktop: 재시작 필요
- Claude Code CLI: `claude mcp list`로 등록 확인

### MCP_PROJECT_ROOT 오류
- 절대 경로 사용
- 해당 경로에 `works/` 디렉토리가 존재하는지 확인
