# TASK-00 결과 — 스키마 레퍼런스 정합화

- 상태: DONE (PASS)
- 대상 FR: FR-4, FR-6, FR-7

## 변경 파일
- `develop/references/xml-schema.md` — 디스패처 라벨 orchestrator화, 신규 `<gate type="stage|decision">`(§5)/`<needs-decision>`(§6)/`<decision>`(§7) 정의 + 예시 XML
- `develop/references/work-activity-log.md` — 기록 주체 orchestrator 일원화, 이벤트 체계 개정(`ORCHESTRATOR_*`/`STAGE_START/DONE`/`GATE_WAIT`/`DECISION_WAIT`/`DECISION`), **STAGE_DONE=게이트 통과 후** 규칙 명시
- `develop/references/file-content-schema.md` — `DECISIONS.md` 포맷 신설(§5, 상태 PENDING|RESOLVED) + 파일명 규칙 표 갱신

## 검증
- `grep needs-decision xml-schema.md` / `grep GATE_WAIT work-activity-log.md` / `grep DECISIONS.md file-content-schema.md` 모두 매치
- 기존 PLAN/TASK 양식·파서 정규식 미변경 확인

## 후속 참조 계약 (TASK-01~ 사용)
- 신호: `<gate type="stage|decision" work stage>`, `<needs-decision work task agent>`, `<decision work stage|task by="user|auto">`
- 로그 이벤트: `ORCHESTRATOR_START/DONE`, `STAGE_START/STAGE_DONE`, `GATE_WAIT`, `DECISION_WAIT`, `DECISION`
- 규칙: STAGE_DONE은 게이트 RESOLVED 이후에만 기록
- 산출물: `works/{WORK}/DECISIONS.md`(생성 주체 orchestrator)
