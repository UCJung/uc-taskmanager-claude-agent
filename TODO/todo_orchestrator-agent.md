# TODO: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

> 작성일: 2026-07-21
> 상태: **최종 확정 (구현 대기)** — 게이트/재개/생명주기/로그 프로토콜까지 대화형 검토로 확정됨

## Context (왜 이 변경을 하는가)

현재 uc-taskmanager 아키텍처는 **"Subagents can't nest — Main Claude orchestrates everything"** 제약(README 2회 명시) 위에 설계되어 있다. 그 결과:

- `scheduler` 와 `specifier`(direct 모드)는 **직접 다음 에이전트를 spawn하지 못하고** dispatch XML만 반환한다. 실제 spawn은 항상 **Main Claude**가 수행 (`scheduler.md:88,97`, `agent-flow.md:179`).
- 승인 게이트(⛔), 컨텍스트 핸드오프(슬라이딩 윈도우), 재개 판정 등 모든 오케스트레이션 로직이 Main Claude(터미널 세션)에 흩어져 있다.
- 파이프라인이 specifier 이후 멈추는 트리거 실패 관측(WORK-50/51은 WORK-LIST 행만 있고 폴더 미생성).

**Claude Code v2.1.172부터 sub-agent 중첩이 정식 지원**된다(`tools`에 `Agent` 포함 시 하위 spawn 가능, 깊이 제한 5, headless 정상 동작). 이 제약을 제거하고 **파이프라인 전체를 스스로 오케스트레이션하는 단일 `orchestrator` 에이전트**를 도입한다.

**목표 결과물**: `[tag]` 메시지 → Main Claude가 `orchestrator`를 **1회** spawn → orchestrator가 내부에서 specifier→(planner)→builder→verifier→committer를 **중첩 spawn**하고, TASK 스케줄링까지 담당하며, 승인 게이트 없이 자율 실행하고, 판단 필요 지점은 **권고안으로 자동 결정 후 결과보고서에 기록**한다.

### 사용자 확정 결정사항
- 오케스트레이터 범위: **specifier 포함 전체** (WORK 생성부터 orchestrator 책임)
- 승인 게이트: **기본 유지** — `[tag]` 메시지에 "auto"/"자동으로"가 포함된 경우에만 게이트 생략. 중첩 sub-agent(orchestrator)는 사용자에게 승인을 물을 수 없으므로(`AskUserQuestion` 미지원), **게이트는 Main Claude 경계에서 처리**한다. 비-auto 모드에서는 orchestrator가 게이트 지점에서 요약+GATE 신호를 반환하고 yield(파킹) → Main Claude가 승인 요청 → 승인 시 `SendMessage`로 컨텍스트 유지 재개(폴백: 로그 기반 re-spawn). auto 모드에서만 orchestrator 1회 spawn으로 완주하며, 판단 필요 지점은 권고안 자동결정 + 결과보고서 기록.
- 동적 의사결정: 고정 게이트(①specifier ②planner) **외에도**, orchestrator 또는 자식 에이전트가 자율 판단 중 "사용자 결정이 필요"하다고 판단하면 **언제든** 배경+선택지+권고안을 담아 `<gate type="decision">`을 반환·정지 → Main Claude가 사용자에게 요청·승인 → 결정을 주입해 재개. auto 모드에서는 동일 지점을 권고안으로 자동결정 + 기록.
- 게이트 재개 방식: **`SendMessage`(transcript 재개, 컨텍스트 유지) 우선 + 로그 기반 re-spawn 폴백**(크로스-세션/headless). `SendMessage`로 종료된 orchestrator를 컨텍스트 유지한 채 이어감(v2.1.191+ 검증). agentId로 지정, 실패 시 disk 재-spawn.
- 생명주기/고스트 관리: **orchestrator 핸들 1개만 능동 관리**. 게이트 파킹 ↔ 승인 시 계속 ↔ 수정 시 SendMessage 재개 ↔ 완료/방치 시 `TaskStop`. 자식(specifier/planner/builder…)은 실행→반환하면 끝(세션 정리 30일에 맡김). **디스크(log+DECISIONS.md)가 소스 오브 트루스** — 파킹 에이전트는 최적화일 뿐.
- 로그 기록 주체 = **orchestrator 일괄** (개별 자식 아님): `STAGE_START`는 자식 spawn 전, **`STAGE_DONE`은 게이트가 있으면 게이트 통과 후**에 기록 → cross-session 재개가 미승인 게이트를 스킵하지 않음. 콜백(CE7)도 orchestrator가 일괄 발신. 자식은 로그/콜백 없이 순수 산출물만 반환.
- 게이트/결정 대기 마커: orchestrator가 게이트 yield 시 `GATE_WAIT — stage=X`(동적 결정은 `DECISION_WAIT`) 기록 → cross-session 재개는 **자식 재실행 없이** 디스크 산출물 재사용 + 게이트만 재제시. execution-mode도 WORK 메타에 기록해 재개가 원래 모드 승계.
- 스케줄러 범위: **WORK 내부 TASK DAG만** (`scheduler.md` 병합/삭제)
- 모드 체계: **전면 재설계** (direct/pipeline/full 3-모드 → orchestrator 중심)

