# Requirement -- WORK-44

## Original Request
> README 문서 현행화 -- v1.4.0 릴리스 과정에서 여러 구조적 변경이 이루어졌으나 README.md에 반영되지 않은 부분을 업데이트한다.

## Functional Requirements
- FR-01: Combined Spawns 반영 -- specifier+planner, verifier+committer 결합 실행을 파이프라인 다이어그램 및 에이전트 테이블에 반영
- FR-02: Spawn Count 테이블 추가 -- direct 3회, pipeline 3회, full 2+2N회
- FR-03: Approval Gate 변경 반영 -- pipeline/full 모드 승인 2회에서 1회로 변경
- FR-04: ref-cache Phase 2 (Selective Section Delivery) 개요 추가
- FR-05: Bash CLI 실행 -- `claude -p` 비대화형 파이프라인 실행 추가
- FR-06: Skills 수 정정 -- 3개에서 4개로 (init 추가)
- FR-07: Repository Structure -- PRIVACY.md 추가
- FR-08: README_KO.md 동기화 -- 위 모든 변경사항을 한국어 문서에도 반영

## Non-Functional Requirements
- NFR-01: 기존 README 스타일/톤 유지
- NFR-02: 영문/한국어 양쪽 문서의 내용 일관성 유지

## Acceptance Criteria
- [ ] README.md의 파이프라인 다이어그램이 combined spawns를 반영한다
- [ ] README.md의 에이전트 테이블이 combined spawns를 반영한다
- [ ] Spawn Count 테이블이 README.md에 존재한다
- [ ] Approval Gate 1회 변경이 반영되어 있다
- [ ] ref-cache Phase 2 설명이 추가되어 있다
- [ ] `claude -p` 비대화형 실행 설명이 추가되어 있다
- [ ] Skills 수가 4개로 표기되어 있다
- [ ] Repository Structure에 PRIVACY.md가 포함되어 있다
- [ ] README_KO.md에 위 모든 변경사항이 동기화되어 있다
