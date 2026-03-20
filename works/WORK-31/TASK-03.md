# TASK-03: npm/ 코드 수정 및 agents 복사

## WORK
WORK-31: 프로젝트 폴더 구조 재구조화 (agents / npm / plugin 분리)

## Dependencies
- TASK-01 (required)

## Scope
npm/lib/constants.mjs의 getAgentsSrcDir 경로를 npm/ 기준으로 수정한다. npm/package.json의 files 필드를 수정한다. agents/en/ 파일을 npm/agents/로, agents/ko/ 파일을 npm/agents/ko/로 복사한다. 루트 LICENSE를 npm/LICENSE로 복사한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `npm/lib/constants.mjs` | MODIFY | getAgentsSrcDir 경로를 npm/ 기준으로 수정 |
| `npm/package.json` | MODIFY | files 필드 수정 |
| `npm/agents/*.md` | CREATE | agents/en/ 에이전트 12개 복사 |
| `npm/agents/ko/*.md` | CREATE | agents/ko/ 에이전트 12개 복사 |
| `npm/LICENSE` | CREATE | 루트 LICENSE 복사 |

## Acceptance Criteria
- [ ] npm/lib/constants.mjs의 경로가 npm/ 내부 기준으로 동작
- [ ] npm/package.json의 files 필드가 새 구조 반영
- [ ] npm/agents/ 에 en 에이전트 12개 존재
- [ ] npm/agents/ko/ 에 ko 에이전트 12개 존재
- [ ] npm/LICENSE 파일 존재

## Verify
```bash
# agents 파일 수 확인
ls npm/agents/*.md | wc -l  # 12
ls npm/agents/ko/*.md | wc -l  # 12

# constants.mjs 경로 확인
grep -n "getAgentsSrcDir" npm/lib/constants.mjs

# package.json files 필드 확인
node -e "const p=JSON.parse(require('fs').readFileSync('npm/package.json','utf8')); console.log(p.files)"

# LICENSE 존재
ls npm/LICENSE
```
