---
name: work-status
description: Shows WORK status (read-only). Use ONLY when the user asks to VIEW status — not to execute or resume. Matches queries like "WORK 목록", "상태 확인", "WORK-01 상태", "show status". Do NOT use for "실행", "계속", "resume" — those go to work-pipeline.
---

# WORK 상태

WORK 및 TASK의 현재 상태를 확인하고 보고합니다.

## 확인 방법

1. `works/WORK-LIST.md`를 읽어 모든 WORK의 마스터 인덱스 확인
2. 특정 WORK의 경우 `works/WORK-NN/work_WORK-NN.log` 마지막 줄을 읽어 현재 진행 상황 확인
3. 특정 TASK의 경우 `works/WORK-NN/TASK-NN_result.md`를 읽어 완료 상세 확인

## 상태 값

| 상태 | 의미 |
|------|------|
| `IN_PROGRESS` | WORK 생성됨, TASK 실행 중 |
| `DONE` | 모든 TASK 커밋됨 — orchestrator가 마지막 TASK에서 인라인 커밋 후 자동 설정 |
| `COMPLETED` | `_COMPLETED/`로 아카이빙됨 — push 시 설정 |

## 표시 형식

```
WORK 상태
  WORK-01: 사용자 인증    ✅ 5/5 완료
  WORK-02: 결제 연동      🔄 2/4 진행 중
  WORK-03: 관리자 대시보드  ⬜ 0/6 대기
```

## Arguments

Query: $ARGUMENTS
