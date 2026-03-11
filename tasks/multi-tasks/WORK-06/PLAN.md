# WORK-06: committer result 파일 섹션 헤더 다국어 대응

> REQ: REQ-049
> Language: ko
> Created: 2026-03-11
> Status: COMPLETED
> 요구사항: REQ-049

## 목표

committer 에이전트가 생성하는 result.md 파일의 섹션 헤더(## Summary 등)가
PLAN.md Language 설정과 무관하게 영어 고정인 문제를 해결한다.
언어별 섹션 헤더 매핑 테이블을 추가하고, Output Language Rule에 번역 지시를 명시한다.

## TASK 목록

| TASK | 제목 | 의존성 |
|------|------|--------|
| WORK-06-TASK-00 | committer.md에 언어별 섹션 헤더 매핑 추가 | 없음 |
| WORK-06-TASK-01 | shared-prompt-sections.md에 섹션 헤더 번역 규칙 추가 | 없음 |
| WORK-06-TASK-02 | 전역 설치 파일 동기화 | TASK-00, TASK-01 |

## Task Dependency Graph

```
TASK-00 ──┐
           ├──→ TASK-02
TASK-01 ──┘
```
