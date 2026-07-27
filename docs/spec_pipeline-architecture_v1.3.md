# Pipeline Architecture Spec v1.3

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
- **불변 보장**: 모든 모드에서 result.md 생성과 커밋 완료 콜백(TaskCallback) 전송 보장

---

## 2. 에이전트 구성

| 에이전트 | 역할 | 모델 | 실행 모드 |
|---------|------|------|---------|
| **specifier** | 사용자 요청 분석 → Requirement.md 생성 → execution-mode 결정 및 실행 오케스트레이션 | opus | 항상 |
| **planner** | WORK 생성 + TASK 분해 + DAG 설계 | opus | pipeline / full |
| **scheduler** | DAG 관리 + Builder/Verifier 파이프라인 실행 | haiku | full 전용 |
| **builder** | TASK 실제 구현 (파일 생성/수정) + progress.md 기록 | sonnet | direct / pipeline / full |
| **verifier** | 구현 결과 검증 (빌드·린트·테스트·AC) — 읽기 전용 | haiku | pipeline / full |

> verifier PASS 후 result.md 작성 + git commit + TaskCallback 전송은 **Main Claude가 인라인으로 수행**한다 (별도 서브에이전트 spawn 없음).

### 에이전트 간 호출 구조

> **모든 에이전트 호출은 Main Claude가 수행한다.**
> 서브에이전트는 작업 완료 후 결과 XML(dispatch 또는 task-result)만 반환한다.
> Main Claude가 반환값을 받아 다음 에이전트를 호출한다.

```
[WORK 시작] 태그 감지
     │
     ▼
  Main Claude → specifier 호출
                  │
         execution-mode 결정
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
  direct       pipeline        full
 (1 spawn)    (1 spawn)      (1 spawn)
 specifier+   specifier+     specifier+
 planner      planner        planner
 겸임          →builder      →scheduler
  │           →verifier     →[builder→
  ▼            (1 spawn)      verifier]
 builder                      (1 spawn)
  │                            ×N
  ▼
 verifier
 (1 spawn)
```

**Spawn 수 요약:**

| 모드 | Spawn 구성 | 총 Spawn 수 |
|------|-----------|:----------:|
| direct | specifier(1) + builder(1) + verifier(1) | **3** |
| pipeline | specifier+planner(1) + builder(1) + verifier(1) | **3** |
| full (N TASK) | specifier+planner(1) + scheduler(1) + [builder(1) + verifier(1)] × N | **2 + 2N** |
| full (6 TASK 예시) | 2 + 2×6 | **14** |

---

## 3. execution-mode 3종 체계

Specifier가 `.agent/router_rule_config.json`의 rules를 우선 적용하여 판정한다.
config 없을 경우 요구사항 복잡도 기반 내장 기준을 사용한다.

```
요청 분석 → Requirement.md 생성
  → config 존재? YES → config rules 기준만 사용
              NO  → 내장 기준 (요구사항 복잡도):
                     direct   — FR 1~2개 + 단순 AC
                     pipeline — FR 3개 미만 또는 NFR 없음, 1~2단계
                     full     — FR 3개 이상 또는 NFR 존재 또는 복잡 의존성
```

판정이 애매한 경우 `mcp__sequential-thinking__sequentialthinking` 사용.

### 3.1 direct 모드

Specifier가 Planner 역할을 겸임하여 PLAN.md + TASK 파일을 생성하고, builder dispatch XML을 반환한다.
Main Claude가 builder를 호출하여 구현을 수행한다.

```
Specifier: Requirement.md 생성 → PLAN.md + TASK-00.md 생성 → builder dispatch XML 반환
Main Claude: builder 호출 → verifier 호출 → (PASS 시) 인라인으로 result.md 작성 → git commit
```

**실행 순서 (12단계):**