---

## 설계 개요

```
[tag]/resume 메시지
   │
   ▼  (work-pipeline SKILL)
Main Claude ── orchestrator spawn (요청 원문 + REFERENCES_DIR + mode=gated|auto)
   (게이트 처리)      │  (depth 1)  ※ gated=게이트마다 yield→SendMessage 재개 / auto=1회 완주
                   ▼
              orchestrator  ← 흐름 제어 + TASK DAG 스케줄 + 자율 의사결정
                   │  중첩 spawn (depth 2)
   ┌───────────────┼───────────────────────────────┐
   ▼               ▼                                 ▼
specifier  →  planner(복잡 시)  →  [TASK별] builder → verifier → committer
(WORK 생성)   (PLAN+TASK DAG)      (DAG READY 순서, FAIL 시 builder 재시도 ≤3)
                   │
                   ▼
   최종 WORK 요약 + 자동결정 목록을 Main Claude에 반환
```

**핵심 원칙**
- `orchestrator`는 **조정자 + 스케줄러 + 의사결정 중재자**. 무거운 추론(요구분석/설계)은 기존 specifier/planner를 **중첩 spawn**해서 재사용한다.
- `scheduler`는 고유 LLM 작업이 없는 순수 조정 역할이므로 **삭제하고 DAG 로직을 orchestrator에 인라인 흡수**한다.
- 깊이: Main(0) → orchestrator(1) → 자식(2). 제한(5) 이내로 안전.

### 승인 게이트 & 동적 의사결정 처리 (모드별)

중첩 sub-agent는 사용자에게 승인을 물을 수 없으므로 게이트/의사결정 요청은 **Main Claude 경계**에서만 처리한다. `<gate>` 신호는 두 종류:
- `type="stage"` — 고정 게이트(① specifier 완료 후, ② planner 완료 후).
- `type="decision"` — **동적 의사결정 요청**. orchestrator/자식 에이전트가 자율 판단 중 사용자 결정이 필요하다고 판단하면 배경(context) + 선택지(options) + 권고안(recommended)을 담아 언제든 발생.

두 종류 모두 처리 방식은 동일: orchestrator가 `<gate>` 반환·yield → Main Claude가 사용자에게 제시·승인 대기 → 결정/승인을 `SendMessage`로 주입해 재개(폴백: 로그 re-spawn) → orchestrator가 결정을 반영·기록.

