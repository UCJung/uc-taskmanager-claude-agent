# TASK-00: 에이전트 디렉토리 재구조화 + npm CLI 경로 수정

## WORK
WORK-30: Claude Marketplace Plugin 형식 전환

## Dependencies
- (none)

## Scope
agents/en/*.md 12개 파일을 agents/ 루트로 이동하여 Plugin 표준 디렉토리 구조에 맞춘다.
agents/en/ 디렉토리를 제거하고, npm CLI(uctm init/update)가 새 경로를 올바르게 참조하도록 수정한다.

구체적 변경:
1. agents/en/*.md 12개 파일 → agents/*.md (루트)로 이동
2. agents/en/ 디렉토리 제거
3. lib/constants.mjs: getAgentsSrcDir('en') — agents/en/ 대신 agents/ 루트 반환
4. package.json: files 필드 — "agents/en/" → "agents/*.md" 또는 적절한 glob

agents/ko/ 디렉토리는 변경 없이 유지한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/*.md` (12개) | CREATE (이동) | agents/en/에서 agents/ 루트로 이동 |
| `agents/en/` | DELETE | 빈 디렉토리 제거 |
| `lib/constants.mjs` | MODIFY | getAgentsSrcDir('en') 반환 경로 변경 |
| `package.json` | MODIFY | files 필드 agents 경로 수정 |

## Acceptance Criteria
- [ ] agents/ 루트에 12개 en 에이전트 .md 파일이 존재
- [ ] agents/en/ 디렉토리가 존재하지 않음
- [ ] agents/ko/ 디렉토리와 파일이 그대로 유지
- [ ] getAgentsSrcDir('en') 호출 시 agents/ 루트 경로 반환
- [ ] getAgentsSrcDir('ko') 호출 시 agents/ko/ 경로 반환 (기존과 동일)
- [ ] package.json files 필드가 새 구조 반영

## Verify
```bash
# 1. en 에이전트 12개 파일 존재 확인
ls agents/*.md | wc -l  # 12

# 2. agents/en/ 제거 확인
test ! -d agents/en && echo "PASS: agents/en/ removed"

# 3. agents/ko/ 유지 확인
ls agents/ko/*.md | wc -l  # 12

# 4. constants.mjs 경로 확인
node -e "import { getAgentsSrcDir } from './lib/constants.mjs'; console.log('en:', getAgentsSrcDir('en')); console.log('ko:', getAgentsSrcDir('ko'));"
```
