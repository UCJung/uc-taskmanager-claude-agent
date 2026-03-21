# Requirement — WORK-39

## Original Request
> [BUG fix] 커미터 에이전트가 specifier가 생성한 works/WORK-NN/ 파일들을 git commit에서 누락하는 버그 수정

## Functional Requirements
- FR-01: 커미터의 Git Commit 단계(3-6)에서 `git add -A` 대신 명시적으로 `works/{WORK_ID}/` 디렉토리 전체 + builder 변경 파일을 스테이징하도록 변경
- FR-02: ko/en 양쪽 committer.md에 동일하게 적용

## Non-Functional Requirements
- NFR-01: Claude Code 내장 안전 규칙(`git add -A` 대신 개별 파일 지정 선호)을 우회할 수 있도록, 스테이징 대상을 명시적이면서도 누락 없이 지정

## Acceptance Criteria
- [ ] committer.md (ko/en) 3-6 Git Commit 섹션이 `works/{WORK_ID}/` 디렉토리 + builder 변경 파일을 명시적으로 스테이징
- [ ] `git add -A` 문구가 더 이상 사용되지 않음
- [ ] 2번 업무 테이블의 Git Commit 설명도 일관되게 변경
- [ ] 3-2 실행 순서 목록의 `git add -A` 참조도 일관되게 변경
