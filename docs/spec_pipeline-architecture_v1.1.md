# Pipeline Architecture Spec v1.1

> uc-taskmanager -- 에이전트 파이프라인 전체 구조 명세 v1.1

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-03-12 | 최초 작성 (WORK-07 기반) |
| v1.0.1 | 2026-03-14 | SDD v1.3 execution-mode 3종 체계 반영 (WORK-10) |
| v1.0.2 | 2026-03-15 | 파일명 규칙 현행화 (WORK-19) |
| **v1.1** | **2026-03-15** | **Main Claude 오케스트레이터 구조 명시, agent-flow 반영, Activity Log 체계 추가, STARTUP 참조 파일 체계 반영 (WORK-24)** |

---

## 1. 개요

uc-taskmanager는 Claude Code CLI 위에서 동작하는 **멀티 에이전트 작업 파이프라인 시스템**이다.
사용자의 요청을 분석하여 복잡도에 따라 세 가지 execution-mode 중 하나로 라우팅하고, 각 TASK를 에이전트 파이프라인으로 자동 처리한다.

### v1.1 핵심 변경사항

v1.0에서는 서브에이전트 간 직접 호출이 가능한 것처럼 기술되어 있었으나, 실제 구현에서는 **Main Claude(최상위 Claude Code 세션)가 모든 에이전트 호출을 수행하는 오케스트레이터 역할**을 한다. v1.1은 이 구조를 명시적으로 반영한다.

```
[v1.0] scheduler --직접호출--> builder --직접호출--> verifier --직접호출--> committer
[v1.1] Main Claude --호출--> scheduler (dispatch XML 반환)
       Main Claude --호출--> builder   (task-result XML 반환)
       Main Claude --호출--> verifier  (task-result XML 반환)
       Main Claude --호출--> committer (task-result XML 반환)
```

**서브에이전트는 작업 완료 후 결과(dispatch XML 또는 task-result XML)만 반환한다. Main Claude가 반환값을 받아 다음 에이전트를 호출한다.**

---

## 2. 아키텍처 개요

### 2.1 계층 구조

```
사용자
  |
  v
Main Claude (오케스트레이터)
  |
  +-- router        요청 분석 + execution-mode 결정
  +-- planner       WORK 생성 + TASK 분해 (full 모드)
  +-- scheduler     DAG 관리 + dispatch XML 생성 (full 모드)
  +-- builder       TASK 구현
  +-- verifier      구현 검증 (READ-ONLY)
  +-- committer     result.md 생성 + git commit
```

Main Claude는 에이전트를 순차적으로 호출하고, 각 에이전트의 반환값(XML)을 다음 에이전트의 입력으로 전달한다. 에이전트 간 직접 통신은 발생하지 않는다.

### 2.2 에이전트 구성

| 에이전트 | 역할 | 모델 | 반환값 |
|---------|------|------|--------|
| **router** | 요청 분석 + execution-mode 결정 + direct 모드 직접 처리 | opus | execution-mode + dispatch XML |
| **planner** | WORK 생성 + TASK 분해 + DAG 설계 (full 모드 전용) | opus | PLAN.md/TASK 파일 생성 완료 보고 |
| **scheduler** | DAG 분석 + READY TASK 결정 + dispatch XML 생성 (full 모드 전용) | haiku | READY TASK + dispatch XML |
| **builder** | TASK 실제 구현 (파일 생성/수정) + self-check | sonnet | task-result XML (context-handoff 포함) |
| **verifier** | 구현 결과 검증 (빌드/린트/테스트/AC) READ-ONLY | haiku | task-result XML |
| **committer** | result.md 작성 + git commit + 콜백 | haiku | task-result XML + commit hash |

### 2.3 에이전트별 STARTUP 참조 파일

모든 에이전트는 실행 시 `agents/agent-flow.md`를 **최우선**으로 읽어 자신의 역할과 실행 흐름을 확인한다.