**기본(비-auto) 모드 — 세그먼트 실행 + 게이트:**
```
Main Claude
  → orchestrator spawn (mode=gated) ── agentId 보관
      · specifier 중첩 spawn → WORK 생성
      · [GATE-1] <gate> 신호 + Requirement 요약 반환 후 yield(파킹)
  ← Main Claude: 요약 제시 → 사용자 승인 대기
  → SendMessage(agentId, "승인") ── 컨텍스트 유지 재개 (폴백: 로그 re-spawn)
      · (복잡) planner 중첩 spawn → PLAN + TASK DAG
      · [GATE-2] <gate> 신호 + PLAN/TASK 요약 반환 후 yield(파킹)
  ← Main Claude: 요약 제시 → 사용자 승인 대기
  → SendMessage(agentId, "승인") ── 재개
      · 실행 단계: TASK별 builder→verifier→committer (게이트 없음)
  ← 최종 WORK 요약 반환 → Main Claude가 TaskStop(agentId)로 종료
```
- 고정 게이트 지점: ① specifier 완료 후, ② planner 완료 후(복잡 WORK). 단순 WORK는 ①로 통합 → 기존 direct=1게이트, pipeline/full=2게이트와 동일.
- **동적 의사결정**은 위 고정 게이트 사이 어느 지점에서든(요구 모호·설계 트레이드오프·범위 확장·파괴적 변경·3회 재시도 실패 등) 발생 가능 → `<gate type="decision">`로 즉시 정지·승인 요청. 실행 단계(builder/verifier/committer) 중에도 발생 가능.
- 재개 판정은 `work_{WORK}.log`의 `STAGE_DONE`/`GATE_WAIT`/`DECISION_WAIT`/`*_START` 규칙 사용(아래 "게이트 재개 메커니즘" 참조). 결정 내용은 `works/{WORK}/DECISIONS.md`에 누적 기록해 재개가 참조.

**auto 모드 (메시지에 "auto"/"자동으로"):**
- orchestrator **1회 spawn**으로 게이트/의사결정 정지 없이 완주. 고정 게이트·동적 의사결정 지점 모두 권고안으로 자동결정 후 결과보고서 `## 자동 결정 사항`에 기록.

### 게이트 재개 메커니즘 & 생명주기 (고스트 관리)

게이트에서 orchestrator는 **종료가 아니라 yield(파킹)** — 자기 턴을 끝내고 멈춘 뒤 재개 가능한 상태. 재개·정리 규칙:

**재개 (2단계):**
1. **`SendMessage`(agentId) 우선** — 파킹된 orchestrator를 **컨텍스트 유지한 채** transcript에서 재개(v2.1.191+ 검증). 게이트당 파일 재읽기·상태 재구성 불필요. plan 수정 요청도 SendMessage로 이어감.
2. **로그 기반 re-spawn 폴백** — 세션 종료로 핸들 유실 / headless 별도 호출(`--resume <session-id>`) / SendMessage 실패(이름 충돌 등) 시, 디스크(`work_{WORK}.log`+`DECISIONS.md`)에서 새 orchestrator를 spawn해 재구성. 손실 없음(디스크가 소스 오브 트루스).
   - **재개 판정(로그 마지막 이벤트 기준)**: `GATE_WAIT — stage=X` → 자식 재실행 없이 디스크 산출물 재사용하고 **게이트만 재제시**(승인 후 `STAGE_DONE` 기록하고 진행). `DECISION_WAIT` → PENDING 결정 재제시. `STAGE_DONE` → 게이트 이미 통과됨, 다음 단계로. `*_START`(GATE_WAIT 없이) → 자식 실행 중단됨, 재실행. → **미승인 게이트는 로그에 `STAGE_DONE`이 없으므로 절대 스킵되지 않음.**

**생명주기 (파킹 핸들 1개 원칙):**

| 파킹 orchestrator 상태 | 처리 | 도구 |
|---|---|---|
| 승인 대기 / 수정 가능 | 파킹 유지 | (yield) |
| 승인됨 → 계속 | 컨텍스트 유지 재개 | `SendMessage` |
| plan/결정 수정 요청 | 컨텍스트 유지 재개 | `SendMessage` |
| WORK 완료 / 방치 | 완전 종료(해제) | `TaskStop` |

- **동시에 살아있는 파킹 핸들은 orchestrator 1개뿐** → 고스트 누적 없음. 자식(specifier/planner/builder…)은 실행→반환하면 끝이라 능동 종료 대상 아님(세션 정리 30일).
- **파킹 ≠ 실행 중** — yield 상태는 compute 미소비, 재개 가능한 transcript일 뿐(idle 타임아웃 없음).
- **컨텍스트 관리**: sub-agent는 auto-compaction만 지원(수동 clear/compact·부분 비우기 불가 — 검증됨). 장수 orchestrator 비대화는 auto-compaction이 흡수. "맥락 털기"가 필요하면 `TaskStop` 후 disk에서 re-spawn(이분법: **유지=SendMessage / 초기화=종료+재spawn**, 중간 없음).
- 재개 지정은 **name이 아니라 agentId** 사용(이름 재사용 오배달 방지).

---

## 변경 대상 (파일별)

