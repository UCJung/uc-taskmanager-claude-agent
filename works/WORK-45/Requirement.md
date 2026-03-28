# Requirement — WORK-45

## Original Request
> 오늘 수정된 agent 관련 내용으로 모든 기술문서와 리드미 영/한 현행화

## Functional Requirements
- FR-01: README.md (영문)에 v1.5.0 변경사항 반영 — spawn 결합(specifier+planner, verifier+committer), 자동 권한 설정(v1.4.0), plugin 리소스 npm 포함, pipe 명령어 제거
- FR-02: README_KO.md (한글)에 동일한 변경사항 반영
- FR-03: docs/spec_pipeline-architecture_v1.3.md에 spawn 결합 아키텍처 변경 반영 (에이전트 호출 구조, execution-mode별 단계 수 갱신)
- FR-04: docs/pipeline-architecture-v1.3-visual.html에 spawn 결합 시각화 반영
- FR-05: docs/spec_SDD_with_ucagent_requirement.md에 v1.6.0 변경 이력 추가 및 에이전트 호출 구조 현행화
- FR-06: docs/SDD-requirement-visual.html에 spawn 결합 반영
- FR-07: docs/spec_sliding-window-context.md 및 sliding-window-context-visual.html 현행화 (spawn 결합이 컨텍스트 전달에 미치는 영향)
- FR-08: docs/spec_callback-integration.md 및 callback-integration-visual.html 현행화
- FR-09: plugin/README.md에 v1.5.0 변경사항 반영

## Non-Functional Requirements
- NFR-01: 코드 변경 없음 — 문서 업데이트만 수행
- NFR-02: 빌드/테스트 불필요
- NFR-03: 영/한 문서 내용 일관성 유지

## Acceptance Criteria
- [ ] README.md에 spawn 결합(30% 감소), v1.4.0 자동 권한 설정, v1.5.0 plugin 리소스 포함이 반영됨
- [ ] README_KO.md에 동일 내용이 한국어로 반영됨
- [ ] spec_pipeline-architecture_v1.3.md에 spawn 결합 아키텍처가 반영됨
- [ ] pipeline-architecture-v1.3-visual.html에 시각화가 업데이트됨
- [ ] spec_SDD_with_ucagent_requirement.md 변경 이력에 v1.6.0 추가
- [ ] SDD-requirement-visual.html 업데이트
- [ ] sliding-window-context 문서/시각화 현행화
- [ ] callback-integration 문서/시각화 현행화
- [ ] plugin/README.md 업데이트
- [ ] README_KO.md의 저장소 구조(docs/ 섹션)가 실제 파일명과 일치
