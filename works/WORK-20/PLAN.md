# WORK-20: works 하위 파일 조사하여 WORK-LIST.md 갱신

> Created: 2026-03-15
> 요구사항: N/A
> Execution-Mode: direct
> Project: uc-taskmanager
> Tech Stack: Markdown
> Language: ko
> Status: PLANNED

## Goal
works 디렉토리 하위의 모든 WORK 폴더를 조사하여 WORK-LIST.md를 현재 상태에 맞게 갱신한다.

## Task Dependency Graph
TASK-00 (독립)

## Tasks

### TASK-00: WORK-LIST.md 갱신
- **Depends on**: (none)
- **Scope**: 각 WORK 폴더의 PLAN.md에서 제목/생성일을 추출하고, TASK result 파일로 완료 여부를 판단하여 WORK-LIST.md를 재작성
- **Files**:
  - `works/WORK-LIST.md` — WORK 목록 갱신