| 에이전트 | 필수 참조 파일 |
|---------|--------------|
| router | agent-flow.md, file-content-schema.md, shared-prompt-sections.md, xml-schema.md, work-activity-log.md |
| planner | agent-flow.md, file-content-schema.md, shared-prompt-sections.md |
| scheduler | agent-flow.md, file-content-schema.md, shared-prompt-sections.md, xml-schema.md, context-policy.md |
| builder | agent-flow.md, file-content-schema.md, shared-prompt-sections.md, xml-schema.md, context-policy.md |
| verifier | agent-flow.md, shared-prompt-sections.md, xml-schema.md, context-policy.md |
| committer | agent-flow.md, file-content-schema.md, shared-prompt-sections.md, xml-schema.md, context-policy.md |

---

## 3. execution-mode 3종 체계

router가 요청 복잡도를 평가하여 세 가지 모드 중 하나를 선택한다.
판정 기준은 `.agent/router_rule_config.json` 존재 시 해당 config의 rules만 사용하고, 없으면 아래 내장 기준을 적용한다.

```
[] 태그 감지
     |
     v
  복잡도 평가
     |
     +-- Trivial (1파일, <=10줄)
     |   v
     |  direct -- Router 단독 수행 (서브에이전트 없음)
     |
     +-- Simple (2~3파일, 또는 >10줄, 1~2단계)
     |   v
     |  pipeline -- Main Claude: Router -> Builder -> Verifier -> Committer
     |
     +-- Complex (4+파일, 3+단계, 의존성 있음)
         v
        full -- Main Claude: Router -> Planner -> [Scheduler -> B->V->C] x N
```

### 3.1 direct 모드

Router가 서브에이전트 없이 자신의 세션에서 전 과정을 직접 수행한다.

```
Router: WORK 폴더 생성 -> PLAN.md + TASK-00.md 생성
     -> 코드 수정 -> self-check
     -> TASK-00_progress.md (COMPLETED)
     -> TASK-00_result.md 작성
     -> git commit -> 커밋 해시 백필
     -> WORK-LIST.md IN_PROGRESS 추가
```

- 서브에이전트 호출 비용(~12,500 토큰 세션 초기화) 없음
- PLAN.md에 `Execution-Mode: direct` 기록
- Router가 committer 역할까지 대행 (result.md + commit + COMMITTER DONE 콜백)
- WORK 폴더 생성은 필수 (생략 금지)

### 3.2 pipeline 모드

Router가 PLAN + TASK 파일을 생성한 후, **Main Claude가** 서브에이전트를 순차 호출한다.

```
Main Claude:
  1. router 호출 -> PLAN.md + TASK-00.md 생성 + builder dispatch XML 반환
  2. builder 호출 (dispatch XML을 prompt로) -> task-result XML 반환
  3. verifier 호출 (builder 결과를 prompt로) -> task-result XML 반환
  4. committer 호출 (verifier 결과를 prompt로) -> commit hash 반환
```

- `execution-mode="pipeline"` 속성을 dispatch XML에 포함
- PLAN.md에 `Execution-Mode: pipeline` 기록

### 3.3 full 모드

Router가 planner에게 계획 수립을 위임하고, scheduler가 DAG 기반으로 dispatch XML을 생성한다. **실제 호출은 모두 Main Claude가 수행한다.**

```
Main Claude:
  1. router 호출 -> WORK 디렉토리 생성 + planner dispatch XML 반환
  2. planner 호출 (dispatch XML을 prompt로) -> PLAN.md + TASK 파일 생성
  3. scheduler 호출 -> DAG 분석 + READY TASK + builder dispatch XML 반환
  4. builder 호출 (dispatch XML을 prompt로) -> 구현 + task-result XML 반환
  5. verifier 호출 (builder 결과를 prompt로) -> task-result XML 반환
  6. committer 호출 (verifier 결과를 prompt로) -> commit + task-result XML 반환
  7. 미완료 TASK 있으면 3번으로 돌아감
```

- `execution-mode="full"` 속성을 dispatch XML에 포함
- PLAN.md에 `Execution-Mode: full` 기록
- 기본 모드: 계획 완료 후 사용자 승인 후 builder 단계 진입
- 병렬 실행: scheduler가 복수의 READY TASK를 반환하면 Main Claude가 builder를 동시에 호출

### 3.4 Routing 기준표

