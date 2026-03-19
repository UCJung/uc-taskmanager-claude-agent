# Pipeline Architecture Spec v1.1

> uc-taskmanager — 에이전트 파이프라인 전체 구조 명세 (agents/ 12개 파일 기반 전면 재작성)

---

## 1. 개요

uc-taskmanager는 Claude Code CLI 위에서 동작하는 **멀티 에이전트 작업 파이프라인 시스템**이다.
사용자의 요청을 분석하여 복잡도에 따라 세 가지 execution-mode 중 하나로 라우팅하고, 각 TASK를 에이전트 파이프라인으로 자동 처리한다.

### 핵심 설계 원칙

- **WORK / TASK 2단계 계층**: WORK(일) → TASK(작업) 구조로 목표를 분해
- **3종 execution-mode**: 복잡도에 따라 direct / pipeline / full 중 최적 경로 선택
- **Main Claude 오케스트레이션**: 모든 서브에이전트 호출은 Main Claude가 수행
- **슬라이딩 윈도우 컨텍스트**: 에이전트 간 reasoning 전달로 토큰 절감
- **불변 보장**: 모든 모드에서 result.md 생성과 COMMITTER DONE 콜백 전송 보장

---

## 2. 에이전트 구성

| 에이전트 | 역할 | 모델 | 실행 모드 |
|---------|------|------|---------|
| **router** | 사용자 요청 분석 → execution-mode 결정 및 실행 오케스트레이션 | opus | 항상 |
| **planner** | WORK 생성 + TASK 분해 + DAG 설계 | opus | full 전용 |
| **scheduler** | DAG 관리 + Builder/Verifier/Committer 파이프라인 실행 | haiku | full 전용 |
| **builder** | TASK 실제 구현 (파일 생성/수정) + progress.md 기록 | sonnet | pipeline / full |
| **verifier** | 구현 결과 검증 (빌드·린트·테스트·AC) — 읽기 전용 | haiku | pipeline / full |
| **committer** | result.md 작성 + git commit + TaskCallback 전송 | haiku | pipeline / full |

### 에이전트 간 호출 구조

> **모든 에이전트 호출은 Main Claude가 수행한다.**
> 서브에이전트는 작업 완료 후 결과 XML(dispatch 또는 task-result)만 반환한다.
> Main Claude가 반환값을 받아 다음 에이전트를 호출한다.

```
[] 태그 감지
     │
     ▼
  Main Claude → router 호출
                  │
         execution-mode 결정
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
  direct       pipeline        full
  (router       builder       planner
  단독)       →verifier      →scheduler
             →committer   →[B→V→C]×N
```

---

## 3. execution-mode 3종 체계

router가 `.agent/router_rule_config.json`의 rules를 우선 적용하여 판정한다.
config 없을 경우 내장 기준을 사용한다.

```
요청 분석
  → config 존재? YES → config rules 기준만 사용
              NO  → 내장 기준:
                     direct   — 1파일, ≤10줄
                     pipeline — 2~3파일, 1~2단계
                     full     — 4+파일, 3+단계, 의존성
```

판정이 애매한 경우 `mcp__sequential-thinking__sequentialthinking` 사용.

### 3.1 direct 모드

Router가 서브에이전트 없이 자신의 세션에서 전 과정을 직접 수행한다.

```
Router: WORK 파일 생성 → 코드 수정 → self-check → result.md 작성 → git commit → 콜백
```

**실행 순서 (14단계):**

```
1.  WORK ID 결정
2.  log_work INIT
3.  mkdir works/WORK-NN/                          ← 반드시 생성
4.  PLAN.md 생성 (Execution-Mode: direct)
5.  TASK-00.md 생성                               ← 반드시 생성
6.  TASK-00_progress.md 생성 (Status: PENDING)
7.  log_work REF
8.  코드 수정 + self-check (build && lint)
9.  log_work BUILD
10. TASK-00_progress.md → Status: COMPLETED
11. TASK-00_result.md 생성                        ← 반드시 생성
12. git add -A && git commit
13. 커밋 해시 백필 → git commit --amend --no-edit
14. log_work COMMIT → COMMITTER DONE 콜백 전송
```

