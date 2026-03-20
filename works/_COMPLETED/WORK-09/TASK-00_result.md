# WORK-09-TASK-00 Result

## Task
shared-prompt-sections.md에 Task Callbacks 섹션 추가

## Status
COMPLETED

## Summary
agents/shared-prompt-sections.md 파일에 Task Callbacks 섹션을 성공적으로 추가했습니다. 이 섹션은 CLAUDE.md에서 콜백 설정을 읽는 방법, 조건부 실행 패턴, 에러 처리 원칙, 그리고 TaskCallback/ProgressCallback의 curl 호출 템플릿을 포함합니다.

## Files Changed
- **Modified**: `agents/shared-prompt-sections.md`
  - Section 6 추가: Task Callbacks (External System Integration)
  - 콜백 설정 형식 (CLAUDE.md) 문서화
  - bash 스니펫: CLAUDE.md에서 콜백 URL/토큰 추출
  - 조건부 실행 가드 패턴
  - TaskCallback 페이로드 형식 (Committer)
  - ProgressCallback 페이로드 형식 (Builder)
  - 에러 처리 원칙 (curl 실패 시 경고만 출력)
  - Cache Control 마커 추가

## Verification Results
- File existence: PASS — Task Callbacks 섹션이 agents/shared-prompt-sections.md에 존재
- TaskCallback documented: PASS — TaskCallback 설정 형식과 curl 템플릿이 문서화됨
- ProgressCallback documented: PASS — ProgressCallback 설정 형식과 curl 템플릿이 문서화됨
- CallbackToken documented: PASS — CallbackToken 설정 형식이 문서화됨
- curl templates: PASS — TaskCallback/ProgressCallback의 curl POST 요청 템플릿 포함
- Error handling principles: PASS — curl 실패 시 경고 출력 후 계속 진행하는 원칙이 명시됨
- Conditional execution patterns: PASS — URL 존재 여부 확인하는 bash 가드 패턴 포함

## Acceptance Criteria
- [x] `agents/shared-prompt-sections.md`에 "Task Callbacks" 섹션이 추가됨
- [x] `TaskCallback`, `ProgressCallback`, `CallbackToken` 설정 형식이 문서화됨
- [x] CLAUDE.md에서 콜백 URL을 grep으로 추출하는 bash 스니펫이 포함됨
- [x] 조건부 실행 가드 패턴(URL 존재 여부 확인)이 포함됨
- [x] curl 실패 시 경고만 출력하는 에러 처리 원칙이 명시됨
- [x] Authorization 헤더 포함한 공통 curl POST 템플릿이 포함됨

## Commit Message
docs(WORK-09): Task Callbacks 섹션 추가 — 외부 시스템 콜백 통합 가이드 (WORK-09-TASK-00)

CLAUDE.md 콜백 설정 스펙, CLAUDE.md에서 설정 읽기 bash 스니펫, 조건부 실행 패턴, TaskCallback/ProgressCallback 페이로드 형식, 에러 처리 원칙을 shared-prompt-sections.md에 문서화

## Git Commit
Committer가 git add 및 git commit을 실행합니다.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
