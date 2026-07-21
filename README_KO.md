<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-GPLv3-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

요구사항 분석 및 개발 6-Agent Full Pipeline + DAG 기반 오케스트레이션 + Sliding Window Context 관리

**Universal Claude Task Manager** — Claude Code를 위해 SDD(Specification-Driven Development)를 실행하는 WORK-PIPELINE Agent입니다.
사용자의 요구사항을 명세화하고,
그 명세를 바탕으로 실행 계획(WORK)을 수립하고,
작은 단위의 작업(TASK)으로 분해해서 의존관계 그래프(DAG)를 분석한 뒤,
의존관계에 따라 TASK들을 순차 또는 병렬로 자동 실행합니다.

**npm CLI**(`uctm`)로 설치할 수 있습니다. 한 번 설치하면 `[]` 태그가 붙은 요청만으로 자동화된 멀티 에이전트 파이프라인이 실행됩니다.

**[English Documentation](README.md)**

---

## 빠른 시작

### npm CLI

```bash
npm install -g uctm
cd your-project
uctm init --lang en   # English agents
uctm init --lang ko   # 한국어 에이전트 (Korean — npm only)
uctm init             # 대화형 언어 선택
```

`uctm init`은 에이전트에 필요한 Bash 권한을 `settings.local.json`에 자동 설정하고, `.claude-plugin`과 `skills/` 리소스도 함께 설치합니다. 별도 프롬프트 없이 init 직후 파이프라인을 바로 실행할 수 있습니다.

### 시작하기

설치가 끝나면 Claude Code를 실행하고 파이프라인 태그를 사용하세요:

```
claude
> [new-feature] hello world 기능 추가해줘
```

`uctm init`이 권한을 자동으로 설정하므로 추가 프롬프트 없이 파이프라인이 실행됩니다. CI/격리된 환경에서 권한을 우회해야 한다면:

```bash
claude --dangerously-skip-permissions
```