- 서브에이전트 호출 없음 (세션 초기화 비용 0)
- Router가 committer 역할까지 대행 (result.md + commit + TaskCallback)
- ProgressCallback도 Router가 직접 전송

### 3.2 pipeline 모드

Router가 PLAN + TASK 파일을 생성한 후 Main Claude를 통해 서브에이전트를 순차 dispatch한다.

```
Router: PLAN 생성 → builder dispatch XML 반환
Main Claude: builder 호출 → verifier 호출 → committer 호출
```

**실행 순서:**

```
1. router: WORK ID 결정, PLAN.md, TASK-00.md, TASK-00_progress.md 생성
2. router: builder dispatch XML 반환
3. Main Claude: builder 서브에이전트 호출
4. Main Claude: verifier 서브에이전트 호출 (builder context-handoff 전달)
5. Main Claude: committer 서브에이전트 호출 (verifier + builder context-handoff 전달)
```

- TASK 1개 단순 구조
- `execution-mode="pipeline"` 속성을 dispatch XML에 포함

### 3.3 full 모드

Router가 planner에게 계획 수립을 위임하고, scheduler가 DAG 기반으로 파이프라인을 반복 실행한다.

```
router → (Main Claude) → planner → (Main Claude) → scheduler
→ (Main Claude) → [builder → verifier → committer] × N
```

**실행 순서:**

```
신규 WORK:
1. router: WORK ID 결정, WORK 디렉토리 생성, planner dispatch XML 반환
2. Main Claude: planner 호출 → PLAN.md + TASK 파일 생성 (사용자 승인 후)
3. Main Claude: scheduler 호출

기존 WORK 실행:
1. Main Claude: scheduler 호출

scheduler 루프:
4. scheduler: DAG 분석 → READY TASK 선별 → builder dispatch XML 반환
5. Main Claude: builder 호출
6. Main Claude: verifier 호출
7. Main Claude: committer 호출
8. 미완료 TASK 있으면 4번으로 돌아감
```

- 병렬 실행: scheduler가 복수의 READY TASK를 반환하면 builder를 동시에 호출 가능
- PLAN.md에 `Execution-Mode: full` 기록

### 3.4 Routing 기준표

| 기준 | direct | pipeline | full |
|------|:---:|:---:|:---:|
| 수정 파일 수 | 1 | 2~3 | 4+ |
| 변경 줄 수 | ≤10 | >10 | — |
| 단계 수 | 1 | 1~2 | 3+ |
| TASK 의존성 | 없음 | 없음 | 순차/병렬 |
| 신규 모듈 추가 | 없음 | 없음 | 있음 |

---

## 4. WORK / TASK 파일 구조

모든 execution-mode에서 동일한 파일 구조를 사용한다.

```
works/
  WORK-LIST.md                  # 전체 WORK 목록 (IN_PROGRESS / COMPLETED)
  WORK-NN/
    PLAN.md                     # WORK 개요 + DAG (7개 필수 메타정보 필드)
    PROGRESS.md                 # scheduler 진행 상태 (full 모드만)
    TASK-XX.md                  # TASK 명세 (WORK prefix 없음)
    TASK-XX_progress.md         # 실시간 체크포인트 (builder/router 작성)
    TASK-XX_result.md           # 완료 보고서 (committer/router 작성)
    work_WORK-NN.log            # Activity Log (모든 에이전트 기록)
```

### 파일명 규칙

| 종류 | 형식 | 생성 주체 |
|------|------|----------|
| WORK 계획 | `PLAN.md` | planner / router |
| TASK 계획 | `TASK-NN.md` | planner / router |
| TASK 진행 | `TASK-NN_progress.md` | planner(템플릿) / builder(갱신) |
| TASK 결과 | `TASK-NN_result.md` | committer / router(direct) |
| WORK 진행 | `PROGRESS.md` | scheduler |
| Activity Log | `work_WORK-NN.log` | 모든 에이전트 |

> **파일명 금지 형식**: `WORK-NN-TASK-NN.md` — `parseTaskFilename()` 인식 불가

### PLAN.md 7개 필수 메타정보 필드

