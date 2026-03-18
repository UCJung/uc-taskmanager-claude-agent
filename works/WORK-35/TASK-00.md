# TASK-00: Claude Desktop 연동 테스트 + config 생성

## WORK
WORK-35: Phase 3 — Integration (Claude Desktop + CLI 연동)

## Dependencies
- (none)

## Scope
Claude Desktop의 MCP 설정 파일(claude_desktop_config.json)을 생성하고, uc-taskmanager MCP Server가 Claude Desktop에서 정상 연동되는지 테스트한다. 연동 절차를 가이드 문서로 정리한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/claude-desktop-config.json` | CREATE | Claude Desktop용 MCP 설정 예시 파일 |
| `docs/integration-guide.md` | CREATE | Claude Desktop + CLI 연동 가이드 문서 |

## Acceptance Criteria
- [ ] claude_desktop_config.json이 Claude Desktop 설정 스키마에 맞게 작성됨
- [ ] MCP Server 경로와 실행 명령이 정확히 설정됨
- [ ] 연동 가이드에 Claude Desktop 설정 절차가 단계별로 기술됨

## Verify
```bash
# JSON 형식 검증
node -e "JSON.parse(require('fs').readFileSync('docs/claude-desktop-config.json','utf8'))"
# 가이드 파일 존재 확인
test -f docs/integration-guide.md && echo "PASS"
```
