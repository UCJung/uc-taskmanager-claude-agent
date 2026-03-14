# WORK-07: 슬라이딩 윈도우 컨텍스트 전달 — result.md 재설계 및 파이프라인 안정성 강화

> Created: 2026-03-12
> 요구사항: N/A
> Project: uc-taskmanager (Universal Claude Task Manager)
> Tech Stack: Claude Code CLI Subagent System (Markdown-based agent definitions)
> Language: ko
> Status: PLANNED

## Goal

에이전트 파이프라인(scheduler → builder → verifier → committer)에 슬라이딩 윈도우 방식의 컨텍스트 전달을 도입한다. result.md 작성 주체를 committer로 변경하고, context-handoff 구조(what/why/caution/incomplete)를 추가하며, builder의 progress.md 체크포인트와 committer gate 역할, scheduler 재시도 로직을 구현하여 파이프라인 안정성을 강화한다.

## Background

현재 문제점:
1. result.md를 builder가 작성하므로, 빌드 실패 시에도 result.md가 생성될 수 있다
2. TASK 간 의존성 전달 시 어떤 정보를 상세/요약/드롭할지 규칙이 없어 토큰이 낭비된다
3. builder 비정상 종료 시 작업 진행 상태를 알 수 없어 재시도가 처음부터 시작된다
4. xml-schema.md에 context-handoff 같은 시맨틱 전달 구조가 없다

## Task Dependency Graph

```
TASK-00 (context-handoff 정책 + xml-schema.md 수정)
   |
   +---> TASK-01 (scheduler.md 슬라이딩 윈도우 + 재시도)
   |
   +---> TASK-02 (builder.md progress.md 체크포인트)
   |
   +---> TASK-03 (committer.md result.md 작성 + gate)
   |
   +---> TASK-04 (verifier.md context-handoff 기반 검증)
              |
              v
         TASK-05 (통합 검증 — 전체 파이프라인 흐름 일관성)
```

## Tasks

### WORK-07-TASK-00: context-handoff 정책 문서 + xml-schema.md 수정
- **Depends on**: (none)
- **Scope**: context-handoff 4-필드 구조(what/why/caution/incomplete)와 슬라이딩 윈도우 정책(직전=FULL, 2단계전=SUMMARY, 3단계전=DROP)을 정의하고, xml-schema.md에 context-handoff 요소 및 detail-level 속성을 추가한다
- **Files**: `agents/context-policy.md` (CREATE), `agents/xml-schema.md` (MODIFY)
- **Acceptance Criteria**: 정책 문서 생성, xml-schema.md에 context-handoff/detail-level 정의 완료

### WORK-07-TASK-01: scheduler.md 슬라이딩 윈도우 + TASK 간 의존성 전달 + 재시도 로직
- **Depends on**: WORK-07-TASK-00
- **Scope**: scheduler.md에 슬라이딩 윈도우 디스패치 로직, TASK 간 의존성 context-handoff 전달, committer FAIL 시 builder 재디스패치(progress.md 기반 재개) 로직을 추가한다
- **Files**: `agents/scheduler.md` (MODIFY)
- **Acceptance Criteria**: 슬라이딩 윈도우 규칙, 의존성 전달, 재시도 로직이 scheduler.md에 명시됨

### WORK-07-TASK-02: builder.md progress.md 실시간 체크포인트 규칙
- **Depends on**: WORK-07-TASK-00
- **Scope**: builder.md에서 result.md 작성 책임을 제거하고, 작업 중간 진행상태를 progress.md에 실시간 기록하는 체크포인트 규칙을 추가한다
- **Files**: `agents/builder.md` (MODIFY)
- **Acceptance Criteria**: result.md 작성 제거, progress.md 체크포인트 규칙 명시, context-handoff 출력 규칙 추가

### WORK-07-TASK-03: committer.md result.md 직접 작성 + gate 역할
- **Depends on**: WORK-07-TASK-00
- **Scope**: committer.md가 result.md를 직접 작성(what/why/caution/incomplete 구조)하도록 변경하고, progress.md 존재/완료 여부를 확인하는 gate 역할을 추가한다
- **Files**: `agents/committer.md` (MODIFY)
- **Acceptance Criteria**: result.md 작성 로직, gate 역할(progress.md 확인), FAIL 반환 규칙이 명시됨

### WORK-07-TASK-04: verifier.md context-handoff 기반 검증 규칙
- **Depends on**: WORK-07-TASK-00
- **Scope**: verifier.md에 builder의 context-handoff를 기반으로 검증하는 규칙과, 자신의 context-handoff를 committer에게 전달하는 출력 규칙을 추가한다
- **Files**: `agents/verifier.md` (MODIFY)
- **Acceptance Criteria**: builder context-handoff 기반 검증, verifier context-handoff 출력 규칙이 명시됨

### WORK-07-TASK-05: 통합 검증 — 전체 파이프라인 흐름 일관성 확인
- **Depends on**: WORK-07-TASK-01, WORK-07-TASK-02, WORK-07-TASK-03, WORK-07-TASK-04
- **Scope**: 전체 에이전트 파일 간 context-handoff 전달 흐름, 슬라이딩 윈도우 적용, result.md 작성 주체, progress.md 체크포인트, gate/재시도 로직의 일관성을 검증한다
- **Files**: 전체 에이전트 파일 (READ), `agents/context-policy.md` (READ)
- **Acceptance Criteria**: 전체 파이프라인 흐름이 context-policy.md와 일관됨