```
1.  WORK ID 결정 (LAST_WORK_ID 헤더 기반)
2.  log_work INIT
3.  mkdir works/WORK-NN/
4.  Requirement.md 생성
5.  PLAN.md 생성 (Execution-Mode: direct)
6.  TASK-00.md 생성
7.  TASK-00_progress.md 생성 (Status: PENDING)
8.  WORK-LIST.md IN_PROGRESS 추가 + LAST_WORK_ID 갱신
9.  log_work PLAN "Requirement.md, PLAN.md, TASK-00.md created"
10. 사용자에게 산출물 요약 제시 + 승인 요청
11. builder dispatch XML 반환 (execution-mode="direct")
12. log_work DISPATCH "Builder dispatch XML returned"
```

- Specifier가 Planner 겸임 (PLAN.md + TASK 파일 직접 생성)
- builder → verifier 순차 실행 (Main Claude 수행, verifier는 자체 spawn)
- ProgressCallback: builder가 직접 전송
- TaskCallback: verifier PASS 후 Main Claude가 커밋 완료 시 전송
- **Spawn 수: 3** (specifier(Planner 겸임) 1 + builder 1 + verifier 1)

### 3.2 pipeline 모드

Specifier와 Planner가 **단일 spawn**으로 결합되어 실행된다.
specifier+planner spawn이 Requirement.md + PLAN + TASK 파일을 생성하면,
Main Claude가 builder → verifier를 순차 실행한다.
verifier PASS 후에는 Main Claude가 인라인으로 result.md 작성 + git commit을 수행한다(별도 spawn 없음).

```
specifier+planner (1 spawn): Requirement.md + PLAN.md + TASK 생성
Main Claude: builder 호출 → verifier 호출 (1 spawn) → (PASS 시) 인라인 커밋
```

**실행 순서:**

```
1. specifier+planner: Requirement.md 생성, WORK ID 결정, mkdir
2. specifier+planner: WORK-LIST.md IN_PROGRESS 추가 + LAST_WORK_ID 갱신
3. specifier+planner: PLAN.md, TASK-00.md, TASK-00_progress.md 생성 (사용자 승인 후)
4. Main Claude: builder 서브에이전트 호출
5. Main Claude: verifier 서브에이전트 호출 (builder context-handoff 전달)
6. Main Claude: verifier PASS 시 인라인으로 result.md 작성 → git commit
```

- TASK 1개 단순 구조
- `execution-mode="pipeline"` 속성을 dispatch XML에 포함
- **Spawn 수: 3** (specifier+planner 1 + builder 1 + verifier 1)

### 3.3 full 모드

specifier와 planner가 **단일 spawn**으로 결합되어 실행된다.
specifier+planner spawn이 PLAN + TASK 파일을 생성하고, Scheduler를 dispatch한다.
Scheduler가 DAG 기반으로 [builder → verifier] × N을 반복 실행한다.
각 TASK의 verifier PASS 후에는 Main Claude가 인라인으로 result.md 작성 + git commit을 수행한다(별도 spawn 없음).

```
specifier+planner (1 spawn) → (Main Claude) → scheduler
→ (Main Claude) → [builder → verifier (1 spawn) → 인라인 커밋] × N
```

**실행 순서:**

```
신규 WORK:
1. specifier+planner: Requirement.md 생성, WORK ID 결정, mkdir
2. specifier+planner: WORK-LIST.md IN_PROGRESS 추가 + LAST_WORK_ID 갱신
3. specifier+planner: PLAN.md + TASK 파일 생성 (사용자 승인 후)
4. Main Claude: scheduler 호출

기존 WORK 실행:
1. Main Claude: scheduler 호출

scheduler 루프:
5. scheduler: DAG 분석 → READY TASK 선별 → builder dispatch XML 반환
6. Main Claude: builder 호출
7. Main Claude: verifier 호출 (자체 spawn)
8. Main Claude: verifier PASS 시 인라인으로 result.md 작성 → git commit
9. 미완료 TASK 있으면 5번으로 돌아감
```

