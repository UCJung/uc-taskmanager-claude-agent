# Requirement -- WORK-37

## Original Request
> "docs/spec_pipeline-architecture_v1.1.md 현행화 -- ROUTER 내용 제거, 현재 개발 구조 및 파이프라인 기준으로 현행화하고 HTML도 갱신. HTML은 영문/한글 두 가지를 선택할 수 있도록 만들어줘"

## Background (Since spec v1.1 was written)
- Router -> Specifier 전환 완료 (WORK-28)
- Specifier가 Planner 겸임 가능 (direct mode)
- 6개 에이전트: specifier, planner, scheduler, builder, verifier, committer
- shared-prompt-sections.md에 SS 9-12 공통 섹션 추가 (WORK-33)
- WORK 완료 시 _COMPLETED/ 아카이브 (WORK-35)
- WORK-LIST.md에 LAST_WORK_ID 헤더 추가
- WORK-LIST.md 3단계 상태: IN_PROGRESS → DONE → COMPLETED (WORK-38)
- committer가 마지막 TASK 완료 시 IN_PROGRESS → DONE 전환
- Push 시 DONE → COMPLETED 일괄 처리 (_COMPLETED/ 이동)

## Functional Requirements
- FR-01: spec_pipeline-architecture_v1.1.md 현행화
  - Router 관련 내용을 모두 Specifier로 변환
  - 에이전트 구성 테이블 현행화 (router 제거, specifier 추가)
  - execution-mode 판정 주체 변경 (router -> specifier)
  - direct 모드: Specifier가 Planner 겸임하여 PLAN.md+TASK 생성 후 Builder dispatch
  - pipeline 모드: Specifier가 Requirement.md 생성 후 Planner에 위임 (Main Claude가 B->V->C 실행)
  - full 모드: Specifier가 Requirement.md 생성 후 Planner에 위임, Planner가 Scheduler dispatch
  - WORK-LIST.md 규칙 현행화 (LAST_WORK_ID, IN_PROGRESS only, _COMPLETED/ 아카이브)
  - 불변 보장 항목 현행화 (Specifier 기준)
  - Dispatcher-Receiver 매핑 현행화
  - 산출물 파일 포맷 생성 주체 현행화
  - 관련 문서 경로 현행화 (agents/ -> skills/sdd-pipeline/references/)
  - 버전을 v1.2로 올리고 변경사항 기록

- FR-02: pipeline-architecture-v1.1-visual.html 갱신 + 영문/한글 언어 전환
  - spec v1.2 내용에 맞게 HTML 시각화 갱신 (Router -> Specifier 등)
  - 영문/한글 두 가지 언어를 선택할 수 있는 토글/드롭다운 UI 추가
  - 모든 텍스트 콘텐츠를 영문/한글 양쪽으로 제공
  - 파일명도 v1.2로 변경 (pipeline-architecture-v1.2-visual.html)

## Non-Functional Requirements
- NFR-01: 기존 HTML의 디자인 퀄리티(다크/라이트 테마, 애니메이션 등) 유지
- NFR-02: 언어 전환 시 페이지 새로고침 없이 즉시 반영 (JavaScript)
- NFR-03: spec 문서와 HTML 시각화의 내용 일관성 보장

## Acceptance Criteria
- [ ] spec 문서에서 "router" / "Router" 단어가 역사적 맥락 외에는 등장하지 않음
- [ ] 6개 에이전트(specifier, planner, scheduler, builder, verifier, committer) 기준으로 모든 테이블/다이어그램 갱신
- [ ] direct 모드의 실행 주체가 Specifier(Planner 겸임)로 명시
- [ ] WORK-LIST.md 규칙이 현행(LAST_WORK_ID, 3단계 상태: IN_PROGRESS→DONE→COMPLETED) 반영
- [ ] HTML에서 영문/한글 전환이 동작하고, 전환 시 모든 텍스트가 올바르게 변경됨
- [ ] HTML의 에이전트 구성 및 파이프라인 흐름이 spec v1.2와 일치
- [ ] 기존 HTML 디자인 퀄리티(테마, 애니메이션) 유지
