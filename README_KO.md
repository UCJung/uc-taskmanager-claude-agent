<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-GPLv3-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

**Universal Claude Task Manager** — Claude용 SDD(Specification-Driven Development) WORK-PIPELINE 실행하는 WORK-PIPELINE Agent입니다.
사용자의 요구사항을 명세화하고, 
그 명세 기반으로 업무(WORK) 개발 계획을 수립하고, 
작은 단위의 작업(TASK)으로 분해해서 의존관계(DAG)를 분석하고, 
의존관계에 따라 순차 혹은 병렬로 TASK들을 자동으로 실행한다.

**[English Documentation](README.md)**

---

## 빠른 시작

### 옵션 1: Claude Marketplace Plugin (제출 준비 중)

> Plugin 제출을 준비 중입니다. 출시 후에는 Marketplace에서 직접 설치할 수 있습니다 — npm이나 CLI 설정 불필요.

1. [Claude Marketplace](https://claude.ai/marketplace) (또는 `platform.claude.com/plugins`) 접속
2. **uc-taskmanager** 검색
3. **Install Plugin** 클릭
4. Claude Code를 열면 6개 파이프라인 에이전트가 바로 사용 가능

### 옵션 2: npm CLI

```bash
npm install -g uctm
cd your-project
uctm init --lang ko   # 한국어 에이전트
uctm init --lang en   # English agents
uctm init             # 대화형 언어 선택
```

### 시작하기

설치 완료 후 (두 방법 모두), Claude Code를 실행하고 파이프라인 태그를 사용하세요: []시작하는 지시를 내리면 Agent가 동작합니다.

```
claude
> [추가기능] hello world 기능 추가해줘
```

파일 생성, 셸 명령 등의 권한 질문 없이 실행하려면 바이패스 모드를 사용하세요:

```bash
claude --dangerously-skip-permissions
```

> **주의**: 바이패스 모드는 격리된 환경이거나 파이프라인을 충분히 신뢰할 때만 사용하세요. 자세한 내용은 [Claude Code Permissions](https://code.claude.com/docs/en/permissions)를 참고하세요.

agent들이 요청을 분석하고, 계획을 세우고, 격리된 서브에이전트 파이프라인으로 실행합니다.

---

## 이 파이프라인의 차별점

### 1. 절차데로 잘 수행되고 기록되어야 한다는 관점
* TDD나 DDD처럼 개발을 잘하자의 목적보다는 **개발 절차를 잘 수행하자**는 취지의 Agent이다.
* **요구사항(사용자) → 요구사항명세 → WORK Plan → TASK별 실행계획 → TASK별 실행·검증·종료 → Task별 결과저장**의 단계(WORK PIPELINE)를 체계화해서 수행
* 수행 결과 요구사항부터 개발결과까지 end-to-end 기록을 남김으로써 추적가능성을 부여한다.

**이 Agent로 AI Agent와 함께 일하는 법:**
* 시작 : [] 로 시작하는 프롬프트 지시하면 WORK-PIPELINE가 시작된다
```
[게임개발] 블록깨기 게임을 HTML로 만들어줘
```

* 요구사항분석 : Agent가 요구사항 분석 후 물어본다. `works/WORK-NN/Requirement.md`를 검증하고 **"승인"**을 입력하면 다음 단계를 실행한다.
```
{요구사항명세 내용}
Requirement.md를 승인하시면 Planner를 호출하여 PLAN.md + TASK 분해를 진행하겠습니다. 수정할 부분이 있으면 말씀해주세요.
```

* WORK 실행 Plan 수립 : WORK 실행계획 수립하고 물어본다. `works/WORK-NN/PLAN.md`과 `TASK-NN.md` 검증하고 **"승인"**을 입력하면 다음 단계를 실행한다.
```
WORK-31 개발 승인 요청

  프로젝트 폴더 구조 재구조화 ~~~~~~~ / ########

  ┌─────────┬─────────────────────────┐
  │  항목   │          내용           │
  ├─────────┼─────────────────────────┤
  │ Mode    │ full                    │
  ├─────────┼─────────────────────────┤
  │ TASK 수 │ 6개 (TASK-00 ~ TASK-05) │
  └─────────┴─────────────────────────┘

  DAG 구조

  TASK-00 (agents/ en 파일 → en/ 하위 이동)
     ├─→ TASK-01 (~~~~~~~~~~~~) ─→ TASK-03 (#########)
     ├─→ TASK-02 (plugin/ 생성+이동) ─→ TASK-04 (????????)
     └─────────────────────────────────→ TASK-05 ($$$$$$$$$)

  - TASK-01/02 병렬, TASK-03/04 병렬, TASK-05는 최종 통합
  - 승인하시면 scheduler → builder → verifier → committer 파이프라인을 실행합니다.

  진행할까요?
```
* TASK별 구현 → 검증 -> 작업종료(Commit) 를 TASK의 개수만큼 자동으로 반복한다.
```
● TASK-05 커밋 완료. PROGRESS.md를 갱신하고 WORK-31을 마무리합니다.
```
* TASK가 종료되면 `works/WORK-NN/TASK-NN_result.md`파일 내용과 실제 테스트를 통해 검증한다.
```
  push, merge 
```

**롤백할때** `WORK-NN rollback`입력. 파일에 WORK commit 키가 저장되어 있어서 해당 WORK에 관련된 변경만 롤백한다.

**단순한 버튼 이름 변경에 두 번 승인하기 귀찮다고?**
```
[WORK start] ~~~~ 버튼 이름을 "----"로 변경해줘 자동으로
```
"자동으로"를 붙이면 승인 과정 없이 모든 과정이 자동 진행된다.

### 2. 토큰 절감

난 가난하다(농담). 그래서 토큰을 아껴야 해서 아주 다양한 토큰 사용 절감 방식을 적용했다.

**(1) Serena MCP로 코드베이스 분석.** 
이 Agent는 코드베이스 탐색 시 [Serena MCP](https://github.com/oraios/serena)를 우선 적용하게 지침을 내려놨다. 
파일 전체를 읽는 대신 심볼 단위로 읽는다. (Serena 개발 팀 여러분 너무너무 감사합니다.)

**(2) 세 가지 실행 모드로 서브에이전트 오버헤드 최소화.** WORK-PIPELINE은 총 6단계의 Agent가 순차적으로 동작한다. TASK 하나짜리 WORK에 6개의 Sub Agent를 실행시키면? 매번 초기 로딩에 토큰이 사용된다. 아깝다. 그래서 요구사항을 명세화하는 Agent가 복잡도에 따라 실행 방법을 결정한다. **direct** 모드는 specifier → builder → committer의 최소 3단계만 실행 — 중간 단계(planner, scheduler, verifier) 생략. 자세한 사항은 [세 가지 실행 모드](#개념-세-가지-실행-모드-execution-mode) 참고.

**(3) 구조화된 XML 통신.** Sub agent는 nest하게 sub agent를 실행시킬 수 없다. 그래서 모든 절차를 지휘하는 것은 Main Claude다. 
* Agent 실행이 종료되고 다음 Agent를 실행시킬 때 Main Claude가 중간에 끼게 되어 데이터 통신을 두 번 하게 된다. 이 통신이 텍스트 덩어리다 — 
* 수신받은 쪽에서 또 해석해야 한다. 그래서 통신 규격을 XML로 정형화했다. 
* 조금이라도 아껴보자는 취지다. 
* (이거 덕분에 Agent 로그 모니터링이 편해지기는 했다.) 자세한 사항은 [구조화된 에이전트 통신](#구조화된-에이전트-통신) 참고.

**(4) Sliding Window Context Transfer.** A가 작업이 끝났다 → B에게 자기가 한 일을 알려준다. B가 작업이 끝났다 → C에게 A의 정보와 자신의 정보를 알려준다. C가 작업을 시작한다. 그런데 C는 B가 준 정보를 모두 알아야 하는 건 맞는데, A가 한 일까지 다 알 필요가 있을까? 그래서 B는 C에게 자신이 한 일은 전부 전해주고, A가 한 일은 요약해서 전달한다. **한 다리 건너면 남이다** — 이름하고 간단한 연락처만 알면 되지 성격이 어떻고 이런 걸 알 필요는 없다. 궁금하면 연락해보면 되니까. 대략 20~30% 토큰이 절감된다. 자세한 사항은 [슬라이딩 윈도우 컨텍스트 전달](#슬라이딩-윈도우-컨텍스트-전달) 참고.

**agent 안 쓰고 직접 다 하게 하면 되지 않냐고?** [컨텍스트 격리](#컨텍스트-격리) 섹션을 봐라. 하나의 CLI를 계속 쓰다 보면 갑자기 AI Agent가 낯설게 느껴질 때가 있다 — 기억력을 상실한 것처럼. 이걸 방지하기 위해서 철저하게 Context Isolation을 적용했다. 결과물의 품질과 직결된다.

### 3. 의존성 기반 병렬 실행

WORK의 TASK 간에 의존성을 관리한다. 병렬 실행도 의존관계에 따라 서로 상관이 없을 때만 실행한다. 다시 말하면 — 병렬 실행해도 같은 소스를 수정해서 충돌날 문제가 없다는 뜻이다.

이 Work-Pipeline과 연계된 **요구사항관리 시스템**도 만들었다. 거기서는 프로젝트별로 요구사항을 관리한다. 자기 전에 요구사항들을 실행 대기로 놓고 자면 아침에 일어나면 모든 요구사항이 개발되어 있어서 그걸 검토해야 하는 할 일이 늘어나기는 한다. 즉 프로젝트 단위로 WORK도 병렬 실행된다 — 프로젝트 간에 의존성이 있을 리가 없으니까.

### 앞으로의 계획

지금 설계하고 있는 건 **RAG를 사용해서 축적된 산출물들을 저장**하고, 요구사항 분석할 때 유사 요구사항을 조회해서 보다 빠르고 정확한 요구사항 분석을 시켜보는 거다. (그러다가 데이터가 쌓이면 별도 LLM 파인튜닝해서 MCP를 만들지 누가 알겠냐?)

> **참고**: AI Agent에게 지침을 내리는 건 SQL 쿼리에서 WHERE 조건의 순서라고 생각해라 (개발자들만). 제일 첫 번째 WHERE 조건에서 데이터 범위를 좁혀야 한다는 것, 그리고 그게 Index가 걸려있다면 베스트. 그래서 난 용어와 소스코드 진입점이 기록된 용어집을 만들어 놓고 AI Agent가 그걸 참조하도록 하고 있다. 나의 토큰은 소중하니까.

---

어떤 프로젝트에서든, 어떤 언어에서든 동작하는 6개의 서브에이전트가 **실행 모드 판정 → 작업 분해 → 의존성 관리 → 코드 구현 → 검증 → 커밋**을 자동으로 처리합니다.

```
"[추가기능] 사용자 인증 기능을 만들어줘"
→ specifier가 WORK 판단, planner가 WORK-01 + TASK 5개 생성, 파이프라인 실행
```

---

## 사용법

### 초단순 수정 (direct 모드)

```
> [버그수정] 로그인 에러 메시지 오타 수정
```

Main Claude가 specifier를 호출하면 `execution-mode: direct`를 판정하고 dispatch XML을 반환합니다. Main Claude가 builder(구현)와 committer(커밋)를 순차 호출. WORK-NN 디렉토리 + PLAN + result.md + commit 자동 생성.

### 간단한 작업 (pipeline 모드)

```
> [버그수정] 모바일에서 로그인 버튼이 반응하지 않는 문제 수정
```

Main Claude가 specifier를 호출하면 `execution-mode: pipeline`을 판정하고 PLAN을 생성. 이후 Main Claude가 builder → verifier → committer를 순차 호출.

### 복잡한 기능 (WORK)

#### 1. WORK 생성 (계획)

```
> [추가기능] 사용자 인증 기능을 만들거야. 계획 세워줘.
```

planner가 프로젝트를 분석하고 WORK-01을 생성합니다:

```
WORK-01: 사용자 인증 기능

  WORK-01: TASK-00 프로젝트 초기화           ← 선행 없음
  WORK-01: TASK-01 DB 스키마 설계            ← TASK-00
  WORK-01: TASK-02 JWT 인증 API             ← TASK-01
  WORK-01: TASK-03 사용자 CRUD              ← TASK-02
  WORK-01: TASK-04 테스트 + 문서화           ← TASK-03

  이 계획을 승인하시겠습니까?
```

#### 2. WORK 실행

```
> WORK-01 파이프라인 실행해줘
```

scheduler가 의존성 순서대로 TASK를 실행합니다.

#### 3. 기존 WORK에 추가

WORK-01이 IN_PROGRESS이면 specifier가 질문합니다:
> "WORK-01 (사용자 인증 기능)이 진행 중입니다. 추가 TASK로 진행할까요, 새 WORK를 생성할까요?"

#### 4. 전체 현황 확인

```
> WORK 목록
```

```
WORK 현황
   WORK-01: 사용자 인증 기능    ✅ 5/5 완료
   WORK-02: 결제 기능 추가      🔄 2/4 진행 중
   WORK-03: 관리자 대시보드     ⬜ 0/6 대기
```

#### 5. 자동 모드 / 재개

```
> WORK-02 자동으로 실행해줘
> WORK-02 재개해줘
```

#### 6. 특정 TASK만 실행

WORK 내 특정 TASK를 지정하여 실행 (실패 후 재시도 등):

```
> WORK-02-TASK-02 실행해줘
```

scheduler가 다음 TASK를 반환하면 Main Claude가 builder → verifier → committer를 순차 호출합니다.

#### 7. WORK 강제 생성 (복잡도 검사 스킵)

`[WORK 시작]` 태그를 사용하면 복잡도 판단 없이 항상 새 WORK를 생성합니다:

```
> [WORK 시작] 인증 모듈 리팩토링
```

#### 8. 실패 처리 / 재시도

파이프라인 도중 TASK가 실패하면 scheduler가 최대 3회 자동 재시도합니다.
그래도 실패하면 result 파일을 확인한 후 수동으로 재시도할 수 있습니다:

```
> WORK-02-TASK-01 실패했어. 다시 실행해줘.
```

또는 문제를 수정한 후 재실행:

```
> src/auth.ts 문제 수정하고, WORK-02-TASK-01 다시 실행해줘
```

#### 9. 진행 중인 WORK에 TASK 추가

```
> [기능개선] 인증 API에 rate limiting 추가해줘
```

WORK-02가 `IN_PROGRESS`이면 specifier가 질문합니다:
> "WORK-02 (인증 모듈)이 진행 중입니다. 추가 TASK로 진행할까요, 새 WORK를 생성할까요?"

#### 10. 개별 TASK 상태 확인

```
> WORK-02 진행 현황 보여줘
> WORK-03-TASK-02 상태가 어떻게 돼?
```

scheduler가 `PROGRESS.md`와 `result.md` 파일을 읽어 현재 상태를 보고합니다.

---

## `[]` 태그 시스템

요청에 `[]` 태그를 붙이면 파이프라인이 트리거됩니다:

| 태그 | 의미 |
|------|------|
| `[추가기능]` | 새 기능 추가 |
| `[기능개선]` | 기존 기능 개선 |
| `[오류수정]` / `[버그수정]` | 버그 수정 |
| `[WORK 시작]` | 항상 새 WORK 생성 (복잡도 판단 생략) |

`[]` 태그 없음 = 파이프라인 없이 직접 처리.

---

## 설치

### Claude Marketplace Plugin (제출 준비 중)

출시 후에는 터미널 없이 Claude Marketplace에서 직접 설치:

1. [Claude Marketplace](https://claude.ai/marketplace) (또는 `platform.claude.com/plugins`) 접속
2. **uc-taskmanager** 검색
3. **Install Plugin** 클릭
4. Claude Code가 plugin의 `agents/` 디렉토리에서 에이전트를 자동으로 인식

Marketplace Plugin은 **영어 에이전트만 포함**합니다 (6개 핵심 에이전트 + 6개 참조 문서).

> **Marketplace Plugin vs npm CLI**: Plugin은 설치 단계 없이 항상 최신 상태를 유지합니다. npm CLI는 한국어 에이전트(`--lang ko`)와 `CLAUDE.md`를 통한 프로젝트별 커스터마이징을 지원합니다.

### npm CLI (전체 언어 지원 + 커스터마이징)

```bash
npm install -g uctm

# 프로젝트별 설치 (에이전트 + 설정 복사 + CLAUDE.md 업데이트)
cd your-project
uctm init --lang ko          # 한국어 에이전트
uctm init --lang en          # English agents
uctm init                    # 대화형 언어 선택

# 전역 설치 (~/.claude/agents/에 복사)
uctm init --global --lang ko

# uctm 업그레이드 후 에이전트 파일 갱신 (--lang 필수)
uctm update --lang ko
```

### 수동 설치

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git /tmp/uc-tm
mkdir -p .claude/agents
cp /tmp/uc-tm/agents/ko/*.md .claude/agents/   # 또는 agents/en/ (영어)
rm -rf /tmp/uc-tm
git add .claude/agents/ && git commit -m "chore: add uc-taskmanager agents"
```

### 로컬 Plugin 테스트

```bash
# Marketplace 제출 전 로컬에서 Plugin 테스트
claude --plugin-dir ./
```

### 설치 확인

```bash
claude
> /agents
# specifier, planner, scheduler, builder, verifier, committer → 6개 확인
```

---

## 개념: 세 가지 실행 모드 (execution-mode)

Main Claude가 `[]` 태그를 감지하면 **specifier** 서브에이전트를 호출하여 `execution-mode`를 판정합니다:

```
사용자 요청 → Main Claude (오케스트레이터)
                    │
                    ▼
              ┌───────────┐
              │ specifier │ (Main Claude가 호출)
              └─────┬─────┘
                    │
              execution-mode 판정
                    │
      ├─ direct  (빌드/테스트 검증 불필요)
      │   → specifier가 dispatch XML 반환 → Main Claude가 builder → committer 순차 호출
      │
      ├─ pipeline  (빌드/테스트 필요, 단일 도메인, 순차 처리)
      │   → Main Claude가 순차 호출: builder → verifier → committer
      │
      └─ full  (멀티 도메인 / 복잡 DAG / 신규 모듈 / 5+ TASK)
          → Main Claude가 순차 호출: planner → scheduler → [builder → verifier → committer] × N
```

3가지 모드 모두 `works/WORK-NN/`에 동일한 산출물 구조(PLAN.md + result.md + COMMITTER DONE 콜백)를 생성합니다.

### WORK (다중 작업, full 모드)

복잡한 기능을 위한 2단계 계층 구조:

```
WORK (일)                 하나의 목표. 사용자가 요청한 단위.
└── TASK (작업)           WORK를 달성하기 위한 개별 실행 단위.
    └── result            완료 증빙. 검증 통과 후 자동 생성.
```

### pipeline 모드 (단일 작업, 위임)

중간 규모 단일 작업을 Main Claude가 순차 호출로 처리. Main Claude는 오케스트레이터 역할만 하므로 컨텍스트 사용을 최소화합니다.

```
Main Claude → builder(sonnet) → verifier(haiku) → committer(haiku)
              (각각 Main Claude가 개별 호출)
```

### direct 모드 (초단순)

Main Claude가 specifier를 호출하면 dispatch XML을 반환합니다. Main Claude가 builder(구현)와 committer(커밋)를 순차 호출합니다.

```
Main Claude → specifier: 분석 → dispatch XML 반환 → [Main Claude로 복귀]
Main Claude → builder: 구현 → self-check → [Main Claude로 복귀]
Main Claude → committer: 커밋 → result.md
```

---

## 파이프라인

### WORK 파이프라인 (복잡한 작업)

> 서브에이전트는 중첩 호출 불가 — Main Claude(CLI 터미널)가 모든 호출을 중개합니다.

```
                          Main Claude (오케스트레이터)
                    ┌──────────┼──────────────────────┐
                    │          │                       │
  specifier        planner          scheduler         builder          verifier         committer
 ┌──────────┐    ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │실행 모드  │────▶│WORK 생성 │────▶│의존성 DAG │────▶│코드 구현  │────▶│빌드/테스트│────▶│결과보고서 │
 │판정      │     │TASK 분해 │     │실행 순서  │     │파일 생성  │     │검증 실행  │     │→ git커밋 │
 └──────────┘    └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                                                        │                │                │
                                                        └── 실패 시 재시도 ┘                │
                                                           (최대 3회)                      │
                                                                           다음 TASK로 반복 ◀┘
```

### pipeline 모드 (단순 → 위임)

```
  specifier         builder          verifier         committer
 ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │PLAN      │────▶│코드 구현  │────▶│빌드/테스트│────▶│결과보고서 │
 │+TASK생성 │     │파일 생성  │     │검증 실행  │     │→ git커밋 │
 └──────────┘     └──────────┘     └──────────┘     └──────────┘
  (컨텍스트 유지)   (sonnet)         (haiku)           (haiku)
               ← 각각 Main Claude가 개별 호출 →
```

### direct 모드 (초단순)

```
  specifier        builder                                 committer
 ┌──────────┐     ┌──────────────────────────────┐        ┌──────────┐
 │ 분석     │────▶│ 구현 → self-check             │───────▶│커밋      │
 │ dispatch │     └──────────────────────────────┘        │→ result  │
 └──────────┘      (빌드/테스트 불필요)                    └──────────┘
```

### 에이전트

| 에이전트 | 역할 | 모델 | 권한 | MCP |
|----------|------|------|------|-----|
| **specifier** | `[]` 태그 감지, execution-mode 판정(direct/pipeline/full), PLAN 생성, WORK-LIST 관리, dispatch XML 반환 | **opus** | read + dispatch | Serena(direct 코드수정), sequential-thinking(복잡도판정) |
| **planner** | WORK 생성 + TASK 분해 + PLAN.md(Execution-Mode:full) + progress 템플릿 선생성 | **opus** | read-only | Serena(코드베이스탐색), sequential-thinking(TASK분해) |
| **scheduler** | 특정 WORK의 DAG 관리 + [B→V→C]×N 파이프라인 실행 | **haiku** | read + dispatch | — |
| **builder** | 코드 구현 + progress.md 체크포인트 기록 | **sonnet** | full access | Serena(심볼단위탐색/편집) |
| **verifier** | progress gate 검사 → 빌드/린트/테스트 검증 (읽기 전용) | **haiku** | read + execute | — |
| **committer** | gate 검사 → result.md 생성 → git commit → COMMITTER DONE 콜백 | **haiku** | read + write + git | — |

### 참조 문서 (Plugin에 포함)

6개 파이프라인 에이전트 외에도 plugin은 에이전트가 시작 시 참조하는 6개 참조 문서를 포함합니다.
이 파일들은 `plugin/skills/sdd-pipeline/references/`에 위치합니다 (`agents/en/`에서 동기화):

| 파일 | 용도 |
|------|------|
| `agent-flow.md` | 파이프라인 오케스트레이션 규칙 — Main Claude가 각 에이전트를 순차 호출하는 방식 |
| `file-content-schema.md` | 모든 파일 포맷(PLAN.md, TASK.md, progress.md, result.md)의 단일 정보원 |
| `shared-prompt-sections.md` | cache_control이 적용된 공통 프롬프트 섹션 — 반복 토큰 비용을 최대 90% 절감 |
| `context-policy.md` | 에이전트 간 슬라이딩 윈도우 컨텍스트 전달 규칙 |
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
│   ├── TASK-00.md                    ← 작업 명세
│   ├── TASK-00_progress.md           ← 실시간 체크포인트 (builder 기록)
│   ├── TASK-00_result.md             ← 완료 보고서 (committer 생성)
│   ├── TASK-01.md
│   └── ...
└── WORK-02/
    └── ...                           ← direct/pipeline/full 모두 여기에 출력
```

### 파일 명명 규칙

| 파일 | 명명 규칙 |
|------|-----------|
| 작업 명세 | `TASK-NN.md` (prefix 없음) |
| 진행 체크포인트 | `TASK-NN_progress.md` (언더스코어 구분자) |
| 완료 보고서 | `TASK-NN_result.md` |
| 계획 | `PLAN.md` |
| WORK 진행 상황 | `PROGRESS.md` |

### WORK-LIST.md

specifier가 `works/WORK-LIST.md`를 마스터 인덱스로 관리합니다:

| WORK ID | Title | Status | Created |
|---------|-------|--------|---------|
| WORK-01 | 사용자 인증 기능 | DONE | 2026-03-01 | 2026-03-01 |
| WORK-02 | 결제 기능 추가 | IN_PROGRESS | 2026-03-05 | |

| 상태 | 의미 |
|------|------|
| `IN_PROGRESS` | WORK 생성됨, TASK 진행 중 |
| `DONE` | 모든 TASK 커밋 완료 — committer가 마지막 TASK 완료 시 자동 변경 |
| `COMPLETED` | `_COMPLETED/`로 아카이브 — push 절차에서 일괄 처리 |

- **IN_PROGRESS**: 새 WORK 생성 전 specifier가 확인
- **DONE**: 마지막 TASK 완료 시 committer가 IN_PROGRESS → DONE으로 자동 변경
- **COMPLETED**: push 시 DONE 상태 WORK를 일괄 처리 — WORK-LIST에서 행 제거 + `works/_COMPLETED/`로 이동

#### git push 절차

Claude에게 push를 요청하면 (`"push 해줘"`, `"git push"`), Claude가 아래 순서를 자동으로 처리합니다:

```
1. 에이전트 동기화 — agents/ 원본을 npm/agents/, plugin/agents/로 복사
2. DONE WORK 일괄 완료 처리 — DONE 행 제거 + _COMPLETED/ 이동
3. README.md 확인 — 변경 내용이 반영되어 있는지 확인, 누락 시 업데이트
4. git push
```

> **DONE은 committer가 자동 설정** — 마지막 TASK 완료 시점. **COMPLETED는 push 시점**에 DONE WORK를 `_COMPLETED/`로 아카이브합니다.

---

## 팁

### CLAUDE.md를 최신 상태로 유지

언어 설정과 프로젝트 컨텍스트는 `CLAUDE.md`에 저장됩니다. 에이전트가 매 실행 시 이 파일을 읽으므로 최신 상태를 유지하면 불필요한 질문이 줄어듭니다.

### `[]` 태그 일관되게 사용

`[]` 태그 없는 요청은 라우팅 없이 Claude가 직접 처리합니다. 파이프라인을 보장하려면 항상 태그를 붙이세요.

### 병렬 TASK

planner는 의존성 그래프를 기반으로 TASK를 생성합니다. 동일한 선행 조건을 가진 독립 TASK는 scheduler가 동시에 실행할 수 있습니다 — 승인 시 명시하세요:

```
> 승인. 독립 TASK는 병렬로 실행해줘.
```

### 컨텍스트 초기화 후 재개

파이프라인 도중 Claude가 컨텍스트를 잃어도 언제든 재개할 수 있습니다:

```
> WORK-02 멈춘 곳부터 재개해줘
```

scheduler가 `PROGRESS.md`를 읽어 마지막으로 완료된 TASK를 파악하고 이어서 실행합니다.

---

## 예제 세션

```
User: [추가기능] 블로그 시스템의 댓글 기능을 만들거야.

Claude: [specifier → WORK 경로]
  복잡도: 4+ 파일, DB 스키마 변경, 다중 모듈
  → 새 WORK 생성

Claude: [planner]
  프로젝트 분석
     Tech Stack: Next.js + Prisma + PostgreSQL
     기존 코드: 게시글 CRUD 완료, 인증 완료

  WORK-03: 댓글 기능

  WORK-03: TASK-00 Comment 모델 + 마이그레이션        ← 선행 없음
  WORK-03: TASK-01 댓글 CRUD API                     ← TASK-00
  WORK-03: TASK-02 대댓글 (self-relation)             ← TASK-01
  WORK-03: TASK-03 프론트엔드 댓글 컴포넌트            ← TASK-00 (병렬 가능)
  WORK-03: TASK-04 통합 + 알림                        ← TASK-02, TASK-03

  승인하시겠습니까?

User: 승인. 자동으로 진행해줘.

Claude: [scheduler → 자동 모드]
  WORK-03-TASK-00 → builder → verifier ✅ → committer [a1b2c3d]
  WORK-03-TASK-01 → builder → verifier ✅ → committer [d4e5f6g]
  WORK-03-TASK-02 → builder → verifier ✅ → committer [h7i8j9k]
  WORK-03-TASK-03 → builder → verifier ✅ → committer [l0m1n2o]
  WORK-03-TASK-04 → builder → verifier ✅ → committer [p3q4r5s]

  🎉 WORK-03 완료! 5 tasks, 5 commits
```

---

## 왜 이 방식인가?

### 에이전트 파일 설계

모든 에이전트 파일(`agents/*.md`)은 하나의 원칙으로 작성됩니다: **핵심 내용만, 장식 없이**. 설명, 강조 마커, 중복 예시를 제거한 결과 전체 에이전트 합산 약 1,600줄로 — 원래 크기의 절반 이하 — 동일한 기능 범위를 커버합니다.

각 에이전트 파일은 일관된 4섹션 구조를 따릅니다:

```
## 1. 역할
   에이전트의 목적과 책임을 선언합니다.
   에이전트가 무엇이며 무엇을 담당하는지 한 단락으로 기술합니다.

## 2. 수행업무
   담당 업무를 플랫 테이블로 나열합니다.
   | 업무 | 설명 |

## 3. 업무수행단계 및 내용
   § 2에 나열된 각 업무의 단계별 상세 절차.
   시작 시 반드시 읽어야 할 파일을 명시한 STARTUP 블록으로 시작합니다.
   파일 포맷은 file-content-schema.md를 참조합니다 (단일 정보원).
   에이전트 간 통신은 xml-schema.md를 참조합니다.

## 4. 제약사항 및 금지사항
   에이전트가 반드시 준수해야 할 불변 규칙.
   금지/제약 사항을 플랫 목록으로 기술합니다.
```

`file-content-schema.md`는 모든 파일 포맷(PLAN.md, TASK.md, progress.md, result.md)의 단일 권위 정의입니다. 에이전트가 포맷 스펙을 직접 내장하는 대신 이 파일을 참조하여 6개 에이전트 파일 간 중복을 제거합니다.

### WORK ID 할당 전략

WORK ID는 **파일시스템 우선 원칙**을 따릅니다:

1. **파일시스템 소스**: planner가 `works/` 디렉토리를 스캔하여 기존 WORK 디렉토리를 찾고, 가장 최신 디렉토리를 기반으로 다음 WORK ID를 결정합니다.
2. **MEMORY.md 미참조**: 프로젝트 메모리(MEMORY.md)는 WORK 번호 결정에 절대 참조되지 않습니다. 오직 파일시스템만이 유일한 정보원입니다.
3. **일관성 검증**: specifier는 planner 전에 파일시스템과 WORK-LIST.md를 모두 확인하여 WORK ID 일관성을 검증합니다.

이를 통해:
- MEMORY.md가 오래되거나 손상되어도 WORK ID 중복 할당 방지
- 세션 간 신뢰성 있는 재개 보장
- 명확한 추적성: WORK-NN은 직접 `works/WORK-NN/` 폴더에 대응

### 컨텍스트 격리

각 서브에이전트는 독립 컨텍스트에서 실행됩니다. builder가 50개 파일을 생성하며 20,000 토큰을 썼어도, scheduler에게 돌아오는 건 3줄 요약뿐입니다.

```
scheduler's context after 5 TASKs:

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

### Specifier 판정 기준 config (`.agent/router_rule_config.json`)

specifier는 프로젝트 루트의 `.agent/router_rule_config.json`을 읽어 실행 모드 판정 기준을 결정합니다. 파일이 없으면 specifier의 내장 기본값을 사용합니다.

**파일 위치:**
```
{프로젝트-루트}/.agent/router_rule_config.json
```

**JSON 구조:**
```json
{
  "$schema": "http://uc-taskmanager.local/schemas/specifier-rules/v1.0.json",
  "version": "1.1.0",
  "description": "Specifier execution-mode 판정 기준 설정. 프로젝트별로 커스터마이즈.",
  "decision_flow": [
    "1. build_test_required 여부 판단 → false이면 direct",
    "2. single_domain + sequential DAG → pipeline",
    "3. full_conditions 중 하나라도 해당 → full"
  ],
  "rules": {
    "direct": {
      "criteria": {
        "build_test_required": false,
        "note": "파일 수·줄 수 무관. 검증 없이 끝나는 작업이면 direct (텍스트 편집, 설정 변경, 단순 치환 등)"
      }
    },
    "pipeline": {
      "criteria": {
        "build_test_required": true,
        "single_domain_only": true,
        "max_tasks": 5,
        "dag_complexity": "sequential"
      }
    },
    "full": {
      "criteria": {
        "any_of": [
          "task_count > 5",
          "dag_complexity == complex (TASK 간 의존성이 2레벨 이상)",
          "multi_domain == true (BE + FE 동시 변경)",
          "new_module == true (신규 모듈/기능 — 설계→구현→검증 다단계)",
          "partial_rollback_needed == true (TASK 실패 시 부분 롤백 필요)"
        ]
      }
    }
  },
  "customization_guide": {
    "문서 중심 프로젝트 (md 편집)": "direct 범위를 넓게. build_test_required=false인 경우 대부분 direct",
    "코드 개발 중심 프로젝트": "pipeline/full 중심. 단순 버그 수정은 pipeline, 멀티도메인은 full",
    "max_tasks 조정": "팀 규모나 컨텍스트 한계에 따라 3~7 사이로 조정 가능"
  }
}
```

**주요 필드 설명:**
| 필드 | 설명 |
|------|------|
| `rules.direct.criteria.build_test_required` | `false` → 서브에이전트 없이 specifier가 겸임으로 직접 처리 |
| `rules.pipeline.criteria.max_tasks` | pipeline에서 full로 에스컬레이션하는 최대 TASK 수 (기본: 5) |
| `rules.pipeline.criteria.dag_complexity` | `sequential`만 허용; complex DAG → full로 에스컬레이션 |
| `rules.full.criteria.any_of` | 조건 목록 — 하나라도 해당하면 full 모드 트리거 |

**Fallback 동작:** `.agent/router_rule_config.json`이 없거나 파싱 오류 시 specifier의 내장 기본값으로 폴백합니다 (위 구조와 동일).

**프로젝트별 커스터마이즈 예시:**

문서 편집 중심 프로젝트 (대부분 텍스트 수정):
```json
{
  "rules": {
    "direct": {
      "criteria": { "build_test_required": false }
    },
    "pipeline": {
      "criteria": { "max_tasks": 3, "single_domain_only": true, "dag_complexity": "sequential" }
    }
  }
}
```

엄격한 빌드 검증이 필요한 모노레포:
```json
{
  "rules": {
    "pipeline": {
      "criteria": { "max_tasks": 7 }
    },
    "full": {
      "criteria": {
        "any_of": ["task_count > 7", "multi_domain == true"]
      }
    }
  }
}
```

### 세 가지 실행 모드

Main Claude가 specifier를 호출하면, specifier가 복잡도에 맞는 `execution-mode`를 판정합니다:
- **direct**: 1줄 오타 수정 — Main Claude가 specifier 호출 → dispatch XML 반환 → builder(구현) + committer(커밋) 순차 호출
- **pipeline**: 중간 규모 수정 — Main Claude가 builder → verifier → committer 순차 호출. Main Claude는 오케스트레이터 역할만 하므로 컨텍스트 사용 최소화
- **full**: 복잡한 기능 — 전체 계획, 분해, 추적

3가지 모드 모두 동일한 산출물 구조(`WORK-NN/` + result.md + 콜백)를 생성하므로 Runner 연동이 모드에 무관하게 동작합니다.

### 구조화된 에이전트 통신

모호한 자연어 프롬프트 대신 구조화된 XML 포맷으로 에이전트 간 통신합니다:

**디스패치 포맷** (호출자 → 수신자):
```xml
<dispatch to="builder" work="WORK-03" task="TASK-00" execution-mode="pipeline">
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
    <file action="created" path="agents/shared-prompt-sections.md">cache_control이 포함된 공통 섹션</file>
  </files-changed>
  <verification>
    <check name="file_existence" status="PASS">두 파일 모두 생성됨</check>
  </verification>
</task-result>
```

**장점**:
- **명확성**: 명시적인 XML 구조가 모호한 자연어를 제거합니다 ("컨텍스트를 전달해줘" ← 혼동 vs `<context>` ← 명확)
- **출력 토큰 감소**: 에이전트가 명확화 질문을 생성하지 않음, 수신자가 XML을 직접 파싱합니다
- **Prompt Caching**: Output Language Rule, Build Commands 같은 공통 섹션을 Anthropic API의 `cache_control`로 마킹하여 **90% 이상 토큰 절감**
- **확장성**: 캐시 히트율이 WORK 개수에 따라 향상 (5 TASK 시 ~0.03 tokens/token vs 캐시 없이 2K+ tokens)

전체 포맷은 `agents/xml-schema.md`를, 캐시 가능한 섹션은 `agents/shared-prompt-sections.md`를 참고하세요.

### 슬라이딩 윈도우 컨텍스트 전달

각 서브에이전트는 빈 컨텍스트에서 시작합니다 — 격리의 비용입니다. **슬라이딩 윈도우** 시스템은 에이전트 간, 의존 TASK 간 컨텍스트 전달 시 토큰 낭비를 최소화합니다.

**규칙**: 멀수록 덜 상세하게:

| 단계 거리 | Detail Level | 내용 |
|----------|-------------|---------|
| 직전 단계 | `FULL` | what + why + caution + incomplete |
| 2단계 전 | `SUMMARY` | what만 (1-3줄) |
| 3단계 이상 | `DROP` | 전달하지 않음 |

각 에이전트는 **context-handoff**를 출력합니다 — 단순 결과 로그가 아닌 구조화된 추론 문서입니다:

```xml
<context-handoff from="builder" detail-level="FULL">
  <what>auth.ts 수정 — JWT 자동 갱신 로직 추가</what>
  <why>기존 코드는 만료 즉시 401 반환. 자동 갱신으로 UX 개선.</why>
  <caution>session.ts의 setSession()과 결합되어 있음. 변경 시 부작용 주의.</caution>
  <incomplete>단위 테스트 미작성. Verifier 확인 필요.</incomplete>
</context-handoff>
```

**예상 토큰 절감**: 3-TASK 의존 체인에서 전체 결과를 전달하는 방식 대비 ~48%.

자세한 설계는 `docs/spec_sliding-window-context.md` 참조.

---

## 산출물 언어

산출물 언어는 **CLAUDE.md**에서 관리됩니다. 최초 설정 이후에는 별도 설정이 필요 없습니다.

```
1. CLAUDE.md에서 "Language: xx" 확인
   ├─ 있음 → 해당 언어 사용
   └─ 없음 ↓

2. 사용자에게 질문: "산출물 언어를 설정하시겠습니까? (예: ko, en, ja)"
   ├─ 사용자가 언어 지정 → CLAUDE.md에 기록 + 해당 언어 사용
   └─ 거부/스킵 ↓

3. 시스템 로케일 자동 감지 → CLAUDE.md에 기본값으로 기록
```

한 번 설정되면 CLAUDE.md에 저장되어 다시 질문하지 않습니다. 우선순위: `PLAN.md > CLAUDE.md > en`

기본적으로 git commit 메시지와 코드 주석을 포함한 **모든 산출물**이 설정된 언어로 작성됩니다:

| 항목 | 기본값 | 오버라이드 |
|------|--------|-----------|
| PLAN.md / TASK 설명 | Language | — |
| result 보고서 | Language | — |
| Git commit 메시지 (제목/본문) | Language | `CommitLanguage: en` |
| 코드 주석 | Language | `CommentLanguage: en` |
| 커밋 타입 접두사 (`feat`, `fix`...) | 항상 English | — |
| 파일명, 경로, 명령어 | 항상 English | — |

### 카테고리별 언어 오버라이드

CLAUDE.md에 추가하여 특정 카테고리만 언어를 변경할 수 있습니다:

```markdown
## Language
ko
CommitLanguage: en
CommentLanguage: en
```

이렇게 하면 계획/보고서는 `ko`로, 커밋과 코드 주석은 `en`으로 작성됩니다 — 오픈소스 프로젝트나 글로벌 팀에 유용합니다.

---

## 커스터마이징

`.claude/agents/`에 동일 이름 파일을 두면 오버라이드됩니다.

| 항목 | 파일 | 섹션 |
|------|------|------|
| 실행 모드 판정 기준 | `specifier.md` | Three-Path Routing |
| 승인 정책 | `scheduler.md` | Phase 1: User Approval |
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
├── agents/                  ← 에이전트 소스 (여기서 편집 — 권위 있는 원본)
│   ├── en/                  ← 영어 에이전트 프롬프트 (12개 파일)
│   │   ├── specifier.md     ← [] 태그 감지 + execution-mode 라우팅
│   │   ├── planner.md       ← WORK 생성 + TASK 분해
│   │   ├── scheduler.md     ← DAG 관리 + 파이프라인 오케스트레이션
│   │   ├── builder.md       ← 코드 구현
│   │   ├── verifier.md      ← 빌드/린트/테스트 검증
│   │   ├── committer.md     ← git commit + result.md
│   │   ├── agent-flow.md    ← 파이프라인 오케스트레이션 규칙
│   │   ├── file-content-schema.md  ← 파일 포맷 정의
│   │   ├── shared-prompt-sections.md  ← 캐시 가능 공통 섹션
│   │   ├── context-policy.md    ← 슬라이딩 윈도우 컨텍스트 규칙
│   │   ├── work-activity-log.md ← Activity log 포맷
│   │   └── xml-schema.md    ← XML 통신 포맷
│   └── ko/                  ← 한국어 에이전트 프롬프트 (12개 파일)
├── npm/                     ← npm 패키지 (uctm으로 배포)
│   ├── agents/              ← agents/en/에서 동기화 (+ ko/ 하위 폴더)
│   │   └── ko/              ← agents/ko/에서 동기화
│   ├── bin/cli.mjs          ← CLI 진입점 (uctm init/update)
│   ├── lib/                 ← CLI 구현 (constants.mjs, init.mjs, update.mjs)
│   ├── .agent/              ← npm에 번들된 기본 라우터 설정
│   │   └── router_rule_config.json
│   ├── package.json         ← npm 패키지 설정
│   ├── .npmignore
│   └── LICENSE
├── plugin/                  ← Claude Marketplace Plugin
│   ├── agents/              ← agents/en/에서 동기화 (6개 핵심 에이전트)
│   ├── skills/              ← Plugin skills (참조 문서)
│   │   ├── sdd-pipeline/
│   │   │   ├── SKILL.md     ← Skill 매니페스트
│   │   │   └── references/  ← agents/en/에서 동기화 (6개 참조 문서)
│   │   ├── work-pipeline/
│   │   │   └── SKILL.md
│   │   └── work-status/
│   │       └── SKILL.md
│   ├── .claude-plugin/
│   │   └── plugin.json      ← Plugin 매니페스트 (name, version, agents 배열)
│   └── README.md
├── .claude/                 ← 로컬 Claude 설정 (커밋하지 않음)
│   └── settings.local.json
├── README.md                ← English (기본, 이 파일)
├── README_KO.md             ← 한국어
├── CLAUDE.md                ← 프로젝트 지침 (push 절차, 언어, 에이전트 호출 규칙)
├── LICENSE
├── docs/                    ← 설계 명세
│   ├── spec_pipeline-architecture.md       ← 파이프라인 구조 및 에이전트 역할
│   ├── spec_pipeline-architecture_v1.2.md  ← 파이프라인 아키텍처 v1.2 (Specifier 기반, 3단계 상태)
│   ├── spec_sliding-window-context.md      ← 슬라이딩 윈도우 컨텍스트 설계
│   ├── spec_callback-integration.md        ← 외부 시스템 콜백 연동 가이드
│   ├── spec_SDD_with_ucagent_requirement.md ← SDD 요구사항관리 시스템 설계
│   ├── pipeline-architecture-visual.html   ← 인터랙티브 파이프라인 시각화
│   └── sliding-window-context-visual.html  ← 인터랙티브 슬라이딩 윈도우 시각화
└── works/                   ← WORK 디렉토리 (자동 생성)
    ├── WORK-LIST.md          ← 마스터 인덱스
    ├── WORK-01/              ← 모든 모드의 산출물 (direct/pipeline/full)
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

**builder** 에이전트는 [Serena MCP](https://github.com/oraios/serena)와 통합되어 심볼 단위 코드 탐색을 수행합니다. Serena 사용 시 파일 전체를 읽는 대신 아래 탐색 계층을 따릅니다:

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