| 기준 | direct | pipeline | full |
|------|:---:|:---:|:---:|
| 수정 파일 수 | 1 | 2~3 | 4+ |
| 변경 줄 수 | <=10 | >10 | -- |
| 범위 | 단일 수정 | 단일 모듈 | 복수 모듈 |
| DB 스키마 변경 | 없음 | 없음 | 있음 |
| TASK 의존성 | 없음 | 없음 | 순차/병렬 |
| 예상 단계 수 | 1 | 1~2 | 3+ |

---

## 4. WORK / TASK 파일 구조

모든 execution-mode에서 동일한 파일 구조를 사용한다 (불변 보장).

```
works/
  WORK-LIST.md                  # 전체 WORK 목록
  WORK-NN/
    PLAN.md                     # WORK 개요 + DAG (mini 또는 full)
    PROGRESS.md                 # scheduler 진행 상태 (full 모드만)
    TASK-XX.md                  # TASK 명세 (WORK prefix 없음)
    TASK-XX_progress.md         # 실시간 체크포인트 (builder/router 작성)
    TASK-XX_result.md           # 완료 보고서 (committer/router 작성)
    work_WORK-NN.log            # Activity Log
```

파일명 규칙 상세는 `agents/file-content-schema.md` SS 7 참조.

### 불변 보장 항목

모드에 무관하게 반드시 생성/전송되어야 하는 항목:

| 불변 항목 | direct 수행 주체 | pipeline/full 수행 주체 |
|-----------|:---------------:|:----------------------:|
| `works/WORK-NN/` 디렉토리 | Router | Router / Planner |
| `PLAN.md` (mini 또는 full) | Router | Router / Planner |
| `TASK-XX.md` 파일 | Router | Router / Planner |
| `TASK-XX_progress.md` 파일 | Router | Planner(템플릿) / Builder(갱신) |
| `TASK-XX_result.md` 생성 | **Router** | **Committer** |
| COMMITTER DONE 콜백 전송 | **Router** | **Committer** |
| `WORK-LIST.md` IN_PROGRESS 추가 | Router | Router |
| `work_WORK-NN.log` Activity Log | Router | 각 에이전트 |

---

## 5. TASK 파이프라인 흐름

### 5.1 pipeline / full 공통 (v1.1: Main Claude 오케스트레이션)

각 TASK는 다음 순서로 실행된다. **모든 에이전트 호출은 Main Claude가 수행한다.**

```
Main Claude (오케스트레이터)
  |
  +-- [1] builder 호출
  |       +-- 구현 수행
  |       +-- progress.md 실시간 기록 (STARTED -> IN_PROGRESS -> COMPLETED)
  |       +-- self-check (build + lint)
  |       +-- task-result XML 반환 (context-handoff 포함)
  |
  +-- [2] Main Claude가 builder 반환값을 verifier에 전달
  |       +-- verifier 호출
  |       +-- progress.md gate check
  |       +-- 빌드/린트/테스트/AC 검증 (READ-ONLY)
  |       +-- task-result XML 반환 (context-handoff 포함)
  |
  +-- [3] Main Claude가 verifier 반환값을 committer에 전달
          +-- committer 호출
          +-- [Gate] progress.md 존재 + COMPLETED 확인
          +-- Gate 실패 -> Main Claude에 FAIL 반환 -> builder 재호출
          +-- Gate 통과 -> result.md 작성 + git commit + 콜백
          +-- task-result XML 반환 (commit hash 포함)
```

### 5.2 v1.0 대비 변경점

| 항목 | v1.0 | v1.1 |
|------|------|------|
| 에이전트 호출 주체 | dispatcher (Router 또는 Scheduler) | **Main Claude** |
| scheduler 역할 | DAG 관리 + 에이전트 직접 dispatch | DAG 관리 + **dispatch XML 생성만** (호출은 Main Claude) |
| 에이전트 반환값 | 다음 에이전트에 직접 전달 | **Main Claude에 XML 반환** -> Main Claude가 전달 |
| 재시도 결정 | dispatcher가 결정 | **Main Claude가 결정** |

---

## 6. 에이전트 간 통신 포맷

에이전트 간 데이터는 **구조화된 XML**로 전달된다. 상세 스키마는 `agents/xml-schema.md` 참조.