```markdown
> Created: {YYYY-MM-DD}
> 요구사항: {REQ-XXX | N/A}
> Execution-Mode: {direct | pipeline | full}
> Project: {project name}
> Tech Stack: {stack}
> Language: {lang_code}
> Status: PLANNED
```

### 불변 보장 항목

모드에 무관하게 반드시 생성/전송되어야 하는 항목:

| 불변 항목 | direct 수행 주체 | pipeline/full 수행 주체 |
|-----------|:---------------:|:----------------------:|
| `works/WORK-NN/` 디렉토리 | Router | Router / Planner |
| `PLAN.md` | Router | Router / Planner |
| `TASK-XX.md` 파일 | Router | Router / Planner |
| `TASK-XX_result.md` 생성 | **Router** | **Committer** |
| COMMITTER DONE 콜백 전송 | **Router** | **Committer** |
| `WORK-LIST.md` IN_PROGRESS 추가 | Router | Router |

---

## 5. 에이전트별 상세 역할

### 5.1 Router

**모델:** opus | **트리거:** `[]` 태그 감지

주요 역할:
- execution-mode 결정 (config rules 또는 내장 기준)
- WORK ID 결정: FS + WORK-LIST.md 양쪽 스캔 후 최댓값+1
- direct 모드: 구현부터 커밋까지 전 과정 단독 수행
- pipeline 모드: PLAN + TASK 파일 생성 후 builder dispatch XML 반환
- full 모드: planner dispatch XML 또는 scheduler dispatch XML 반환
- Serena MCP 코드 탐색, Sequential Thinking 복잡도 판정

**WORK-LIST.md 관리:**
- WORK 생성 시 `IN_PROGRESS` 추가
- COMPLETED 변경: **git push 시에만** (Router 직접 변경 금지)

### 5.2 Planner

**모델:** opus | **트리거:** full 모드 router dispatch

주요 역할:
- 프로젝트 탐색 (CLAUDE.md, README, package.json, 디렉토리 구조)
- TASK 분해: 각 TASK는 ~30분~2시간 완료 가능, 독립 커밋 가능
- 의존성 DAG 설계 (동일 WORK 내부만)
- PLAN.md, TASK-XX.md, TASK-XX_progress.md(템플릿) 생성
- **사용자 승인 후** 파일 생성

**금지:** 코드 구현, cross-WORK 의존성, 승인 없이 파일 생성

### 5.3 Scheduler

**모델:** haiku | **트리거:** full 모드 (router 또는 planner 이후)

주요 역할:
- DAG Resolution: `result file 존재 → DONE`, `ALL deps DONE → READY`, 그 외 `BLOCKED`
- READY TASK를 번호 낮은 순 실행
- builder → verifier → committer 순차 호출을 위한 dispatch XML 반환 (Main Claude가 각각 호출)
- FAIL 시 최대 3회 builder 재dispatch
- PROGRESS.md 업데이트 및 진행 보고
- Pipeline Stage Callbacks (BUILDER/VERIFIER/COMMITTER START/DONE)

**WORK-LIST.md:** COMPLETED 변경 금지 (git push 시에만)

### 5.4 Builder

**모델:** sonnet | **트리거:** pipeline/full 모드 dispatch

주요 역할:
- dispatch XML 파싱 → TASK 명세 파일 읽기 → 구현 범위 확정
- Serena MCP 우선 사용 (list_dir → get_symbols_overview → find_symbol → Read 순)
- 파일 생성·수정·삭제 + 프로젝트 컨벤션 준수
- Self-check: build + lint 통과 확인, 실패 시 수정 후 재실행
- progress.md 실시간 갱신 (STARTED → IN_PROGRESS → COMPLETED)
- ProgressCallback 전송 (체크포인트마다)
- task-result XML + context-handoff 반환

**금지:** self-check 스킵, 테스트 수정으로 통과, 파일 읽기 없이 덮어쓰기

### 5.5 Verifier

**모델:** haiku | **트리거:** builder 완료 후 dispatch

