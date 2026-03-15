# TASK-00 Result

> WORK: WORK-25 — 에이전트 md 파일 중복 제거 및 지침 참조 전환
> Completed: 2026-03-16 00:32
> Status: **DONE**
> Commit: 8027b87

## 요약

builder.md에서 지침 파일과 중복된 4개 영역(dispatch XML, Build/Lint 스크립트, task-result XML, Output Language Rule)을 제거하고 참조 표기로 대체하여 에이전트 고유 내용만 보존.

## 완료 체크리스트

- [x] dispatch XML 코드 블록 제거 → xml-schema.md § 1 참조로 대체
- [x] Build/Lint 스크립트 제거 → shared-prompt-sections.md § 2 참조로 대체
- [x] task-result XML 간소화 → xml-schema.md § 2, § 4 참조 + builder 고유 필드 유지
- [x] Output Language Rule 참조 전환 → shared-prompt-sections.md § 1 참조 + builder 고유 규칙 유지
- [x] builder 고유 내용 보존 (Serena 우선순위, Progress Checkpoint, ProgressCallback, Retry Protocol)

## 변경 파일

### Modified
- `agents/builder.md` — 4개 영역 참조 전환 완료

## 검증 결과

- Build: ✅ (self-check)
- Lint: ✅ (self-check)

## 발생 이슈

None

## 후속 TASK 참고사항

None

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)

builder.md의 4개 중복 영역(§ 3-2 XML Input 파싱, § 3-5 Self-Check, § 3-8 Context-Handoff Output, § 4 Output Language Rule)을 지침 파일 참조로 대체. builder 고유 내용(Serena 우선순위, Progress Checkpoint, ProgressCallback, Retry Protocol, CommentLanguage override)은 모두 보존.

### Verifier Context (FULL)

- **what**: builder.md의 중복 제거가 정확하게 수행됨. 지침 파일과 동일한 코드 블록/규칙만 제거되고, 에이전트 고유 내용은 모두 보존.
- **why**: builder.md의 4개 섹션별로 progress.md Status=COMPLETED 확인, 각 섹션의 참조 전환 상태 검증, builder 고유 부분의 무결성 확인.
- **caution**: None
- **incomplete**: None
