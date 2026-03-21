# TASK-00: calc.js ESM 모듈 및 테스트 파일 작성

## WORK
WORK-TEST: Simple Calculator ESM 모듈 + 테스트

## Dependencies
- (none)

## Scope
사칙연산(add, subtract, multiply, divide) 함수 4개를 export하는 ESM 모듈 calc.js와 node:test 내장 테스트 러너 기반 calc.test.js를 작성한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `works/WORK-TEST/calc.js` | CREATE | add, subtract, multiply, divide 함수 export (ESM) |
| `works/WORK-TEST/calc.test.js` | CREATE | node:test 기반 테스트 — 각 함수별 정상 케이스 + divide by zero 처리 |

## Acceptance Criteria
- [ ] calc.js가 ESM export로 4개 함수를 내보냄
- [ ] calc.test.js가 node --test로 실행 시 모든 테스트 통과
- [ ] divide(n, 0) 시 적절한 에러 처리

## Verify
```bash
node --test works/WORK-TEST/calc.test.js
```