주요 역할:
- **Step 0 (CRITICAL)**: progress.md 존재 + `Status: COMPLETED` 확인
- **Step 1 (CRITICAL)**: 빌드 실행 (exit ≠ 0 → FAIL)
- **Step 2**: 린트 실행 (실패 시 WARN, CRITICAL 아님)
- **Step 3**: 테스트 실행 (명령 없으면 N/A)
- **Step 4**: TASK `## Verify` 섹션 명령 실행
- **Step 5**: TASK `## Files` 섹션 파일 존재 확인
- **Step 6**: 컨벤션 준수 확인
- context-handoff 포함 task-result XML 반환

**금지:** 소스 코드 수정, 이슈 수정(오직 보고만)

### 5.6 Committer

**모델:** haiku | **트리거:** verifier 완료 후 dispatch

**실행 순서 (7단계):**

```
1. Gate Check: progress.md 존재 + Status=COMPLETED + Files changed 비어있지 않음
   실패 시: FAIL 반환 (result.md 생성 및 commit 금지)
2. result.md 생성: works/WORK-NN/TASK-XX_result.md
3. PROGRESS.md 갱신
4. git add -A && git commit
5. 커밋 해시 백필: result.md에 commit hash 기록 후 amend
6. TaskCallback 전송 (CLAUDE.md TaskCallback URL)
7. 결과 보고: task-result XML 반환
```

**Git commit type:** feat / fix / chore / test / docs / refactor (항상 영어)

**금지:** result 없이 commit, Gate 없이 진행, WORK-LIST.md COMPLETED 변경

---

## 6. TASK 파이프라인 흐름 (pipeline / full 공통)

각 TASK는 다음 순서로 실행된다:

```
dispatcher (Router 또는 Scheduler)
  │
  ├─ [1] builder dispatch
  │       └─ 구현 수행 (Serena MCP 코드 탐색)
  │       └─ progress.md 실시간 기록 (STARTED → IN_PROGRESS → COMPLETED)
  │       └─ ProgressCallback 전송 (체크포인트마다)
  │       └─ task-result XML + context-handoff 반환
  │
  ├─ [2] verifier dispatch
  │       └─ builder context-handoff(FULL) 수신
  │       └─ progress.md Gate 확인 (CRITICAL)
  │       └─ build / lint / test / AC 검증
  │       └─ task-result XML + context-handoff 반환
  │
  └─ [3] committer dispatch
          └─ verifier context-handoff(FULL) + builder context-handoff(SUMMARY) 수신
          └─ Gate Check (progress.md + COMPLETED + Files changed)
          └─ Gate 실패 → dispatcher에 FAIL 반환 → builder 재dispatch (최대 3회)
          └─ Gate 통과 → result.md 작성 → git commit → TaskCallback 전송
```

---

## 7. 에이전트 간 통신 포맷

에이전트 간 데이터는 **구조화된 XML**로 전달된다. 상세 스키마는 `agents/xml-schema.md` 참조.

### dispatch (dispatcher → 하위 에이전트)

```xml
<dispatch to="builder" work="WORK-NN" task="TASK-XX"
          execution-mode="pipeline|full">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
    <plan-file>works/WORK-NN/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/WORK-NN/TASK-XX.md</file>
    <title>TASK 제목</title>
    <action>implement|verify|commit</action>
  </task-spec>
  <previous-results>
    <context-handoff from="prev-task" task="TASK-WW" detail-level="FULL">
      ...
    </context-handoff>
  </previous-results>
</dispatch>
```

**dispatch 속성:**

| 속성 | 값 | 설명 |
|------|----|------|
| `to` | builder, verifier, committer, planner, scheduler | 수신 에이전트 |
| `work` | WORK-NN | WORK 식별자 |
| `task` | TASK-XX | TASK 식별자 (WORK prefix 금지) |
| `execution-mode` | direct, pipeline, full | 생략 시 `full`로 간주 |

### 결과 반환 (하위 에이전트 → dispatcher)

