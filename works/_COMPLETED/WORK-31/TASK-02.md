# TASK-02: plugin/ 폴더 생성 및 파일 이동

## WORK
WORK-31: 프로젝트 폴더 구조 재구조화 (agents / npm / plugin 분리)

## Dependencies
- TASK-00 (required)

## Scope
plugin/ 디렉토리를 생성하고 .claude-plugin/plugin.json을 plugin/.claude-plugin/으로 이동한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `plugin/` | CREATE | plugin 루트 디렉토리 생성 |
| `plugin/.claude-plugin/` | CREATE | 플러그인 설정 디렉토리 생성 |
| `plugin/.claude-plugin/plugin.json` | CREATE | .claude-plugin/plugin.json 이동 |

## Acceptance Criteria
- [ ] plugin/ 디렉토리가 존재
- [ ] plugin/.claude-plugin/plugin.json 파일이 존재
- [ ] plugin.json 내용이 원본과 동일

## Verify
```bash
# 파일 존재 확인
ls plugin/.claude-plugin/plugin.json

# JSON 유효성 확인
node -e "JSON.parse(require('fs').readFileSync('plugin/.claude-plugin/plugin.json','utf8')); console.log('Valid JSON')"
```
