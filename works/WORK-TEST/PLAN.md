# WORK-TEST: Simple Calculator ESM 모듈 + 테스트

> Created: 2026-03-20
> 요구사항: N/A
> Execution-Mode: pipeline
> Project: uc-taskmanager
> Tech Stack: Node.js (ESM, node:test)
> Language: ko
> Status: PLANNED

## Goal
사칙연산(add, subtract, multiply, divide) 함수 4개를 export하는 ESM 모듈과 node --test 기반 테스트 파일을 생성한다.

## Task Dependency Graph
```
TASK-00 (calc.js + calc.test.js 구현)
```

## Tasks

### TASK-00: calc.js ESM 모듈 및 테스트 파일 작성
- **Depends on**: (none)
- **Scope**: add, subtract, multiply, divide 함수를 export하는 calc.js와 node:test 기반 calc.test.js 작성
- **Files**:
  - `works/WORK-TEST/calc.js` — 사칙연산 함수 4개 export (ESM)
  - `works/WORK-TEST/calc.test.js` — node:test 기반 테스트 파일
