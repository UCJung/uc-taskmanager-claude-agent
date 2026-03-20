# Requirement -- WORK-34

## Original Request
> "readme 전체 내용을 현행화 해줘"

## Functional Requirements

- FR-01: WORK-LIST.md COMPLETED 동작 설명 현행화
  - 현재 README: "COMPLETED는 git push 시점에 갱신, Agent가 갱신하지 않음"
  - 실제(v1.2.0+): "COMPLETED는 마지막 TASK 완료 시 committer가 자동 변경" (shared-prompt-sections.md SS 8 기준)
  - 대상: README.md, README_KO.md 모두

- FR-02: Push 절차 설명 현행화
  - 현재 README: 6단계(WORK-LIST.md 열기 -> COMPLETED 변경 -> push)
  - 실제(CLAUDE.md): 에이전트 동기화 -> README 업데이트 -> git push (WORK-LIST COMPLETED 변경은 committer가 이미 처리)
  - 대상: README.md, README_KO.md 모두

- FR-03: Repository Structure 섹션 현행화
  - `.agent/` 디렉토리: 프로젝트 루트에 존재하지 않음 (npm/.agent/에만 존재) -> 제거
  - `docs/` 섹션: `spec_pipeline-architecture_v1.1.md`, `spec_SDD_with_ucagent_requirement.md` 누락 -> 추가
  - 대상: README.md, README_KO.md 모두

- FR-04: Agent 모델 정보 일관성 확보
  - README_KO.md: specifier 모델이 "sonnet"으로 표기됨
  - 실제(spec_pipeline-architecture.md): specifier = opus
  - 대상: README_KO.md

- FR-05: README_KO.md에 Claude Marketplace Plugin 섹션 추가
  - README.md에는 Plugin 설치 방법(Quick Start Option 1, Installation Plugin 섹션)이 있으나 README_KO.md에는 없음
  - 빠른 시작, 설치 섹션에 Plugin 옵션 추가

- FR-06: README_KO.md에 Support Files 및 The Bigger Picture 섹션 추가
  - README.md의 "Support Files (included in Plugin)" 섹션 (참조 문서 6개 설명)
  - README.md의 "The Bigger Picture" 섹션 (SDD 요구사항관리 시스템 연계 설명)
  - 대상: README_KO.md

- FR-07: direct 모드 설명 일관성 확보
  - README_KO.md: "specifier: 분석 -> 구현 -> self-check -> 커밋 -> result.md" (specifier가 커밋까지)
  - README.md: "Main Claude -> specifier -> Main Claude -> committer" (committer가 커밋)
  - 현재 에이전트 구조(specifier.md): specifier는 dispatch XML 반환, builder가 구현, committer가 커밋
  - 대상: README.md, README_KO.md 모두 현행 구조에 맞게 정리

## Non-Functional Requirements

- NFR-01: README.md와 README_KO.md 간 구조/내용의 일관성 유지
- NFR-02: 문서 수정만 수행 -- 코드 변경 없음

## Acceptance Criteria

- [ ] WORK-LIST.md COMPLETED 동작 설명이 "committer 자동 변경"으로 통일
- [ ] Push 절차가 현행 CLAUDE.md와 일치
- [ ] Repository Structure에서 존재하지 않는 .agent/ 제거, 누락 docs 추가
- [ ] 양쪽 README의 specifier 모델이 opus로 통일
- [ ] README_KO.md에 Plugin 설치 섹션 존재
- [ ] README_KO.md에 Support Files, The Bigger Picture 섹션 존재
- [ ] direct 모드 설명이 현행 에이전트 구조와 일치
- [ ] README.md와 README_KO.md 간 구조/내용 일관성 확인
