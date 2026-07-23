# Agent Flow — Main Claude 역할 가이드

> Main Claude는 **트리거와 게이트 경계**만 담당합니다.
> 파이프라인 내부 진행(WORK 생성 → 설계 → TASK 실행 → 완료)은 **orchestrator**가 전담합니다.
> Main Claude는 orchestrator 외의 다른 에이전트를 **직접 spawn하지 않습니다**.
>
> **예외 — 축퇴 모드(§7)**: 실행 환경이 중첩 spawn을 지원하지 않으면 Main Claude가 orchestrator 역할을 넘겨받아 자식을 직접 spawn합니다.

---

## 1. Main Claude 역할 (트리거 + 게이트 경계)

Main Claude가 직접 수행하는 일은 다음 5가지뿐입니다.

1. **트리거 감지** — `[tag]` 메시지 또는 WORK 재개 요청(예: "WORK-01 계속실행", "resume WORK-01")을 감지.
2. **orchestrator 1회 spawn** — 다음을 전달:
   - `REFERENCES_DIR={절대 경로}`
   - `mode=gated|auto` — 사용자 메시지에 "auto"/"자동으로"가 포함되면 `auto`, 그 외는 기본값 `gated`
   - 사용자 요청 원문 (재개 요청이면 대상 `WORK_ID`)
   - spawn 결과로 받는 **agentId를 보관**한다(재개 시 name이 아니라 **agentId**로 지정 — 이름 재사용 오배달 방지).
3. **축퇴 신호 처리** — orchestrator가 `<capability-degraded>`를 반환하면 §7 축퇴 모드로 전환한다.
4. **게이트 처리** — orchestrator가 `<gate type="stage">` 또는 `<gate type="decision">`을 반환하고 **yield(파킹)** 하면:
   1. 게이트 내용을 사용자에게 그대로 제시한다 — `type="stage"`는 완료 요약, `type="decision"`은 배경(`<context>`) + 선택지(`<options>`) + 권고안(`<recommended>`)(`AskUserQuestion` 등으로 선택 요청).
   2. 사용자의 승인 또는 선택을 기다린다.
   3. 응답을 받으면 **`SendMessage(agentId, 결정내용)`으로 컨텍스트를 유지한 채 재개**한다.
   4. `SendMessage`가 실패하면(파킹 핸들 유실 등) **폴백**: `works/{WORK_ID}/work_{WORK_ID}.log` + `DECISIONS.md`를 근거로 orchestrator를 `WORK_ID`와 함께 새로 spawn해 재개시킨다.
5. **완료 처리** — orchestrator가 최종 WORK 요약을 반환하면 사용자에게 그대로 릴레이하고 **`TaskStop(agentId)`로 파킹 핸들을 해제**한다.

`mode=auto`인 경우 orchestrator가 게이트/의사결정 정지 없이 1회 spawn으로 완주하므로, 4단계(게이트 처리)는 발생하지 않는다 — Main Claude는 spawn 후 최종 결과만 수신·릴레이하고 `TaskStop`으로 마무리한다.

---

## 2. Orchestrator 내부 흐름

Main Claude가 관여하지 않는 orchestrator 내부 진행이다. 상세 절차와 로그 규칙은 `develop/agents/orchestrator.md`를 정본으로 하며, 아래는 Main Claude가 게이트 신호를 올바르게 해석하기 위한 요약이다.

### STEP A. Specifier spawn (WORK 생성)

- orchestrator가 specifier를 중첩 spawn → `Requirement.md` + WORK 폴더 생성, 복잡도 판정(단순/복잡).
- `mode=gated`: 활동 로그에 `GATE_WAIT — stage=specifier` 기록 → `<gate type="stage" work="{WORK}" stage="specifier">` 반환 후 **yield**.
- `mode=auto`: 게이트 생략, `STAGE_DONE — stage=specifier` 즉시 기록 후 STEP B로 진행.

### STEP B. Planner spawn

- planner를 중첩 spawn → `PLAN.md` + TASK DAG 생성.
- `mode=gated`: `GATE_WAIT — stage=planner` 기록 → `<gate type="stage" work="{WORK}" stage="planner">` 반환 후 **yield**.
- `mode=auto`: 게이트 생략, `STAGE_DONE — stage=planner` 즉시 기록 후 STEP C로 진행.

### STEP C. TASK DAG 실행 — 게이트 없음

