# TASK-04 결과 — work-pipeline SKILL 간소화

- 상태: DONE (PASS) · FR: FR-3, FR-5, FR-7

## 변경
- `develop/skills/work-pipeline/SKILL.md` — 다단계 스폰 프로즈 제거, orchestrator 중심 오케스트레이션 흐름 신설
  - gated: mode=gated spawn + agentId 보관 → `<gate>`(stage/decision, decision은 AskUserQuestion) → SendMessage 재개(폴백 re-spawn) → TaskStop 종료
  - auto: mode=auto 1회 spawn 완주
  - 트리거/REFERENCES_DIR/auto 감지 유지, scheduler 참조 제거(0)

## 검증
- grep orchestrator/mode=/SendMessage/TaskStop → 12 매치
- grep scheduler → 0
