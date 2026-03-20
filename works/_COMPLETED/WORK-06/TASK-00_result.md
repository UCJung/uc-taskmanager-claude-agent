# WORK-06-TASK-00 Result

> WORK: WORK-06 — committer result 파일 섹션 헤더 다국어 대응
> Completed: 2026-03-11
> Status: **DONE**

## 요약

committer.md Step 1에 언어별(en/ko/ja) 섹션 헤더 매핑 테이블을 추가하고, Output Language Rule에 섹션 헤더 번역 지시 문장을 추가하였다.

## 완료 체크리스트

- [x] 언어별 섹션 헤더 매핑 테이블(ko/en/ja)이 committer.md에 존재
- [x] Output Language Rule에 섹션 헤더 번역 지시 문장 존재
- [x] result 템플릿에 헤더 번역 안내 표기 존재

## 검증 결과

- grep "요약" agents/committer.md: ✅ (3건)
- grep "サマリー" agents/committer.md: ✅ (2건)
- grep "섹션 헤더" agents/committer.md: ✅ (3건)

## 변경 파일

### Modified
- `agents/committer.md` — Step 1에 언어별 섹션 헤더 매핑 테이블 추가, result 템플릿 헤더에 언어별 변환 안내 표기, Output Language Rule에 섹션 헤더 번역 지시 추가

## 발생 이슈

없음

## 후속 TASK 참고사항

TASK-02(전역 동기화)에서 수정된 committer.md를 ~/.claude/agents/에 복사해야 함
