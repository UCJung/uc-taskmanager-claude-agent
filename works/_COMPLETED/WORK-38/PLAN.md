# WORK-38: WORK-LIST 3단계 상태 분리 (IN_PROGRESS/DONE/COMPLETED)

> Created: 2026-03-21
> Requirement: works/WORK-38/Requirement.md
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Node.js, Markdown agents
> Language: ko
> Status: PLANNED

## 목표

WORK-LIST.md의 상태 전이를 기존 2단계(IN_PROGRESS → COMPLETED)에서 3단계(IN_PROGRESS → DONE → COMPLETED)로 분리하여, committer는 DONE까지만 처리하고, COMPLETED 전환(행 제거 + _COMPLETED 이동)은 push 시점에 Main Claude가 일괄 수행하도록 변경한다.

## Task Dependency Graph

```
TASK-00 (shared-prompt-sections § 8)
  ├── TASK-01 (committer § 3-9-1)
  ├── TASK-02 (specifier 안내 문구)
  └── TASK-03 (CLAUDE.md Push 절차)
```

## Tasks

### TASK-00: shared-prompt-sections.md § 8 DONE 상태 추가
- **Depends on**: (none)
- **Scope**: en/ko 양쪽 shared-prompt-sections.md § 8에 DONE 상태 행 추가, 3단계 전이 규칙 명시, committer/push 역할 재정의
- **Files**:
  - `agents/en/shared-prompt-sections.md` — § 8 WORK-LIST.md Update Rules 수정
  - `agents/ko/shared-prompt-sections.md` — § 8 WORK-LIST.md 갱신 규칙 수정

### TASK-01: committer.md § 3-9-1 DONE 전환으로 변경
- **Depends on**: TASK-00
- **Scope**: en/ko 양쪽 committer.md § 3-9-1을 행 제거 + _COMPLETED 이동에서 IN_PROGRESS → DONE 상태 변경만 수행하도록 변경. § 4 제약사항도 갱신
- **Files**:
  - `agents/en/committer.md` — § 3-9-1, § 4 WORK-LIST.md Rules 수정
  - `agents/ko/committer.md` — § 3-9-1, § 4 WORK-LIST.md 규칙 수정

### TASK-02: specifier.md IN_PROGRESS/DONE 안내 문구 반영
- **Depends on**: TASK-00
- **Scope**: en/ko 양쪽 specifier.md § 3-2에서 IN_PROGRESS WORK 존재 시 안내 문구에 DONE 상태도 포함
- **Files**:
  - `agents/en/specifier.md` — § 3-2 안내 문구 수정
  - `agents/ko/specifier.md` — § 3-2 안내 문구 수정

### TASK-03: CLAUDE.md Push 절차에 DONE 일괄 처리 단계 추가
- **Depends on**: TASK-00
- **Scope**: CLAUDE.md Push 절차에 DONE 상태 WORK를 COMPLETED로 일괄 전환(행 제거 + _COMPLETED/ 이동)하는 단계 추가
- **Files**:
  - `CLAUDE.md` — Push 절차 섹션 수정
