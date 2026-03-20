# WORK-03: Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감

> Created: 2026-03-10
> Project: uc-taskmanager (Universal Claude Task Manager)
> Tech Stack: Claude Code CLI Subagent System (Markdown-based agent definitions)
> Language: ko
> Status: PLANNED

## Goal

6개 에이전트(router, planner, scheduler, builder, verifier, committer) 간의 프롬프트 전달을 구조화된 XML 포맷으로 전환하고, 공통 시스템 프롬프트 섹션에 cache_control 지시사항을 추가하여 토큰 사용량을 절감한다.

## Background (REQ-019)

현재 에이전트 간 통신은 자연어 텍스트 기반이다:
- scheduler -> builder: "Pass: WORK_ID, TASK file content, project context"
- scheduler -> verifier: "Pass: WORK_ID, TASK acceptance criteria, verification commands"
- 이로 인해 모델이 clarification 요청 가능성이 높고, 출력 토큰이 증가한다.

개선 방향:
1. **Prompt Caching**: 동일한 system prompt/태스크 템플릿 반복 호출 시 cache_control 블록 활용 (비용 90% 절감)
2. **구조화된 XML 포맷**: 모호한 텍스트 대신 명확한 XML 구조로 전달하여 출력 토큰 감소 + 재질문 제거
3. **Tool Result 형식**: 의미론적 우선처리를 위한 구조적 결과 반환

## Task Dependency Graph

```
TASK-00 (공통 섹션 식별 + 캐싱 마킹 + XML 스키마 설계)
   |
   +---> TASK-01 (scheduler.md 구조화 XML 디스패치 포맷)
   |
   +---> TASK-02 (router.md 구조화 XML 디스패치 포맷)
   |
   +---> TASK-03 (builder/verifier/committer 수신 파싱 + 응답 포맷)
              |
              v
         TASK-04 (통합 검증 + README 문서 업데이트)
```

## Tasks

### WORK-03-TASK-00: 공통 시스템 프롬프트 섹션 식별 및 캐싱 마킹 + XML 스키마 설계
- **Depends on**: (none)
- **Scope**: 6개 에이전트 파일에서 반복되는 공통 섹션을 식별하고, cache_control 지시사항을 추가하며, 에이전트 간 통신에 사용할 XML 스키마를 설계한다
- **Files**:
  - `agents/shared-prompt-sections.md` — 공통 재사용 섹션 정의 + 캐싱 마킹 지시사항
  - `agents/xml-schema.md` — 에이전트 간 XML 통신 스키마 정의
- **Acceptance Criteria**:
  - [ ] 공통 섹션이 3개 이상 식별되어 문서화됨
  - [ ] cache_control 블록 사용 지시사항이 명시됨
  - [ ] XML 스키마가 dispatcher -> receiver 양방향 정의됨
  - [ ] 기존 에이전트 파일에 영향 없음 (신규 파일만 생성)
- **Verify**:
  ```bash
  test -f agents/shared-prompt-sections.md && echo "PASS: shared-prompt-sections.md exists" || echo "FAIL"
  test -f agents/xml-schema.md && echo "PASS: xml-schema.md exists" || echo "FAIL"
  grep -c "cache_control" agents/shared-prompt-sections.md | xargs -I{} test {} -ge 1 && echo "PASS: cache_control referenced" || echo "FAIL"
  grep -c "<task" agents/xml-schema.md | xargs -I{} test {} -ge 1 && echo "PASS: XML schema defined" || echo "FAIL"
  ```

### WORK-03-TASK-01: scheduler.md 구조화 XML 디스패치 포맷 적용
- **Depends on**: WORK-03-TASK-00
- **Scope**: scheduler가 builder/verifier/committer를 호출할 때 구조화된 XML 포맷을 사용하도록 scheduler.md를 수정한다
- **Files**:
  - `agents/scheduler.md` — MODIFY: Phase 2/3/4의 디스패치 섹션을 XML 포맷으로 교체
- **Acceptance Criteria**:
  - [ ] builder 호출 시 XML 디스패치 포맷 사용
  - [ ] verifier 호출 시 XML 디스패치 포맷 사용
  - [ ] committer 호출 시 XML 디스패치 포맷 사용
  - [ ] 공통 섹션 참조 지시사항 포함
  - [ ] cache_control 지시사항 포함
- **Verify**:
  ```bash
  grep -c "<dispatch" agents/scheduler.md | xargs -I{} test {} -ge 3 && echo "PASS: 3+ dispatch blocks" || echo "FAIL"
  grep -c "cache_control" agents/scheduler.md | xargs -I{} test {} -ge 1 && echo "PASS: cache_control referenced" || echo "FAIL"
  grep "xml-schema" agents/scheduler.md && echo "PASS: xml-schema referenced" || echo "FAIL"
  ```

