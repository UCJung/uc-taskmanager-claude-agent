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
     agents/en/*.md → plugin/agents/*.md (복사 후 `.claude/agents/` → `../skills/sdd-pipeline/references/` 경로 치환)
   - 참조 문서 6개(agent-flow, file-content-schema, shared-prompt-sections, context-policy, xml-schema, work-activity-log):
     agents/en/*.md → plugin/skills/sdd-pipeline/references/*.md (복사 후 `.claude/agents/` → `../skills/sdd-pipeline/references/` 경로 치환)
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


