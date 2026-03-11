# WORK-03-TASK-02: router.md 구조화 XML 디스패치 포맷 적용

## WORK
WORK-03: Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감

## Dependencies
- WORK-03-TASK-00 (required): XML 스키마 및 공통 섹션 정의 필요

## Scope

router.md의 에이전트 디스패치 섹션을 구조화된 XML 포맷으로 교체한다. router는 3가지 경로(S-TASK Direct, S-TASK Pipeline, WORK)에서 다른 에이전트를 호출한다.

### 현재 상태 (자연어 기반)

router.md에서 에이전트 호출은 텍스트 기술로만 되어 있다:

```
### S-TASK Pipeline Flow
router → builder(sonnet) → verifier(haiku) → committer(haiku)

### WORK Flow
router → planner → scheduler → [builder → verifier → committer] × N
```

실제 호출 시 전달할 데이터가 명시적으로 구조화되어 있지 않다.

### 변경 후 (구조화 XML 기반)

**S-TASK Pipeline 디스패치 (builder 호출):**
```xml
<dispatch to="builder" stask="{S-TASK-NNNNN}">
  <context>
    <project>{detected project name}</project>
    <language>{resolved lang_code}</language>
  </context>
  <task-spec>
    <title>{task title from user request}</title>
    <action>implement</action>
    <description>{parsed requirement}</description>
    <files-hint>
      <file path="{estimated file}" action="{create|modify}">{reason}</file>
    </files-hint>
  </task-spec>
  <cache-hint sections="output-language-rule,build-commands" />
</dispatch>
```

**WORK Flow 디스패치 (planner 호출):**
```xml
<dispatch to="planner" mode="new-work">
  <context>
    <project>{detected project name}</project>
    <language>{resolved lang_code}</language>
    <next-work-id>{validated WORK-XX}</next-work-id>
  </context>
  <request>
    <original>{사용자 원문 요청}</original>
    <tag>{detected [] tag}</tag>
    <complexity>complex</complexity>
  </request>
  <cache-hint sections="output-language-rule" />
</dispatch>
```

**WORK Flow 디스패치 (scheduler 호출):**
```xml
<dispatch to="scheduler" work="{WORK_ID}" mode="{manual|auto}">
  <context>
    <language>{resolved lang_code}</language>
    <plan-file>tasks/multi-tasks/{WORK_ID}/PLAN.md</plan-file>
  </context>
  <cache-hint sections="output-language-rule" />
</dispatch>
```

### 추가 수정 사항

1. **S-TASK Direct**: router가 직접 처리하므로 디스패치 XML 불필요 (변경 없음)
2. **WORK ID Validation 섹션**: 기존 로직 유지, XML과 무관
3. **공통 섹션 참조**: `agents/shared-prompt-sections.md` 및 `agents/xml-schema.md` 참조 추가
4. **cache_control 지시사항**: 프롬프트 상단에 캐싱 대상 섹션 표기

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/router.md` | MODIFY | S-TASK Pipeline 및 WORK Flow 디스패치를 XML 포맷으로 교체, 공통 섹션 참조 + cache_control 지시사항 추가 |

## Acceptance Criteria
- [ ] S-TASK Pipeline의 builder/verifier/committer 디스패치에 XML 포맷 적용
- [ ] WORK Flow의 planner 디스패치에 XML 포맷 적용
- [ ] WORK Flow의 scheduler 디스패치에 XML 포맷 적용
- [ ] `agents/xml-schema.md` 참조 지시사항 포함
- [ ] `cache_control` 또는 `cache-hint` 지시사항 포함
- [ ] S-TASK Direct 섹션은 변경하지 않음 (router 직접 처리)
- [ ] WORK ID Validation 로직(Section 4)이 손상되지 않음
- [ ] S-TASK ID Assignment 로직(Section 3)이 손상되지 않음

## Verify
```bash
# XML dispatch 블록 확인
grep -c '<dispatch to="planner"' agents/router.md | xargs -I{} test {} -ge 1 && echo "PASS: planner dispatch XML" || echo "FAIL"
grep -c '<dispatch to="scheduler"' agents/router.md | xargs -I{} test {} -ge 1 && echo "PASS: scheduler dispatch XML" || echo "FAIL"
grep -c '<dispatch to="builder"' agents/router.md | xargs -I{} test {} -ge 1 && echo "PASS: builder dispatch XML" || echo "FAIL"

# cache_control 참조 확인
grep -c "cache" agents/router.md | xargs -I{} test {} -ge 1 && echo "PASS: cache referenced" || echo "FAIL"

# xml-schema 참조 확인
grep "xml-schema" agents/router.md && echo "PASS: xml-schema referenced" || echo "FAIL"

# 기존 핵심 섹션 보존 확인
grep "WORK ID Assignment" agents/router.md && echo "PASS: WORK ID Assignment preserved" || echo "FAIL"
grep "S-TASK ID Assignment" agents/router.md && echo "PASS: S-TASK ID Assignment preserved" || echo "FAIL"
grep "Three-Path Routing\|Three.*Path\|Routing Criteria" agents/router.md && echo "PASS: Routing logic preserved" || echo "FAIL"
grep "WORK-LIST.md Management" agents/router.md && echo "PASS: WORK-LIST management preserved" || echo "FAIL"
```