- 병렬 실행: scheduler가 복수의 READY TASK를 반환하면 builder를 동시에 호출 가능
- PLAN.md에 `Execution-Mode: full` 기록
- **Spawn 수 (N TASK):** 2 + 2N (specifier+planner 1 + scheduler 1 + (builder + verifier) × N)
- **6 TASK 예시:** 2 + 12 = **14 spawns** (기존 20 대비 30% 감소 — specifier+planner 결합에 따른 감소)

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
  WORK-LIST.md                  # 전체 WORK 목록 (LAST_WORK_ID 헤더 + IN_PROGRESS / DONE / COMPLETED)
  _COMPLETED/                   # push 시 DONE → COMPLETED 아카이브 이동 대상
    WORK-NN/
  WORK-NN/
    Requirement.md              # specifier 작성 (모든 모드 필수)
    PLAN.md                     # WORK 개요 + DAG (7개 필수 메타정보 필드)
    PROGRESS.md                 # scheduler 진행 상태 (full 모드만)
    TASK-XX.md                  # TASK 명세 (WORK prefix 없음)
    TASK-XX_progress.md         # 실시간 체크포인트 (builder 작성)
    TASK-XX_result.md           # 완료 보고서 (Main Claude 인라인 작성)
    work_WORK-NN.log            # Activity Log (모든 에이전트 기록)
```

### 파일명 규칙

| 종류 | 형식 | 생성 주체 |
|------|------|----------|
| 요구사항 | `Requirement.md` | specifier |
| WORK 계획 | `PLAN.md` | planner / specifier(direct) |
| TASK 계획 | `TASK-NN.md` | planner / specifier(direct) |
| TASK 진행 | `TASK-NN_progress.md` | planner(템플릿) / builder(갱신) |
| TASK 결과 | `TASK-NN_result.md` | Main Claude(인라인) |
| WORK 진행 | `PROGRESS.md` | scheduler |
| Activity Log | `work_WORK-NN.log` | 모든 에이전트 |

> **파일명 금지 형식**: `WORK-NN-TASK-NN.md` — `parseTaskFilename()` 인식 불가

### PLAN.md 7개 필수 메타정보 필드

```markdown
> Created: {YYYY-MM-DD}
> Requirement: {REQ-XXX | 사용자 요청 텍스트}
> Execution-Mode: {direct | pipeline | full}
> Project: {project name}
> Tech Stack: {stack}
> Language: {lang_code}
> Status: PLANNED
```

### WORK-LIST.md 형식

```
LAST_WORK_ID: WORK-XX

