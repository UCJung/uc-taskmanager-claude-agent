# WORK-03-TASK-00: 공통 시스템 프롬프트 섹션 식별 및 캐싱 마킹 + XML 스키마 설계

## WORK
WORK-03: Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감

## Dependencies
- (없음)

## Scope

6개 에이전트 파일(router.md, planner.md, scheduler.md, builder.md, verifier.md, committer.md)을 분석하여:

1. **공통 반복 섹션 식별**: 여러 에이전트에 동일하게 반복되는 프롬프트 섹션을 찾아낸다.
2. **캐싱 마킹 설계**: Anthropic API의 `cache_control` 블록을 활용한 캐싱 전략을 문서화한다.
3. **XML 통신 스키마 설계**: 에이전트 간 디스패치/결과 전달에 사용할 XML 포맷을 정의한다.

### 식별 대상 공통 섹션 (현재 분석 결과)

| 섹션 | 반복 에이전트 | 내용 |
|------|-------------|------|
| Output Language Rule | planner, scheduler, builder, verifier, committer (5개) | 언어 해석 우선순위, 카테고리별 오버라이드 |
| Self-Check / Build / Lint 명령어 | builder, verifier (2개) | 동일한 빌드/린트 감지 스크립트 |
| WORK/TASK 파일 경로 패턴 | 전체 6개 | `tasks/multi-tasks/{WORK_ID}/` 패턴 |
| 파일시스템 탐색 스크립트 | planner, scheduler, router (3개) | WORK 디렉토리 스캔 로직 |

### XML 스키마 설계 요구사항

dispatcher(호출자) -> receiver(수신자) 방향의 디스패치 포맷:
```xml
<dispatch to="{agent}" work="{WORK_ID}" task="{TASK_ID}">
  <context>
    <project>{project name}</project>
    <language>{lang_code}</language>
    <plan-file>{path to PLAN.md}</plan-file>
  </context>
  <task-spec>
    <file>{path to TASK-XX.md}</file>
    <title>{task title}</title>
    <action>{implement|verify|commit}</action>
  </task-spec>
  <previous-results>
    <result task="{TASK_ID}" status="{PASS|FAIL}">{summary}</result>
  </previous-results>
  <cache-hint sections="output-language-rule,build-commands" />
</dispatch>
```

receiver -> dispatcher 방향의 결과 반환 포맷:
```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2줄 요약}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{description}</file>
  </files-changed>
  <verification>
    <check name="{build|lint|test|custom}" status="{PASS|FAIL}">{output}</check>
  </verification>
  <notes>{후속 작업 참고사항}</notes>
</task-result>
```

### cache_control 전략

```json
{
  "type": "text",
  "text": "{공통 섹션 내용}",
  "cache_control": {"type": "ephemeral"}
}
```

- 공통 섹션(Output Language Rule, Build Commands 등)을 `cache_control` 블록으로 마킹
- 에이전트 프롬프트에 "이 섹션은 캐싱 대상"이라는 지시사항 추가
- 반복 호출 시 캐시된 토큰으로 비용 90% 절감

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/shared-prompt-sections.md` | CREATE | 공통 재사용 섹션 정의 (Output Language Rule, Build Commands 등) + 캐싱 마킹 지시사항 |
| `agents/xml-schema.md` | CREATE | 에이전트 간 XML 통신 스키마 정의 (dispatch, task-input, task-result 포맷) |

## Acceptance Criteria
- [ ] `agents/shared-prompt-sections.md` 파일이 생성됨
- [ ] 공통 섹션이 3개 이상 식별되어 문서화됨 (Output Language Rule, Build Commands, File Path Patterns 등)
- [ ] 각 공통 섹션에 `cache_control` 사용 지시사항이 명시됨
- [ ] `agents/xml-schema.md` 파일이 생성됨
- [ ] dispatch 포맷 (dispatcher -> receiver) 정의됨
- [ ] task-result 포맷 (receiver -> dispatcher) 정의됨
- [ ] 기존 에이전트 파일이 변경되지 않음 (신규 파일만 생성)

## Verify
```bash
# 파일 존재 확인
test -f agents/shared-prompt-sections.md && echo "PASS: shared-prompt-sections.md exists" || echo "FAIL"
test -f agents/xml-schema.md && echo "PASS: xml-schema.md exists" || echo "FAIL"

# 내용 검증
grep -c "cache_control" agents/shared-prompt-sections.md | xargs -I{} test {} -ge 1 && echo "PASS: cache_control referenced" || echo "FAIL"
grep -c "<dispatch" agents/xml-schema.md | xargs -I{} test {} -ge 1 && echo "PASS: dispatch schema defined" || echo "FAIL"
grep -c "<task-result" agents/xml-schema.md | xargs -I{} test {} -ge 1 && echo "PASS: task-result schema defined" || echo "FAIL"

# 기존 파일 무변경 확인
git diff --name-only agents/router.md agents/planner.md agents/scheduler.md agents/builder.md agents/verifier.md agents/committer.md | wc -l | xargs -I{} test {} -eq 0 && echo "PASS: existing agents unchanged" || echo "FAIL"
```