### WORK-03-TASK-02: router.md 구조화 XML 디스패치 포맷 적용
- **Depends on**: WORK-03-TASK-00
- **Scope**: router가 planner/scheduler/builder/verifier/committer를 호출할 때 구조화된 XML 포맷을 사용하도록 router.md를 수정한다
- **Files**:
  - `agents/router.md` — MODIFY: S-TASK Pipeline 및 WORK Flow의 디스패치 섹션을 XML 포맷으로 교체
- **Acceptance Criteria**:
  - [ ] S-TASK Pipeline 디스패치가 XML 포맷 사용
  - [ ] WORK Flow 디스패치가 XML 포맷 사용
  - [ ] planner/scheduler 호출 시 XML 포맷 사용
  - [ ] 공통 섹션 참조 지시사항 포함
  - [ ] cache_control 지시사항 포함
- **Verify**:
  ```bash
  grep -c "<dispatch" agents/router.md | xargs -I{} test {} -ge 2 && echo "PASS: 2+ dispatch blocks" || echo "FAIL"
  grep -c "cache_control" agents/router.md | xargs -I{} test {} -ge 1 && echo "PASS: cache_control referenced" || echo "FAIL"
  grep "xml-schema" agents/router.md && echo "PASS: xml-schema referenced" || echo "FAIL"
  ```

### WORK-03-TASK-03: builder/verifier/committer 수신 파싱 및 응답 포맷 적용
- **Depends on**: WORK-03-TASK-00
- **Scope**: 3개 에이전트가 구조화된 XML 입력을 파싱하고, 결과도 구조화된 XML로 반환하도록 수정한다
- **Files**:
  - `agents/builder.md` — MODIFY: XML 입력 파싱 + 구조화된 결과 반환 포맷 추가
  - `agents/verifier.md` — MODIFY: XML 입력 파싱 + 구조화된 결과 반환 포맷 추가
  - `agents/committer.md` — MODIFY: XML 입력 파싱 + 구조화된 결과 반환 포맷 추가
- **Acceptance Criteria**:
  - [ ] builder.md에 XML 입력 파싱 섹션 추가
  - [ ] builder.md에 XML 결과 반환 포맷 추가
  - [ ] verifier.md에 XML 입력 파싱 섹션 추가
  - [ ] verifier.md에 XML 결과 반환 포맷 추가
  - [ ] committer.md에 XML 입력 파싱 섹션 추가
  - [ ] committer.md에 XML 결과 반환 포맷 추가
  - [ ] 공통 섹션 참조 지시사항 포함
- **Verify**:
  ```bash
  for f in builder verifier committer; do
    grep -c "<task-input" agents/${f}.md | xargs -I{} test {} -ge 1 && echo "PASS: ${f}.md has XML input parsing" || echo "FAIL: ${f}.md"
    grep -c "<task-result" agents/${f}.md | xargs -I{} test {} -ge 1 && echo "PASS: ${f}.md has XML result format" || echo "FAIL: ${f}.md"
  done
  ```

### WORK-03-TASK-04: 통합 검증 및 README 문서 업데이트
- **Depends on**: WORK-03-TASK-01, WORK-03-TASK-02, WORK-03-TASK-03
- **Scope**: 전체 에이전트 간 XML 통신 흐름을 검증하고, README.md와 README_KO.md에 구조화 통신 설명을 추가한다
- **Files**:
  - `README.md` — MODIFY: 구조화 통신 및 토큰 절감 섹션 추가
  - `README_KO.md` — MODIFY: 구조화 통신 및 토큰 절감 섹션 추가
- **Acceptance Criteria**:
  - [ ] 모든 에이전트 파일에서 XML 스키마가 일관되게 참조됨
  - [ ] scheduler -> builder -> verifier -> committer 흐름의 XML 전달이 일관됨
  - [ ] router -> (planner|scheduler|builder|verifier|committer) 흐름의 XML 전달이 일관됨
  - [ ] README.md에 구조화 통신 설명 섹션 추가
  - [ ] README_KO.md에 구조화 통신 설명 섹션 추가
- **Verify**:
  ```bash
  grep -c "xml-schema" agents/scheduler.md agents/router.md agents/builder.md agents/verifier.md agents/committer.md | grep ":0$" && echo "FAIL: some agents missing xml-schema reference" || echo "PASS: all agents reference xml-schema"
  grep -i "structured.*communication\|구조화.*통신\|token.*saving\|토큰.*절감" README.md && echo "PASS: README.md updated" || echo "FAIL"
  grep -i "structured.*communication\|구조화.*통신\|token.*saving\|토큰.*절감" README_KO.md && echo "PASS: README_KO.md updated" || echo "FAIL"
  ```