| WORK | 제목 | 상태 | 생성일 | 완료일 |
|------|------|------|--------|--------|
| WORK-NN | ... | IN_PROGRESS | YYYY-MM-DD | |
| WORK-MM | ... | DONE | YYYY-MM-DD | YYYY-MM-DD |
```

| 상태 | 의미 | 전환 트리거 |
|------|------|------------|
| `IN_PROGRESS` | WORK 진행 중 | specifier가 WORK 생성 시 |
| `DONE` | 모든 TASK 완료, 검토/push 대기 | Main Claude가 마지막 TASK 커밋 완료 시 인라인 전환 |
| `COMPLETED` | `_COMPLETED/` 아카이브 완료 | push 시 Main Claude 일괄 처리 |

### 불변 보장 항목

모드에 무관하게 반드시 생성/전송되어야 하는 항목:

| 불변 항목 | direct 수행 주체 | pipeline/full 수행 주체 |
|-----------|:---------------:|:----------------------:|
| `works/WORK-NN/` 디렉토리 | Specifier | Specifier |
| `Requirement.md` | Specifier | Specifier |
| `PLAN.md` | Specifier(Planner 겸임) | Planner |
| `TASK-XX.md` 파일 | Specifier(Planner 겸임) | Planner |
| `TASK-XX_result.md` 생성 | **Main Claude(인라인)** | **Main Claude(인라인)** |
| 커밋 완료 콜백(TaskCallback) 전송 | **Main Claude(인라인)** | **Main Claude(인라인)** |
| `WORK-LIST.md` IN_PROGRESS 추가 | Specifier | Specifier |
| `WORK-LIST.md` DONE 전환 | **Main Claude(인라인)** | **Main Claude(인라인)** |

---

## 5. 에이전트별 상세 역할

### 5.1 Specifier

**모델:** opus | **트리거:** `[WORK 시작]` 태그 감지

주요 역할:
- 사용자 요청을 FR/NFR/AC 기반 Requirement.md로 구체화
- execution-mode 결정 (config rules 또는 요구사항 복잡도 기반 내장 기준)
- WORK ID 결정: `LAST_WORK_ID` 헤더 기반 (FS + WORK-LIST.md 양쪽 스캔 후 최댓값+1)
- direct 모드: Planner 겸임 — PLAN.md + TASK 파일 생성 후 builder dispatch XML 반환
- pipeline 모드: Requirement.md 생성 후 planner dispatch XML 반환
- full 모드: Requirement.md 생성 후 planner dispatch XML 반환
- Serena MCP 코드 탐색, Sequential Thinking 복잡도 판정

**WORK-LIST.md 관리:**
- WORK 생성 시 `IN_PROGRESS` 추가 + `LAST_WORK_ID` 갱신
- DONE/COMPLETED 변경 금지 (Main Claude 인라인 처리 및 push 절차에서 수행)

### 5.2 Planner

**모델:** opus | **트리거:** pipeline/full 모드 — specifier와 단일 spawn으로 결합 실행

주요 역할:
- 프로젝트 탐색 (CLAUDE.md, README, package.json, 디렉토리 구조)
- TASK 분해: 각 TASK는 ~30분~2시간 완료 가능, 독립 커밋 가능
- 의존성 DAG 설계 (동일 WORK 내부만)
- PLAN.md, TASK-XX.md, TASK-XX_progress.md(템플릿) 생성
- **사용자 승인 후** 파일 생성 (승인 전 산출물 요약 제시)

**금지:** 코드 구현, cross-WORK 의존성, 승인 없이 파일 생성

### 5.3 Scheduler

**모델:** haiku | **트리거:** full 모드 (planner 이후)

주요 역할:
- DAG Resolution: `result file 존재 → DONE`, `ALL deps DONE → READY`, 그 외 `BLOCKED`
- READY TASK를 번호 낮은 순 실행
- builder → verifier 순차 호출을 위한 dispatch XML 반환 (Main Claude가 각각 호출)
- FAIL 시 최대 3회 builder 재dispatch
- PROGRESS.md 업데이트 및 진행 보고
- Pipeline Stage Callbacks (BUILDER/VERIFIER START/DONE)

**WORK-LIST.md:** DONE/COMPLETED 변경 금지

### 5.4 Builder

**모델:** sonnet | **트리거:** direct / pipeline / full 모드 dispatch

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

---

## 6. TASK 파이프라인 흐름 (pipeline / full 공통)

각 TASK는 다음 순서로 실행된다:

```
dispatcher (specifier+planner 또는 Scheduler)
  │
  ├─ [1] builder dispatch
  │       └─ 구현 수행 (Serena MCP 코드 탐색)
  │       └─ progress.md 실시간 기록 (STARTED → IN_PROGRESS → COMPLETED)
  │       └─ ProgressCallback 전송 (체크포인트마다)
  │       └─ task-result XML + context-handoff 반환
  │
  ├─ [2] verifier dispatch (자체 spawn)
  │       └─ builder context-handoff(FULL) 수신
  │       └─ progress.md Gate 확인 (CRITICAL)
  │       └─ build / lint / test / AC 검증
  │       └─ FAIL → dispatcher에 반환 → builder 재dispatch (최대 3회)
  │       └─ PASS → task-result XML + context-handoff 반환
  │
  └─ [3] Main Claude 인라인 처리 (verifier PASS 후, spawn 없음)
          └─ result.md 작성 → git commit → 커밋 완료 콜백(TaskCallback) 전송
          └─ 마지막 TASK이면 WORK-LIST.md IN_PROGRESS → DONE 전환
