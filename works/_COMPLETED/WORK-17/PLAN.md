# WORK-17: router.md 3-7 Work Activity Log 섹션 분리

> Created: 2026-03-15
> 요구사항: N/A
> Execution-Mode: pipeline
> Project: uc-taskmanager
> Tech Stack: Markdown
> Language: ko
> Status: PLANNED

## Goal

`agents/router.md`의 `### 3-7. Work Activity Log` 섹션 내용을 별도 파일 `agents/work-activity-log.md`로 분리하고, router.md에서는 해당 섹션 내용을 제거한 후 상단 STARTUP 참조 파일 테이블(3-1)에 신규 파일 항목을 추가한다.

## Task Dependency Graph

```
TASK-00
```

## Tasks

### TASK-00: router.md 3-7 섹션 분리 및 work-activity-log.md 생성
- **Depends on**: (none)
- **Scope**: `agents/work-activity-log.md` 신규 생성, `agents/router.md` 3-7 섹션 내용 제거 및 3-1 참조 테이블 갱신
- **Files**:
  - `agents/work-activity-log.md` — 신규 생성 (3-7 섹션 내용 이관)
  - `agents/router.md` — 3-7 내용 제거, 3-1 참조 테이블에 항목 추가
