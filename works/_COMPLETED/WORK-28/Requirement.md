# Requirement — WORK-28

## Original Request
> 변경된 사항을 확인하여 docs 폴더와 readme 현행화

## Functional Requirements (기능 요구사항)
- FR-01: README.md의 router 참조를 specifier 기반 아키텍처로 갱신 (에이전트 테이블, 파이프라인 다이어그램, 저장소 구조 등)
- FR-02: README_KO.md의 router 참조를 specifier 기반으로 갱신 + --lang CLI 옵션 반영 + agents/ 디렉토리 구조 갱신
- FR-03: docs/spec_pipeline-architecture.md의 에이전트 구성, execution-mode 체계, 에이전트별 상세 역할, Dispatcher-Receiver 매핑 갱신
- FR-04: docs/spec_sliding-window-context.md의 router 참조를 specifier로 갱신
- FR-05: docs/spec_callback-integration.md의 콜백 전송 주체 테이블 갱신

## Non-Functional Requirements (비기능 요구사항)
- NFR-01: router_rule_config 등 config 파일명의 "router"는 유지 (에이전트명으로서의 router만 변경)

## Acceptance Criteria
- [ ] README.md/README_KO.md에서 "router" 단어가 에이전트명으로 사용되지 않음
- [ ] 에이전트 테이블에 specifier 포함, 총 6개 에이전트 구성 정확
- [ ] 파이프라인 다이어그램이 specifier 기반으로 갱신
- [ ] docs 3개 파일의 router 참조가 specifier로 갱신
- [ ] agents/ 저장소 구조가 ko/en 분리 구조로 갱신
