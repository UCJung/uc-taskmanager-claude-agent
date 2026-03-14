# WORK-06-TASK-01 Result

> WORK: WORK-06 — committer result 파일 섹션 헤더 다국어 대응
> Completed: 2026-03-11
> Status: **DONE**

## 요약

shared-prompt-sections.md Section 1 (Output Language Rule) Content 블록에 "결과 파일의 섹션 헤더(##)도 resolved language로 작성한다" 규칙을 추가하였다.

## 완료 체크리스트

- [x] Section 1 Content 블록 내에 섹션 헤더 번역 규칙 문장 존재

## 검증 결과

- grep "섹션 헤더" agents/shared-prompt-sections.md: ✅ (2건)

## 변경 파일

### Modified
- `agents/shared-prompt-sections.md` — Section 1 Output Language Rule Content 블록에 섹션 헤더 번역 규칙 추가

## 발생 이슈

없음

## 후속 TASK 참고사항

TASK-02(전역 동기화)에서 수정된 shared-prompt-sections.md를 ~/.claude/agents/에 복사해야 함
