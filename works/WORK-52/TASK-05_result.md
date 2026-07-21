# TASK-05 결과 — 자식 에이전트 5종 수정

- 상태: DONE (PASS) · FR: FR-8, FR-6

## 변경 (specifier/planner/builder/verifier/committer.md)
- 보고 대상 "Main Claude" → "orchestrator" (전 파일)
- 로그/콜백 기록 STEP·문구 제거 (orchestrator 일괄로 이관)
- specifier/planner/builder: 모호점 시 `<needs-decision>` 반환 규칙 추가
- description의 Skill 트리거/scheduler 문구 제거
- 자식 tools에 Agent/Task 미추가(중첩 불필요)

## builder 판단(적절, 플래그됨)
- 잔여 scheduler 참조 제거
- specifier의 direct/pipeline planner 로직을 orchestrator STEP B와 정합(direct만 planner 생략)
- committer는 work-activity-log.md만 read-only 유지(마지막 TASK 판정용), WORK-LIST DONE 판정을 `STAGE_DONE — stage=committer`로 갱신

## 검증
- Main Claude 0 / orchestrator 5파일 / needs-decision 3파일 / scheduler 0 / 자식 tools 불변