### 6.1 dispatch (Main Claude -> 서브에이전트)

```xml
<dispatch to="{receiver}" work="{WORK_ID}" task="{TASK_ID}"
          execution-mode="{direct|pipeline|full}">
  <context>
    <project>{project name}</project>
    <language>{lang_code}</language>
    <plan-file>works/{WORK_ID}/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/{WORK_ID}/TASK-XX.md</file>
    <title>TASK 제목</title>
    <action>{implement|verify|commit|plan|route}</action>
  </task-spec>
  <previous-results>
    <result task="{TASK_ID}" status="{PASS|FAIL|SKIP}">{summary}</result>
  </previous-results>
</dispatch>
```

### 6.2 결과 반환 (서브에이전트 -> Main Claude)

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2줄 요약}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{description}</file>
  </files-changed>
  <verification>
    <check name="{type}" status="{PASS|FAIL|N/A}">{output}</check>
  </verification>
  <context-handoff from="{agent}" detail-level="{FULL|SUMMARY}">
    <what>{변경/검증 사항}</what>
    <why>{의사결정 근거}</why>
    <caution>{주의사항}</caution>
    <incomplete>{미완료 사항}</incomplete>
  </context-handoff>
  <notes>{참고사항}</notes>
</task-result>
```

### 6.3 dispatch 속성 요약

| 속성 | 값 | 설명 |
|------|----|------|
| `to` | builder, verifier, committer, planner, scheduler | 수신 에이전트 |
| `work` | WORK-NN | WORK 식별자 |
| `task` | TASK-XX | TASK 식별자 (WORK prefix 포함 금지) |
| `execution-mode` | direct, pipeline, full | 에이전트 동작 수준. 생략 시 `full`로 간주 |

### 6.4 execution-mode별 에이전트 행동

| 에이전트 | direct | pipeline | full |
|---------|--------|----------|------|
| Router | 구현+self-check+result.md+commit+콜백 직접 | PLAN 생성 후 dispatch XML 반환 | planner dispatch XML 반환 |
| Planner | 호출 안 됨 | 호출 안 됨 | PLAN.md + TASK 파일 생성 |
| Scheduler | 호출 안 됨 | 호출 안 됨 | DAG 관리 + dispatch XML 반환 |
| Builder | 호출 안 됨 | 구현 + task-result 반환 | 구현 + task-result 반환 |
| Verifier | 호출 안 됨 | 검증 + task-result 반환 | 검증 + task-result 반환 |
| Committer | 호출 안 됨 | result.md+commit+콜백 | result.md+commit+콜백 |

---

## 7. 컨텍스트 전달 (슬라이딩 윈도우)

에이전트 간, TASK 간 컨텍스트를 전달할 때 토큰 절감을 위해 슬라이딩 윈도우 정책을 적용한다.
상세 정책은 `agents/context-policy.md` 참조.

### 7.1 거리별 Detail Level

| 단계 거리 | Detail Level | 전달 필드 |
|---------|-------------|----------|
| 직전 (1단계) | `FULL` | what, why, caution, incomplete (4개 필드 모두) |
| 2단계 전 | `SUMMARY` | what 필드만 (1-3줄) |
| 3단계 이상 | `DROP` | 생략 |

### 7.2 파이프라인 내 컨텍스트 흐름 (v1.1)

```
Builder --[task-result XML]--> Main Claude
  Main Claude --[builder context FULL]--> Verifier

Verifier --[task-result XML]--> Main Claude
  Main Claude --[verifier context FULL + builder context SUMMARY]--> Committer

TASK-XX 완료 후:
  Main Claude --[TASK-XX context FULL]--> 다음 TASK Builder
  Main Claude --[TASK-(XX-1) context SUMMARY]--> 다음 TASK Builder
  (3단계 이상 이전: DROP)
