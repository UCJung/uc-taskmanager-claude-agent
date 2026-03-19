# REQ-04: CLAUDE.md 템플릿 다국어

## 요구사항
- init 시 선택된 lang에 맞는 CLAUDE_MD_SECTION 삽입
- KO 버전: 현재 그대로 (Agent 호출 규칙, [추가기능] 등)
- EN 버전:
  - "## Agent Invocation Rules"
  - [new-feature], [bugfix], [enhancement], [new-work] 태그
  - 동일 구조, 영문 설명

## 제약
- 기존 CLAUDE.md에 이미 섹션이 있으면 skip (현재 로직 유지)
- 판별 키워드: KO='Agent 호출 규칙', EN='Agent Invocation Rules'
