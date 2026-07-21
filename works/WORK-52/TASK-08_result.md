# TASK-08 결과 — plugin/npm 동기화 + E2E 검증

- 상태: DONE (PASS, 1건 manual 잔여) · NFR: NFR-01, NFR-02 · FR: FR-1

## 동기화
- develop/ → plugin/, npm/ 동기화: agents(orchestrator 추가·scheduler 삭제·5종 갱신), references(8), skills(work-pipeline·sdd-pipeline), plugin.json
- 3-way diff(develop=plugin=npm): agents·references·skills 전부 일치, plugin.json 6 agents

## grep 스윕 (R-03)
- scheduler 잔여 = 의도적 설명 2파일만(orchestrator.md 흡수 설명, context-policy.md 마이그레이션). stale enum(xml-schema/work-activity-log/file-content-schema/sdd-pipeline) 정리 완료
- README "can't nest" = 0

## 정합성 수정
- committer.md: shared-prompt §13 → §12 (Bash 명령 규칙 실제 위치, TASK-02 발견분)
- xml-schema/work-activity-log/file-content-schema/sdd-pipeline: 단계·대상 enum에서 scheduler 제거, sdd-pipeline에 orchestrator 추가

## 검증 잔여 (manual)
- **R-01 spawn 토큰(Agent/Task) 라이브 스모크**: 미확정. orchestrator가 플러그인 등록 에이전트로 로드된 뒤 실제 nested-spawn 호출로 확정 필요. frontmatter에 `Agent, Task` 병기해 대비.
- **R-04 SendMessage/TaskStop headless**: 대화형 전제로 수용.
- 깊이(Main0→orch1→자식2 ≤5)·세션 한도(200) 여유 — 설계상 확인.

## 후속(범위 밖)
- ref-cache 정상화, hook 인프라, 크로스-WORK 큐: 별도 TODO
