# Sliding Window Context — 메시지 규격 검증 보고서

> Date: 2026-03-20
> WORK: WORK-TEST (Simple Calculator — pipeline 모드)
> Purpose: Main Claude ↔ 서브에이전트 간 메시지 규격이 스펙대로 전달되는지 실제 파이프라인 실행을 통해 검증

---

## 1. 테스트 개요

Simple Calculator (calc.js, 사칙연산 ESM 모듈)를 pipeline 모드로 실행하여 4개 서브에이전트(router → builder → verifier → committer) 간 메시지 흐름을 캡처했다.

### 실행 흐름

```
User → Main Claude
  │
  ├─ [1] Main Claude → router (prompt: "[추가기능] ...")
  │      router → Main Claude (dispatch XML 반환)
  │
  ├─ [2] Main Claude → builder (prompt: dispatch XML)
  │      builder → Main Claude (task-result XML + context-handoff 반환)
  │
  ├─ [3] Main Claude → verifier (prompt: builder task-result XML)
  │      verifier → Main Claude (task-result XML + context-handoff 반환)
  │
  └─ [4] Main Claude → committer (prompt: builder + verifier task-result XML)
         committer → Main Claude (task-result XML + commit hash 반환)
```

---

## 2. 메시지 규격 대조

### 2.1 dispatch XML (Router → Main Claude → Builder)

| 항목 | 스펙 (agent-flow.md) | 실제 | 일치 |
|------|---------------------|------|------|
| `<dispatch to="builder">` | O | O | **O** |
| `execution-mode` 속성 | pipeline / full / direct | `pipeline` | **O** |
| `<context>` (project, language, plan-file) | O | O | **O** |
| `<task-spec>` (file, title, action, description) | O | O | **O** |
| `<previous-results/>` | O (pipeline 첫 TASK는 빈 태그) | `<previous-results/>` | **O** |
| `<cache-hint>` | O | `sections="build-lint,file-paths"` | **O** |

**캡처된 dispatch XML:**

```xml
<dispatch to="builder" work="WORK-TEST" task="TASK-00" execution-mode="pipeline">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
    <plan-file>works/WORK-TEST/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/WORK-TEST/TASK-00.md</file>
    <title>calc.js ESM 모듈 및 테스트 파일 작성</title>
    <action>implement</action>
    <description>사칙연산(add, subtract, multiply, divide) 함수 4개를 export하는 ESM 모듈 calc.js와
    node:test 내장 테스트 러너 기반 calc.test.js를 works/WORK-TEST/ 디렉토리에 작성.
    divide by zero 에러 처리 포함.
    검증: node --test works/WORK-TEST/calc.test.js</description>
  </task-spec>
  <previous-results/>
  <cache-hint sections="build-lint,file-paths"/>
</dispatch>
```

### 2.2 task-result XML (Builder → Main Claude)

| 항목 | 스펙 | 실제 | 일치 |
|------|------|------|------|
| `<task-result>` 루트 | work, task, agent, status 속성 | `work="WORK-TEST" task="TASK-00" agent="builder" status="PASS"` | **O** |
| `<summary>` | 1-3줄 | O | **O** |
| `<files-changed>` | `<file action="" path="">` | 3개 파일 (calc.js, calc.test.js, progress.md) | **O** |
| `<verification>` | check name/status | node --test PASS, build N/A, lint N/A | **O** |
| `<self-check>` | build/lint/test | O | **O** |
| `<notes>` | 자유 텍스트 | O | **O** |
| `<context-handoff>` | what/why/caution/incomplete + detail-level | FULL, 4필드 모두 포함 | **O** |

**캡처된 builder task-result (context-handoff 부분):**

```xml
<context-handoff from="builder" detail-level="FULL">
  <what>calc.js(ESM 4함수) + calc.test.js(8 테스트) 생성 완료. 모든 Acceptance Criteria 충족.</what>
  <why>node:test 내장 러너 사용으로 외부 의존성 없음. ESM import/export 사용으로 PLAN 스택 준수.</why>
  <caution>테스트 파일이 상대 경로 import(./calc.js)를 사용하므로 동일 디렉토리에 두 파일이 함께 있어야 함.</caution>
  <incomplete>없음</incomplete>
</context-handoff>
```

### 2.3 task-result XML (Verifier → Main Claude)

| 항목 | 스펙 | 실제 | 일치 |
|------|------|------|------|
| `<task-result agent="verifier">` | O | O | **O** |
| `<verification>` 세부 항목 | progress, build, lint, tests, task-specific, files, acceptance-criteria | 7개 항목 모두 포함 | **O** |
| `<context-handoff>` | what/why/caution/incomplete + FULL | O | **O** |