- `work_{WORK}.log` + `PLAN.md`로 DAG를 해석해 READY TASK를 오름차순으로 판정한다. 복수 READY면 builder를 병렬로 중첩 spawn한다.
- TASK별로 builder → verifier를 순차 spawn 후 orchestrator가 인라인 커밋(result.md 작성 + WORK-LIST 갱신 + git commit)을 수행한다. 이 단계는 사용자 승인 대상이 아니므로 고정 게이트가 없다.
- verifier가 FAIL을 반환하면 builder에 최대 2회 재디스패치(총 3회 시도)한다. 3회 모두 실패하면 자식이 `<needs-decision>`으로 orchestrator에 상향하고, `mode=gated`면 게이트로 승격, `mode=auto`면 권고안 자동결정 후 계속한다.

### STEP D. 로그 일괄 기록

- 활동 로그를 기록하는 주체는 **orchestrator뿐**이다.
- 이벤트 순서: `ORCHESTRATOR_START` → (`STAGE_START` → [`GATE_WAIT`/`DECISION_WAIT` → `DECISION`] → `STAGE_DONE`)를 단계마다 반복 → `ORCHESTRATOR_DONE`. 인라인 커밋 완료는 `STAGE_START` 없이 `STAGE_DONE — stage=commit task=TASK-NN`만 기록되는 비-spawn 이벤트다.

### 재개 규칙 (마지막 로그 이벤트 기준)

| 마지막 로그 이벤트 | 판정 | 처리 |
|---|---|---|
| 로그 없음 | 신규 WORK | STEP A부터 시작 |
| `{STAGE}_START`만 있고 대응하는 `STAGE_DONE`/`GATE_WAIT`/`DECISION_WAIT` 없음 | 자식 실행 중 중단됨 | 자식 재실행 |
| `GATE_WAIT — stage=X` | 게이트 미승인 | 자식 재실행 없이 디스크 산출물 재사용, **동일 게이트를 재제시** |
| `DECISION_WAIT — stage=X` | 결정 미확정 | `DECISIONS.md`의 `상태: PENDING` 항목을 동일 배경/선택지/권고안으로 재제시 |
| `DECISION — ... by=...` | 결정 확정, 후속 `STAGE_DONE` 없음 | 결정을 반영해 해당 단계 이어서 진행 |
| `STAGE_DONE — stage=verifier task=TASK-NN`이 있고 해당 TASK의 `STAGE_DONE — stage=commit task=TASK-NN`이 없음 | 인라인 커밋 미완료(비-spawn 단계) | 자식 재실행 없이 인라인 커밋 단계부터 재개(멱등 처리) |
| `STAGE_DONE — stage=X` | 해당 단계 완료(게이트 통과됨) | 다음 단계로 진행 |
| `ORCHESTRATOR_DONE` | WORK 이미 완료 | 재개 불필요 — 완료 상태 보고 |

> **핵심 불변식**: `STAGE_DONE`은 게이트가 있는 단계에서는 게이트가 해소(RESOLVED)된 이후에만 기록된다. 따라서 **미승인 게이트는 로그에 `STAGE_DONE`이 남지 않아 재개 시 절대 스킵되지 않는다.**

### 슬라이딩 윈도우 (컨텍스트 핸드오프)

orchestrator가 자식 프롬프트를 구성할 때 이전 단계 결과를 다음 기준으로 압축해 전달한다.

| 단계 거리 | 상세 레벨 | 포함 필드 |
|---|---|---|
| 직전 (1단계) | `FULL` | what + why + caution + incomplete |
| 2단계 전 | `SUMMARY` | what만 (1-3줄) |
| 3단계+ | `DROP` | 전달하지 않음 |

---

## 3. 승인 게이트 (CRITICAL)

게이트는 orchestrator가 자율 실행을 멈추고 반환하는 정지 신호다. 중첩 sub-agent는 사용자에게 직접 질문할 수 없으므로, **승인/결정의 실제 처리(사용자에게 묻고 응답을 받는 것)는 항상 Main Claude 경계에서 이뤄진다.**

> **반드시 정지하고 명시적 사용자 승인/결정을 기다려야 합니다.**
> 유일한 예외는 auto 모드 — 사용자의 원본 메시지에 "auto" 또는 "자동으로"가 포함된 경우뿐이다.

게이트는 두 종류이며 Main Claude의 처리 방식은 동일하다(§1-3 참조).

### 고정 게이트 (2개, `type="stage"`)

| 게이트 | 발생 지점 | `stage` 값 | 승인 후 다음 |
|---|---|---|---|
| GATE-1 | specifier 완료 후 | `specifier` | planner spawn |
| GATE-2 | planner 완료 후 | `planner` | STEP C(builder) |

### 동적 게이트 (`type="decision"`)