```

### 7.3 Context-Handoff 4-필드

| 필드 | FULL | SUMMARY | 내용 |
|------|:----:|:-------:|------|
| `what` | O | O | 변경/검증 사항 요약 (2-5줄) |
| `why` | O | X | 의사결정 근거 (2-4줄) |
| `caution` | O | X | 주의사항, 조건부 완료 (1-3줄) |
| `incomplete` | O | X | 미완료 사항 (1-2줄, 없으면 "None") |

---

## 8. Activity Log 체계

각 에이전트는 WORK 진행 상황을 `works/{WORK_ID}/work_{WORK_ID}.log` 파일에 기록한다.

### 8.1 로그 형식

```
[{ISO 8601 timestamp}]_{AGENT}_{STAGE}_{설명}
```

### 8.2 STAGE 테이블

| STAGE | 시점 | 설명 예시 |
|-------|------|-----------|
| `INIT` | WORK_ID 결정 후 | `WORK-NN 생성 -- Execution-Mode: direct/pipeline/full` |
| `REF` | STARTUP 참조 직후 | `참조: CLAUDE.md, agents/file-content-schema.md, ...` |
| `PLAN` | PLAN.md + TASK 파일 생성 완료 | `PLAN.md, TASK-00.md 생성 완료` |
| `IMPL` | direct 모드 코드 구현 시작 | `코드 구현 시작 -- 참조: {수정 대상 파일 목록}` |
| `BUILD` | self-check 통과 | `빌드/린트 통과` |
| `COMMIT` | git commit 완료 | `commit {hash}` |
| `DISPATCH` | pipeline/full dispatch | `Builder dispatch` 또는 `Planner dispatch` |

### 8.3 기록 시점 규칙

- 최초 실행 시: 수신한 프롬프트 메시지 내용 (필수)
- Callback 호출 시: URL, 성공 여부, Payload, Response (필수)
- 작업 진행 시: 작업 항목 및 작업 내용
- 수행 작업 완료 시: 타 Agent에 전송한 프롬프트 메시지 내용 (필수)

---

## 9. 비정상 종료 대응

| 상황 | 감지 방법 | 대응 |
|------|---------|------|
| builder 세션 크래시 | committer가 progress.md 없음 감지 | **Main Claude가** builder 재호출 |
| builder 작업 미완료 | progress.md Status != COMPLETED | **Main Claude가** builder 재호출 (progress.md 포함) |
| 재시도 3회 초과 | Main Claude 카운터 | TASK FAILED 마킹 + 파이프라인 중단 |

builder가 재시작될 때 **progress.md의 마지막 체크포인트부터 이어서 작업**한다.

### Committer Gate 재시도 흐름 (v1.1)

```
Committer --FAIL 반환--> Main Claude
  Main Claude: 재시도 카운터 확인
    카운터 < 3 -> builder 재호출 (기존 progress.md 포함)
    카운터 >= 3 -> TASK FAILED 마킹, 파이프라인 중단
```

---

## 10. DAG 의존성 관리 (full 모드)

PLAN.md에 정의된 TASK 간 의존성을 scheduler가 DAG로 분석하고, READY TASK 목록을 Main Claude에 반환한다.

```
TASK-00 (의존 없음) -> 즉시 실행
TASK-01 (TASK-00 의존) -> TASK-00 완료 후 실행
TASK-02 (TASK-01 의존) -> TASK-01 완료 후 실행
TASK-03, TASK-04 (TASK-00 의존) -> TASK-00 완료 후 병렬 실행 가능
```

### DAG Resolution 알고리즘

```
For each TASK:
  result file exists -> DONE
  ALL dependencies DONE -> READY
  else -> BLOCKED

