# WORK-03-TASK-01: scheduler.md 구조화 XML 디스패치 포맷 적용

## WORK
WORK-03: Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감

## Dependencies
- WORK-03-TASK-00 (required): XML 스키마 및 공통 섹션 정의 필요

## Scope

scheduler.md의 **Phase 2 (Build), Phase 3 (Verify), Phase 4 (Commit)** 디스패치 섹션을 구조화된 XML 포맷으로 교체한다.

### 현재 상태 (자연어 기반)

scheduler.md에서 builder/verifier/committer를 호출할 때 다음과 같이 기술되어 있다:

```
### Phase 2: Build
Delegate to **builder**:
- Pass: WORK_ID, TASK file content, project context (CLAUDE.md)

### Phase 3: Verify
Delegate to **verifier**:
- Pass: WORK_ID, TASK acceptance criteria, verification commands

### Phase 4: Commit
Delegate to **committer**:
- Pass: WORK_ID, TASK ID, title, changed files, verification results
```

### 변경 후 (구조화 XML 기반)

각 Phase의 디스패치를 TASK-00에서 정의한 XML 스키마로 교체:

**Phase 2 (builder 호출) 예시:**
```xml
<dispatch to="builder" work="{WORK_ID}" task="{TASK_ID}">
  <context>
    <project>{detected project name}</project>
    <language>{resolved lang_code}</language>
    <plan-file>tasks/multi-tasks/{WORK_ID}/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX.md</file>
    <title>{task title}</title>
    <action>implement</action>
  </task-spec>
  <previous-results>
    <!-- 이전 TASK 결과 요약 -->
  </previous-results>
  <cache-hint sections="output-language-rule,build-commands" />
</dispatch>
```

**Phase 3 (verifier 호출) 예시:**
```xml
<dispatch to="verifier" work="{WORK_ID}" task="{TASK_ID}">
  <context>
    <language>{resolved lang_code}</language>
  </context>
  <task-spec>
    <file>tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX.md</file>
    <title>{task title}</title>
    <action>verify</action>
  </task-spec>
  <builder-report>{builder의 XML task-result}</builder-report>
  <cache-hint sections="output-language-rule,build-commands" />
</dispatch>
```

**Phase 4 (committer 호출) 예시:**
```xml
<dispatch to="committer" work="{WORK_ID}" task="{TASK_ID}">
  <context>
    <language>{resolved lang_code}</language>
  </context>
  <task-spec>
    <file>tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX.md</file>
    <title>{task title}</title>
    <action>commit</action>
  </task-spec>
  <verification-report>{verifier의 XML task-result}</verification-report>
  <builder-report>{builder의 XML task-result}</builder-report>
  <cache-hint sections="output-language-rule" />
</dispatch>
```

### 추가 수정 사항

1. **공통 섹션 참조**: Output Language Rule 섹션을 `agents/shared-prompt-sections.md` 참조로 교체 (또는 인라인 유지 + 캐싱 마킹 코멘트 추가)
2. **cache_control 지시사항**: 프롬프트 상단에 캐싱 대상 섹션 표기 추가
3. **XML 스키마 참조**: `agents/xml-schema.md` 파일 참조 지시사항 추가

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/scheduler.md` | MODIFY | Phase 2/3/4 디스패치를 XML 포맷으로 교체, 공통 섹션 참조 + cache_control 지시사항 추가 |

## Acceptance Criteria
- [ ] Phase 2 (builder 호출)에 XML `<dispatch>` 포맷 적용
- [ ] Phase 3 (verifier 호출)에 XML `<dispatch>` 포맷 적용
- [ ] Phase 4 (committer 호출)에 XML `<dispatch>` 포맷 적용
- [ ] `agents/xml-schema.md` 참조 지시사항 포함
- [ ] `cache_control` 또는 `cache-hint` 지시사항이 1개 이상 포함
- [ ] Output Language Rule 섹션에 캐싱 마킹 코멘트 추가
- [ ] 기존 기능(DAG 해석, WORK 식별, Progress 관리 등)이 손상되지 않음

## Verify
```bash
# XML dispatch 블록 확인 (builder, verifier, committer 각 1개 이상)
grep -c '<dispatch to="builder"' agents/scheduler.md | xargs -I{} test {} -ge 1 && echo "PASS: builder dispatch XML" || echo "FAIL"
grep -c '<dispatch to="verifier"' agents/scheduler.md | xargs -I{} test {} -ge 1 && echo "PASS: verifier dispatch XML" || echo "FAIL"
grep -c '<dispatch to="committer"' agents/scheduler.md | xargs -I{} test {} -ge 1 && echo "PASS: committer dispatch XML" || echo "FAIL"

# cache_control 참조 확인
grep -c "cache" agents/scheduler.md | xargs -I{} test {} -ge 1 && echo "PASS: cache referenced" || echo "FAIL"

# xml-schema 참조 확인
grep "xml-schema" agents/scheduler.md && echo "PASS: xml-schema referenced" || echo "FAIL"

# 기존 핵심 섹션 보존 확인
grep "DAG Resolution" agents/scheduler.md && echo "PASS: DAG Resolution preserved" || echo "FAIL"
grep "WORK Identification" agents/scheduler.md && echo "PASS: WORK Identification preserved" || echo "FAIL"
grep "Progress File" agents/scheduler.md && echo "PASS: Progress File preserved" || echo "FAIL"
```
