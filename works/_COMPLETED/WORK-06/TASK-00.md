# WORK-06-TASK-00: committer.md에 언어별 섹션 헤더 매핑 추가

> WORK: WORK-06 — committer result 파일 섹션 헤더 다국어 대응
> Depends on: 없음

## 목적

agents/committer.md의 Step 1 result 템플릿에 언어별 섹션 헤더 매핑 테이블(ko/en/ja)을 추가하고,
Output Language Rule에 "섹션 헤더도 resolved language로 작성" 지시를 추가한다.

## 구현 내용

### 1. 언어별 섹션 헤더 매핑 테이블 추가 (Step 1 앞에 삽입)

```markdown
<!-- 언어별 섹션 헤더 매핑 -->
| 언어 | Summary | Completed Checklist | Verification Results | Files Changed | Issues Encountered | Notes for Subsequent Tasks |
|------|---------|---------------------|----------------------|---------------|-------------------|---------------------------|
| en | ## Summary | ## Completed Checklist | ## Verification Results | ## Files Changed | ## Issues Encountered | ## Notes for Subsequent Tasks |
| ko | ## 요약 | ## 완료 체크리스트 | ## 검증 결과 | ## 변경 파일 | ## 발생 이슈 | ## 후속 TASK 참고사항 |
| ja | ## サマリー | ## 完了チェックリスト | ## 検証結果 | ## 変更ファイル | ## 発生した問題 | ## 後続タスクへの注記 |
```

### 2. Output Language Rule에 섹션 헤더 번역 지시 추가

기존:
```
- Write result report (summary, checklist, notes) in the resolved language
```

변경:
```
- Write result report (summary, checklist, notes) in the resolved language
- **결과 파일의 섹션 헤더(##)도 resolved language로 작성한다.** 위 언어별 섹션 헤더 매핑 테이블 참조.
```

### 3. result 템플릿 주석 보강

`## Summary` 등 영어 헤더에 `{resolved language에 따라 변환}` 주석 추가

## 대상 파일

- `agents/committer.md` — MODIFY

## 인수 조건

- [ ] 언어별 섹션 헤더 매핑 테이블(ko/en/ja)이 committer.md에 존재
- [ ] Output Language Rule에 섹션 헤더 번역 지시 문장 존재
- [ ] result 템플릿에 헤더 번역 안내 주석 존재

## 검증

```bash
grep -c "요약" agents/committer.md
grep -c "サマリー" agents/committer.md
grep "섹션 헤더" agents/committer.md
```
