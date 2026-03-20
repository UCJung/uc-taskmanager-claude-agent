# Requirement — WORK-33

## Original Request
> "agent에 중복적이고 반복적인 지침들을 통합"

## Functional Requirements
- FR-01: Language Detection 로직 통합 — specifier.md, planner.md에 100% 동일하게 복사된 locale 감지 bash 스크립트를 shared-prompt-sections.md 새 섹션으로 이동하고, 원본 위치는 참조로 대체
- FR-02: Callback 전송 블록 통합 — builder.md, committer.md에 90% 동일한 curl 페이로드를 shared-prompt-sections.md 공통 템플릿으로 추출하고, 원본 위치는 참조로 대체
- FR-03: Project Discovery bash 통합 — specifier.md, planner.md에 거의 동일한 프로젝트 탐색 스크립트를 shared-prompt-sections.md로 이동하고, 원본 위치는 참조로 대체
- FR-04: Progress file gate check 통합 — verifier.md, committer.md에 동일한 progress 파일 확인 로직을 shared-prompt-sections.md로 이동하고, 원본 위치는 참조로 대체
- FR-05: STARTUP 테이블 간소화 — 6개 에이전트의 STARTUP 참조 테이블에서 공통 문구/형식을 간소화 (테이블 자체는 유지, 각 에이전트가 다른 파일을 참조하므로)

## Non-Functional Requirements
- NFR-01: agents/en/*.md와 agents/ko/*.md 양쪽 모두에 동일하게 적용
- NFR-02: 기존 에이전트 동작에 영향 없음 — 참조만 변경하고 실제 지침 내용은 보존
- NFR-03: shared-prompt-sections.md에 추가되는 새 섹션은 기존 번호 체계(현재 마지막 섹션 8)에 이어서 부여

## Acceptance Criteria
- [ ] shared-prompt-sections.md에 신규 섹션 4개 추가됨 (Language Detection, Callback Template, Project Discovery, Progress Gate Check)
- [ ] specifier.md, planner.md에서 Language Detection 중복 코드가 제거되고 shared 참조로 대체됨
- [ ] builder.md, committer.md에서 Callback 전송 중복 코드가 제거되고 shared 참조로 대체됨
- [ ] specifier.md, planner.md에서 Project Discovery 중복 코드가 제거되고 shared 참조로 대체됨
- [ ] verifier.md, committer.md에서 Progress gate check 중복 코드가 제거되고 shared 참조로 대체됨
- [ ] 6개 에이전트의 STARTUP 테이블 공통 문구가 간소화됨
- [ ] en/ko 양쪽 모두 동일하게 수정됨
- [ ] 변경 후 각 에이전트의 지침 의미가 변경 전과 동일함
