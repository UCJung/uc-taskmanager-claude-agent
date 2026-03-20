# TASK-04: plugin 설정 수정 및 agents 복사

## WORK
WORK-31: 프로젝트 폴더 구조 재구조화 (agents / npm / plugin 분리)

## Dependencies
- TASK-02 (required)

## Scope
plugin/.claude-plugin/plugin.json의 agents 배열 경로를 확인하고 plugin/ 기준으로 수정한다. agents/en/ 파일을 plugin/agents/로 복사한다. plugin/README.md를 Plugin 전용으로 생성한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `plugin/.claude-plugin/plugin.json` | MODIFY | agents 배열 경로 수정 |
| `plugin/agents/*.md` | CREATE | agents/en/ 에이전트 12개 복사 |
| `plugin/README.md` | CREATE | Plugin 전용 README 생성 |

## Acceptance Criteria
- [ ] plugin/.claude-plugin/plugin.json의 agents 경로가 유효
- [ ] plugin/agents/ 에 en 에이전트 12개 존재
- [ ] plugin/README.md 파일 존재
- [ ] plugin.json의 agents가 배열 형식 (NFR-03)

## Verify
```bash
# agents 파일 수 확인
ls plugin/agents/*.md | wc -l  # 12

# plugin.json agents 필드가 배열인지 확인
node -e "const p=JSON.parse(require('fs').readFileSync('plugin/.claude-plugin/plugin.json','utf8')); console.log(Array.isArray(p.agents) ? 'Array OK' : 'NOT Array')"

# README 존재
ls plugin/README.md
```
