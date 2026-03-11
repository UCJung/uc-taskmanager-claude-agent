# WORK-03-TASK-03: builder/verifier/committer 수신 파싱 및 응답 포맷 적용

## WORK
WORK-03: Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감

## Dependencies
- WORK-03-TASK-00 (required): XML 스키마 및 공통 섹션 정의 필요

## Scope

builder.md, verifier.md, committer.md 3개 에이전트가 구조화된 XML 입력을 파싱하고, 결과도 구조화된 XML로 반환하도록 수정한다.

### 1. builder.md 수정

**XML 입력 파싱 섹션 추가:**

builder가 scheduler/router로부터 받는 `<dispatch>` XML을 파싱하는 규칙을 추가한다:

```xml
<!-- builder가 받는 입력 -->
<task-input work="{WORK_ID}" task="{TASK_ID}">
  <spec-file>tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX.md</spec-file>
  <action>implement</action>
  <language>{lang_code}</language>
  <previous-results>
    <result task="{prev_TASK_ID}" status="PASS">{summary}</result>
  </previous-results>
</task-input>
```

**구조화된 결과 반환 포맷 추가:**

기존 "Completion Report" 섹션을 XML 구조화 포맷으로 교체/보강:

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="builder" status="{PASS|FAIL}">
  <summary>{1-2줄 요약}</summary>
  <files-changed>
    <file action="created" path="src/auth/auth.module.ts">인증 모듈</file>
    <file action="modified" path="src/app.module.ts">auth 모듈 import 추가</file>
  </files-changed>
  <self-check>
    <check name="build" status="PASS" />
    <check name="lint" status="PASS" />
  </self-check>
  <notes>{verifier가 확인해야 할 사항}</notes>
</task-result>
```

**추가 사항:**
- 기존 Self-Check 섹션의 빌드/린트 스크립트 유지 (공통 섹션 참조 마킹 추가)
- `cache-hint` 응답에 포함하여 다음 에이전트가 캐싱 활용 가능하도록

### 2. verifier.md 수정

**XML 입력 파싱 섹션 추가:**

```xml
<!-- verifier가 받는 입력 -->
<task-input work="{WORK_ID}" task="{TASK_ID}">
  <spec-file>tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX.md</spec-file>
  <action>verify</action>
  <language>{lang_code}</language>
  <builder-result>
    <!-- builder의 task-result XML -->
  </builder-result>
</task-input>
```

**구조화된 결과 반환 포맷 추가:**

기존 "Report Format" 섹션을 XML 구조화 포맷으로 교체/보강:

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="verifier" status="{PASS|FAIL}">
  <summary>{검증 결과 요약}</summary>
  <verification>
    <check name="build" status="{PASS|FAIL}">{output}</check>
    <check name="lint" status="{PASS|FAIL|N/A}">{output}</check>
    <check name="tests" status="{PASS|FAIL|N/A}" count="{N}">{output}</check>
    <check name="task-specific" status="{PASS|FAIL}">{output}</check>
    <check name="files" status="{PASS|FAIL}">{output}</check>
    <check name="conventions" status="{PASS|FAIL|N/A}">{output}</check>
  </verification>
  <failure-details>
    <!-- status가 FAIL인 경우에만 -->
    <failure check="{check name}">
      <error>{error message}</error>
      <file>{path}</file>
      <suggested-fix>{suggestion}</suggested-fix>
    </failure>
  </failure-details>
</task-result>
```

**추가 사항:**
- Verification Pipeline (Step 1~6) 유지
- 빌드/린트/테스트 스크립트에 공통 섹션 참조 마킹 추가

### 3. committer.md 수정

**XML 입력 파싱 섹션 추가:**

```xml
<!-- committer가 받는 입력 -->
<task-input work="{WORK_ID}" task="{TASK_ID}">
  <spec-file>tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX.md</spec-file>
  <action>commit</action>
  <language>{lang_code}</language>
  <title>{task title}</title>
  <builder-result>
    <!-- builder의 task-result XML -->
  </builder-result>
  <verifier-result>
    <!-- verifier의 task-result XML -->
  </verifier-result>
</task-input>
```

