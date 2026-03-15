# WORK-26: agents 참조문서 5개 핵심 축소

> Created: 2026-03-16
> 요구사항: N/A
> Execution-Mode: direct
> Project: uc-taskmanager
> Tech Stack: Markdown
> Language: ko
> Status: PLANNED

## Goal
agents/ 폴더의 참조문서 5개(file-content-schema.md, shared-prompt-sections.md, xml-schema.md, context-policy.md, work-activity-log.md)에서 불필요한 중복, 장황한 설명, 예시 과다를 제거하여 핵심만 남긴다.

## Task Dependency Graph
```
TASK-00 (5개 참조문서 축소)
```

## Tasks

### TASK-00: 참조문서 5개 핵심 축소
- **Depends on**: (none)
- **Scope**: 5개 파일의 중복/장황/과다 예시 제거
- **Files**:
  - `agents/file-content-schema.md` — 다국어 매핑 테이블 삭제, § 4/§ 5 통합, COMPLIANCE 간결화
  - `agents/shared-prompt-sections.md` — § 7 중복 제거, § 4 간결화
  - `agents/xml-schema.md` — § 3/§ 5 통합
  - `agents/context-policy.md` — XML 예시 축소, 재시도 규칙 요약화
  - `agents/work-activity-log.md` — 장황한 설명 테이블화
