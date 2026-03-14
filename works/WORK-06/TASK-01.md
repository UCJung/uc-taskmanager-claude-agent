# WORK-06-TASK-01: shared-prompt-sections.md에 섹션 헤더 번역 규칙 추가

> WORK: WORK-06 — committer result 파일 섹션 헤더 다국어 대응
> Depends on: 없음

## 목적

agents/shared-prompt-sections.md Section 1 (Output Language Rule)의 Content 블록 내에
"결과 파일의 섹션 헤더(##)도 resolved language로 작성한다" 규칙을 추가한다.

## 구현 내용

Section 1 Content 블록의 기존 규칙 목록 끝에 추가:

```
- **결과 파일의 섹션 헤더(##)도 resolved language로 작성한다.**
  각 에이전트 파일의 언어별 섹션 헤더 매핑 테이블(ko/en/ja)을 참조하여
  resolved language에 맞는 헤더를 사용할 것.
```

## 대상 파일

- `agents/shared-prompt-sections.md` — MODIFY

## 인수 조건

- [ ] Section 1 Content 블록 내에 섹션 헤더 번역 규칙 문장 존재

## 검증

```bash
grep "섹션 헤더" agents/shared-prompt-sections.md
```