```xml
<task-result work="WORK-NN" task="TASK-XX" agent="builder" status="PASS|FAIL">
  <summary>요약</summary>
  <files-changed>
    <file action="created|modified|deleted" path="...">설명</file>
  </files-changed>
  <self-check>
    <check name="build" status="PASS|FAIL" />
    <check name="lint" status="PASS|FAIL|N/A" />
  </self-check>
  <context-handoff from="builder" detail-level="FULL">
    <what>변경 사항</what>
    <why>의사결정 근거</why>
    <caution>주의사항</caution>
    <incomplete>미완료</incomplete>
  </context-handoff>
  <notes>verifier 확인 사항</notes>
</task-result>
```

### Dispatcher-Receiver 매핑

| Dispatcher | Receiver | execution-mode | 설명 |
|------------|----------|:--------------:|------|
| Router | (자기 자신) | `direct` | Router가 구현+commit+콜백 직접 수행 |
| Router | Builder | `pipeline` | TASK 1개 구현 |
| Router | Planner | `full` | 복잡 WORK 계획 수립 |
| Router | Scheduler | `full` | 기존 WORK 실행 |
| Scheduler | Builder | `full` | TASK N개 구현 |
| Scheduler | Verifier | `full` | TASK N개 검증 |
| Scheduler | Committer | `full` | TASK N개 커밋 |

---

## 8. 컨텍스트 전달 정책 (슬라이딩 윈도우)

에이전트 간 reasoning을 전달하는 핵심 메커니즘. 상세는 `agents/context-policy.md` 참조.

### 슬라이딩 윈도우 원칙

| 단계 거리 | Detail Level | 전달 내용 |
|---------|-------------|---------|
| 직전 (1단계) | **FULL** | what + why + caution + incomplete 전체 |
| 2단계 전 | **SUMMARY** | what만 1~3줄 요약 |
| 3단계 이상 | **DROP** | 전달하지 않음 |

### context-handoff 4개 필드

```xml
<context-handoff from="{agent}" detail-level="FULL|SUMMARY|DROP">
  <what>구체적으로 무엇을 변경/검증했는가 (2~5줄)</what>
  <why>왜 그런 방식을 선택했는가 (FULL only, 2~4줄)</why>
  <caution>다음 에이전트가 주의할 점 (FULL only, 1~3줄)</caution>
  <incomplete>완료하지 못한 사항 (FULL only, 없으면 "None")</incomplete>
</context-handoff>
```

### TASK 파이프라인 내 컨텍스트 전달

```
builder 완료
  └─ verifier: builder context-handoff (FULL) 수신
                → 왜 그렇게 짰는지 알고 타겟 검증 가능

verifier 완료
  └─ committer: verifier context-handoff (FULL) + builder context-handoff (SUMMARY) 수신
                → result.md 작성에 필요한 정보만 보유
```

### TASK 간 의존성 전달 (full 모드)

scheduler가 다음 TASK builder dispatch 시 슬라이딩 윈도우를 적용한다:

```xml
<dispatch to="builder" task="TASK-03">
  <previous-results>
    <!-- 직전 TASK: FULL -->
    <context-handoff from="prev-task" task="TASK-02" detail-level="FULL">
      <what>...</what><why>...</why><caution>...</caution><incomplete>...</incomplete>
    </context-handoff>
    <!-- 2단계 전: SUMMARY -->
    <context-handoff from="prev-prev-task" task="TASK-01" detail-level="SUMMARY">
      <what>...</what>
    </context-handoff>
    <!-- TASK-00: DROP — 전달 안 함 -->
  </previous-results>
</dispatch>
```

---

## 9. Progress 체크포인트 시스템

builder(또는 direct 모드의 router)가 비정상 종료 대비를 위해 작업 상태를 파일로 실시간 기록한다.

### progress.md 상태 전이

| 시점 | Status |
|------|--------|
| planner 템플릿 생성 | `PENDING` |
| builder 착수 | `STARTED` |
| 파일 변경 중 | `IN_PROGRESS` |
| 완료 | `COMPLETED` |

### committer Gate (3가지 조건)

```
Gate 검사:
  1. progress.md 파일이 존재하는가?       → 없으면 FAIL
  2. Status = COMPLETED인가?             → 아니면 FAIL
  3. Files Changed 목록이 비어있지 않은가? → 비어있으면 FAIL

Gate 실패:
  → Committer가 FAIL 반환 (result.md 생성 및 commit 금지)
  → Scheduler가 builder 재dispatch (최대 2회 재시도, 총 3회)
  → 3회 실패 → TASK FAILED 마킹, 파이프라인 중단

Gate 통과:
  → result.md 작성 → git commit → TaskCallback 전송
```

