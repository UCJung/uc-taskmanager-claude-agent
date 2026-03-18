# TASK-01 Progress

- Status: COMPLETED
- Started: 2026-03-18T20:30:00
- Updated: 2026-03-18T20:35:00
- Files changed:
  - scripts/mcp-register.sh (CREATE — CLI 등록 스크립트, project/user scope 지원)
  - .mcp.json (CREATE — claude mcp add로 자동 생성)
  - docs/integration-guide.md (UPDATE — 스크립트 사용법, --remove 옵션 추가)

## Results
- `claude mcp add` 등록 성공 (project scope)
- `.mcp.json` 정상 생성 확인
- scripts/mcp-register.sh 존재 확인 PASS
- integration-guide.md "Claude Code CLI" 포함 확인 PASS
- [태그] 방식과 MCP 방식 공존: CLAUDE.md의 Agent 호출 규칙([] 태그 → agent-flow.md)은 MCP 도구와 독립적으로 동작. 파일 구조가 동일하므로 충돌 없음
