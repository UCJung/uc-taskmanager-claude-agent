# WORK-09: CLAUDE.md 콜백 URL 기반 외부 시스템 결과 전달

> Created: 2026-03-12
> 요구사항: N/A
> Project: uc-taskmanager (Universal Claude Task Manager)
> Tech Stack: Claude Code CLI Subagent System (Markdown-based agent definitions)
> Language: ko
> Status: PLANNED

## Goal

uc-taskmanager의 범용성을 유지하면서, CLAUDE.md에 콜백 URL을 선택적으로 주입하면 committer/builder가 자동으로 외부 시스템(예: uc-teamspace)에 결과를 전달하는 구조를 구현한다. 설정이 없으면 기존 동작 그대로 유지된다.

## Background

현재 에이전트 파이프라인은 로컬 파일 기반으로만 결과를 남긴다(result.md + git commit). 외부 시스템(예: uc-teamspace)이 파이프라인 진행 상태나 완료 결과를 실시간으로 수신하려면, 에이전트가 능동적으로 HTTP 콜백을 호출해야 한다.

핵심 원칙:
- **선택적 활성화**: CLAUDE.md에 `TaskCallback`/`ProgressCallback` URL이 있을 때만 동작
- **실패 허용**: curl 호출 실패 시 경고만 출력, 본 작업은 계속 진행
- **범용성 유지**: 콜백 설정이 없는 프로젝트에는 영향 없음

## Task Dependency Graph

```
TASK-00 (shared-prompt-sections.md 콜백 섹션 추가)
   |
   +---> TASK-01 (committer.md TaskCallback curl 호출)
   |
   +---> TASK-02 (builder.md ProgressCallback curl 호출)
              |
              v
         TASK-03 (콜백 통합 설계 명세 문서)
```

## Tasks

### WORK-09-TASK-00: shared-prompt-sections.md에 Task Callbacks 섹션 추가
- **Depends on**: (none)
- **Scope**: CLAUDE.md 콜백 설정 스펙 정의 및 shared-prompt-sections.md에 콜백 읽기 가이드 섹션 추가
- **Files**: `agents/shared-prompt-sections.md`
- **Acceptance Criteria**:
  - [ ] Task Callbacks 섹션이 추가됨
  - [ ] TaskCallback, ProgressCallback, CallbackToken 설정 형식이 문서화됨

### WORK-09-TASK-01: committer.md TaskCallback 조건부 curl 호출 추가
- **Depends on**: WORK-09-TASK-00
- **Scope**: committer가 result.md 작성 + git commit 완료 후 TaskCallback URL로 결과를 POST 전송
- **Files**: `agents/committer.md`
- **Acceptance Criteria**:
  - [ ] CLAUDE.md에서 TaskCallback URL 읽기 로직 추가
  - [ ] curl POST 호출 페이로드 정의
  - [ ] curl 실패 시 경고만 출력하고 계속 진행

### WORK-09-TASK-02: builder.md ProgressCallback 조건부 curl 호출 추가
- **Depends on**: WORK-09-TASK-00
- **Scope**: builder가 progress 체크포인트 업데이트 후 ProgressCallback URL로 진행 상태를 POST 전송
- **Files**: `agents/builder.md`
- **Acceptance Criteria**:
  - [ ] CLAUDE.md에서 ProgressCallback URL 읽기 로직 추가
  - [ ] curl POST 호출 페이로드 정의
  - [ ] curl 실패 시 경고만 출력하고 계속 진행

### WORK-09-TASK-03: 콜백 통합 설계 명세 문서 작성
- **Depends on**: WORK-09-TASK-01, WORK-09-TASK-02
- **Scope**: 전체 콜백 통합 설계를 정리한 명세 문서 작성
- **Files**: `docs/spec_callback-integration.md`
- **Acceptance Criteria**:
  - [ ] CLAUDE.md 설정 스펙, 페이로드 스키마, 에러 처리 전략이 문서화됨
  - [ ] committer/builder 콜백 흐름이 다이어그램으로 설명됨