- 고정 게이트 사이 **어느 단계에서든**(설계·구현·검증 포함) orchestrator 또는 자식이 사용자 결정이 필요하다고 판단하면 즉시 발생한다.
- 판단 기준 예: 요구 해석의 다의성, 설계 트레이드오프, 명시된 범위 초과, 파괴적/비가역적 변경, 재시도 3회 실패.
- 자식은 `<needs-decision>`으로 orchestrator에 먼저 상향하며, orchestrator가 자동 결정 가능 여부를 판단한 뒤 불가능하면 `<gate type="decision">`으로 승격해 Main Claude에 전달한다.
- `<gate type="decision">`은 `<context>`(배경)·`<options>`(선택지)·`<recommended>`(권고안)를 반드시 포함한다.

### auto 모드

| 모드 | 정지 횟수 | 처리 |
|---|:---:|---|
| gated (기본값) | 고정 게이트 1~2회 + 동적 게이트 발생 시마다 | Main Claude가 매번 승인/선택 후 재개 |
| auto ("auto"/"자동으로") | 0 | orchestrator 1회 spawn으로 완주. 모든 판단 지점은 권고안으로 자동결정되어 최종 보고서 `## 자동 결정 사항`과 `DECISIONS.md`에 기록 |

### 승인 요청 방법 (Main Claude)

1. `<gate>` 내용을 그대로 사용자에게 제시(요약 또는 배경+선택지+권고안).
2. "진행할까요?" 또는 동등한 질문(`type="decision"`이면 선택 요청).
3. **사용자 응답 대기** — 응답 전까지 `SendMessage`로 재개하지 말 것.

---

## 4. 모드/스폰 수

| Main → Orchestrator | Orchestrator → Specifier | → Planner | → Builder | → Verifier | 합계 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 1 | N | N | **3 + 2N** |

- `gated`/`auto` 여부는 spawn 수에 영향을 주지 않는다 — 게이트 정지 발생 여부만 다르다(§3).
- 위 표는 orchestrator 내부 자식 spawn만 집계한다. Main Claude가 spawn하는 대상은 오직 orchestrator 1개다. 인라인 커밋(result.md 작성 + WORK-LIST 갱신 + git commit)은 orchestrator가 자식 spawn 없이 직접 수행하므로 집계에 포함되지 않는다.

---

## 5. 기존 WORK 재개

Main Claude는 재개 요청을 감지하면 대상 `WORK_ID`를 orchestrator에 전달하는 것으로 끝난다. 재개 지점 판정(§2 "재개 규칙")은 orchestrator가 로그를 읽어 스스로 수행한다.

1. 파킹된 agentId를 보관하고 있으면 → `SendMessage(agentId, "WORK-{NN} 계속")`으로 컨텍스트를 유지한 채 재개.
2. 세션이 끊겨 핸들이 없으면(예: 새 세션에서 "WORK-01 계속실행") → orchestrator를 `WORK_ID` + `REFERENCES_DIR` + (승계된) `mode`와 함께 새로 spawn → orchestrator가 `work_{WORK_ID}.log`의 마지막 이벤트로 재개 지점을 판정한다.
3. 단순/복잡 분기는 다시 묻지 않는다 — orchestrator가 `PLAN.md`와 TASK 구성에서 판정한다.

---

## 6. 에이전트 역할 요약

| 에이전트 | 역할 | 모델 |
|---|---|---|
| orchestrator | 파이프라인 전체 조정 + TASK DAG 스케줄링 + 게이트/의사결정 중재 + 로그 일괄 기록 + 인라인 커밋(result.md 작성 + WORK-LIST 갱신 + git commit) | opus |
| specifier | 요구사항 분석 | opus |
| planner | 실행계획 수립 + TASK 분해 | opus |
| builder | 코드 구현 | sonnet |
| verifier | 빌드/린트/테스트 검증 | haiku |

---

## References Directory 전달 (필수)

Main Claude는 orchestrator spawn 시(신규/재개 모두) references 디렉토리 경로를 전달해야 합니다.
설치 방법(npm 또는 plugin)에 관계없이 orchestrator가 레퍼런스 파일을 찾을 수 있도록 합니다. 이 경로를 받는 것은 orchestrator뿐이며, 자식에게는 전달되지 않습니다.

**전달 방법:**
- orchestrator spawn 프롬프트 상단에 `REFERENCES_DIR={absolute_path}` 추가
- npm 설치: `.claude/references` 사용 (프로젝트 루트 기준 기본값)
- plugin 설치: 스킬의 "Base directory"에서 유도 (`{base_dir}/../../references`)

**예시:**
```
REFERENCES_DIR=C:/Users/me/.claude/plugins/cache/uc-taskmanager/abc123/references
mode=gated

[WORK] 사용자 요청 원문...
```

