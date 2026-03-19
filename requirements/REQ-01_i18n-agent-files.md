# REQ-01: 에이전트 파일 다국어 구조

## 요구사항
- agents/ 하위에 ko/, en/ 디렉토리로 언어별 에이전트 파일 분리
- 각 디렉토리에 동일한 12개 .md 파일 배치
- 기존 agents/*.md → agents/ko/ 로 이동
- agents/en/ 신규 작성 (영문 번역)

## 파일 목록 (12개 × 2 = 24개)
agent-flow.md, builder.md, committer.md, context-policy.md,
file-content-schema.md, planner.md, router.md, scheduler.md,
shared-prompt-sections.md, verifier.md, work-activity-log.md, xml-schema.md

## 제약
- 영문 에이전트도 Output Language Rule은 유지 (PLAN.md Language 필드 기준 출력)
- XML 스키마, 태그명은 언어 불문 동일 유지
- [new-feature], [bugfix] 등 트리거 태그는 영문 통일
