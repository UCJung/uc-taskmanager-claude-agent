# TASK-00 Result

> WORK: WORK-26 — agents 참조문서 5개 핵심 축소
> Completed: 2026-03-16
> Execution-Mode: direct
> Status: **DONE**
> Commit: ab3fb6b

## 요약
agents/ 참조문서 5개에서 중복 내용, 장황한 설명, 과다 예시를 제거하여 608줄 -> 523줄로 축소 (14%). 모든 섹션 참조(Section number) 무결성 유지.

## 변경 파일
- `agents/file-content-schema.md` — COMPLIANCE 테이블 간결화, 다국어 매핑 테이블 삭제, Status 전이 테이블 1줄화
- `agents/shared-prompt-sections.md` — § 7 필수 컬럼 축소, § 4 FS Discovery 간결화, cache_control 참조 삭제, Version 삭제
- `agents/xml-schema.md` — § 3/§ 5 통합, cache-hint 요소 삭제, Dispatcher-Receiver 매핑 간결화
- `agents/context-policy.md` — Builder/Verifier 개별 XML 예시 -> 테이블화, Scheduler 예시 3개 -> 2개, Committer 재시도 1줄 요약
- `agents/work-activity-log.md` — 장황한 설명 테이블화, 오타 수정
- `agents/committer.md` — 삭제된 다국어 매핑 테이블 참조를 § 4 템플릿 참조로 변경

## 검증
- Build: PASS (self-check)
- Lint: PASS (self-check)