REFERENCES_DIR를 사용할 수 없는 경우(예: plugin 없는 npm 설치), orchestrator는 `.claude/references/`를 폴백으로 사용합니다. orchestrator는 자신이 읽은 레퍼런스 중 각 자식에게 필요한 섹션만 잘라 `<ref-cache>`(`xml-schema.md` § 4)로 **반드시** 재전달합니다.

---

## 레퍼런스 로딩

**정상 경로**: Main Claude는 레퍼런스 파일을 읽지 않으며 — `agent-flow.md`만 읽습니다. `{REFERENCES_DIR}/`의 레퍼런스 파일을 읽는 주체는 **orchestrator 하나뿐**입니다(기동 시 1회, 5개 파일).

**축퇴 모드(§7)**: orchestrator 역할이 Main Claude로 넘어오므로 Main Claude가 그 5개 파일을 읽습니다. 읽는 주체만 바뀌고 횟수·범위는 동일합니다.

어느 경우든 자식 에이전트(specifier/planner/builder/verifier)는 디스크를 읽지 않고, 각 파일 상단의 **섹션 소비 매트릭스**를 기준으로 잘라 전달된 `<ref-cache>`만 사용합니다 → `xml-schema.md` § 4.

---

## 7. 축퇴 모드 — Main Claude가 orchestrator 역할 수행

### 진입 조건

orchestrator가 `<capability-degraded reason="no-agent-tool">`(→ `xml-schema.md` § 8)을 반환한 경우. 일부 CLI 버전·환경에서 서브에이전트에 `Agent` 도구가 주입되지 않아 중첩 spawn이 불가능할 때 발생합니다. orchestrator는 이때 아무 산출물도 만들지 않고 즉시 반환하므로, 디스크에는 아무것도 남아 있지 않은 상태입니다.

### 처리 절차

1. **사용자에게 1줄 알린다** — 예: "중첩 spawn을 지원하지 않는 환경입니다. Main Claude가 직접 오케스트레이션합니다." 승인을 기다리지 않고 그대로 진행합니다(`mode=auto`의 무정지 완주 원칙 유지).
2. **`{REFERENCES_DIR}/orchestrator.md`와 레퍼런스 5종을 읽는다** — `file-content-schema.md`, `shared-prompt-sections.md`, `xml-schema.md`, `work-activity-log.md`, `context-policy.md`.
3. **`orchestrator.md`의 절차를 그대로 수행한다.** 정본은 `orchestrator.md` 하나이며 축퇴용 별도 절차는 없습니다. STEP A~D, TASK DAG 스케줄링, 재시도, 컨텍스트 핸드오프, ref-cache 조립(STEP 1-1), 활동 로그 규칙이 **전부 동일하게** 적용됩니다.
4. **활동 로그**에 `ORCHESTRATOR_START` 직후 `ORCHESTRATOR_DEGRADED — reason=no-agent-tool`을 1회 기록합니다.

### 정상 경로와 다른 점 — 3가지뿐

| 항목 | 정상 | 축퇴 |
|------|------|------|
| 자식 spawn depth | 2 (orchestrator가 spawn) | **1** (Main Claude가 직접 spawn) |
| 게이트 처리 | orchestrator가 `<gate>` 반환 후 yield → Main Claude가 사용자에게 질의 | **Main Claude가 사용자에게 직접 질의** — `<gate>` XML·`SendMessage`·`TaskStop` 불필요 |
| 레퍼런스를 읽는 주체 | orchestrator | **Main Claude** |

그 외 산출물 형식, 로그 이벤트 체계, ref-cache 조립 규칙, 재개 판정은 모두 같습니다.

### 금지 사항

- **자식 역할을 인라인으로 대행하지 않는다.** 축퇴 모드에서도 specifier/planner/builder/verifier는 반드시 별도 spawn한다. Main Claude가 직접 코드를 작성하면 파이프라인의 역할 분리가 사라진다. 단, 인라인 커밋(result.md 작성 + WORK-LIST 갱신 + git commit)은 정상 경로와 동일하게 orchestrator 역할을 넘겨받은 Main Claude가 자식 spawn 없이 직접 수행한다.
- `<ref-cache>` 없이 자식을 spawn하지 않는다 — 정상 경로와 동일하게 필수다.

### 재개

축퇴 모드로 진행 중이던 WORK를 재개할 때도 동일하다. Main Claude는 `works/{WORK_ID}/work_{WORK_ID}.log`의 마지막 이벤트로 재개 지점을 판정한다(§2 "재개 규칙"). 로그에 `ORCHESTRATOR_DEGRADED`가 있으면 그 WORK는 축퇴 모드로 시작됐다는 뜻이지만, 재개 시점의 환경이 바뀌었을 수 있으므로 **매번 orchestrator를 먼저 spawn해 다시 판정**한다.
