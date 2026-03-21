# TASK-01: en 에이전트 6개에 ref-cache Reference Loading 규칙 추가

## WORK
WORK-41: ref-cache 체인 전파 Phase 1 — 에이전트 간 중복 파일 읽기 제거

## Dependencies
- TASK-00 (required)

## Scope
영문 에이전트 6개 파일(specifier, planner, scheduler, builder, verifier, committer)의 STARTUP 섹션에 ref-cache 기반 Reference Loading 규칙을 추가한다.

### 추가할 규칙 내용
각 에이전트의 STARTUP 섹션(참조 파일 읽기 단계)에 다음 로직을 추가:
1. dispatch XML의 `<ref-cache>`에 필요한 참조 파일이 있는지 확인
2. ref-cache에 있으면 파일 읽기를 SKIP하고 캐시된 내용을 사용
3. ref-cache에 없는 참조만 파일에서 읽어 ref-cache에 추가
4. 반환 XML(task-result)에 병합된 ref-cache를 포함
5. ref-cache가 없는 dispatch(기존 방식)를 받으면 기존과 동일하게 모든 파일을 읽음 (하위 호환성)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/en/specifier.md` | MODIFY | STARTUP 섹션에 ref-cache Reference Loading 규칙 추가 |
| `agents/en/planner.md` | MODIFY | STARTUP 섹션에 ref-cache Reference Loading 규칙 추가 |
| `agents/en/scheduler.md` | MODIFY | STARTUP 섹션에 ref-cache Reference Loading 규칙 추가 |
| `agents/en/builder.md` | MODIFY | STARTUP 섹션에 ref-cache Reference Loading 규칙 추가 |
| `agents/en/verifier.md` | MODIFY | STARTUP 섹션에 ref-cache Reference Loading 규칙 추가 |
| `agents/en/committer.md` | MODIFY | STARTUP 섹션에 ref-cache Reference Loading 규칙 추가 |

## Acceptance Criteria
- [ ] 6개 에이전트 파일 모두에 Reference Loading 규칙 섹션이 추가되어 있다
- [ ] ref-cache 존재 시 파일 읽기 SKIP 로직이 명시되어 있다
- [ ] ref-cache 미존재 시 기존 방식으로 파일을 읽는 하위 호환성이 명시되어 있다
- [ ] 반환 XML에 병합된 ref-cache 포함 규칙이 명시되어 있다

## Verify
```bash
# 6개 에이전트 파일에 ref-cache 규칙 존재 확인
for f in specifier planner scheduler builder verifier committer; do
  echo "$f: $(grep -c 'ref-cache' agents/en/${f}.md)"
done
```