모든 원본 작업은 `develop/`에서 하고, 완료 후 push 절차로 `plugin/`·`npm/` 동기화.

### 1. 신규 `develop/agents/orchestrator.md`
- frontmatter: `model: opus`, `tools: Agent, Read, Write, Edit, Bash, Glob, Grep` + serena. **`Agent`(중첩 spawn 도구) 반드시 포함.**
  - ⚠️ 구현 시 확인: 이 런타임의 spawn 도구 토큰이 `Agent`인지 `Task`인지 스모크 테스트로 확정(문서는 `Agent`, 기존 에이전트 frontmatter는 `Task` 사용). 안전하게 둘 다 나열 검토.
- **입력 플래그** `mode=gated|auto` (Main Claude가 전달):
  - `gated`: ① STEP A/B 완료 직후 `<gate type="stage">` + 요약을 반환하고 **yield(파킹)**. ② 어느 단계에서든 자율 판단상 사용자 결정이 필요하면 `<gate type="decision">`(배경+선택지+권고안) 반환·yield. 사용자 승인은 Main Claude가 처리하며, **`SendMessage`로 컨텍스트 유지 재개**(폴백: 로그/`DECISIONS.md` 기반 re-spawn). 재개 시 주입된 결정을 반영해 이어감.
  - `auto`: 게이트/의사결정 정지 없이 전 구간 완주. 모든 판단 지점은 권고안 자동결정 + 결과보고서 기록.
- **의사결정 에스컬레이션 규칙**: 자식 에이전트(specifier/planner/builder)가 사용자 결정이 필요한 모호점을 만나면 `<needs-decision>` 결과를 반환 → orchestrator가 `gated`면 `<gate type="decision">`로 상향, `auto`면 권고안 자동결정 후 기록. 판단 기준 예: 요구 해석 다의성, 설계 트레이드오프, 명시 범위 초과, 파괴적/비가역 변경, 재시도 3회 실패.
- 역할/할일/방식(기존 에이전트 문체 유지: 역할→수행업무→수행절차→출력):
  - **STEP A**: specifier 중첩 spawn → WORK 생성(폴더/Requirement.md/IN_PROGRESS 행/LAST_WORK_ID), 복잡도·모드 판정 수신. → `gated`면 `GATE_WAIT` 기록 후 [GATE-1] 반환·yield(파킹).
  - **STEP B**: 복잡 WORK면 planner 중첩 spawn → PLAN.md + TASK DAG. (단순 WORK는 specifier가 만든 단일 TASK 사용 → 기존 direct/pipeline 분기를 내부 branch로 대체.) → `gated`면 `GATE_WAIT` 기록 후 [GATE-2] 반환·yield(파킹).
  - **STEP C (scheduler 흡수, 게이트 없음)**: `work_{WORK}.log` 기반 DAG 해석 → READY(오름차순) 결정 → TASK별 builder→verifier→committer 중첩 spawn. verifier/committer FAIL 시 builder 최대 3회 재시도. 복수 READY면 builder 병렬 spawn.
  - **STEP D (로그·콜백 일괄)**: orchestrator가 모든 활동 로그/콜백을 기록. `STAGE_START`=자식 spawn 전, `STAGE_DONE`=(게이트 있으면) 게이트 통과 후, 게이트 yield 시 `GATE_WAIT`/`DECISION_WAIT`, 결정 확정 시 `DECISION`. 자식은 로그/콜백을 쓰지 않음.
  - **재개 로직**: `*_START`=중단(재실행) / `STAGE_DONE`=완료(다음) 규칙 + `GATE_WAIT`(자식 재실행 없이 게이트만 재제시) / `DECISION_WAIT`(PENDING 결정 재제시)를 orchestrator 내부로 이전. execution-mode는 WORK 메타에서 승계.
  - **컨텍스트 핸드오프**: 슬라이딩 윈도우(직전 FULL / 2단계 SUMMARY / 3+ DROP)를 orchestrator가 자식 프롬프트 구성 시 적용.
  - **출력**: 최종 WORK 요약 + `## 자동 결정 사항` 목록을 Main Claude에 반환.

### 2. `develop/agents/scheduler.md` — 삭제
- DAG/재시도/진행보고 로직은 orchestrator STEP C로 이전. `plugin.json`·`agent-flow.md`·`context-policy.md`의 scheduler 참조 제거.

