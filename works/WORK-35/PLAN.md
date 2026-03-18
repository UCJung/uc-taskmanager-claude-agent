# WORK-35: Phase 3 — Integration (Claude Desktop + CLI 연동)

> Created: 2026-03-18
> 요구사항: N/A
> Execution-Mode: direct
> Project: uc-taskmanager
> Tech Stack: Node.js, MCP Server, Claude Desktop, Claude Code CLI
> Language: ko
> Status: COMPLETED

## Goal

Phase 2까지 구현된 MCP Server를 Claude Desktop과 Claude Code CLI에 실제 연동하여 동작을 검증하고, 기존 [태그] 방식과의 공존을 확인한다. 연동 config 파일과 가이드 문서를 산출물로 생성한다.

## Task Dependency Graph

```
TASK-00 (Claude Desktop 연동)
  │
  ▼
TASK-01 (Claude Code CLI 연동 + [태그] 공존 확인)
```

## Tasks

| TASK | 내용 | 산출물 | 의존성 |
|------|------|--------|--------|
| TASK-00 | Claude Desktop 연동 테스트 + config 생성 | claude_desktop_config.json, 연동 가이드 | (none) |
| TASK-01 | Claude Code CLI 연동 + 기존 [태그] 방식 공존 확인 | 연동 스크립트, 공존 검증 결과 | TASK-00 |

### TASK-00: Claude Desktop 연동 테스트 + config 생성
- **Depends on**: (none)
- **Scope**: Claude Desktop의 MCP 설정 파일(claude_desktop_config.json)을 생성하고, uc-taskmanager MCP Server가 Claude Desktop에서 정상 연동되는지 테스트한다. 연동 절차를 가이드 문서로 정리한다.
- **Files**:
  - `docs/claude-desktop-config.json` — Claude Desktop용 MCP 설정 예시 파일
  - `docs/integration-guide.md` — Claude Desktop + CLI 연동 가이드 문서

### TASK-01: Claude Code CLI 연동 + [태그] 공존 확인
- **Depends on**: TASK-00
- **Scope**: Claude Code CLI에서 `claude mcp add` 명령으로 MCP Server를 등록하고 동작을 확인한다. 기존 CLAUDE.md의 [태그] 방식(Agent 호출 규칙)과 MCP 도구 방식이 충돌 없이 공존하는지 검증한다. 연동 스크립트를 작성한다.
- **Files**:
  - `scripts/mcp-register.sh` — Claude Code CLI MCP 등록 스크립트
  - `docs/integration-guide.md` — 공존 검증 결과 추가
