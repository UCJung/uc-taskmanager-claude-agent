# TASK-01: Claude Code CLI 연동 + [태그] 공존 확인

## WORK
WORK-35: Phase 3 — Integration (Claude Desktop + CLI 연동)

## Dependencies
- TASK-00 (required)

## Scope
Claude Code CLI에서 `claude mcp add` 명령으로 MCP Server를 등록하고 동작을 확인한다. 기존 CLAUDE.md의 [태그] 방식(Agent 호출 규칙)과 MCP 도구 방식이 충돌 없이 공존하는지 검증한다. 연동 스크립트를 작성한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `scripts/mcp-register.sh` | CREATE | Claude Code CLI MCP 등록 스크립트 |
| `docs/integration-guide.md` | MODIFY | 공존 검증 결과 섹션 추가 |

## Acceptance Criteria
- [ ] mcp-register.sh가 `claude mcp add` 명령을 올바르게 실행함
- [ ] [태그] 방식과 MCP 방식이 충돌 없이 공존함을 확인
- [ ] 연동 가이드에 CLI 연동 절차 + 공존 검증 결과가 기술됨

## Verify
```bash
# 스크립트 존재 및 실행 권한 확인
test -f scripts/mcp-register.sh && echo "PASS"
# 가이드 문서에 CLI 섹션 존재 확인
grep -q "Claude Code CLI" docs/integration-guide.md && echo "PASS"
```
