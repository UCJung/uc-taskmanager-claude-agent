# TASK-03 Result

> WORK: WORK-25 — 에이전트 md 파일 중복 제거 및 지침 참조 전환
> Completed: 2026-03-16 00:32
> Status: **DONE**
> Commit: 8027b87

## 요약

scheduler.md에서 지침 파일과 중복된 6개 영역(FS discovery 스크립트, 3개 dispatch XML, 슬라이딩 윈도우, multi-WORK 스크립트, Output Language Rule)을 제거하고 참조로 대체하여 scheduler 고유 내용(DAG resolution, 재시도 로직, 진행 보고)을 보존.

## 완료 체크리스트

- [x] FS discovery 스크립트 제거 → shared-prompt-sections.md § 4 참조로 대체
- [x] Builder Dispatch XML 제거 → xml-schema.md § 1 참조로 대체
- [x] Verifier Dispatch XML + 슬라이딩 윈도우 제거 → xml-schema.md § 1 + context-policy.md 참조로 대체
- [x] Committer Dispatch XML + 슬라이딩 윈도우 + 의존성 제거 → 참조로 대체 (Committer FAIL 재시도 로직 유지)
- [x] Multi-WORK 스크립트 제거 → shared-prompt-sections.md § 4 참조로 대체
- [x] Output Language Rule 참조 전환 → shared-prompt-sections.md § 1 참조 + scheduler 고유 규칙 유지

## 변경 파일

### Modified
- `agents/scheduler.md` — 6개 영역 참조 전환 완료

## 검증 결과

- Build: ✅ (self-check)
- Lint: ✅ (self-check)

## 발생 이슈

None

## 후속 TASK 참고사항

None

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)

scheduler.md의 6개 중복 영역을 지침 파일 참조로 대체. scheduler 고유 내용(DAG resolution, 사용자 승인, Pipeline Stage Callbacks, Committer FAIL 재시도 로직, 진행 보고, "모든 상태 메시지/PROGRESS.md를 resolved language로 작성" 규칙)은 모두 보존.

### Verifier Context (FULL)

- **what**: scheduler.md의 중복 제거가 정확하게 수행됨. 지침 파일과 동일한 코드 블록/규칙만 제거되고, scheduler 고유 로직은 모두 보존.
- **why**: scheduler.md의 6개 섹션별로 progress.md Status=COMPLETED 확인, 참조 전환 검증, scheduler 고유 부분(DAG, 재시도, 진행 보고)의 무결성 확인.
- **caution**: None
- **incomplete**: None
