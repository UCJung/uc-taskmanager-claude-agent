# WORK-25: 에이전트 md 파일 중복 제거 및 지침 참조 전환

> Created: 2025-03-16
> 요구사항: N/A
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Markdown (에이전트 프롬프트 문서)
> Language: ko
> Status: IN_PROGRESS

## Goal

`agents/` 폴더의 6개 에이전트 md 파일에서 5개 지침 파일과 중복된 내용을 제거하고, 참조 표기로 대체하여 에이전트 고유 내용만 남긴다.

## 참조 지침 파일

| 파일 | 역할 |
|------|------|
| `shared-prompt-sections.md` | 공통 규칙: 언어, 빌드/린트, 파일 경로, FS 스크립트, WORK-LIST |
| `xml-schema.md` | dispatch/task-result/context-handoff XML 포맷 |
| `context-policy.md` | 슬라이딩 윈도우 규칙, 에이전트별 입출력, gate, 재시도 |
| `file-content-schema.md` | PLAN.md/TASK/progress/result 파일 스키마 |
| `work-activity-log.md` | log_work 함수, STAGE 테이블 |

## Task Dependency Graph

```
TASK-00 (builder.md)     ─┐
TASK-01 (verifier.md)    ─┤
TASK-02 (committer.md)   ─┼─ 모두 독립 / 병렬 가능
TASK-03 (scheduler.md)   ─┤
TASK-04 (router.md)      ─┤
TASK-05 (planner.md)     ─┘
```

## 변환 원칙

1. 지침 파일과 **동일한 코드 블록/규칙**만 제거
2. 제거한 자리에 `→ 참조: {파일명} § N` 형태의 한 줄 참조로 대체
3. 에이전트 **고유 로직**(커스텀 워크플로우, 에이전트 특화 필드)은 반드시 유지
4. 참조 전환 후에도 에이전트의 동작이 변하지 않아야 함