READY tasks: 번호 낮은 순 실행
```

병렬 실행: scheduler가 복수의 READY TASK를 반환하면, **Main Claude가** builder를 동시에 호출한다.

---

## 11. MCP 도구 통합

### 11.1 Router MCP 도구

| 도구 | 용도 |
|------|------|
| `mcp__sequential-thinking__sequentialthinking` | 복잡도 판정이 애매할 때 단계별 분석 |
| `mcp__serena__*` | direct 모드에서 Router가 직접 코드 수정 시 심볼 단위 접근으로 토큰 절감 |

### 11.2 Planner MCP 도구

| 도구 | 용도 |
|------|------|
| `mcp__sequential-thinking__sequentialthinking` | TASK 수 4개 이상이거나 의존성이 복잡할 때 TASK 분해 보조 |
| `mcp__serena__*` | Discovery Process에서 기존 코드 구조 파악 시 사용 |

### 11.3 Builder MCP 도구 (Serena 우선 탐색)

| 우선순위 | 도구 | 용도 |
|---------|------|------|
| 1 | `mcp__serena__list_dir` | 디렉토리 구조 |
| 2 | `mcp__serena__get_symbols_overview` | 파일 심볼 구조 (전체 읽기 전 필수) |
| 3 | `mcp__serena__find_symbol(depth=1)` | 클래스 메서드 목록 |
| 4 | `mcp__serena__find_symbol(include_body=true)` | 수정 대상 정밀 읽기 |
| 5 | `mcp__serena__find_referencing_symbols` | 영향 범위 파악 |
| 6 | `Read` 도구 | 최후 수단 |

---

## 12. 콜백 통합

### 12.1 Pipeline Stage Callbacks

각 단계 전후에 콜백 이벤트를 전송한다. 콜백 URL은 CLAUDE.md에서 설정한다.

| 이벤트 | 페이로드 |
|--------|---------|
| BUILDER START/DONE | `{"stage": "BUILDER", "event": "START\|DONE", "workId": "...", "taskId": "..."}` |
| VERIFIER START/DONE | `{"stage": "VERIFIER", "event": "START\|DONE", ...}` |
| COMMITTER START/DONE | `{"stage": "COMMITTER", "event": "START\|DONE", ...}` |
| 실패 시 | `"event": "FAILED"` |

### 12.2 ProgressCallback

builder가 주요 체크포인트 갱신 후 호출한다. 실패해도 구현을 계속한다.

### 12.3 TaskCallback

committer가 git commit 완료 후 전송한다.

상세 콜백 연동은 `docs/spec_callback-integration.md` 참조.

---

## 13. 공유 리소스 (agents/ 파일 체계)

agents/ 디렉토리에는 12개의 md 파일이 있으며, 역할에 따라 두 유형으로 분류된다.

### 13.1 에이전트 정의 파일 (7개)

| 파일 | 에이전트 | 문서 구조 |
|------|---------|----------|
| `router.md` | Router | 1.역할, 2.수행업무, 3.업무수행단계, 4.제약사항 |
| `planner.md` | Planner | 동일 구조 |
| `scheduler.md` | Scheduler | 동일 구조 |
| `builder.md` | Builder | 동일 구조 |
| `verifier.md` | Verifier | 동일 구조 |
| `committer.md` | Committer | 동일 구조 |
| `agent-flow.md` | (공통) | Main Claude 오케스트레이션 가이드 -- 모든 에이전트 최우선 참조 |

### 13.2 공유 스키마/규칙 파일 (5개)

| 파일 | 내용 |
|------|------|
| `file-content-schema.md` | PLAN.md, TASK, progress, result 파일 포맷 단일 정의 |
| `shared-prompt-sections.md` | 공통 재사용 섹션 (빌드 명령, 파일 경로 패턴, WORK-LIST 규칙 등) |
| `xml-schema.md` | 에이전트 간 XML 통신 포맷 (dispatch, task-result, context-handoff) |
| `context-policy.md` | 슬라이딩 윈도우 컨텍스트 전달 규칙 |
| `work-activity-log.md` | Activity Log 기록 규칙 (log_work 함수, STAGE 테이블) |

---

## 14. 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| XML 스키마 | `agents/xml-schema.md` | 에이전트 간 통신 포맷 상세 |
| 컨텍스트 정책 | `agents/context-policy.md` | 슬라이딩 윈도우 정책 상세 |
| 파이프라인 산출물 포맷 | `agents/file-content-schema.md` | 파일 포맷 단일 정의 |
| 슬라이딩 윈도우 설계 | `docs/spec_sliding-window-context.md` | 토큰 절감 설계 |
| 콜백 통합 | `docs/spec_callback-integration.md` | 외부 시스템 콜백 연동 |
| 이전 버전 | `docs/spec_pipeline-architecture.md` | v1.0 문서 |

---

*최초 작성: 2026-03-15 | WORK-24 기반*
*v1.1: Main Claude 오케스트레이터 구조 명시, agent-flow.md 반영, Activity Log 체계 추가, STARTUP 참조 파일 체계 반영*
