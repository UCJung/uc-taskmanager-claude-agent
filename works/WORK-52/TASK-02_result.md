# TASK-02 결과 — scheduler.md 삭제 + 잔여 레퍼런스 정합화

- 상태: DONE (PASS) · FR: FR-2, FR-6, FR-7

## 변경
- `develop/agents/scheduler.md` 삭제 (DAG 로직 orchestrator STEP C 흡수)
- `context-policy.md` — Scheduler 디스패치 → Orchestrator 디스패치
- `callback-protocol.md` — 콜백 발신 주체 orchestrator 일괄
- `shared-prompt-sections.md` — §6 자동결정 기록 관례 신설, §4 Discovery 이벤트명을 신규 체계로 교체

## 검증
- scheduler.md deleted OK
- context-policy.md:68 "scheduler" 1건은 마이그레이션 설명목적(허용)
- shared-prompt §8 WORK-LIST의 "Main Claude"는 push 절차 소관(유지)

## 발견(범위 밖, 후속)
- committer.md:90 → shared-prompt §13 참조하나 실제 §12 (기존 불일치) → TASK-08 스윕에서 확인