> **경고**: 바이패스 모드는 격리된 환경이거나 파이프라인을 전적으로 신뢰할 때만 사용하세요. 자세한 내용은 [Claude Code Permissions](https://code.claude.com/docs/en/permissions)를 참고하세요.

에이전트가 요청을 분석하고, 작업을 계획하고, 격리된 서브에이전트 파이프라인을 통해 실행합니다.

---

## 이 파이프라인의 차별점

### 1. 절차대로 잘 수행되고 기록되어야 한다는 관점

* TDD나 DDD처럼 *코드를 더 잘 짜는 것*(개발을 잘하자)을 목표로 하기보다는, 이 Agent는 **개발 절차를 제대로 수행하는 것**에 초점을 맞춥니다.
* **요구사항(사용자) → 요구사항 명세 → WORK Plan → TASK별 실행 계획 → TASK별 실행/검증/종료 → TASK별 결과 저장**의 전체 파이프라인(WORK PIPELINE)을 체계화했습니다.
* 그 결과 요구사항부터 산출물까지 end-to-end 기록이 남아 추적 가능성(traceability)이 보장됩니다.

**이 AI Agent와 함께 일하는 법:**

* **시작**: `[]`로 시작하는 프롬프트로 WORK-PIPELINE를 트리거합니다
```
[game-dev] 블록깨기 게임을 HTML로 만들어줘
```

* **요구사항 분석**: Main Claude가 `orchestrator` 에이전트를 **단 한 번** spawn합니다(기본값 `mode=gated`). orchestrator는 내부적으로 `specifier`를 중첩 호출해 요구사항을 분석합니다. orchestrator는 **[GATE-1]**에서 일시 정지하고 승인을 요청하는 요약을 반환합니다. `works/WORK-NN/Requirement.md`를 검토하고 **"승인"**을 입력하면 다음 단계로 진행합니다.
```
{요구사항 명세 내용}
Requirement.md를 승인하시면 orchestrator가 Planner를 중첩 spawn하여 PLAN.md + TASK 분해를 진행합니다.
수정할 부분이 있으면 말씀해주세요.
```

* **WORK 실행 계획**: orchestrator가 `planner`를 중첩 호출해 실행 계획을 수립하고 **[GATE-2]**에서 다시 일시 정지합니다. `works/WORK-NN/PLAN.md`와 `TASK-NN.md`를 검토하고 **"승인"**을 입력하면 다음 단계로 진행합니다.
```
WORK-31 개발 승인 요청

  프로젝트 폴더 구조 재구조화 ~~~~~~~ / ########

  ┌─────────┬─────────────────────────┐
  │  항목   │          내용           │
  ├─────────┼─────────────────────────┤
  │ TASK 수 │ 6개 (TASK-00 ~ TASK-05) │
  └─────────┴─────────────────────────┘

  DAG 구조

  TASK-00 (agents/ en 파일 → en/ 하위 이동)
     ├─→ TASK-01 (~~~~~~~~~~~~) ─→ TASK-03 (#########)
     ├─→ TASK-02 (plugin/ 생성) ─→ TASK-04 (????????)
     └─────────────────────────────────→ TASK-05 ($$$$$$$$$)

  - TASK-01/02 병렬, TASK-03/04 병렬, TASK-05는 최종 통합
  - 승인하시면 orchestrator가 TASK DAG를 직접 스케줄링하며 TASK별로 builder → verifier → committer를 중첩 spawn합니다 — 이 단계에는 추가 승인 게이트가 없습니다.

  진행할까요?
```
* TASK별: build → verify → commit이 각 TASK마다 자동으로 반복됩니다. 모두 동일한 중첩 orchestrator 실행 안에서 이루어집니다.
```
● TASK-05 커밋 완료. PROGRESS.md를 갱신하고 WORK-31을 마무리합니다.
```
* TASK가 완료되면 `works/WORK-NN/TASK-NN_result.md` 파일 내용과 실제 테스트로 검증합니다.
```
  push, merge
```

**롤백하고 싶다면** `WORK-NN rollback`을 입력하세요. commit hash가 파일에 저장되어 있어 해당 WORK의 변경 사항만 되돌립니다.

**단순 버튼 이름 변경까지 이 모든 절차를 거치기 귀찮다면?**
```
[WORK start] 제출 버튼 이름을 "전송"으로 바꿔줘 — 자동으로
```
"자동으로"를 추가하면 orchestrator가 `mode=auto`로 실행됩니다 — 승인 게이트 없이 단 한 번의 중첩 spawn으로 WORK 전체를 완료하고, 대신 내린 모든 판단을 `works/WORK-NN/DECISIONS.md`와 최종 보고서의 `## 자동 결정 사항` 섹션에 기록합니다.

### 2. 토큰 절감

토큰에 민감한 편입니다(솔직히). 그래서 이 Agent는 네 가지 토큰 절감 전략을 적용합니다:

**(1) 코드베이스 분석에 Serena MCP 사용.**
이 Agent는 코드 탐색 시 [Serena MCP](https://github.com/oraios/serena)를 우선 사용합니다 — 파일 전체가 아니라 심볼 단위로 읽습니다. (Serena 팀에게 정말 감사합니다.)

**(2) 단계별 왕복 대신 단일 중첩 orchestrator.** WORK-PIPELINE은 최대 6단계의 에이전트로 구성됩니다. Main Claude가 매 단계를 하나씩 호출하는 대신, Main Claude는 `orchestrator` 에이전트를 **한 번만** spawn하고, orchestrator가 specifier → planner → builder → verifier → committer를 자기 자신의 하위 spawn(Claude Code sub-agent nesting, depth 2)으로 중첩 호출합니다. orchestrator는 Main Claude를 거치지 않고 TASK DAG를 직접 스케줄링합니다. 자세한 내용은 [개념: orchestrator 실행 모드](#개념-orchestrator-실행-모드-gated-vs-auto) 참고.

**(3) 구조화된 XML 통신.** 중첩 구조라 하더라도 에이전트 사이의 모든 경계는 여전히 텍스트로 오갑니다 — 게이트 요약과 인계 내용도 결국 텍스트 덩어리입니다.
* 수신 측은 이를 다시 해석해야 합니다. 그래서 통신 규격을 XML로 표준화했습니다.
* 조금이라도 아껴보자는 취지입니다.
* (덕분에 Agent 로그 모니터링도 훨씬 쉬워졌습니다.) 자세한 내용은 [구조화된 에이전트 통신](#구조화된-에이전트-통신) 참고.

**(4) Sliding Window Context 전달.** A가 작업을 끝내고 B에게 자신이 한 일을 알려줍니다. B가 작업을 끝내고 C에게 A가 한 일과 자신이 한 일을 알려줍니다. 그런데 C가 A의 세부 내용까지 전부 알아야 할까요? 그래서 B는 자신의 작업은 전부 C에게 전달하고, A가 한 일은 요약해서 전달합니다. **한 다리 건너면 남이다** — 이름과 간단한 연락처만 알면 됩니다. 성격까지 알 필요는 없습니다. 궁금하면 직접 연락하면 되니까요. 테스트 결과 약 20~30%의 토큰이 절감됩니다. 자세한 내용은 [슬라이딩 윈도우 컨텍스트 전달](#슬라이딩-윈도우-컨텍스트-전달) 참고.

**"에이전트 없이 한 세션에서 다 처리하면 안 되나?"** [컨텍스트 격리](#컨텍스트-격리) 섹션을 참고하세요. 긴 세션이 이어지면 AI는 점차 일관성을 잃습니다 — 대화 중간에 갑자기 기억을 잃는 것처럼요. 철저한 컨텍스트 격리는 이를 방지하고 결과물의 품질에 직접적인 영향을 줍니다.

### 3. 의존성 기반 병렬 실행

WORK 내 TASK 간 의존성은 DAG로 관리됩니다. 병렬 실행은 TASK 간에 상호 의존성이 없을 때만 이루어집니다 — 즉 동시 편집으로 인한 소스코드 충돌이 없다는 뜻입니다.

이 파이프라인과 연계되는 **요구사항관리 시스템**도 구축했습니다. 프로젝트별로 요구사항을 관리합니다. 자기 전에 요구사항을 큐에 쌓아두면 아침에는 모두 개발되어 있어서, 할 일이 "코딩"에서 "리뷰"로 바뀝니다. WORK는 프로젝트 간에도 병렬로 실행됩니다(프로젝트 간 의존성은 존재하지 않으므로).

### 앞으로의 계획

현재 **RAG 기반 시스템**을 설계 중입니다. 축적된 산출물을 저장하고, 요구사항 분석 시 유사한 과거 요구사항을 조회해 더 빠르고 정확한 요구사항 분해를 하는 것이 목표입니다. (데이터가 충분히 쌓이면 언젠가 MCP 뒤에 파인튜닝된 LLM을 둘지도 모르겠습니다.)

> **AI 에이전트에게 지침을 내리는 팁**: SQL WHERE 절의 순서를 떠올려보세요(개발자 한정). 첫 번째 조건이 데이터셋을 가장 많이 좁혀야 하고, 인덱스를 탄다면 더 좋습니다. 그래서 저는 용어와 소스코드 진입점을 정리한 용어집을 유지하고, 에이전트가 이를 참조하도록 했습니다. 제 토큰은 소중하니까요.

---

여섯 개의 서브에이전트가 어떤 프로젝트, 어떤 언어에서든 **요청 라우팅 → 작업 분해 → 의존성 관리 → 코드 구현 → 검증 → 커밋**을 자동으로 처리합니다.

```
"[new-feature] 사용자 인증 기능을 만들어줘"
→ specifier가 WORK를 판단, planner가 TASK 5개로 WORK-01 생성, 파이프라인 실행
```

---

## 사용법

### 작은 수정

```
> [bugfix] 로그인 에러 메시지 오타 수정
```

Main Claude가 `orchestrator`를 한 번 spawn합니다(기본값 `mode=gated`). orchestrator는 specifier → **[GATE-1]** → planner → **[GATE-2]** → builder → verifier → committer를 중첩 호출합니다. WORK-NN 디렉토리 + PLAN + result.md + commit이 모두 동일한 orchestrator 실행 안에서 생성됩니다. 모든 WORK가 같은 경로를 타므로 한 줄짜리 변경도 계획되고 기록됩니다.

### 기능 (WORK)

#### 1. WORK 생성 (계획 수립)

```
> [new-feature] 사용자 인증 기능을 만들거야. 계획 세워줘.
```

orchestrator가 specifier → planner를 중첩 호출합니다. planner는 프로젝트를 분석하고 WORK-01을 생성합니다:

```
WORK-01: 사용자 인증 기능

  WORK-01: TASK-00: 프로젝트 초기화             ← 선행 없음
  WORK-01: TASK-01: DB 스키마 설계              ← TASK-00
  WORK-01: TASK-02: JWT 인증 API                ← TASK-01
  WORK-01: TASK-03: 사용자 CRUD                 ← TASK-02
  WORK-01: TASK-04: 테스트 + 문서화              ← TASK-03

  이 계획을 승인하시겠습니까?
```

#### 2. WORK 실행

```
> WORK-01 파이프라인 실행해줘
```

orchestrator 내부의 DAG 스케줄링(STEP C)이 WORK-01의 TASK를 의존관계 순서대로 실행하며, TASK마다 builder → verifier → committer를 중첩 호출합니다 — 이 단계에는 승인 게이트가 없습니다.

#### 3. 기존 WORK에 추가

WORK-01이 IN_PROGRESS 상태라면 specifier가 질문합니다:
> "WORK-01 (사용자 인증 기능)이 진행 중입니다. 새 TASK로 추가할까요, 새 WORK를 생성할까요?"

#### 4. 상태 확인

```
> WORK 목록
```

```
WORK 현황
   WORK-01: 사용자 인증 기능    ✅ 5/5 완료
   WORK-02: 결제 기능 추가      🔄 2/4 진행 중
   WORK-03: 관리자 대시보드     ⬜ 0/6 대기
```

#### 5. Auto 모드 / 재개

```
> WORK-02 자동으로 실행해줘
> WORK-02 재개해줘
```

"자동으로"는 `mode=auto`를 트리거합니다 — orchestrator가 게이트 없이 단일 중첩 spawn 안에서 완료합니다. "재개"는 `SendMessage`로 park된 orchestrator에 다시 연결합니다(컨텍스트 유지). 핸들이 소실된 경우에는 `work_{WORK}.log`를 기반으로 재구성한 새 중첩 spawn으로 폴백합니다.

#### 6. 특정 TASK 실행

WORK 내 특정 TASK로 건너뛰어 실행합니다(예: 실패 후 재시도):

```
> WORK-02: TASK-02 실행해줘
```

orchestrator의 DAG 스케줄링(STEP C)이 다음 READY 상태의 TASK를 식별한 뒤 builder → verifier → committer를 순차적으로 중첩 호출합니다.

#### 7. WORK 강제 생성 (복잡도 검사 스킵)

`[new-work]` 태그를 사용하면 복잡도와 무관하게 항상 새 WORK를 생성합니다:

```
> [new-work] 인증 모듈 리팩토링
```

#### 8. 실패 처리 / 재시도

파이프라인 도중 TASK가 실패하면 orchestrator가 builder를 최대 3회까지 자동으로 재디스패치합니다(STEP C). 3회 모두 실패하면 `<needs-decision>`으로 에스컬레이션합니다 — `mode=gated`에서는 `<gate type="decision">`으로, `mode=auto`에서는 `DECISIONS.md`에 기록되는 자동 결정으로 처리됩니다.
그래도 실패한다면 result 파일을 확인한 뒤 수동으로 재시도할 수 있습니다:

```
> WORK-02: TASK-01 실패했어. 다시 실행해줘.
```

또는 문제를 먼저 수정하고 재실행:

```
> src/auth.ts 문제 수정하고, WORK-02: TASK-01 다시 실행해줘
```

#### 9. 진행 중인 WORK에 TASK 추가

```
> [enhancement] 인증 API에 rate limiting 추가해줘
```

WORK-02가 `IN_PROGRESS` 상태라면 specifier가 질문합니다:
> "WORK-02 (Auth Module)이 진행 중입니다. 새 TASK로 추가할까요, 새 WORK를 생성할까요?"

#### 10. 개별 TASK 상태 확인

```
> WORK-02 진행 현황 보여줘
> WORK-03: TASK-02 상태가 어떻게 돼?
```

orchestrator가 `PROGRESS.md`와 `result.md` 파일을 읽어 현재 상태를 보고합니다.

---

## `[]` 태그 시스템

요청 앞에 `[]` 태그를 붙이면 파이프라인이 트리거됩니다:

| 태그 | 의미 |
|-----|------|
| `[new-feature]` | 새 기능 |
| `[enhancement]` | 기능 개선 |
| `[bugfix]` | 버그 수정 |
| `[new-work]` | 항상 새 WORK 생성 (복잡도 검사 생략) |

`[]` 태그 없음 = 파이프라인 없이 직접 처리.

이 규칙을 프로젝트에 등록하려면 `CLAUDE.md`에 다음을 추가하세요:

```markdown
## Agent 호출 규칙

`[]` 태그로 시작하는 요청 → specifier 에이전트 호출 (WORK 파이프라인 시작)
```

이렇게 하면 `[]` 태그가 붙은 요청을 Claude가 별도 호출 없이 자동으로 specifier 에이전트에 위임합니다.

---

## 설치

### npm CLI

```bash
npm install -g uctm

# 프로젝트별 설치 (에이전트 + 설정 복사 + CLAUDE.md 갱신)
cd your-project
uctm init --lang en          # English agents
uctm init --lang ko          # 한국어 에이전트
uctm init                    # 대화형 언어 선택

# 전역 설치 (~/.claude/agents/에 복사)
uctm init --global --lang en

# uctm 업그레이드 후 에이전트 갱신 (--lang 필수)
uctm update --lang en
```

### 수동 설치

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git /tmp/uc-tm
mkdir -p .claude/agents .claude/references
cp /tmp/uc-tm/npm/agents/*.md .claude/agents/          # 6개 에이전트 (orchestrator, specifier, planner, builder, verifier, committer)
cp /tmp/uc-tm/npm/references/*.md .claude/references/   # 7개 참조 문서
rm -rf /tmp/uc-tm
git add .claude/agents/ .claude/references/ && git commit -m "chore: add uc-taskmanager agents"
```

### 로컬 Plugin 테스트

```bash
# 로컬에서 Plugin 테스트
claude --plugin-dir ./
```

### 설치 확인

```bash
claude
> /agents
# orchestrator, specifier, planner, builder, verifier, committer → 6개 확인
```

---

## 개념: orchestrator 실행 모드 (gated vs auto)

Main Claude는 `[]` 태그를 감지하면 단일 **orchestrator** 서브에이전트를 spawn하며, `mode=gated`(기본값) 또는 `mode=auto`(요청에 "auto"/"자동으로"가 포함된 경우)를 전달합니다. orchestrator는 나머지 모든 에이전트를 스스로 중첩 호출합니다 — Main Claude는 specifier/planner/builder/verifier/committer를 직접 호출하지 않습니다:

```
User Request → Main Claude
                    │
                    ▼ spawn once, mode=gated|auto
              ┌──────────────┐
              │ orchestrator │  ← TASK DAG 스케줄링 + 게이트/결정 중재
              └──────┬───────┘
                     │ nested spawn (depth 2)
                     ▼
              specifier → Requirement.md          ← [GATE-1]
                     │
              planner   → PLAN.md + TASK DAG      ← [GATE-2]
                     │
              STEP C: DAG 순서로 [builder → verifier → committer] × N (READY 상태면 병렬)
```

- `mode=gated`: specifier 이후(**[GATE-1]**) `<gate type="stage">`로 일시 정지하며, planner 이후(**[GATE-2]**)에도 정지합니다. 또한 orchestrator나 중첩된 자식이 사용자 판단이 필요할 때는 언제든 `<gate type="decision">`(배경 + 선택지 + 권고안)으로 정지합니다. Main Claude는 게이트를 사용자에게 중계하고 승인/선택을 기다린 뒤 `SendMessage`로 park된 orchestrator를 재개합니다(핸들이 소실된 경우 로그 기반 재spawn으로 폴백).
- `mode=auto`: **spawn 1회, 게이트 0회** — 모든 판단 지점을 권고안으로 자동 해결하고 `works/{WORK}/DECISIONS.md`와 최종 보고서의 `## 자동 결정 사항` 섹션에 기록합니다.
- 실행 단계(STEP C: builder → verifier → committer)는 사용자에게 게이트를 걸지 않습니다 — WORK 생성(specifier)과 계획 수립(planner)만 게이트 대상입니다.

**Sub-agent Spawn 수:**

| Branch | Main → Orchestrator | → Specifier | → Planner | → Builder | → Verifier | → Committer | 합계 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 1 | 1 | N | N | N | **3 + 3N** |

`gated`와 `auto`는 spawn 수에 영향을 주지 않습니다 — 실행이 승인 대기로 정지하는지 여부만 다릅니다([승인 게이트, 중첩 자율성, 그리고 DECISIONS.md](#승인-게이트-중첩-자율성-그리고-decisionsmd) 참고, `agent-flow.md` § 4).

두 branch 모두 `works/WORK-NN/`에 산출물을 출력하고 `result.md` + `DECISIONS.md`를 보장합니다.

### WORK와 TASK

2단계 계층 구조:

```
WORK (일)                 하나의 목표. 사용자가 요청한 단위.
└── TASK (작업)           WORK를 달성하기 위한 개별 실행 단위.
    └── result            완료 증빙. 검증 통과 후 자동 생성.
```

### 실행 흐름

orchestrator가 planner를 한 번 중첩 호출한 뒤, TASK별로 DAG 순서에 따라 builder → verifier → committer를 반복합니다.

```
orchestrator → planner(opus, nested)                 → PLAN.md + TASK DAG
             → [builder(sonnet) → verifier(haiku) → committer(haiku)] × N   ← STEP C, 게이트 없음
              (각 중첩 spawn은 orchestrator가 생성, Main Claude가 아님)
```

---

## 파이프라인

### WORK 파이프라인 (중첩)

> Main Claude는 `orchestrator`를 **한 번만** spawn합니다. 아래의 다른 모든 호출은 orchestrator 자신이 생성하는 *중첩* 서브에이전트 spawn입니다 — Main Claude는 이 루프에 관여하지 않습니다.

```
Main Claude ── spawn once (mode=gated|auto) ──▶ orchestrator
                                                      │  nested spawn (depth 2)
                    ┌─────────────┬──────────────────┴──────────────────┐
                    │             │                                     │
  specifier        planner                    builder          verifier         committer
 ┌──────────┐    ┌─────────┐               ┌──────────┐     ┌──────────┐     ┌──────────┐
 │요구사항   │────▶│WORK/TASK │──────────────▶│코드      │────▶│Build/Test│────▶│결과      │
 │분석      │     │생성      │  (complex     │구현      │     │검증      │     │→ git     │
 └────┬─────┘     └────┬────┘   WORK only)  └────┬─────┘     └────┬─────┘     └────┬─────┘
      │                │                         │                │                │
 [GATE-1]          [GATE-2]                      └── 실패 시 재시도 ┘                │
 (gated mode        (gated mode                     (최대 3회, 이후                 │
  only; yield        only; yield                    <needs-decision> 에스컬레이션)  │
  + SendMessage       + SendMessage)                                다음 READY TASK 루프 ◀┘
  로 재개)                              (orchestrator가 DAG를 직접 스케줄링 — STEP C, 게이트 없음)
```

- `mode=gated`(기본값): **[GATE-1]**(specifier 이후)과 **[GATE-2]**(planner 이후)에서 정지 + yield; `SendMessage(agentId, decision)`으로 재개하며, 실패 시 로그 기반 재spawn으로 폴백합니다.
- `mode=auto`: 게이트 없음 — orchestrator가 단일 spawn으로 전체 다이어그램을 완료하고, 판단이 필요했던 부분은 `DECISIONS.md`에 기록합니다.
- STEP C(builder → verifier → committer 루프)는 어느 모드에서도 사용자 게이트를 걸지 않습니다.

### 단계 상세

```
  specifier   →  planner  →  [builder → verifier → committer] × N
 ┌──────────┐   ┌─────────┐   ┌──────────┐  ┌──────────┐  ┌────────────┐
 │요구사항   │──▶│PLAN     │──▶│코드      │─▶│Build/Test│─▶│결과→ git  │
 │분석      │   │+TASK DAG│   │구현      │  │검증      │  │            │
 └──────────┘   └─────────┘   └──────────┘  └──────────┘  └────────────┘
   (opus)          (opus)       (sonnet)       (haiku)        (haiku)
              ← 모든 중첩 spawn은 orchestrator가 생성 →
```

### 에이전트

여섯 개의 에이전트가 깔끔하게 격리된 파이프라인으로 협업합니다 — Main Claude는 `orchestrator`만 spawn하고, orchestrator가 나머지를 중첩 호출합니다:

| 에이전트 | 역할 | 모델 | 권한 | MCP | Spawn |
|-------|------|-------|------------|-----|-------|
| **orchestrator** | specifier→(planner)→builder→verifier→committer를 중첩 호출; TASK DAG 스케줄링(STEP C); 고정/동적 게이트 중재; 활동 로그 일괄 기록 | **opus** | read + nested spawn | Serena (선택) | Main Claude가 WORK당 **한 번만** spawn |
| **specifier** | `[]` 태그 감지, 요구사항 분석, 복잡도 판정, WORK-LIST 관리, dispatch XML 반환 | **opus** | read + dispatch | Serena(코드베이스 탐색), sequential-thinking(복잡도 판정) | orchestrator가 중첩 호출 |
| **planner** | WORK 생성 + TASK 분해 + PLAN.md 생성 + progress 템플릿 선생성 | **opus** | read-only | Serena(코드베이스 탐색), sequential-thinking(작업 분해) | orchestrator가 중첩 호출 |
| **builder** | 코드 구현 + progress.md 체크포인트 기록 | **sonnet** | full access | Serena(심볼 단위 탐색/편집) | orchestrator가 TASK별로 중첩 호출 |
| **verifier** | progress gate(Status=COMPLETED) 검사 → 빌드/린트/테스트 검증 (읽기 전용) | **haiku** | read + execute | — | orchestrator가 TASK별로 중첩 호출 |
| **committer** | gate 검사(progress.md) → result.md 작성 → git commit | **haiku** | read + write + git | — | orchestrator가 TASK별로 중첩 호출 |

> 활동 로그 기록은 **orchestrator가 한 번만** 방금 중첩 호출한 에이전트를 대신해 수행합니다 — 자식 에이전트(specifier/planner/builder/verifier/committer)는 직접 로그를 쓰지 않습니다.

### 참조 문서 (Plugin에 포함)

6개 파이프라인 에이전트 외에도 plugin에는 에이전트가 시작 시 참조하는 8개 지원 문서가 포함되어 있습니다.
이 파일들은 `plugin/references/`에 위치합니다(`develop/references/`에서 동기화). npm으로 설치하면 `.claude/references/`에 배치됩니다:

| 파일 | 용도 |
|------|------|
| `agent-flow.md` | 파이프라인 오케스트레이션 규칙 — Main Claude의 트리거/게이트 경계 + orchestrator 내부의 중첩 spawn 흐름 |
| `context-policy.md` | 에이전트 간 슬라이딩 윈도우 컨텍스트 전달 규칙 |
| `file-content-schema.md` | 모든 파일 포맷(PLAN.md, TASK.md, progress.md, result.md)의 단일 정보원 |
| `ref-cache-protocol.md` | 4단계 ref-cache 프로토콜 — dispatch XML의 `<ref-cache>`를 확인하고, 캐시된 참조가 있으면 디스크 읽기를 생략 |
| `shared-prompt-sections.md` | cache_control이 적용된 공통 프롬프트 섹션 — 반복 토큰 비용을 최대 90% 절감 |
| `work-activity-log.md` | builder 단계 추적을 위한 Activity log 포맷 |
| `xml-schema.md` | dispatch 및 task-result 메시지의 XML 통신 포맷 |

---

## 파일 구조

```
works/
├── WORK-LIST.md                      ← 전체 WORK 마스터 목록 (specifier가 관리)
├── WORK-01/                          ← "사용자 인증 기능"
│   ├── PLAN.md                       ← 계획 + 의존성 그래프
│   ├── PROGRESS.md                   ← 진행 상황 (자동 업데이트)
│   ├── work_WORK-01.log               ← orchestrator 활동 로그 (STAGE_*/GATE_WAIT/DECISION_WAIT/DECISION)
│   ├── DECISIONS.md                  ← 자동 결정 + 승인된 게이트 결정 (PENDING → RESOLVED)
│   ├── TASK-00.md                    ← 작업 명세
│   ├── TASK-00_progress.md           ← 실시간 체크포인트 (builder 기록)
│   ├── TASK-00_result.md             ← 완료 보고서 (committer 생성)
│   ├── TASK-01.md
│   └── ...
└── WORK-02/
    └── ...
```

### 파일 명명 규칙

| 파일 | 명명 규칙 |
|------|-----------|
| 작업 명세 | `TASK-NN.md` (prefix 없음) |
| 진행 체크포인트 | `TASK-NN_progress.md` (언더스코어 구분자) |
| 완료 보고서 | `TASK-NN_result.md` |
| 계획 | `PLAN.md` |
| WORK 진행 상황 | `PROGRESS.md` |
| 활동 로그 | `work_{WORK_ID}.log` (orchestrator가 기록; 게이트 재개의 기준) |
| 결정 로그 | `DECISIONS.md` (자동 결정 + 사용자 승인 결정, `PENDING`/`RESOLVED`) |

### WORK-LIST.md

specifier가 `works/WORK-LIST.md`를 마스터 인덱스로 관리합니다:

| WORK ID | Title | Status | Created |
|---------|-------|--------|---------|
| WORK-01 | 사용자 인증 기능 | DONE | 2026-03-01 | 2026-03-01 |
| WORK-02 | 결제 기능 추가 | IN_PROGRESS | 2026-03-05 | |

| 상태 | 의미 |
|--------|---------|
| `IN_PROGRESS` | WORK 생성됨, TASK 진행 중 |
| `DONE` | 모든 TASK 커밋 완료 — committer가 마지막 TASK 완료 시 자동 설정 |
| `COMPLETED` | `_COMPLETED/`로 아카이브 — push 절차에서 설정 |

- **IN_PROGRESS**: 새 WORK 생성 전 specifier가 확인
- **DONE**: 마지막 TASK 완료 시 committer가 IN_PROGRESS → DONE으로 자동 변경
- **COMPLETED**: push 시 DONE 상태 WORK를 일괄 처리 — WORK-LIST에서 행 제거 후 `works/_COMPLETED/`로 이동

#### git push 절차

Claude에게 push를 요청하면(`"push 해줘"`, `"git push"`) Claude가 다음 순서를 자동으로 처리합니다:

```
1. 에이전트 동기화 — develop/ 원본을 npm/, plugin/으로 복사
2. DONE WORK 일괄 완료 처리 — WORK-LIST에서 DONE 행 제거, 폴더를 _COMPLETED/로 이동
3. README.md 확인 — 변경 내용이 반영되어 있는지 확인, 누락 시 업데이트
4. git push
```

> **DONE은 committer가 설정**합니다 — 마지막 TASK가 완료되는 시점. **COMPLETED**는 push 시점에 DONE 상태 WORK를 `_COMPLETED/`로 아카이브할 때 설정됩니다.

---

## 팁

### CLAUDE.md를 최신 상태로 유지

언어 설정과 프로젝트 컨텍스트는 `CLAUDE.md`에 저장됩니다. 에이전트가 매 호출마다 이 파일을 읽으므로, 정확하게 유지하면 불필요한 왕복이 줄어듭니다.

### `[]` 태그를 일관되게 사용

`[]` 태그가 없는 요청은 라우팅 없이 Claude가 직접 처리합니다. 파이프라인 동작을 보장하려면 항상 태그를 사용하세요.

### 병렬 TASK

planner는 의존성을 고려한 TASK 그래프를 생성합니다. 독립적인 TASK(동일한 `blockedBy` 집합)는 orchestrator의 DAG 스케줄링(STEP C)에 의해 동시에 디스패치됩니다 — 승인 시 명시하세요:

```
> 승인. 독립 TASK는 병렬로 실행해줘.
```

### 컨텍스트 초기화 후 재개

파이프라인 도중 Claude가 컨텍스트를 잃어도 언제든 재개할 수 있습니다:

```
> WORK-02 멈춘 곳부터 재개해줘
```

orchestrator는 `work_{WORK}.log`(및 `PROGRESS.md`)를 읽어 마지막으로 완료된 단계/TASK를 파악하고 이어서 진행합니다 — park된 핸들이 살아있으면 `SendMessage`로 재연결하고, 그렇지 않으면 로그를 기반으로 재구성한 새 중첩 spawn을 사용합니다. 해소되지 않은 `GATE_WAIT`/`DECISION_WAIT`는 건너뛰지 않고 항상 다시 제시됩니다.

---

## 예제 세션

```
User: [new-feature] 블로그 시스템의 댓글 기능을 만들거야.

Claude: [Main Claude가 orchestrator를 한 번 spawn, mode=gated]

Claude: [orchestrator가 specifier를 중첩 호출 → WORK 경로]
  복잡도: 4+ 파일, DB 스키마 변경, 다중 모듈 → Large
  → 새 WORK 생성

  [GATE-1] 요구사항 승인 — planner로 계속 진행

Claude: [orchestrator가 planner를 중첩 호출]
  프로젝트 분석
     Tech Stack: Next.js + Prisma + PostgreSQL
     기존 코드: 게시글 CRUD 완료, 인증 완료

  WORK-03: 댓글 기능

  WORK-03: TASK-00: Comment 모델 + 마이그레이션          ← 선행 없음
  WORK-03: TASK-01: 댓글 CRUD API                       ← TASK-00
  WORK-03: TASK-02: 대댓글 (self-relation)               ← TASK-01
  WORK-03: TASK-03: 프론트엔드 댓글 컴포넌트              ← TASK-00 (병렬 가능)
  WORK-03: TASK-04: 통합 + 알림                          ← TASK-02, TASK-03

  [GATE-2] 이 계획을 승인하시겠습니까?

User: 승인.

Claude: [SendMessage로 orchestrator 재개 → STEP C: DAG 실행, 추가 게이트 없음]
  WORK-03: TASK-00 → builder → verifier ✅ → committer [a1b2c3d]
  WORK-03: TASK-01 → builder → verifier ✅ → committer [d4e5f6g]
  WORK-03: TASK-02 → builder → verifier ✅ → committer [h7i8j9k]
  WORK-03: TASK-03 → builder → verifier ✅ → committer [l0m1n2o]
  WORK-03: TASK-04 → builder → verifier ✅ → committer [p3q4r5s]

  🎉 WORK-03 완료! 5 tasks, 5 commits
  ## 자동 결정 사항: 없음 (두 게이트 모두 명시적 승인 필요)
```

---

## 왜 이 방식인가?

### 에이전트 파일 설계

모든 에이전트 파일(`agents/*.md`)은 하나의 원칙으로 작성됩니다: **핵심 내용만, 장식 없이**. 설명, 강조 마커, 중복 예시를 제거한 결과 전체 에이전트 합산 약 1,600줄로 — 원래 크기의 절반 이하 — 동일한 기능 범위를 커버합니다.

에이전트 프롬프트는 Bash 시퀀스에서 파이프(`|`) 명령어를 사용하지 않습니다 — Windows, Linux, macOS 등 크로스 플랫폼 호환성을 위해 각 명령을 개별 호출로 처리합니다.

각 에이전트 파일은 일관된 4섹션 구조를 따릅니다:

```
## 1. 역할 (Role)
   에이전트의 목적과 책임을 선언합니다.
   에이전트가 무엇이며 무엇을 담당하는지 한 단락으로 기술합니다.

## 2. 수행업무 (Responsibilities)
   담당 업무를 플랫 테이블로 나열합니다.
   | 업무 (Task) | 설명 (Description) |

## 3. 업무수행단계 및 내용 (Execution Steps)
   § 2에 나열된 각 업무의 단계별 상세 절차.
   시작 시 반드시 읽어야 할 파일을 명시한 STARTUP 블록으로 시작합니다.
   파일 포맷은 file-content-schema.md를 참조합니다 (단일 정보원).
   에이전트 간 통신은 xml-schema.md를 참조합니다.

## 4. 제약사항 및 금지사항 (Constraints and Prohibitions)
   에이전트가 반드시 준수해야 할 불변 규칙.
   금지/제약 사항을 플랫 목록으로 기술합니다.
```

`file-content-schema.md`는 모든 파일 포맷(PLAN.md, TASK.md, progress.md, result.md)의 단일 권위 정의입니다. 에이전트가 포맷 스펙을 직접 내장하는 대신 이 파일을 참조하여 6개 에이전트 파일 간 중복을 제거합니다.

### ref-cache: 참조 파일 캐싱

각 에이전트는 시작 시 4~5개의 공유 참조 파일(shared-prompt-sections.md, file-content-schema.md, xml-schema.md 등)을 읽습니다 — 전체 파이프라인 기준 약 26회의 파일 읽기가 발생합니다. **ref-cache**는 이 중복을 제거합니다:

1. **첫 번째 에이전트**(orchestrator 자신, STARTUP 단계에서)가 참조 파일을 정상적으로 읽고, 다음 에이전트를 중첩 호출할 때 `<ref-cache>`를 반환할 수 있습니다
2. **orchestrator**는 Main Claude가 중계하는 대신 ref-cache를 각 중첩 자식의 dispatch에 직접 복사합니다
3. **이후 중첩 에이전트**는 디스크에서 파일을 읽는 대신 캐시된 내용을 사용합니다

프로토콜 자체는 `references/ref-cache-protocol.md`(4단계)에 정의되어 있습니다. Phase 2(선택적 전달)는 각 에이전트가 필요로 하는 섹션만 전달함으로써(파일 전체가 아니라) 토큰 사용량을 추가로 절감합니다. 에이전트별 섹션 매핑은 `agent-flow.md`에 정의되어 있습니다.

**측정된 효과** (3개 에이전트 기준):
- 파일 읽기: 14 → 5 (**-64%**)
- 토큰 사용량: ~85K → ~72K (**-15%**)

### WORK ID 할당 전략

WORK ID는 **파일시스템 우선 원칙**을 따릅니다:

1. **파일시스템 소스**: planner가 `works/` 디렉토리를 스캔하여 기존 WORK 디렉토리를 찾고, 가장 최신 디렉토리를 기반으로 다음 WORK ID를 결정합니다.
2. **MEMORY.md 미참조**: 프로젝트 메모리(MEMORY.md)는 WORK 번호 결정에 절대 참조되지 않습니다. 오직 파일시스템만이 유일한 정보원입니다.
3. **일관성 검증**: specifier는 planner에게 넘기기 전에 파일시스템과 WORK-LIST.md를 모두 확인하여 WORK ID 일관성을 검증합니다.

이를 통해:
- MEMORY.md가 오래되거나 손상되어도 WORK ID 중복 할당 방지
- 세션 간 신뢰성 있는 재개 보장
- 명확한 추적성: WORK-NN은 직접 `works/WORK-NN/` 폴더에 대응

### 컨텍스트 격리

각 서브에이전트는 독립된 컨텍스트에서 실행됩니다. builder가 20,000 토큰을 써서 50개 파일을 생성했더라도, 이를 중첩 호출한 orchestrator는 슬라이딩 윈도우 context-handoff를 통해 3줄짜리 요약만 받습니다.

```
orchestrator's context after 5 TASKs:

  PLAN.md (loaded once)                              ~500 tokens
  WORK-01: TASK-00 result: "20 files, PASS"           ~200 tokens
  WORK-01: TASK-01 result: "15 files, PASS"           ~200 tokens
  WORK-01: TASK-02 result: "8 files, PASS"            ~200 tokens
  WORK-01: TASK-03 result: "12 files, PASS"           ~200 tokens
  WORK-01: TASK-04 result: "5 files, PASS"            ~200 tokens
  ────────────────────────────────────────
  Total: ~1,500 tokens (stays flat)
```

### 단일 세션 vs uc-taskmanager

| | 단일 세션 | uc-taskmanager |
|---|---|---|
| TASK당 컨텍스트 | 모든 코드 + 로그 누적 | 요약만 (~200 tokens) |
| 10개 TASK 후 | 50K~100K 토큰, 품질 저하 | ~3K 토큰, 품질 유지 |
| 실패 복구 | 처음부터 다시 | 마지막 result 파일부터 재개 |
| 추적 | 채팅 히스토리 스크롤 | 파일 기반 (PLAN.md, result.md) |
| 검증 | 수동 | 자동 (build/lint/test) |

### 승인 게이트, 중첩 자율성, 그리고 DECISIONS.md

Main Claude는 WORK당 정확히 한 번만 `orchestrator`를 spawn합니다. specifier/planner/builder/verifier/committer를 언제 중첩 호출할지, 그리고 언제 정지하여 사람에게 물어볼지는 오로지 orchestrator가 결정합니다. 중첩된 서브에이전트는 사용자에게 직접 프롬프트를 띄울 수 없으므로, **모든 승인/결정은 Main Claude 경계에서 표면화**됩니다:

- **고정 게이트** (`<gate type="stage">`) — 정확히 두 개이며, `mode=gated`(기본값)에서만 발생합니다: specifier 직후(Requirement.md 준비 완료)의 **[GATE-1]**, planner 직후(PLAN.md + TASK DAG 준비 완료)의 **[GATE-2]**.
- **동적 게이트** (`<gate type="decision">`) — orchestrator나 중첩된 자식이 *어느 시점에서든* 제기할 수 있습니다(설계 트레이드오프, 범위 확장, 파괴적 변경, 3회 재시도 실패, 모호한 요구사항 등). `<context>` + `<options>` + `<recommended>`를 포함합니다.
- 게이트에서 orchestrator는 종료하지 않고 **yield(park)** 합니다. Main Claude는 게이트를 제시하고 사람의 응답을 기다린 뒤, `SendMessage(agentId, decision)`으로 park된 orchestrator를 재개합니다 — 컨텍스트가 보존되어 파일을 다시 읽을 필요가 없습니다. 핸들이 소실된 경우(새 세션, 터미널 종료 등) Main Claude는 `WORK_ID`로 orchestrator를 재spawn하고, orchestrator는 `work_{WORK}.log`를 재생해 해소되지 않은 동일한 게이트를 다시 제시합니다 — **승인되지 않은 게이트는 절대 조용히 건너뛰지 않습니다**. `STAGE_DONE`은 게이트가 해소된 *이후*에만 기록되기 때문입니다.
- 최종 보고서가 도착하면 Main Claude는 park된 핸들을 해제하기 위해 `TaskStop(agentId)`를 호출합니다.
- `mode=auto`(요청에 "auto"/"자동으로" 포함)는 모든 게이트를 건너뜁니다: orchestrator는 각 판단 지점을 스스로 권고안으로 해결하고 단일 spawn 안에서 완료합니다.

모든 결정 — 사람이 승인했든 orchestrator가 자동으로 해결했든 — 은 `works/{WORK_ID}/DECISIONS.md`에 기록되며(park 중에는 `PENDING`, 해소 후 `RESOLVED`), 최종 보고서의 `## 자동 결정 사항` 섹션에 요약됩니다. STEP C 자체(builder → verifier → committer TASK 루프)는 어느 모드에서도 게이트를 걸지 않습니다 — 아무도 승인할 필요가 없는 파이프라인 구간이기 때문입니다.

두 모드(gated/auto) 모두 동일한 산출물 구조(PLAN.md + result.md + `DECISIONS.md`)로 `works/WORK-NN/`에 출력되므로, 모드와 무관하게 다운스트림 연동이 동작합니다.

### 구조화된 에이전트 통신

모호한 자연어 프롬프트 대신 구조화된 XML 포맷으로 에이전트 간 통신합니다:

**디스패치 포맷** (호출자 → 수신자):
```xml
<dispatch to="builder" work="WORK-03" task="TASK-00">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
    <plan-file>works/WORK-03/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/WORK-03/TASK-00.md</file>
    <title>공통 시스템 프롬프트 섹션 식별 및 XML 스키마 설계</title>
    <action>implement</action>
  </task-spec>
  <cache-hint sections="output-language-rule,build-commands"/>
</dispatch>
```

**결과 포맷** (수신자 → 호출자):
```xml
<task-result work="WORK-03" task="TASK-00" agent="builder" status="PASS">
  <summary>shared-prompt-sections.md와 xml-schema.md 생성</summary>
  <files-changed>
    <file action="created" path="references/shared-prompt-sections.md">cache_control이 포함된 공통 섹션</file>
  </files-changed>
  <verification>
    <check name="file_existence" status="PASS">두 파일 모두 생성됨</check>
  </verification>
</task-result>
```

**장점**:
- **명확성**: 명시적인 XML 구조가 모호한 자연어를 제거합니다 ("컨텍스트를 전달해줘" ← 혼동 vs `<context>` ← 명확)
- **출력 토큰 감소**: 에이전트가 명확화 질문을 생성하지 않고, 수신자는 XML을 직접 파싱합니다
- **Prompt Caching**: Output Language Rule, Build Commands 같은 공통 섹션을 Anthropic API의 `cache_control`로 마킹하여 반복 토큰 비용을 **최대 90%** 절감
- **확장성**: WORK 개수가 늘어날수록 캐시 히트율이 향상됩니다 (5 TASK 기준 ~0.03 tokens/token vs 캐시 없이 2K+ tokens)

전체 포맷은 `references/xml-schema.md`를, 캐시 가능한 섹션은 `references/shared-prompt-sections.md`를 참고하세요.

### 슬라이딩 윈도우 컨텍스트 전달

각 서브에이전트는 빈 컨텍스트에서 시작합니다 — 격리의 비용입니다. **슬라이딩 윈도우** 시스템은 에이전트 간, 그리고 의존 TASK 간 컨텍스트 전달 시 토큰 낭비를 최소화합니다.

**규칙**: 멀어질수록 덜 상세하게:

| 거리 | Detail Level | 내용 |
|----------|-------------|---------|
| 직전 단계 | `FULL` | what + why + caution + incomplete |
| 2단계 전 | `SUMMARY` | what만 (1–3줄) |
| 3단계 이상 | `DROP` | 전달하지 않음 |

각 에이전트는 **context-handoff**를 출력합니다 — 단순 결과 로그가 아니라 구조화된 추론 문서입니다:

```xml
<context-handoff from="builder" detail-level="FULL">
  <what>auth.ts 수정 — JWT 자동 갱신 로직 추가</what>
  <why>기존 코드는 만료 즉시 401을 반환했음. 자동 갱신으로 UX 개선.</why>
  <caution>session.ts의 setSession()과 결합되어 있음. 변경 시 부작용 주의.</caution>
  <incomplete>단위 테스트 미작성. Verifier가 확인해야 함.</incomplete>
</context-handoff>
```

**결과 책임의 이동**: builder는 구현에만 집중하며 `progress.md` 체크포인트를 기록합니다. **committer**가 builder와 verifier의 context-handoff를 종합해 최종 `result.md`를 작성합니다. builder가 컨텍스트 압박을 받아도 result 파일이 누락되지 않도록 방지합니다.

**예상 토큰 절감**: 3-TASK 의존 체인 기준, 전체 결과를 그대로 전달하는 방식 대비 약 48%.

전체 설계는 `docs/spec_sliding-window-context.md`를 참조하세요.

---

## 산출물 언어

산출물 언어는 프로젝트의 **CLAUDE.md**에서 결정됩니다. 최초 설정 이후에는 별도 설정이 필요 없습니다.

```
1. CLAUDE.md에서 "Language: xx" 확인
   ├─ 있음 → 해당 언어 사용
   └─ 없음 ↓

2. 질문: "산출물 언어를 설정하시겠습니까? (예: ko, en, ja)"
   ├─ 사용자가 지정 → CLAUDE.md에 기록 + 해당 언어 사용
   └─ 사용자가 거부 ↓

3. 시스템 로케일 자동 감지 → CLAUDE.md에 기본값으로 기록
```

한 번 설정되면 CLAUDE.md에 저장되어 다시 질문하지 않습니다. 우선순위: `PLAN.md > CLAUDE.md > en`

기본적으로 git commit 메시지와 코드 주석을 포함한 **모든 산출물**이 설정된 언어로 작성됩니다:

| 항목 | 기본값 | Override |
|------|---------|----------|
| PLAN.md / TASK 설명 | Language | — |
| 결과 보고서 | Language | — |
| Git commit 메시지 (제목/본문) | Language | `CommitLanguage: en` |
| 코드 주석 | Language | `CommentLanguage: en` |
| 커밋 타입 prefix (`feat`, `fix`...) | 항상 English | — |
| 파일명, 경로, 명령어 | 항상 English | — |

### 카테고리별 Override

CLAUDE.md에 추가하여 특정 카테고리만 언어를 재정의할 수 있습니다:

```markdown
## Language
ko
CommitLanguage: en
CommentLanguage: en
```

이렇게 하면 계획/보고서는 `ko`로, 커밋과 코드 주석은 `en`으로 작성됩니다 — 오픈소스 프로젝트나 글로벌 팀에 유용합니다.

---

## 커스터마이징

`.claude/agents/`에 동일한 이름의 파일을 두면 오버라이드됩니다.

| 항목 | 파일 | 섹션 |
|------|------|------|
| 복잡도 판정 기준 | `specifier.md` | 4. 역할 결정 |
| 승인 게이트 / 모드 처리 | `orchestrator.md` | 3-3. 게이트 및 동적 의사결정 |
| TASK DAG 스케줄링 / 재시도 | `orchestrator.md` | STEP C: TASK DAG 실행 |
| 커밋 메시지 형식 | `committer.md` | Step 3: Stage + Commit |
| 검증 단계 | `verifier.md` | Verification Pipeline |
| 작업 세분화 | `planner.md` | Task Decomposition Rules |
| 빌드/린트 명령어 | `builder.md` + `verifier.md` | Self-Check / Step 1-2 |
| 산출물 언어 | `planner.md` | Output Language Rule |

---

## 지원 스택

프로젝트 파일에서 자동 감지됩니다. 별도 설정이 필요 없습니다.

| 파일 | 스택 |
|------|------|
| `package.json` | Node.js / TypeScript / React / NestJS / Next.js |
| `pyproject.toml` / `setup.py` | Python / FastAPI / Django |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `build.gradle` / `pom.xml` | Java / Kotlin |
| `Gemfile` | Ruby |
| `Makefile` | Generic |

---

## 저장소 구조

```
uc-taskmanager/
├── develop/                 ← 소스 오브 트루스 (여기서 편집)
│   ├── agents/              ← 6개 에이전트 프롬프트 (언어 독립)
│   │   ├── orchestrator.md  ← 중첩 spawn 코디네이터: specifier→(planner)→builder→verifier→committer, TASK DAG 스케줄링, 게이트/결정, 로그 일괄 처리
│   │   ├── specifier.md     ← [] 태그 감지 + 요구사항 분석
│   │   ├── planner.md       ← WORK 생성 + TASK 분해
│   │   ├── builder.md       ← 코드 구현
│   │   ├── verifier.md      ← 빌드/린트/테스트 검증
│   │   └── committer.md     ← git commit + result.md
│   ├── references/          ← 7개 지원 문서 (에이전트 간 공유)
│   │   ├── agent-flow.md          ← 파이프라인 오케스트레이션 규칙
│   │   ├── context-policy.md      ← 슬라이딩 윈도우 컨텍스트 규칙
│   │   ├── file-content-schema.md ← 파일 포맷 정의
│   │   ├── ref-cache-protocol.md  ← ref-cache 프로토콜 (4단계)
│   │   ├── shared-prompt-sections.md ← 캐시 가능한 공통 섹션
│   │   ├── work-activity-log.md   ← Activity log 포맷
│   │   └── xml-schema.md          ← XML 통신 포맷
│   ├── skills/              ← Skill 정의 (sdd-pipeline, uctm-init, work-pipeline, work-status)
│   └── .claude-plugin/
│       └── plugin.json      ← Plugin 매니페스트 소스 (name, version, agents 배열)
├── npm/                     ← npm 패키지 (`uctm`으로 배포)
│   ├── agents/              ← develop/agents/에서 동기화
│   ├── references/          ← develop/references/에서 동기화 (7개 파일)
│   ├── skills/              ← develop/skills/에서 동기화 (SKILL.md 4개)
│   ├── bin/cli.mjs          ← CLI 진입점 (uctm init/update)
│   ├── lib/                 ← CLI 구현 (constants.mjs, init.mjs, update.mjs)
│   ├── .claude-plugin/
│   │   └── plugin.json      ← develop/.claude-plugin/plugin.json에서 동기화
│   ├── README.md            ← README.md에서 동기화 (npmjs.com에 노출)
│   ├── package.json         ← npm 패키지 설정
│   ├── .npmignore
│   └── LICENSE
├── plugin/                  ← Claude Plugin (Marketplace)
│   ├── agents/              ← develop/agents/에서 동기화
│   ├── references/          ← develop/references/에서 동기화
│   ├── skills/              ← Plugin skills
│   │   ├── sdd-pipeline/
│   │   │   └── SKILL.md     ← Skill 매니페스트
│   │   ├── uctm-init/
│   │   │   └── SKILL.md     ← /uctm-init (works/, CLAUDE.md, 권한 설정)
│   │   ├── work-pipeline/
│   │   │   └── SKILL.md
│   │   └── work-status/
│   │       └── SKILL.md
│   └── .claude-plugin/
│       └── plugin.json      ← Plugin 매니페스트 (name, version, agents 배열)
├── .claude/                 ← 로컬 Claude 설정 (커밋하지 않음)
│   └── settings.local.json
├── README.md                ← English (기본, 영문 문서)
├── README_KO.md             ← 한국어 (이 문서)
├── CLAUDE.md                ← 프로젝트 지침 (push 절차, 언어, 에이전트 호출 규칙)
├── LICENSE
├── docs/                    ← 설계 명세
│   ├── spec_pipeline-architecture_v1.3.md  ← 파이프라인 아키텍처 v1.3 (ref-cache, Specifier 기반)
│   ├── spec_sliding-window-context.md      ← 슬라이딩 윈도우 컨텍스트 설계
│   ├── spec_SDD_with_ucagent_requirement.md ← SDD v1.5 요구사항관리 시스템 설계
│   ├── pipeline-architecture-v1.3-visual.html ← 인터랙티브 파이프라인 시각화 (ref-cache 탭 포함)
│   ├── SDD-requirement-visual.html         ← 인터랙티브 SDD 시각화 (ref-cache 탭 포함)
│   ├── sliding-window-context-visual.html  ← 인터랙티브 슬라이딩 윈도우 시각화
│   └── _archive/                           ← 레거시 문서 (Router 기반)
└── works/                   ← WORK 디렉토리 (자동 생성)
    ├── WORK-LIST.md          ← 마스터 인덱스
    ├── WORK-01/              ← 모든 WORK의 산출물
    └── ...
```

---

## 요구 사항

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git 초기화 (`git init`)
- 그 외 의존성 없음.

---

## 선택 사항: MCP 설정

### Serena MCP — 심볼 단위 코드 탐색

[Serena](https://github.com/oraios/serena)를 만들고 오픈소스로 공개해 주신 [Oraios](https://github.com/oraios) 팀에 감사드립니다. 심볼 단위 코드 탐색 도구 덕분에 AI 에이전트의 토큰 사용량을 줄이고 편집 정확도를 높일 수 있었습니다.

**builder** 에이전트는 [Serena MCP](https://github.com/oraios/serena)와 통합되어 심볼 단위 코드 탐색을 수행합니다. Serena를 사용할 수 있으면 builder는 파일 전체를 읽는 대신 아래 탐색 계층을 따릅니다:

| 단계 | 도구 | 용도 |
|------|------|------|
| 1 | `list_dir` | 디렉토리 구조 파악 (`find` 대체) |
| 2 | `get_symbols_overview` | 파일 읽기 전 심볼 맵 확인 |
| 3 | `find_symbol(depth=1)` | 클래스/모듈 메서드 목록 |
| 4 | `find_symbol(include_body=true)` | 수정 대상 심볼만 정밀 읽기 |
| 5 | `find_referencing_symbols` | 편집 전 영향 범위 분석 |
| 6 | `Read` | 위 도구로 불충분할 때만 (최후 수단) |

대형 코드베이스에서 파일 전체 읽기 대신 필요한 심볼만 읽어 읽기 토큰을 30~50% 절감합니다.

#### 브라우저 자동 실행 비활성화

Serena는 매 시작 시 웹 대시보드를 브라우저에서 엽니다. 이를 비활성화하려면 `~/.claude.json`에 `--open-web-dashboard False`를 추가하세요:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--context", "ide-assistant",
        "--project", ".",
        "--open-web-dashboard", "False"
      ]
    }
  }
}
```

대시보드는 `http://localhost:PORT`에서 계속 사용 가능합니다 — 시작 시 자동으로 열리지 않을 뿐입니다.

---

## 더 큰 그림

이 에이전트는 **SDD 기반 요구사항관리 및 자동 개발 시스템**과 연계되어 동작하도록 설계되었습니다 — 요구사항관리 → 자동 개발 → 계획 및 산출물을 연결하는 서버 애플리케이션입니다. 전체 시스템 아키텍처는 [`docs/spec_SDD_with_ucagent_requirement.md`](docs/spec_SDD_with_ucagent_requirement.md)에 문서화되어 있습니다. 이를 참고하여 자신의 필요에 맞는 시스템을 구축하세요.

---

## 라이선스

GPL-3.0
