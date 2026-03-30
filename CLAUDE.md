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
   - 에이전트 6개(specifier, planner, scheduler, builder, verifier, committer):
     agents/en/*.md → plugin/agents/*.md (경로 치환 불필요 — `{REFERENCES_DIR}/`이 그대로 사용됨)
   - 참조 문서 6개(agent-flow, file-content-schema, shared-prompt-sections, context-policy, xml-schema, work-activity-log):
     agents/en/*.md → plugin/skills/sdd-pipeline/references/*.md (경로 치환 불필요)
2. **DONE WORK 일괄 완료 처리** — WORK-LIST.md에서 DONE 상태인 WORK를 찾아 COMPLETED로 전환한다
   - WORK-LIST.md에서 `DONE` 상태인 행을 모두 찾아 제거
   - 해당 WORK 폴더(`works/WORK-NN/`)를 `works/_COMPLETED/`로 이동
   - 변경사항 스테이징 (`git add`)
3. **README.md 업데이트** — 이번 작업에서 추가/변경된 내용이 README에 반영되어 있는지 확인하고, 누락된 내용이 있으면 업데이트한다
4. **npm README 동기화** — `README.md` → `npm/README.md` 복사 (영문 README만, 한국어 제외)
5. **git push**

README 업데이트 범위:
- 새로운 에이전트 또는 기능이 추가된 경우 해당 섹션 반영
- 파일 구조가 변경된 경우 Repository Structure 섹션 반영
- 동작 방식이 변경된 경우 Pipeline 또는 Why This Approach 섹션 반영
- 변경 없으면 업데이트 생략

## npm 버전업 절차

사용자가 npm 버전업을 요청하면 다음을 추가로 수행한다:

1. **플러그인 리소스 복사** — plugin 폴더의 아래 항목을 npm/ 하위로 복사
   - `plugin/.claude-plugin` → `npm/.claude-plugin`
   - `plugin/skills/` → `npm/skills/`
2. 에이전트 동기화 (Push 절차 1단계와 동일)
3. `npm version patch|minor|major` 실행
4. `npm publish`

## Agent 테스트

Agent/Skill/Hook 변경 시 파이프라인 동작 검증 방법: [docs/guide_agent-testing.md](docs/guide_agent-testing.md)

## 진행 중 리펙토링

Agent/Skill/Hook 분리 리펙토링 진행 중: [todo/todo_refactoring_seperate_agent_skill_hook.md](todo/todo_refactoring_seperate_agent_skill_hook.md)
- § 5.1: 완료된 변경 (develop/ 구조 개편, en/ko 통합, hook 구현, 테스트)
- § 5.2: 남은 변경 대상 (REFERENCES_DIR 경로, Agent description 정비, plugin/npm 동기화)
- 이전 세션의 작업을 이어서 진행할 것

## Language

ko
CommitLanguage: en