# TASK-00: xml-schema.md + agent-flow.md에 ref-cache 스키마/규칙 정의

## WORK
WORK-41: ref-cache 체인 전파 Phase 1 — 에이전트 간 중복 파일 읽기 제거

## Dependencies
- (none)

## Scope
dispatch XML과 task-result XML에 `<ref-cache>` 요소 스키마를 정의하고, agent-flow.md에 Main Claude의 ref-cache 체인 전파 규칙을 추가한다.

### xml-schema.md 변경 사항
- dispatch XML 스키마에 `<ref-cache>` 요소 정의 추가
  - `<ref-cache>` 하위에 `<ref key="{filename}">{file content}</ref>` 형태의 요소 목록
  - 선택적 요소(optional) — 하위 호환성 보장
- task-result XML 스키마에 `<ref-cache>` 요소 정의 추가
  - 에이전트가 반환 시 병합된 ref-cache를 포함

### agent-flow.md 변경 사항
- Main Claude의 ref-cache 체인 전파 규칙 추가
  - 에이전트 반환 XML의 `<ref-cache>`를 다음 dispatch XML에 그대로 복사
  - ref-cache가 없는 경우(기존 방식) 기존과 동일하게 동작

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/en/xml-schema.md` | MODIFY | dispatch XML과 task-result XML에 `<ref-cache>` 요소 정의 추가 |
| `agents/en/agent-flow.md` | MODIFY | Main Claude의 ref-cache 체인 전파 규칙 추가 |

## Acceptance Criteria
- [ ] xml-schema.md에 `<ref-cache>` 요소가 dispatch XML 스키마에 정의되어 있다
- [ ] xml-schema.md에 `<ref-cache>` 요소가 task-result XML 스키마에 정의되어 있다
- [ ] `<ref-cache>`는 optional 요소로 정의되어 하위 호환성이 보장된다
- [ ] agent-flow.md에 ref-cache 체인 전파 규칙이 명시되어 있다
- [ ] agent-flow.md에 ref-cache 부재 시 기존 동작 유지 규칙이 명시되어 있다

## Verify
```bash
# xml-schema.md에 ref-cache 정의 존재 확인
grep -c "ref-cache" agents/en/xml-schema.md
# agent-flow.md에 ref-cache 규칙 존재 확인
grep -c "ref-cache" agents/en/agent-flow.md
```
