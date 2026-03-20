# TASK-01: npm/ 폴더 생성 및 파일 이동

## WORK
WORK-31: 프로젝트 폴더 구조 재구조화 (agents / npm / plugin 분리)

## Dependencies
- TASK-00 (required)

## Scope
npm/ 디렉토리를 생성하고 npm 패키지 관련 파일들을 이동한다. bin/cli.mjs, lib/ (constants.mjs, init.mjs, update.mjs), package.json, .npmignore, .agent/router_rule_config.json을 npm/ 하위로 이동한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `npm/` | CREATE | npm 패키지 루트 디렉토리 생성 |
| `npm/bin/cli.mjs` | CREATE | bin/cli.mjs 이동 |
| `npm/lib/constants.mjs` | CREATE | lib/constants.mjs 이동 |
| `npm/lib/init.mjs` | CREATE | lib/init.mjs 이동 |
| `npm/lib/update.mjs` | CREATE | lib/update.mjs 이동 |
| `npm/package.json` | CREATE | package.json 이동 |
| `npm/.npmignore` | CREATE | .npmignore 이동 |
| `npm/.agent/router_rule_config.json` | CREATE | .agent/router_rule_config.json 이동 |

## Acceptance Criteria
- [ ] npm/ 디렉토리 구조가 올바르게 생성됨
- [ ] npm/bin/cli.mjs 파일이 존재
- [ ] npm/lib/에 constants.mjs, init.mjs, update.mjs가 존재
- [ ] npm/package.json 파일이 존재
- [ ] npm/.npmignore 파일이 존재
- [ ] npm/.agent/router_rule_config.json 파일이 존재

## Verify
```bash
# 디렉토리 구조 확인
ls npm/bin/cli.mjs
ls npm/lib/constants.mjs npm/lib/init.mjs npm/lib/update.mjs
ls npm/package.json
ls npm/.npmignore
ls npm/.agent/router_rule_config.json
```