```

---

## 7. 에이전트 간 통신 포맷

에이전트 간 데이터는 **구조화된 XML**로 전달된다. 상세 스키마는 `agents/xml-schema.md` 참조.

### dispatch (dispatcher → 하위 에이전트)

```xml
<dispatch to="builder" work="WORK-NN" task="TASK-XX"
          execution-mode="pipeline|full">
  <ref-cache>                                        <!-- optional -->
    <ref key="shared-prompt-sections">{file content}</ref>
    <ref key="xml-schema">{file content}</ref>
  </ref-cache>
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
| `to` | builder, verifier, planner, scheduler | 수신 에이전트 |
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
  <ref-cache>                                        <!-- optional -->
    <ref key="shared-prompt-sections">{file content}</ref>
    <ref key="xml-schema">{file content}</ref>
  </ref-cache>
</task-result>
```

### Dispatcher-Receiver 매핑

| Dispatcher | Receiver | execution-mode | 설명 |
|------------|----------|:--------------:|------|
| Specifier (겸임) | Builder | `direct` | Planner 겸임 — PLAN.md + TASK 직접 생성 후 builder dispatch |
| Main Claude | Verifier | `direct` | builder 완료 후 dispatch (verifier PASS 후 Main Claude 인라인 커밋) |
| Specifier+Planner | Builder | `pipeline` | 단일 spawn — PLAN + TASK 생성 후 builder dispatch |
| Main Claude | Verifier | `pipeline` | builder 완료 후 dispatch (verifier PASS 후 Main Claude 인라인 커밋) |
| Specifier+Planner | Scheduler | `full` | 단일 spawn — PLAN + TASK 생성 후 scheduler dispatch |
| Scheduler | Builder | `full` | TASK N개 구현 |
| Main Claude | Verifier | `full` | builder 완료 후 dispatch (TASK당, verifier PASS 후 Main Claude 인라인 커밋) |

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

verifier 완료 (PASS)
  └─ Main Claude(인라인): verifier context-handoff (FULL) + builder context-handoff (SUMMARY) 수신
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

builder가 비정상 종료 대비를 위해 작업 상태를 파일로 실시간 기록한다.

### progress.md 상태 전이

| 시점 | Status |
|------|--------|
| planner 템플릿 생성 | `PENDING` |
| builder 착수 | `STARTED` |
| 파일 변경 중 | `IN_PROGRESS` |
| 완료 | `COMPLETED` |

### Main Claude 인라인 커밋 Gate (3가지 조건)

```
Gate 검사 (Main Claude, verifier PASS 후 인라인 수행):
  1. progress.md 파일이 존재하는가?       → 없으면 FAIL
  2. Status = COMPLETED인가?             → 아니면 FAIL
  3. Files Changed 목록이 비어있지 않은가? → 비어있으면 FAIL

Gate 실패:
  → Main Claude가 FAIL 처리 (result.md 생성 및 commit 금지)
  → Scheduler가 builder 재dispatch (최대 2회 재시도, 총 3회)
  → 3회 실패 → TASK FAILED 마킹, 파이프라인 중단

Gate 통과:
  → Main Claude가 인라인으로 result.md 작성 → git commit → TaskCallback 전송
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
| `INIT` | WORK_ID 결정 후 | Specifier / Planner |
| `REF` | STARTUP 참조 직후 | 모든 에이전트 |
| `PLAN` | PLAN.md + TASK 파일 생성 완료 | Specifier / Planner |
| `IMPL` | 코드 구현 시작 | Builder |
| `BUILD` | self-check 통과 | Builder / Verifier |
| `COMMIT` | git commit 완료 | Main Claude(인라인) |
| `DISPATCH` | pipeline/full dispatch | Specifier / Scheduler |

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
| **ProgressCallback** | builder 체크포인트마다 | builder (모든 모드) |
| **TaskCallback** | git commit 완료 후 | Main Claude(인라인, 모든 모드) |
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
| `direct` | **Main Claude(인라인)** | **Builder** |
| `pipeline` | **Main Claude(인라인)** | **Builder** |
| `full` | **Main Claude(인라인)** | **Builder** |