**구조화된 결과 반환 포맷 추가:**

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="committer" status="{PASS|FAIL}">
  <summary>{커밋 결과 요약}</summary>
  <commit>
    <hash>{git commit hash}</hash>
    <message>{commit message}</message>
    <type>{feat|fix|chore|...}</type>
  </commit>
  <result-file>tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX-result.md</result-file>
  <progress>
    <done>{N}</done>
    <total>{M}</total>
  </progress>
  <next-tasks>
    <task id="{WORK_ID}-TASK-YY" status="READY">{title}</task>
  </next-tasks>
</task-result>
```

**추가 사항:**
- 기존 Execution Order (Step 1~5) 유지
- result.md 생성 로직 유지

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/builder.md` | MODIFY | XML 입력 파싱 섹션 추가 + Completion Report를 XML task-result 포맷으로 보강 + 공통 섹션 캐싱 마킹 |
| `agents/verifier.md` | MODIFY | XML 입력 파싱 섹션 추가 + Report Format을 XML task-result 포맷으로 보강 + 공통 섹션 캐싱 마킹 |
| `agents/committer.md` | MODIFY | XML 입력 파싱 섹션 추가 + 결과 반환을 XML task-result 포맷으로 보강 + 공통 섹션 캐싱 마킹 |

## Acceptance Criteria
- [ ] builder.md에 `<task-input>` 파싱 규칙 섹션 추가됨
- [ ] builder.md에 `<task-result>` 반환 포맷 추가됨
- [ ] builder.md의 기존 Self-Check 로직 유지됨
- [ ] verifier.md에 `<task-input>` 파싱 규칙 섹션 추가됨
- [ ] verifier.md에 `<task-result>` 반환 포맷 추가됨
- [ ] verifier.md의 기존 Verification Pipeline (Step 1~6) 유지됨
- [ ] committer.md에 `<task-input>` 파싱 규칙 섹션 추가됨
- [ ] committer.md에 `<task-result>` 반환 포맷 추가됨
- [ ] committer.md의 기존 Execution Order (Step 1~5) 유지됨
- [ ] 3개 에이전트 모두 `agents/xml-schema.md` 참조 포함
- [ ] 3개 에이전트 모두 공통 섹션 캐싱 마킹 포함

## Verify
```bash
# builder.md 검증
grep -c "<task-input" agents/builder.md | xargs -I{} test {} -ge 1 && echo "PASS: builder XML input" || echo "FAIL: builder XML input"
grep -c "<task-result" agents/builder.md | xargs -I{} test {} -ge 1 && echo "PASS: builder XML result" || echo "FAIL: builder XML result"
grep "Self-Check" agents/builder.md && echo "PASS: builder Self-Check preserved" || echo "FAIL"
grep "xml-schema" agents/builder.md && echo "PASS: builder xml-schema ref" || echo "FAIL"

# verifier.md 검증
grep -c "<task-input" agents/verifier.md | xargs -I{} test {} -ge 1 && echo "PASS: verifier XML input" || echo "FAIL: verifier XML input"
grep -c "<task-result" agents/verifier.md | xargs -I{} test {} -ge 1 && echo "PASS: verifier XML result" || echo "FAIL: verifier XML result"
grep "Verification Pipeline" agents/verifier.md && echo "PASS: verifier pipeline preserved" || echo "FAIL"
grep "xml-schema" agents/verifier.md && echo "PASS: verifier xml-schema ref" || echo "FAIL"

# committer.md 검증
grep -c "<task-input" agents/committer.md | xargs -I{} test {} -ge 1 && echo "PASS: committer XML input" || echo "FAIL: committer XML input"
grep -c "<task-result" agents/committer.md | xargs -I{} test {} -ge 1 && echo "PASS: committer XML result" || echo "FAIL: committer XML result"
grep "Execution Order" agents/committer.md && echo "PASS: committer Execution Order preserved" || echo "FAIL"
grep "xml-schema" agents/committer.md && echo "PASS: committer xml-schema ref" || echo "FAIL"
```