### Retry 시 재개 전략

builder가 재dispatch되면 progress.md를 읽고 **마지막 완료된 체크포인트부터 이어서 작업**한다.

---

## 10. DAG 의존성 관리 (full 모드)

PLAN.md에 정의된 TASK 간 의존성을 scheduler가 DAG로 관리한다.

```
TASK-00 (의존 없음) → 즉시 READY
TASK-01 (TASK-00 의존) → TASK-00 완료 후 READY
TASK-02 (TASK-01 의존) → TASK-01 완료 후 READY
TASK-03, TASK-04 (TASK-00 의존) → TASK-00 완료 후 병렬 READY 가능
```

**DAG Resolution 규칙:**

```
For each TASK:
  result file 존재 → DONE
  ALL dependencies DONE → READY
  else → BLOCKED

READY tasks: 번호 낮은 순 실행
병렬 실행: scheduler가 복수 READY TASK 반환 → Main Claude가 동시 builder 호출
```

---

## 11. Activity Log 시스템

모든 에이전트가 WORK 진행 상황을 `works/WORK-NN/work_WORK-NN.log`에 기록한다.

### log_work 함수

```bash
log_work() {
  local WORK_ID="$1" AGENT="$2" STAGE="$3" DESC="$4"
  mkdir -p "works/${WORK_ID}"
  printf '[%s]_%s_%s_%s\n' \
    "$(date '+%Y-%m-%dT%H:%M:%S')" "$AGENT" "$STAGE" "$DESC" \
    >> "works/${WORK_ID}/work_${WORK_ID}.log"
}
```

### STAGE 테이블

| STAGE | 시점 | 기록 주체 |
|-------|------|----------|
| `INIT` | WORK_ID 결정 후 | Router / Planner |
| `REF` | STARTUP 참조 직후 | 모든 에이전트 |
| `PLAN` | PLAN.md + TASK 파일 생성 완료 | Router / Planner |
| `IMPL` | 코드 구현 시작 | Builder / Router(direct) |
| `BUILD` | self-check 통과 | Builder / Verifier |
| `COMMIT` | git commit 완료 | Committer / Router(direct) |
| `DISPATCH` | pipeline/full dispatch | Router / Scheduler |

### 필수 기록 항목

- **최초 실행 시**: 수신한 프롬프트 메시지 내용 (필수)
- **Callback 호출 시**: 호출 URL, 성공 여부, Payload, Response (필수)
- **작업 진행 시**: 작업 항목 및 내용
- **완료 시**: 타 Agent에 전송한 프롬프트 메시지 내용 (필수)

---

## 12. 외부 콜백 통합

### 콜백 종류

| 콜백 | 전송 시점 | 전송 주체 |
|------|---------|---------|
| **ProgressCallback** | builder 체크포인트마다 | builder (pipeline/full), router (direct) |
| **TaskCallback** | git commit 완료 후 | committer (pipeline/full), router (direct) |
| **Pipeline Stage Callback** | 각 단계 START/DONE | scheduler (full) |

### CLAUDE.md 설정

```markdown
TaskCallback: http://your-system.com/api/v1/task-result
ProgressCallback: http://your-system.com/api/v1/task-progress
CallbackToken: <bearer-token>
```

### 콜백 전송 주체 (모드별)

| execution-mode | TaskCallback | ProgressCallback |
|:--------------:|:------------:|:----------------:|
| `direct` | **Router** | **Router** |
| `pipeline` | **Committer** | **Builder** |
| `full` | **Committer** | **Builder** |

- 모든 모드에서 COMMITTER DONE 콜백(TaskCallback) 전송은 **불변 보장**
- 콜백 실패 시 경고 출력 후 계속 진행 (파이프라인 중단 금지)

---

## 13. 산출물 파일 포맷 요약

상세 포맷은 `agents/file-content-schema.md` 참조.

