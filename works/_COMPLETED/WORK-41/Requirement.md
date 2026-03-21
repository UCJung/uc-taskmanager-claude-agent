# Requirement — WORK-41

## Original Request
> ref-cache 체인 전파 Phase 1 구현 — 참조 파일 전체를 ref-cache로 전달하여 에이전트 간 중복 파일 읽기 제거

## Functional Requirements
- FR-01: xml-schema.md의 dispatch XML과 task-result XML에 `<ref-cache>` 요소를 정의한다. ref-cache는 참조 파일명을 key로, 파일 내용 전체를 value로 담는 구조이다.
- FR-02: agent-flow.md에 Main Claude의 ref-cache 전달 규칙을 추가한다. 에이전트 반환 XML의 ref-cache를 다음 dispatch XML에 그대로 복사하는 체인 전파 규칙을 명시한다.
- FR-03: 6개 에이전트 파일(en)의 STARTUP 섹션에 Reference Loading 규칙을 추가한다 — dispatch의 `<ref-cache>`에 필요한 참조가 있으면 파일 읽기를 SKIP하고, 없는 참조만 파일에서 읽어 ref-cache에 추가하며, 반환 XML에 병합된 ref-cache를 포함한다.
- FR-04: 6개 에이전트 파일(ko)에 FR-03과 동일한 규칙을 한국어로 반영한다.

## Non-Functional Requirements
- NFR-01: 파이프라인 전체에서 참조 파일 중복 읽기를 제거하여 ~26회 → 최초 1회(specifier)로 감소시킨다.
- NFR-02: ref-cache가 없는 dispatch(기존 방식)에서도 기존과 동일하게 동작해야 한다(하위 호환성).

## Acceptance Criteria
- [ ] xml-schema.md에 `<ref-cache>` 요소가 dispatch와 task-result 양쪽에 정의되어 있다
- [ ] agent-flow.md에 ref-cache 체인 전파 규칙이 명시되어 있다
- [ ] en 에이전트 6개(specifier, planner, scheduler, builder, verifier, committer)에 ref-cache 기반 Reference Loading 규칙이 추가되어 있다
- [ ] ko 에이전트 6개에 동일 규칙이 한국어로 추가되어 있다
- [ ] ref-cache가 없는 dispatch를 받아도 기존과 동일하게 파일을 읽어 동작한다(하위 호환성)
