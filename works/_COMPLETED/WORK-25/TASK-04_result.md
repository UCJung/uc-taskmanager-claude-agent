# TASK-04 Result

> WORK: WORK-25 — 에이전트 md 파일 중복 제거 및 지침 참조 전환
> Completed: 2026-03-16 00:32
> Status: **DONE**
> Commit: 8027b87

## 요약

router.md에서 지침 파일과 중복된 3개 영역(pipeline/full dispatch XML 2개, Output Language Rule)을 제거하고 참조로 대체하여 router 고유 내용(execution-mode 결정, WORK ID 결정, direct 모드 실행)을 보존.

## 완료 체크리스트

- [x] pipeline dispatch XML 제거 → xml-schema.md § 1 참조로 대체 ("builder 디스패치 subagent 실행 후 메시지 디스패치" 문구 유지)
- [x] full dispatch XML 2개 제거 → xml-schema.md § 1 참조로 대체 (절차 설명/호출 방식 문구 유지)
- [x] Output Language Rule 참조 전환 → shared-prompt-sections.md § 1 참조 + router 고유 규칙 유지
- [x] 기존 참조 유지 (WORK-LIST.md shared-prompt-sections.md § 8)

## 변경 파일

### Modified
- `agents/router.md` — 3개 영역 참조 전환 완료

## 검증 결과

- Build: ✅ (self-check)
- Lint: ✅ (self-check)

## 발생 이슈

None

## 후속 TASK 참고사항

None

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)

router.md의 3개 중복 영역을 지침 파일 참조로 대체. router 고유 내용(execution-mode 결정 알고리즘, WORK ID 결정 로직, direct 모드 self-check 및 commit, "dispatch <context><language> 필드로 전달" 규칙)은 모두 보존.

### Verifier Context (FULL)

- **what**: router.md의 중복 제거가 정확하게 수행됨. 지침 파일과 동일한 코드 블록/규칙만 제거되고, router 고유 로직은 모두 보존.
- **why**: router.md의 3개 섹션별로 progress.md Status=COMPLETED 확인, 참조 전환 검증, router 고유 부분(execution-mode, WORK ID, direct 모드)의 무결성 확인.
- **caution**: None
- **incomplete**: None