- 모든 모드에서 커밋 완료 콜백(TaskCallback) 전송은 **불변 보장**
- 콜백 실패 시 경고 출력 후 계속 진행 (파이프라인 중단 금지)

---

## 13. 산출물 파일 포맷 요약

상세 포맷은 `agents/file-content-schema.md` 참조.

| 파일 | 포맷 섹션 | 생성 주체 |
|------|----------|---------|
| `Requirement.md` | § 0 | specifier |
| `PLAN.md` | § 1 | planner / specifier(direct) |
| `TASK-XX.md` | § 2 | planner / specifier(direct) |
| `TASK-XX_progress.md` | § 3 | planner(템플릿) / builder(갱신) |
| `TASK-XX_result.md` (pipeline/full) | § 4 | Main Claude(인라인) |
| `TASK-XX_result.md` (direct) | § 4 | Main Claude(인라인) |
| `PROGRESS.md` | § 6 | scheduler |

### result.md 구조 (Main Claude 인라인 작성)

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
| Specifier | `mcp__sequential-thinking__sequentialthinking` | 복잡도 판정 경계 분석 |
| Specifier | `mcp__serena__*` | direct 모드 코드 탐색 시 심볼 단위 접근 |
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

## 16. ref-cache Reference File Caching

> v1.3 신규 (WORK-41)

`<ref-cache>`는 에이전트 파이프라인에서 참조 파일 콘텐츠를 사전 로드하여 전달하는 선택적 XML 요소이다.
반복적인 디스크 읽기를 제거하여 파이프라인 효율을 높인다.

### 16.1 Phase 1 — 체인 전파

파이프라인에서 첫 에이전트(specifier)가 참조 파일을 읽고 task-result에 `<ref-cache>`를 포함하면,
Main Claude가 이를 다음 에이전트 dispatch에 그대로 복사한다.

```
specifier (no ref-cache) → reads files → returns task-result with <ref-cache>
  ↓ Main Claude copies <ref-cache>
planner (ref-cache in) → skips file reads → returns with <ref-cache>
  ↓ Main Claude copies <ref-cache>
builder → verifier → ...
```

**규칙:**

1. 첫 에이전트 — ref-cache 없음, 디스크에서 참조 파일 정상 읽기
2. task-result 반환 — 읽은 참조 파일을 `<ref-cache>` 블록에 포함
3. Main Claude 전파 — 이전 task-result의 `<ref-cache>`를 다음 dispatch XML에 복사
4. 수신 에이전트 — `<ref-cache>` 존재 시 디스크 읽기 생략
5. ref-cache 미지원 에이전트 — 무시하고 디스크에서 읽기

### 16.2 Phase 2 — 선택 전달 (Selective Section Delivery)

Main Claude가 파이프라인 시작 시 참조 파일을 한 번 읽고, 에이전트별로 필요한 섹션만 추출하여 전달한다.

| Agent | shared-prompt-sections | file-content-schema | xml-schema | context-policy | work-activity-log |
|-------|:---:|:---:|:---:|:---:|:---:|
| specifier | §1,§7,§8,§9,§11 | §0,§1,§2,§3 | §1,§3 | — | full |
| planner | §1,§2,§11 | §1,§2,§3 | — | — | full |
| scheduler | §4,§8,§10 | §1,§6 | §1,§3,§4,§5 | full | full |
| builder | §1,§2,§10,§12 | §2,§3 | §1,§2,§4 | Builder section | full |
| verifier | §1,§2,§12 | — | §1,§2,§4 | Verifier section | full |

### 16.3 Recognized Keys

| Key | Corresponding File |
|-----|----|  
| `shared-prompt-sections` | `{REFERENCES_DIR}/shared-prompt-sections.md` |
| `file-content-schema` | `{REFERENCES_DIR}/file-content-schema.md` |
| `xml-schema` | `{REFERENCES_DIR}/xml-schema.md` |
| `context-policy` | `{REFERENCES_DIR}/context-policy.md` |
| `work-activity-log` | `{REFERENCES_DIR}/work-activity-log.md` |

