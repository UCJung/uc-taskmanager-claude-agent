# TASK-01: Plugin 매니페스트 및 설정 파일 생성

## WORK
WORK-30: Claude Marketplace Plugin 형식 전환

## Dependencies
- TASK-00 (required)

## Scope
.claude-plugin/plugin.json 매니페스트를 생성한다.
agents 필드는 배열 형식으로 12개 에이전트 경로를 명시한다 (문자열 형식 사용 금지).
선택적으로 settings.json을 생성한다.

plugin.json 필수 필드:
- name, version, description, author, repository, license
- keywords (검색용)
- agents (배열: 12개 에이전트 상대 경로)

주요 제약:
- agents 필드는 반드시 배열 형식 (문자열 시 설치 실패)
- Plugin 에이전트는 hooks, mcpServers, permissionMode frontmatter 미지원
- ${CLAUDE_PLUGIN_ROOT}, ${CLAUDE_PLUGIN_DATA} 환경변수 사용 가능

## Files
| Path | Action | Description |
|------|--------|-------------|
| `.claude-plugin/plugin.json` | CREATE | Plugin 매니페스트 (메타데이터 + agents 배열) |
| `settings.json` | CREATE | 플러그인 기본 설정 (선택) |

## Acceptance Criteria
- [ ] .claude-plugin/plugin.json이 유효한 JSON 형식으로 존재
- [ ] agents 필드가 배열 형식으로 12개 에이전트 경로를 포함
- [ ] 각 agents 배열 항목의 파일이 실제 존재
- [ ] name, version, description, author, license 필드 존재

## Verify
```bash
# 1. JSON 유효성 검사
node -e "const p = JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')); console.log('Valid JSON'); console.log('agents count:', p.agents.length); console.log('agents is array:', Array.isArray(p.agents));"

# 2. agents 배열의 각 파일 존재 확인
node -e "const p = JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')); p.agents.forEach(a => { if(!require('fs').existsSync(a)) throw new Error('Missing: '+a); }); console.log('All agent files exist');"
```
