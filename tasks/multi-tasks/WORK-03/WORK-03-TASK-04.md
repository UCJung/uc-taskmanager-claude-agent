# WORK-03-TASK-04: 통합 검증 및 README 문서 업데이트

## WORK
WORK-03: Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감

## Dependencies
- WORK-03-TASK-01 (required): scheduler.md XML 디스패치 적용 완료 필요
- WORK-03-TASK-02 (required): router.md XML 디스패치 적용 완료 필요
- WORK-03-TASK-03 (required): builder/verifier/committer XML 수신/응답 적용 완료 필요

## Scope

TASK-01, TASK-02, TASK-03에서 수정된 모든 에이전트 파일의 XML 통신 흐름을 통합 검증하고, README.md와 README_KO.md에 구조화 통신 및 토큰 절감 관련 설명을 추가한다.

### 1. 통합 검증

모든 에이전트 간 XML 통신 흐름이 일관되는지 검증:

**Flow 1: WORK Pipeline**
```
router --<dispatch to="planner">--> planner
router --<dispatch to="scheduler">--> scheduler
scheduler --<dispatch to="builder">--> builder --<task-result>--> scheduler
scheduler --<dispatch to="verifier">--> verifier --<task-result>--> scheduler
scheduler --<dispatch to="committer">--> committer --<task-result>--> scheduler
```

**Flow 2: S-TASK Pipeline**
```
router --<dispatch to="builder">--> builder --<task-result>--> router
router --<dispatch to="verifier">--> verifier --<task-result>--> router
router --<dispatch to="committer">--> committer --<task-result>--> router
```

검증 항목:
- dispatcher의 `<dispatch>` 속성이 receiver의 `<task-input>` 파싱과 매칭되는지
- receiver의 `<task-result>` 포맷이 dispatcher의 기대와 매칭되는지
- `cache-hint sections`의 섹션명이 `shared-prompt-sections.md`에 정의된 것과 일치하는지
- 모든 에이전트가 `xml-schema.md`를 참조하는지

### 2. README.md 업데이트

다음 섹션을 추가:

**"Structured Communication" 섹션 (Why This Approach? 하위):**
- 에이전트 간 XML 구조화 통신의 목적과 이점 설명
- 토큰 절감 효과 (Prompt Caching, 구조화 포맷, Tool Result)
- 통신 흐름 다이어그램

**예시 내용:**
```markdown
### Structured Agent Communication

Agents communicate using structured XML format instead of plain text:

- **Dispatch format**: Caller sends `<dispatch>` XML with explicit context, task spec, and cache hints
- **Result format**: Receiver returns `<task-result>` XML with status, files changed, and verification results
- **Prompt Caching**: Common sections (Output Language Rule, Build Commands) are marked for Anthropic API cache_control, saving up to 90% on repeated tokens
```

### 3. README_KO.md 업데이트

README.md와 동일한 내용을 한국어로 추가.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | Structured Communication 섹션 추가 (Why This Approach? 하위) |
| `README_KO.md` | MODIFY | 구조화 통신 섹션 추가 (동일 위치) |

## Acceptance Criteria
- [ ] 모든 에이전트(scheduler, router, builder, verifier, committer)가 `xml-schema.md` 참조를 포함
- [ ] scheduler의 `<dispatch>` 속성과 builder/verifier/committer의 `<task-input>` 파싱이 일관됨
- [ ] router의 `<dispatch>` 속성과 planner/scheduler/builder의 `<task-input>` 파싱이 일관됨
- [ ] `cache-hint sections`의 섹션명이 `shared-prompt-sections.md`에 정의된 것과 일치
- [ ] README.md에 "Structured Communication" 또는 "Structured Agent Communication" 섹션 추가됨
- [ ] README_KO.md에 "구조화 통신" 또는 "구조화된 에이전트 통신" 섹션 추가됨
- [ ] 토큰 절감 효과 설명 포함 (Prompt Caching, 90% 등)

## Verify
```bash
# 모든 에이전트 xml-schema 참조 확인
for f in scheduler router builder verifier committer; do
  grep -q "xml-schema" agents/${f}.md && echo "PASS: ${f}.md references xml-schema" || echo "FAIL: ${f}.md missing xml-schema reference"
done

# dispatch 속성 일관성 검증 (work, task 속성 존재)
for f in scheduler router; do
  grep -q 'dispatch to=' agents/${f}.md && echo "PASS: ${f}.md has dispatch" || echo "FAIL: ${f}.md missing dispatch"
done

# task-input/task-result 일관성 검증
for f in builder verifier committer; do
  grep -q "task-input" agents/${f}.md && echo "PASS: ${f}.md has task-input" || echo "FAIL: ${f}.md missing task-input"
  grep -q "task-result" agents/${f}.md && echo "PASS: ${f}.md has task-result" || echo "FAIL: ${f}.md missing task-result"
done

# shared-prompt-sections.md의 섹션명과 cache-hint 일치 확인
grep -oP 'sections="[^"]*"' agents/scheduler.md agents/router.md 2>/dev/null | head -5
grep -oP '## [^\n]+' agents/shared-prompt-sections.md 2>/dev/null | head -10

# README 업데이트 확인
grep -i "structured.*communication\|structured.*agent" README.md && echo "PASS: README.md updated" || echo "FAIL: README.md"
grep -i "구조화.*통신\|구조화된.*에이전트" README_KO.md && echo "PASS: README_KO.md updated" || echo "FAIL: README_KO.md"

# 토큰 절감 설명 확인
grep -i "token.*sav\|cache.*90%\|토큰.*절감\|캐시.*90%" README.md README_KO.md && echo "PASS: token saving explained" || echo "FAIL"
```