### 16.4 측정 결과

| 지표 | Before | After | 개선 |
|------|--------|-------|------|
| 파일 읽기 횟수 | 30회/WORK | 11회/WORK | **64% 감소** |
| 프롬프트 토큰 | baseline | -15% | **15% 절감** |

### 16.5 제약 조건

- **ref-cache는 REFERENCES_DIR을 대체하지 않는다** — 호환성을 위해 항상 `REFERENCES_DIR`(또는 `<references-dir>`)을 dispatch에 포함
- 에이전트는 ref-cache가 불충분하면 디스크에서 파일 읽기 가능
- ref-cache 없는 dispatch/task-result도 완전히 유효 — 에이전트가 디스크 읽기로 fallback

---

## 15. 관련 문서

| 문서 | 위치 | 내용 |
|------|------|------|
| XML 스키마 | `agents/en/xml-schema.md` (또는 `skills/sdd-pipeline/references/xml-schema.md`) | 에이전트 간 통신 포맷 상세 |
| 컨텍스트 정책 | `agents/en/context-policy.md` (또는 `skills/sdd-pipeline/references/context-policy.md`) | 슬라이딩 윈도우 정책 상세 규칙 |
| 파이프라인 산출물 포맷 | `agents/en/file-content-schema.md` (또는 `skills/sdd-pipeline/references/file-content-schema.md`) | 파일 포맷 단일 정의 |
| 공통 규칙 | `agents/en/shared-prompt-sections.md` (또는 `skills/sdd-pipeline/references/shared-prompt-sections.md`) | TASK ID, WORK-LIST 규칙 등 |
| 에이전트 흐름 | `agents/en/agent-flow.md` (또는 `skills/sdd-pipeline/references/agent-flow.md`) | Main Claude 오케스트레이션 가이드 |
| Activity Log | `agents/en/work-activity-log.md` (또는 `skills/sdd-pipeline/references/work-activity-log.md`) | log_work 함수, STAGE 테이블 |
| 슬라이딩 윈도우 설계 | `docs/spec_sliding-window-context.md` | 토큰 절감 설계 및 효과 |

---

*최초 작성: 2026-03-15 | WORK-23 — agents/ 12개 파일 전면 분석 기반 v1.1 전면 재작성*

---

## 변경사항

### v1.4 (2026-03-28, WORK-45)

1. **에이전트 간 호출 구조 다이어그램 갱신 (§2)**: specifier+planner 단일 spawn, verifier+committer 단일 spawn 반영. Spawn 수 요약 테이블 추가.
2. **Spawn 수 갱신 (§2, §3)**: direct 3 spawns / pipeline 3 spawns / full 2+2N spawns (6 TASK = 14, 기존 20 대비 30% 감소).
3. **pipeline 모드 (§3.2)**: specifier+planner 단일 spawn 결합 설명 반영. verifier+committer 단일 spawn 반영.
4. **full 모드 (§3.3)**: specifier+planner 단일 spawn 결합. verifier+committer 단일 spawn. scheduler 루프 단계 단순화.
5. **direct 모드 (§3.1)**: verifier+committer 단일 spawn 반영. spawn 수 명시.
6. **Planner 역할 (§5.2)**: 트리거 설명을 "specifier와 단일 spawn으로 결합"으로 변경.
7. **Scheduler 역할 (§5.3)**: verifier+committer 단일 spawn dispatch 반영.
8. **TASK 파이프라인 흐름 (§6)**: verifier+committer 단일 spawn 구조로 재작성. dispatcher 주체 갱신.
9. **Dispatcher-Receiver 매핑 (§7)**: spawn 결합 구조 반영. 행 재편성.
10. **v1.4.0/v1.5.0 변경사항**: 자동 권한 설정 (`uctm init` 시 settings.local.json Bash 권한 자동 설정), pipe 명령어 제거 (Windows 호환성), plugin 리소스 npm 패키지 포함 (.claude-plugin, skills/).