### 3. `develop/references/agent-flow.md` — 전면 재작성
- "Main Claude 역할 가이드" → **Main Claude는 트리거만**: `[tag]`/resume 감지 → orchestrator 1회 spawn(REFERENCES_DIR·autonomous 전달) → 최종 보고 릴레이. 직접 다른 에이전트를 spawn하지 않음.
- 신설 "Orchestrator 내부 흐름" 절: STEP A~D, 단순/복잡 내부 분기(기존 direct/pipeline/full 3표 대체), 재개 규칙, 슬라이딩 윈도우.
- Spawn 수 표를 orchestrator 기준으로 갱신.
- 승인 게이트 절 **유지·개정**: 게이트는 Main Claude 경계에서 처리 → orchestrator가 정지 지점에서 `<gate>` 반환 → Main Claude 승인/결정 → 재spawn(로그 재개). "auto"/"자동으로" 요청 시에만 정지 생략(1회 완주). 고정 게이트(specifier 후/planner 후) + **동적 의사결정 게이트(`type="decision"`, 어느 단계에서든)** 두 종류를 모두 문서화.

### 4. `develop/skills/work-pipeline/SKILL.md` — 간소화
- 트리거 감지 + `REFERENCES_DIR` 유도 + **auto 감지("auto"/"자동으로")는 유지**.
- 다단계 스폰 프로즈 제거 → orchestrator 중심으로 단순화하되 **게이트 처리는 Main Claude에 남김**:
  - 비-auto: `orchestrator`를 `mode=gated`로 spawn하고 **agentId 보관** → `<gate>` 신호 수신 시(고정 게이트든 `type="decision"`이든) 요약/선택지/권고안 제시 + 사용자 승인·결정 대기 → **`SendMessage(agentId, 결정)`으로 재개**(폴백: 로그 re-spawn). 최종 요약까지 반복 후 **`TaskStop(agentId)`으로 종료**. `type="decision"` 게이트는 `AskUserQuestion`으로 선택지+권고안을 제시.
  - auto: `orchestrator`를 `mode=auto`로 **1회 spawn**, 게이트/의사결정 정지 없이 완주.
- 모든 최초 spawn 프롬프트 상단에 `REFERENCES_DIR` + `mode=` 포함. 재개는 name 아닌 **agentId** 사용.

### 5. `develop/references/` 기타 정합화
- `xml-schema.md`: dispatch/task-result의 dispatcher를 Main Claude → **orchestrator**로 라벨 변경.
  - (신규) `<gate type="stage|decision" work="WORK-NN" stage="specifier|planner|...">` — orchestrator→Main Claude 정지 신호. `type="decision"`이면 `<context>`/`<options>`/`<recommended>` 하위 요소로 배경·선택지·권고안 전달.
  - (신규) `<needs-decision>` — 자식 에이전트→orchestrator 상향 신호(배경+선택지+권고안).
  - (신규) `<decision>` — 확정된 결정 기록(사용자 승인분·auto 자동결정분 공통), `DECISIONS.md`/로그에 반영.
