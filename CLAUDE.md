# CLAUDE.md — uc-taskmanager 프로젝트 지침

## Claude 실행 지침
- 임의로 판단하여 작업을 실행하지 않는다.
- 임의로 판단하여 작업 범위을 결정하지 않는다.
- 별도의 요청이 없는 한 실행 시 승인을 요청한다.
- 요구사항 구조화 지시사항을 파악하고 결정이 필요한 부분은 내용을 제시하고 대화형으로 진행한다.

## Push 절차

사용자가 "push"를 요청하면 다음 순서로 실행한다:

1. **에이전트 동기화** — agents/ 원본을 npm/agents, plugin/agents로 복사
   - agents/en/*.md → npm/agents/*.md
   - agents/ko/*.md → npm/agents/ko/*.md
   - agents/en/*.md → plugin/agents/*.md
2. **README.md 업데이트** — 이번 작업에서 추가/변경된 내용이 README에 반영되어 있는지 확인하고, 누락된 내용이 있으면 업데이트한다
3. **git push**

README 업데이트 범위:
- 새로운 에이전트 또는 기능이 추가된 경우 해당 섹션 반영
- 파일 구조가 변경된 경우 Repository Structure 섹션 반영
- 동작 방식이 변경된 경우 Pipeline 또는 Why This Approach 섹션 반영
- 변경 없으면 업데이트 생략

## Language

ko
CommitLanguage: en

## Agent 호출 규칙

`[]` 태그로 시작하는 요청 → `.claude/agents/agent-flow.md` 를 읽고 파이프라인을 실행한다.

- **Main Claude가 오케스트레이터**다. 모든 에이전트 호출은 Main Claude가 직접 수행한다.
- `[]` 태그 감지 시 → specifier 호출 (첫 번째 에이전트)
- 각 에이전트는 작업 완료 후 결과(dispatch XML 또는 task-result XML)만 반환한다.
- Main Claude가 반환값을 받아 다음 에이전트를 순서대로 호출한다.
- 파이프라인 흐름은 `.claude/agents/agent-flow.md` 기준을 따른다.

예: `[추가기능]`, `[버그수정]`, `[리팩토링]`, `[WORK 시작]` 등
