# WORK-39: 커미터 git staging 버그 수정 — works/ 파일 누락 방지

> Created: 2026-03-21
> Requirement: 커미터 에이전트가 specifier가 생성한 works/WORK-NN/ 파일들을 git commit에서 누락하는 버그 수정
> Execution-Mode: direct
> Project: uc-taskmanager
> Tech Stack: Markdown (agent prompts)
> Language: ko
> Status: PLANNED

## Goal
커미터의 git add 명령을 `git add -A`에서 명시적 경로 지정으로 변경하여, Claude Code 내장 안전 규칙에 의한 works/ 파일 누락 버그를 해결한다.

## Task Dependency Graph
```
TASK-00 (단독)
```

## Tasks

### TASK-00: committer.md (ko/en) git staging 로직 변경
- **Depends on**: (none)
- **Scope**: 양쪽 committer.md의 3-6 Git Commit 섹션, 2번 업무 테이블, 3-2 실행 순서에서 `git add -A`를 명시적 경로 스테이징으로 변경
- **Files**:
  - `agents/ko/committer.md` — 3-6, 2번 테이블, 3-2 수정
  - `agents/en/committer.md` — 3-6, 2번 테이블, 3-2 수정