| 파일 | 포맷 섹션 | 생성 주체 |
|------|----------|---------|
| `PLAN.md` | § 1 | planner / router |
| `TASK-XX.md` | § 2 | planner / router |
| `TASK-XX_progress.md` | § 3 | planner(템플릿) / builder(갱신) |
| `TASK-XX_result.md` (pipeline/full) | § 4 | committer |
| `TASK-XX_result.md` (direct) | § 5 | router |
| `PROGRESS.md` | § 6 | scheduler |

### result.md 구조 (committer 작성)

```markdown
# TASK-XX Result

> WORK: WORK-NN — {title}
> Completed: {YYYY-MM-DD HH:MM}
> Status: **DONE**
> Commit: {hash}        ← 백필

## 요약
{1-2줄}

## 완료 체크리스트
- [x] {item}

## 검증 결과
- Build: ✅ / Lint: ✅ / Tests: ✅ (N passed)

## 변경 파일
### Created
- `path` — {description}

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)
{builder what 필드 1-3줄}

### Verifier Context (FULL)
{verifier context-handoff 4개 필드}
```

---

## 14. MCP 도구 통합

| 에이전트 | MCP 도구 | 용도 |
|---------|---------|------|
| Router | `mcp__sequential-thinking__sequentialthinking` | 복잡도 판정 경계 분석 |
| Router | `mcp__serena__*` | direct 모드 코드 수정 시 심볼 단위 접근 |
| Planner | `mcp__sequential-thinking__sequentialthinking` | TASK 4개 이상 / 복잡 의존성 분해 |
| Planner | `mcp__serena__*` | 기존 코드 구조 파악 (get_symbols_overview 우선) |
| Builder | `mcp__serena__*` | 코드 탐색 (list_dir → get_symbols_overview → find_symbol → Read 순) |

**Builder Serena 탐색 우선순위:**

| 단계 | 도구 | 용도 |
|------|------|------|
| 1 | `list_dir` | 디렉토리 구조 |
| 2 | `get_symbols_overview` | 파일 심볼 구조 (전체 읽기 전 필수) |
| 3 | `find_symbol(depth=1)` | 클래스 메서드 목록 |
| 4 | `find_symbol(include_body=true)` | 수정 대상 정밀 읽기 |
| 5 | `find_referencing_symbols` | 영향 범위 파악 |
| 6 | `Read` 도구 | 최후 수단 |

---

## 15. 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| XML 스키마 | `agents/xml-schema.md` | 에이전트 간 통신 포맷 상세 |
| 컨텍스트 정책 | `agents/context-policy.md` | 슬라이딩 윈도우 정책 상세 규칙 |
| 파이프라인 산출물 포맷 | `agents/file-content-schema.md` | 파일 포맷 단일 정의 |
| 공통 규칙 | `agents/shared-prompt-sections.md` | TASK ID, WORK-LIST 규칙 등 |
| 에이전트 흐름 | `agents/agent-flow.md` | Main Claude 오케스트레이션 가이드 |
| Activity Log | `agents/work-activity-log.md` | log_work 함수, STAGE 테이블 |
| 슬라이딩 윈도우 설계 | `docs/spec_sliding-window-context.md` | 토큰 절감 설계 및 효과 |
| 콜백 통합 | `docs/spec_callback-integration.md` | 외부 시스템 콜백 연동 |

---

*최초 작성: 2026-03-15 | WORK-23 — agents/ 12개 파일 전면 분석 기반 v1.1 전면 재작성*

**v1.1 주요 변경사항 (v1.0 대비):**
- TASK ID 포맷 수정: `TASK-XX` (WORK prefix 금지, `parseTaskFilename()` 기준)
- 에이전트 모델 정확 반영: router=opus, planner=opus, scheduler=haiku, builder=sonnet, verifier=haiku, committer=haiku
- Activity Log 시스템 섹션 추가 (work-activity-log.md 기반)
- Main Claude 오케스트레이션 역할 명시 (agent-flow.md 기반)
- MCP 도구 통합 섹션 확장 (builder Serena 탐색 우선순위 포함)
- Pipeline Stage Callbacks (scheduler) 섹션 추가
- 에이전트별 상세 역할 및 실행 순서 구체화