**캡처된 verifier context-handoff:**

```xml
<context-handoff from="verifier" detail-level="FULL">
  <what>calc.js(ESM add/subtract/multiply/divide 4함수) + calc.test.js(node:test 8테스트)
        완전 검증 완료. Acceptance Criteria 3개 모두 충족.</what>
  <why>builder 반환 task-result XML의 자체 검증을 추가로 재수행하여 독립 검증 확보.
       모든 테스트 재실행 및 divide by zero 에러 메시지 직접 확인.</why>
  <caution>TASK-00_progress.md 파일명이 underscore(_)를 사용하고 있으며,
           이는 파일 명명 규칙(file-content-schema.md § 7)과 일치.</caution>
  <incomplete>없음. builder가 제시한 모든 내용 검증 완료.</incomplete>
</context-handoff>
```

### 2.4 task-result XML (Committer → Main Claude)

| 항목 | 스펙 | 실제 | 일치 |
|------|------|------|------|
| `<task-result agent="committer">` | O | O | **O** |
| `<commit><hash>` | O | `40ff82a` | **O** |
| `<commit><message>` | conventional commit | `feat(TASK-00): calc.js ESM 모듈 및 테스트 파일 작성` | **O** |
| `<result-file>` | result.md 경로 | `works/WORK-TEST/TASK-00_result.md` | **O** |
| `<progress>` | done/total | 1/1 | **O** |
| `<context-handoff>` | SUMMARY (committer는 체인 마지막) | `detail-level="SUMMARY"`, what만 포함 | **O** |

---

## 3. context-handoff 규격 검증 (spec_sliding-window-context.md §3)

| 필드 | 스펙 | builder | verifier | committer | 일치 |
|------|------|---------|----------|-----------|------|
| `<what>` | 필수, 1-3줄 요약 | O | O | O | **O** |
| `<why>` | 필수, 설계 의도 | O | O | — (SUMMARY) | **O** |
| `<caution>` | 필수, 주의사항 | O | O | — (SUMMARY) | **O** |
| `<incomplete>` | 필수, 미완료 항목 | O ("없음") | O ("없음") | — (SUMMARY) | **O** |
| `detail-level` | FULL/SUMMARY | FULL | FULL | SUMMARY | **O** |

### 슬라이딩 윈도우 적용 확인 (pipeline 모드)

| 수신 Agent | builder handoff | verifier handoff | 스펙 | 일치 |
|-----------|-----------------|------------------|------|------|
| verifier | FULL (직전) | — | FULL | **O** |
| committer | SUMMARY (2단계 전) | FULL (직전) | SUMMARY + FULL | **O** |

---

## 4. result.md 규격 검증 (committer 작성)

| 섹션 | 스펙 (spec_sliding-window-context.md §7) | 실제 | 일치 |
|------|------------------------------------------|------|------|
| 헤더 (WORK, Completed, Status, Commit) | O | O | **O** |
| 요약 (1-2줄) | O | O | **O** |
| 완료 체크리스트 (`[x]`) | O | 4항목 | **O** |
| 검증 결과 (Build/Lint/Tests) | O | O | **O** |
| 변경 파일 (Created/Modified) | O | Created 2개 | **O** |
| Builder Context (SUMMARY) | what 1-3줄 | O | **O** |
| Verifier Context (FULL) | what/why/caution/incomplete | O (4필드) | **O** |
| 섹션 헤더 언어 | PLAN.md Language 기준 | 한국어 (ko) | **O** |

---

## 5. 결론

**전체 32개 검증 항목 중 32개 일치 (100%)**

- dispatch XML: 6/6 항목 일치
- builder task-result XML: 7/7 항목 일치
- verifier task-result XML: 3/3 항목 일치
- committer task-result XML: 6/6 항목 일치
- context-handoff 구조: 5/5 항목 일치
- 슬라이딩 윈도우 적용: 2/2 항목 일치
- result.md 구조: 8/8 항목 일치

pipeline 모드에서 Main Claude가 4개 서브에이전트를 순차 호출하며, **dispatch XML → task-result XML → context-handoff** 체인이 스펙 문서(agent-flow.md, spec_sliding-window-context.md)와 완전히 일치한다.

### 참고 파일

- `works/WORK-TEST/PLAN.md` — 테스트 WORK 계획
- `works/WORK-TEST/TASK-00.md` — TASK 명세
- `works/WORK-TEST/TASK-00_result.md` — committer 작성 최종 보고서
- `works/WORK-TEST/calc.js` — 테스트 대상 (사칙연산 ESM 모듈)
- `works/WORK-TEST/calc.test.js` — node:test 기반 테스트 (8/8 PASS)