### v1.3 (2026-03-22, WORK-41)

1. **ref-cache 섹션 추가 (§16)**: Phase 1 체인 전파 + Phase 2 선택 전달 규칙, recognized keys, 측정 결과, 제약 조건.
2. **통신 포맷 XML (§7)**: dispatch/task-result XML 예시에 `<ref-cache>` 요소 추가.
3. **버전**: v1.3으로 bump.

### v1.2 (2026-03-21, WORK-37)

1. **에이전트 구성 테이블 (§2)**: router 제거, specifier 추가. 6개 에이전트(specifier, planner, scheduler, builder, verifier, committer) 기준으로 재작성.
2. **에이전트 간 호출 구조 다이어그램 (§2)**: `[WORK 시작]` 태그 → Specifier 호출로 변경. Router 참조 전면 제거.
3. **execution-mode 판정 (§3)**: 판정 주체를 router → specifier로 변경. 요구사항 복잡도 기반 판정 로직으로 갱신.
4. **direct 모드 (§3.1)**: Specifier가 Planner 겸임 — PLAN.md + TASK 생성 후 builder dispatch XML 반환. builder → verifier → committer 전 파이프라인으로 재작성.
5. **pipeline 모드 (§3.2)**: Specifier가 Requirement.md 생성 → Planner에 위임 → Main Claude가 B→V→C 순차 실행.
6. **full 모드 (§3.3)**: Specifier가 Requirement.md 생성 → Planner에 위임 → Planner가 Scheduler dispatch → Scheduler가 DAG 기반 [B→V→C]×N 실행.
7. **WORK/TASK 파일 구조 (§4)**: WORK-LIST.md 규칙 현행화 (LAST_WORK_ID 헤더, 3단계 상태: IN_PROGRESS→DONE→COMPLETED, _COMPLETED/ 아카이브). Requirement.md 추가.
8. **파일명 규칙 테이블 (§4)**: 생성 주체 현행화 (router → specifier/planner). Requirement.md 행 추가.
9. **불변 보장 항목 (§4)**: direct 수행 주체를 Router → Specifier로 변경. Requirement.md 행 추가. DONE 전환 항목 추가.
10. **에이전트별 상세 역할 (§5)**: §5.1 Router 섹션 삭제 → §5.1 Specifier 신규 작성. 나머지 에이전트 번호 재배치 및 내용 현행화.
11. **TASK 파이프라인 흐름 (§6)**: dispatcher 주체를 Router/Scheduler → Specifier/Scheduler로 갱신. DONE 전환 단계 추가.
12. **Dispatcher-Receiver 매핑 (§7)**: Router 행 제거, Specifier 행 추가.
13. **산출물 파일 포맷 테이블 (§13)**: 생성 주체 현행화. Requirement.md 행 추가.
14. **관련 문서 경로 (§15)**: `agents/` → 현행 경로 반영 (npm: `agents/en/`, plugin: `skills/sdd-pipeline/references/`).
15. **버전**: v1.2로 올리고 변경사항 기록.
16. **Committer DONE 전환 (§5.6, §6)**: committer가 마지막 TASK 완료 시 IN_PROGRESS → DONE 전환 로직 반영.

### v1.1 (2026-03-15, WORK-23)

- TASK ID 포맷 수정: `TASK-XX` (WORK prefix 금지, `parseTaskFilename()` 기준)
- 에이전트 모델 정확 반영: router=opus, planner=opus, scheduler=haiku, builder=sonnet, verifier=haiku, committer=haiku
- Activity Log 시스템 섹션 추가 (work-activity-log.md 기반)
- Main Claude 오케스트레이션 역할 명시 (agent-flow.md 기반)
- MCP 도구 통합 섹션 확장 (builder Serena 탐색 우선순위 포함)
- Pipeline Stage Callbacks (scheduler) 섹션 추가
- 에이전트별 상세 역할 및 실행 순서 구체화