- `context-policy.md`: "Scheduler Dispatch"/Main Claude 핸드오프 → orchestrator 기준으로 수정.
- `work-activity-log.md`: **기록 주체를 orchestrator로 일원화**(개별 자식 로그 제거). 이벤트 체계 개정 — `ORCHESTRATOR_START/DONE`, `STAGE_START`(spawn 전)/`STAGE_DONE`(게이트 통과 후), `GATE_WAIT — stage=X`, `DECISION_WAIT`, `DECISION`(주체 user|auto), execution-mode 헤더. `STAGE_DONE`=게이트 통과 후 기록이라는 규칙을 명시 → 재개 판정 근거.
- `file-content-schema.md`: **`works/{WORK}/DECISIONS.md`** 포맷 신설(또는 결과보고서 `## 자동 결정 사항` 섹션) — 항목별 시각/단계/배경/선택지/권고안/**확정값**/결정주체(user 승인 | auto)/**상태(PENDING|RESOLVED)**. 게이트 yield 시 PENDING으로 기록, 승인/자동결정 시 RESOLVED로 갱신 → cross-session 재개가 PENDING 결정을 재제시. 재spawn 시 orchestrator가 이 파일을 읽어 결정을 이어간다.
- `callback-protocol.md`: 콜백 발신 주체를 개별 자식 → **orchestrator 일괄**로 변경(STAGE 단위 START/DONE을 orchestrator가 발신).
- `shared-prompt-sections.md`: 자동결정 기록 관례 1항 추가. WORK-LIST 규칙은 유지.

### 6. 기존 역할 에이전트 소폭 수정 (specifier/planner/builder/verifier/committer)
- 보고 대상 문구 "Main Claude" → **"orchestrator"** ("역할 종료 후 orchestrator에 보고").
- specifier/planner/builder: 모호점을 만나면 **`<needs-decision>`(배경+선택지+권고안)을 orchestrator에 반환**. orchestrator가 gated면 사용자 승인 요청으로, auto면 권고안 자동결정으로 처리 → 자식은 사용자를 직접 기다리지 않는다(기존 "auto" 대기 금지 동작 확장).
- **로그/콜백 기록 제거** — 자식은 활동 로그·콜백을 직접 쓰지 않음(orchestrator가 일괄). 자식은 산출물 생성 + 결과 XML 반환만. (리팩터링 TODO §5.2 "활동로그/콜백 중앙화"와 정합.)
- description에서 Skill 트리거 문구 제거(리팩터링 TODO §5.2와 정합).
- 자식들은 중첩 불필요 → `tools`에 `Agent` 추가 안 함.

### 7. `develop/.claude-plugin/plugin.json`
- `agents`: `orchestrator` 추가, `scheduler` 제거 → (orchestrator, specifier, planner, builder, verifier, committer).

### 8. `README.md`
- "Subagents can't nest…" 문장(약 132·434행) 제거.
- Pipeline/Flow·"Why This Approach"를 orchestrator 중심 중첩 흐름으로 재서술, 모드/스폰 표 갱신, 자동결정 기록 설명 추가.
- (push 시) `README.md` → `npm/README.md` 동기화.

---

## 범위 밖 (이번 계획 제외)
- **ref-cache 정상화**(`TODO/todo_ref-cache-fix.md`): 별개 작업. 단, orchestrator가 자식 프롬프트를 직접 구성하므로 ref-cache 전파가 훨씬 쉬워짐 → 후속 작업으로 자연 연계.
- **hook 인프라**(`develop/hooks/`는 현재 부재): 이번 변경은 hook 불필요. 활동 로그/콜백은 에이전트 내부 유지.
- **크로스-WORK 큐 스케줄링**: 이번엔 WORK 내부 TASK만. 향후 orchestrator 상위 큐 계층 확장 여지만 명시.

---

## 검증 (End-to-End)

1. **spawn 도구 확정**: orchestrator가 nested specifier 1개를 실제 spawn하는 최소 스모크 테스트로 `Agent`/`Task` 토큰 확정.
2. **Headless auto 모드 전체 실행**:
   `env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p "[WORK] <요구사항> 자동으로" --dangerously-skip-permissions --output-format stream-json`
   - 확인: orchestrator 1회 spawn(mode=auto) → nested specifier→planner→builder→verifier→committer가 `parent_tool_use_id`로 연결되어 스트림에 출현, 게이트에서 멈추지 않음.
   - 산출물: `works/WORK-NN/` 폴더 + Requirement.md/PLAN.md/TASK-*.md/커밋 생성, `DECISIONS.md`(또는 보고서 자동결정 섹션) 채워짐, WORK-LIST `IN_PROGRESS→DONE` 전환.
2b. **게이트(비-auto) 모드 + SendMessage 재개** (대화형):
   - `[WORK] <요구사항>` (auto 없이) → orchestrator(mode=gated)가 specifier 후 `<gate type="stage">` 반환·yield 확인 → Main Claude 승인 요청 표시 → **`SendMessage(agentId, 승인)`으로 컨텍스트 유지 재개** 확인 → planner 후 재yield → 승인 재개 → 실행 완주 → **`TaskStop(agentId)` 종료** 확인.
   - plan 수정 요청을 SendMessage로 보냈을 때 재구성 없이 이어가는지, 파킹 핸들이 orchestrator 1개로 유지되는지 확인.
   - 폴백: 세션을 끊고 disk에서 로그 기반 re-spawn 시 마지막 `*_DONE`/`DECISION` 지점에서 정확히 재개되는지 확인.
2c. **동적 의사결정 에스컬레이션**:
   - 의도적으로 모호한 요구(예: 명시 안 된 기술 선택/범위)를 gated 모드로 실행 → orchestrator가 `<gate type="decision">`(배경+선택지+권고안) 반환·정지 확인 → Main Claude가 `AskUserQuestion`으로 제시 → 사용자 선택이 재spawn에 주입되어 반영되고 `DECISIONS.md`에 기록되는지 확인.
   - 동일 요구를 auto 모드로 실행 → 정지 없이 권고안 자동결정 + `DECISIONS.md` 기록 확인.
3. **재개 테스트 (cross-session 게이트 스킵 방지 — 핵심)**:
   - gated 모드로 실행 → GATE-1 파킹 상태(승인 전)에서 **세션 강제 종료** → 새 세션에서 "WORK-NN 계속" → 로그 마지막이 `GATE_WAIT — stage=specifier`이므로 **specifier 재실행 없이 GATE-1이 다시 제시**되는지 확인(로그에 `STAGE_DONE` 없음 → 스킵 안 됨). 승인 후에야 `SPECIFIER_DONE` 기록되는지 확인.
   - 실행 단계 중단(예: `BUILDER_START` 후 종료) → 재개 시 해당 TASK builder 재실행되는지 확인.
   - PENDING 동적 결정 상태로 종료 → 재개 시 `DECISION_WAIT`/DECISIONS.md PENDING 근거로 결정 재제시되는지 확인.
4. **한도 점검**: 깊이 ≤5 확인, `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`(기본 200) 대비 대형 WORK(N TASK × 3) 여유 확인.
5. 상세 절차는 `docs/guide_agent-testing.md` 준용.

---

## 참고 (탐색·문서 확인된 런타임 사실)
- **중첩 지원**: v2.1.172+, `tools: Agent`로 활성, 깊이 5, headless 정상(백그라운드 대기 최대 10분 기본). 우리 흐름은 Main(0)→orchestrator(1)→자식(2)로 여유.
- **중첩 sub-agent는 `AskUserQuestion` 등 사용 불가** → 승인 게이트/의사결정 요청은 Main Claude 경계에서만 처리.
- **종료 에이전트 재개(SendMessage)**: v2.1.191+, 종료된 sub-agent를 **컨텍스트 유지한 채** transcript에서 재개. **yield-first**(실행 중 인터럽트 아님, 멈춘 뒤 재개) + v2.1.198부터 재개 시 중간 방향수정 반영. 플러그인 에이전트·중첩 자식 보유 상태에서도 동작(재개해도 depth 불변). agentId로 지정 권장(이름 재사용 오배달 방지). ※ 실제 프로젝트 런타임에서 SendMessage 재개가 동작함을 세션 중 실증.
- **headless 재개**: 단일 `claude -p` 내 불가 → 별도 호출 `--resume <session-id>` 필요. auto 모드는 1회 완주라 무관, gated는 본래 대화형이라 실무상 무관.
- **종료/정리**: `TaskStop`(agentId/name)으로 파킹·실행 에이전트 완전 종료. 파킹은 compute 미소비·idle 타임아웃 없음, transcript는 `cleanupPeriodDays`(기본 30일) 후 정리.
- **컨텍스트 관리**: sub-agent는 auto-compaction만 지원. **수동 clear/compact·부분 비우기 불가**(`/clear`는 spawn 카운트만, `/compact`은 자식 transcript 미영향). "맥락 유지=SendMessage / 초기화=TaskStop+re-spawn"의 이분법, 중간 없음.
- **세션 한도**: 기본 200 sub-agent/세션(`CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`). 파킹 핸들 1개 원칙으로 여유.
- 현재 상태: `develop/`가 원본(v1.6.0), 참조 8개, hook 미존재, WORK 상태기계 `IN_PROGRESS→DONE→COMPLETED`.
- 선행 사례: `_TODO/DONE_bash-cli-pipeline-automation.md`에서 headless `claude -p` full 파이프라인 무인 실행 검증됨(router=최상위 오케스트레이터 개념이 이번 orchestrator에 해당).
