# UC TeamSpace × UC TaskManager — 통합 시스템 설계 명세서 (SDD)

> Version: 1.6.0
> Date: 2026-03-28
> Author: Claude Code (claude-sonnet-4-6) — v1.0~v1.3 + v1.4 현행화 (claude-opus-4-6) + v1.6 현행화
> Scope: WORK-PIPELINE (uc-taskmanager) + Runner + 요구사항 관리 (uc-teamspace)

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2026-03-11 | 초판 작성 (코드베이스 분석 기반) |
| 1.1.0 | 2026-03-14 | runner.ts 코드 역분석으로 미기재 8건 보강 |
| 1.2.0 | 2026-03-14 | 에이전트 프롬프트 9건 역분석으로 §3 WORK-PIPELINE 대폭 확장 |
| 1.3.0 | 2026-03-14 | execution-mode 속성 설계. Router 3경로 산출물 구조 통일, PLAN.md Execution-Mode 필드 추가, XML dispatch 속성 확장, 에이전트별 모드 반응 규칙 정의. S-TASK 산출물 누락 문제 근본 해결 |
| 1.4.0 | 2026-03-19 | 프로젝트 현행화. 파일 경로 `tasks/multi-tasks/` → `works/`, TASK 파일명 프리픽스 제거(`TASK-XX.md`), 구분자 언더스코어 전환(`TASK-XX_progress.md`), mini-PLAN → PLAN.md 통일, Router 모델 Opus 승격, Planner/Router MCP 도구 추가, execution-mode 판정 기준 `router_rule_config.json` 반영, 에이전트 파일 12개 현행화 |
| 1.5.0 | 2026-03-22 | ref-cache Reference File Caching 서브섹션 추가 (§3.13). Phase 1 체인 전파 + Phase 2 선택 전달, 측정 지표(파일 읽기 64% 감소, 토큰 15% 절감), 파이프라인 스펙 참조 |
| 1.6.0 | 2026-03-28 | spawn 결합 아키텍처 반영 (§3.1, §3.2): specifier+planner 단일 spawn, verifier+committer 단일 spawn. spawn 수 갱신(direct 3, pipeline 3, full 2+2N). 자동 권한 설정(`uctm init` 시 Bash 권한 자동 구성). plugin 리소스(.claude-plugin, skills) npm 패키지 포함(v1.5.0). agent 프롬프트 pipe 명령어 제거(Windows 호환성). |

---

## 목차

- [UC TeamSpace × UC TaskManager — 통합 시스템 설계 명세서 (SDD)](#uc-teamspace--uc-taskmanager--통합-시스템-설계-명세서-sdd)
  - [변경 이력](#변경-이력)
  - [목차](#목차)
  - [1. 시스템 개요](#1-시스템-개요)
  - [2. 아키텍처 전체 구조](#2-아키텍처-전체-구조)
  - [3. UC TaskManager — WORK-PIPELINE (v1.2 대폭 확장)](#3-uc-taskmanager--work-pipeline-v12-대폭-확장)
    - [3.1 에이전트 목록 (v1.2 보강)](#31-에이전트-목록-v12-보강)
    - [3.2 세 가지 실행 경로 — execution-mode 통합 (v1.3 재설계)](#32-세-가지-실행-경로--execution-mode-통합-v13-재설계)
    - [3.5 파일 구조 \& 명명 규칙 (v1.3 보강)](#35-파일-구조--명명-규칙-v13-보강)
    - [3.6 슬라이딩 윈도우 컨텍스트 핸드오프 (v1.2 신규)](#36-슬라이딩-윈도우-컨텍스트-핸드오프-v12-신규)
    - [3.7 progress.md 체크포인트 + Gate 메커니즘 (v1.2 신규)](#37-progressmd-체크포인트--gate-메커니즘-v12-신규)
    - [3.8 3중 재시도 메커니즘 (v1.2 신규)](#38-3중-재시도-메커니즘-v12-신규)
    - [3.9 모델 배치 전략 및 비용 최적화 (v1.2 신규)](#39-모델-배치-전략-및-비용-최적화-v12-신규)
    - [3.10 외부 시스템 콜백 (v1.2 신규)](#310-외부-시스템-콜백-v12-신규)
    - [3.11 파일 I/O 권한 매트릭스 (v1.2 신규)](#311-파일-io-권한-매트릭스-v12-신규)
    - [3.12 에이전트별 execution-mode 반응 규칙 (v1.3 신규)](#312-에이전트별-execution-mode-반응-규칙-v13-신규)
    - [3.13 ref-cache Reference File Caching (v1.5 신규)](#313-ref-cache-reference-file-caching-v15-신규)
  - [4. Runner (scripts/runner.ts)](#4-runner-scriptsrunnerts)
    - [4.1 역할 및 위치](#41-역할-및-위치)
    - [4.2 시작 흐름](#42-시작-흐름)
    - [4.3 스트림 파싱 \& 토큰 수집](#43-스트림-파싱--토큰-수집)
    - [4.4 파이프라인 단계 감지](#44-파이프라인-단계-감지)
    - [4.5 WorkDoc 자동 등록](#45-workdoc-자동-등록)
    - [4.6 완료 보고](#46-완료-보고)
    - [4.7 Git Push 백그라운드 루프 (v1.1 신규)](#47-git-push-백그라운드-루프-v11-신규)
    - [4.8 비정상 종료 복구 (v1.1 신규)](#48-비정상-종료-복구-v11-신규)
    - [4.9 환경변수 격리 (v1.1 신규)](#49-환경변수-격리-v11-신규)
    - [4.10 동시성 모델 (v1.1 신규)](#410-동시성-모델-v11-신규)
  - [5. 백엔드 — Execution 생명주기](#5-백엔드--execution-생명주기)
    - [5.1 DB 스키마 핵심 모델](#51-db-스키마-핵심-모델)
    - [5.2 CliExecution 상태 머신](#52-cliexecution-상태-머신)
    - [5.3 API 엔드포인트 목록](#53-api-엔드포인트-목록)
    - [5.4 Callback 처리 흐름](#54-callback-처리-흐름)
  - [6. 요구사항 관리 시스템](#6-요구사항-관리-시스템)
    - [6.1 Requirement 상태 흐름](#61-requirement-상태-흐름)
    - [6.2 DB 스키마](#62-db-스키마)
    - [6.3 API 엔드포인트 목록](#63-api-엔드포인트-목록)
    - [6.4 의존성 관리](#64-의존성-관리)
  - [7. WorkDoc 자동 등록 흐름](#7-workdoc-자동-등록-흐름)
    - [7.1 개요](#71-개요)
    - [7.2 등록 트리거와 흐름](#72-등록-트리거와-흐름)
    - [7.3 파일명 패턴 (parseTaskFilename)](#73-파일명-패턴-parsetaskfilename)
    - [7.4 멱등성 보장 (v1.1 보강)](#74-멱등성-보장-v11-보강)
    - [7.5 PLAN.md 폴백 파싱 — REQ-050-4 (v1.1 신규)](#75-planmd-폴백-파싱--req-050-4-v11-신규)
    - [7.6 규격 위반 감지 — `validateWorkDirectory()` (v1.1 신규)](#76-규격-위반-감지--validateworkdirectory-v11-신규)
  - [8. 토큰 수집 \& 비용 추적](#8-토큰-수집--비용-추적)
    - [8.1 토큰 타입 4종](#81-토큰-타입-4종)
    - [8.2 수집 구조](#82-수집-구조)
    - [8.3 단계별 집계 (ExecutionTokenUsage)](#83-단계별-집계-executiontokenusage)
  - [9. 통계 \& 피벗 분석 (Analytics)](#9-통계--피벗-분석-analytics)
    - [REQ-047 반영 예정](#req-047-반영-예정)
  - [10. 로그 관리 (LOG\_LEVEL)](#10-로그-관리-log_level)
    - [REQ-048 반영 예정](#req-048-반영-예정)
  - [11. 프론트엔드 화면 연계](#11-프론트엔드-화면-연계)
  - [12. WORK-LIST 상태 관리 규칙 (v1.1 보강)](#12-work-list-상태-관리-규칙-v11-보강)
  - [13. 알려진 제약사항 \& 주의사항](#13-알려진-제약사항--주의사항)
    - [13.1 WORK ID 결정 (FILESYSTEM-FIRST)](#131-work-id-결정-filesystem-first)
    - [13.2 WorkDoc 등록 스킵 조건](#132-workdoc-등록-스킵-조건)
    - [13.3 멱등성 체크 버그 (수정 완료)](#133-멱등성-체크-버그-수정-완료)
    - [13.4 PLANNER DONE 콜백 workId 전달](#134-planner-done-콜백-workid-전달)
    - [13.5 배치 실행 (Batch)](#135-배치-실행-batch)
    - [13.6 타임아웃 처리](#136-타임아웃-처리)
    - [13.7 projectRoot 존재 검증 — REQ-109 (v1.1 신규)](#137-projectroot-존재-검증--req-109-v11-신규)
    - [13.8 환경변수 격리의 부작용 (v1.1 신규)](#138-환경변수-격리의-부작용-v11-신규)
    - [13.9 동시성 제약 (v1.1 신규)](#139-동시성-제약-v11-신규)
    - [13.10 Stage 폴링과 스트림 감지의 경쟁 (v1.1 신규)](#1310-stage-폴링과-스트림-감지의-경쟁-v11-신규)
    - [13.11 execution-mode 후방 호환 (v1.3 신규)](#1311-execution-mode-후방-호환-v13-신규)
    - [13.12 direct 모드의 검증 생략 위험 (v1.3 신규)](#1312-direct-모드의-검증-생략-위험-v13-신규)
    - [13.13 파일명 패턴 후방 호환 (v1.4 신규)](#1313-파일명-패턴-후방-호환-v14-신규)
  - [부록 A. Runner API 엔드포인트 전체 목록 (v1.1 신규)](#부록-a-runner-api-엔드포인트-전체-목록-v11-신규)
  - [부록 B. 시각화 인덱스 (v1.3 신규)](#부록-b-시각화-인덱스-v13-신규)
- 부록 A. Runner API 엔드포인트 전체 목록 (v1.1 신규)
- **부록 B. 시각화 인덱스 (VIS-01 ~ VIS-16) (v1.3 신규)**

---


## 1. 시스템 개요

UC TeamSpace는 팀 협업 및 주간업무 보고 플랫폼이다.
UC TaskManager(uc-taskmanager)는 Claude Code CLI 기반의 범용 태스크 파이프라인 서브에이전트 시스템으로, **요구사항(REQ)을 입력받아 WORK-PIPELINE을 통해 코드를 자동 구현·검증·커밋**한다.

두 시스템은 **Runner(scripts/runner.ts)**를 통해 연결된다:

```
[uc-teamspace 프론트엔드]
         │
         │ HTTP (REST + SSE)
         ▼
[uc-teamspace 백엔드 (NestJS)]
         │
         │ pull-based polling (5초 간격)  ← v1.1 보강: subprocess spawn이 아닌 pull 아키텍처
         ▼
[Runner (scripts/runner.ts)]  — 상주 프로세스(daemon)
         │
         │ subprocess spawn
         ▼
[Claude Code CLI (claude --output-format=stream-json)]
         │
         │ HTTP callback
         ▼
[uc-taskmanager WORK-PIPELINE 에이전트들]
```

---

## 2. 아키텍처 전체 구조

> **시각화 참조: VIS-01 (§2 시스템 아키텍처 3계층 구조)**

```
uc-teamspace/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── cli-execution/      ← Execution 관리 (CRUD, SSE, Callback)
│   │   │   ├── requirement/        ← 요구사항 관리
│   │   │   ├── work-doc/           ← WorkDoc/WorkTask 저장
│   │   │   └── runner/             ← Runner API (로그, 완료, 토큰)
│   │   └── prisma/schema.prisma    ← DB 스키마
│   └── frontend/                   ← React SPA
└── scripts/
    └── runner.ts                   ← 핵심 실행 스크립트

uc-taskmanager/                     ← 별도 레포
├── agents/                         ← 에이전트 정의 (12개 파일)
│   ├── router.md                   ← 요청 라우터 (execution-mode 판정)
│   ├── planner.md                  ← WORK 분해 플래너
│   ├── scheduler.md                ← 파이프라인 오케스트레이터
│   ├── builder.md                  ← 코드 구현 (Serena MCP)
│   ├── verifier.md                 ← 검증 (읽기 전용)
│   ├── committer.md                ← 커밋 & 보고
│   ├── agent-flow.md               ← Main Claude 오케스트레이션 흐름
│   ├── context-policy.md           ← 슬라이딩 윈도우 정책
│   ├── xml-schema.md               ← XML 통신 스키마
│   ├── shared-prompt-sections.md   ← 공유 프롬프트 (캐싱)
│   ├── file-content-schema.md      ← 파일 포맷 스키마 (PLAN.md, TASK, result)
│   └── work-activity-log.md        ← Activity Log 규칙
├── .agent/                         ← 프로젝트별 설정
│   └── router_rule_config.json     ← Router execution-mode 판정 기준
└── works/                          ← 모든 경로의 유일한 산출물 디렉토리
    ├── WORK-LIST.md                ← 전체 WORK 마스터 목록
    └── WORK-NN/
        ├── PLAN.md                 ← Execution-Mode 필드 포함 (v1.3)
        ├── PROGRESS.md
        ├── TASK-XX.md              ← v1.4: 프리픽스 없음
        ├── TASK-XX_progress.md     ← v1.4: 언더스코어 구분자
        └── TASK-XX_result.md       ← v1.4: 언더스코어 구분자
```

---
## 3. UC TaskManager — WORK-PIPELINE (v1.2 대폭 확장)

> v1.0은 에이전트 목록·실행 경로·XML 스키마를 개요 수준으로 기술하였다. v1.2에서는 에이전트 프롬프트 9건을 역분석하여 내부 설계를 SDD 수준으로 보강한다.

### 3.1 에이전트 목록 (v1.2 보강)

| 에이전트 | 모델 | 도구 권한 | 역할 | 쓰기 권한 |
|---------|------|----------|------|-----------|
| **router** | **Opus** | Read, Write, Edit, Bash, Glob, Grep, **Task**, **mcp__serena__***, **mcp__sequential-thinking__*** | 요청 분석, [] 태그 감지, execution-mode 판정, WORK 라우팅 | WORK-LIST.md |
| **planner** | **Opus** | Read, Glob, Grep, Bash, **mcp__serena__***, **mcp__sequential-thinking__*** | WORK 분해, TASK 파일 + progress 템플릿 생성 | works/WORK-NN/ 전체 |
| **scheduler** | Haiku | Read, Write, Edit, Bash, Glob, Grep, **Task** | DAG 관리, 콜백 보고, 오케스트레이션 | PROGRESS.md |
| **builder** | Sonnet | Read, Write, Edit, Bash, Glob, Grep, **mcp__serena__*** | 코드 구현, 빌드/린트 자가검증 | 소스코드 전체 + progress.md |
| **verifier** | Haiku | Read, Bash, Glob, Grep | 7단계 검증 (빌드/린트/테스트/인수조건) | **없음** (읽기 전용) |
| **committer** | Haiku | Read, Write, Edit, Bash, Glob, Grep | result.md 생성, git commit, 커밋 해시 백필 | TASK-result.md, PROGRESS.md, git |

**도구 권한 설계 근거:**
- Router는 Opus 모델로 승격 — execution-mode 판정 시 높은 추론 능력 필요. Serena MCP로 direct 모드에서 심볼 수준 코드 수정, sequential-thinking으로 복잡도 판정
- Planner는 코드를 구현하지 않으므로 Write/Edit 제외. Serena MCP로 코드베이스 탐색, sequential-thinking으로 TASK 분해 추론
- Builder는 Serena MCP(`mcp__serena__*`)로 심볼 수준 정밀 편집. Read 도구는 최후 수단
- Verifier는 읽기 전용 — 코드 수정 시도 자체를 차단하여 검증 독립성 보장
- Router와 Scheduler만 Task 도구(서브에이전트 디스패치)를 보유

**Spawn 결합 구조 (v1.6.0 신규):**

실행 효율을 위해 두 에이전트 쌍이 **단일 spawn**으로 결합 실행된다:

| 결합 쌍 | 실행 방식 | 적용 모드 |
|---------|----------|----------|
| **Specifier + Planner** | 단일 spawn — specifier가 planner 역할까지 수행 (PLAN + TASK 파일 생성) | pipeline, full |
| **Verifier + Committer** | 단일 spawn — verifier 검증 후 동일 spawn 내에서 committer 역할 수행 (result.md + git commit) | direct, pipeline, full |

spawn 결합으로 총 spawn 수가 약 30% 감소한다:
- **direct**: 3 spawns (builder → verifier+committer)
- **pipeline**: 3 spawns (specifier+planner → builder → verifier+committer)
- **full (N TASK)**: 2+2N spawns (specifier+planner + scheduler + [builder + verifier+committer]×N)

에이전트 정의(프롬프트)는 개별 에이전트로 유지된다. spawn 결합은 실행 구조이지 에이전트 정의 변경이 아니다.

### 3.2 세 가지 실행 경로 — execution-mode 통합 (v1.3 재설계)

> **v1.2 대비:** 3경로가 서로 다른 산출물 구조(works/ vs simple-tasks/)를 생성하여 Runner가 S-TASK 결과를 인식하지 못하는 문제가 있었다. v1.3에서는 **모든 경로가 `works/WORK-NN/` 구조를 생성**하되, PLAN.md의 `Execution-Mode` 필드로 실행 방식을 구분한다.

**execution-mode 3종 정의:**

| Mode | 복잡도 기준 | 호출 에이전트 | Planner 호출 | Scheduler 호출 | Verifier 호출 |
|------|------------|-------------|:---:|:---:|:---:|
| `direct` | 빌드/테스트 불필요 (텍스트 수정, 설정 변경 등) | **Router 단독** (서브에이전트 없음) | 생략 | 생략 | 생략 |
| `pipeline` | 빌드/테스트 필요 + 단일 도메인 + sequential DAG | Router → Builder → Verifier → Committer | 생략 | 생략 | 호출 |
| `full` | 멀티도메인 / 복잡 DAG / 신규 모듈 / 5+ TASK | Router → Planner → Scheduler → [B→V→C]×N | 호출 | 호출 | 호출 |

**판정 기준 외부화 (v1.4 — `.agent/router_rule_config.json`):**

Router는 프로젝트 루트의 `.agent/router_rule_config.json`에서 판정 기준을 읽는다. 파일이 없으면 내장 기본값을 사용한다. 핵심 판정 흐름:
1. `build_test_required == false` → `direct`
2. `single_domain + sequential DAG + max_tasks 이하` → `pipeline`
3. `full_conditions 중 하나라도 충족` → `full`

**핵심 설계 원칙 — 분리:**
- **변동 영역 (파이프라인 깊이):** spawn 수로 토큰 절감. direct=3 spawns, pipeline=3 spawns, full=2+2N spawns (v1.6: spawn 결합으로 30% 감소)
- **고정 영역 (산출물 구조):** 모든 경로에서 `works/WORK-NN/` + `PLAN.md` + `TASK-XX_result.md` + `COMMITTER DONE 콜백` 보장

**Router의 PLAN.md 생성 (direct / pipeline 경로):**

direct와 pipeline에서는 Planner를 호출하지 않고 Router(Opus)가 직접 WORK 구조를 생성한다 (v1.4: mini-PLAN은 PLAN.md로 명칭 통일):

```
Router 복잡도 판정 → direct 또는 pipeline
  │
  ▼
1. WORK ID 결정 (기존 파일시스템 스캔 + WORK-LIST 검증)
2. mkdir works/WORK-NN/
3. PLAN.md 생성:
   ```markdown
   # WORK-NN: {사용자 요청 1줄 요약}

   > Created: {date}
   > 요구사항: {REQ-XXX | N/A}
   > Execution-Mode: {direct | pipeline}
   > Project: {프로젝트명}
   > Language: {언어코드}
   > Status: PLANNED
   ```
4. TASK-00.md 생성 (TASK 1개 — 요청 전체가 단일 TASK)
5. TASK-00_progress.md 생성 (PENDING 템플릿)
6. WORK-LIST.md에 IN_PROGRESS 추가
```

**full 경로는 기존과 동일:** Router → Planner(Opus) → Scheduler → [B→V→C]×N. Planner가 PLAN.md에 `> Execution-Mode: full`을 기록한다.

**레거시 폴더 폐지:**

v1.3부터 `tasks/simple-tasks/` 폴더, v1.4부터 `tasks/multi-tasks/` 경로가 `works/`로 변경되었다. 기존 S-TASK-NNNNN ID 체계도 폐지하고, 모든 실행은 WORK-NN ID를 부여받는다. 파일명에서도 WORK-NN 프리픽스가 제거되어 `TASK-XX.md` 형식으로 간소화되었다.

**토큰 비용 비교:**

| 경로 | v1.2 (현행) | v1.3 (개선) | 차이 | 비고 |
|------|-----------|-----------|------|------|
| direct | ~500 tok | ~600 tok | +100 | PLAN.md + TASK 파일 생성 비용 |
| pipeline | ~3,000 tok | ~3,200 tok | +200 | PLAN.md + stage 콜백 대행 비용 |
| full | ~15,000+ tok | ~15,000+ tok | 0 | 변경 없음 |

추가 비용은 PLAN.md 생성의 ~100-200 토큰. Planner(Opus) 호출 비용(~3,000-5,000 토큰)의 1/30 수준이며, DB 등록 누락 + 수동 상태 관리 비용 대비 무시할 수 있다.

### 3.3 WORK 파이프라인 상세 흐름

```
1. 사용자: "[기능추가] 새 기능 요청"
      │
      ▼
2. Router:
   - [] 태그 감지
   - 파일시스템 스캔으로 다음 WORK-NN 결정
   - WORK-LIST.md에 IN_PROGRESS 추가
   - execution-mode 판정:
     - direct: 서브에이전트 없이 Router 단독 수행 (v1.3)
     - pipeline: Builder → Verifier → Committer dispatch (v1.3)
     - full: Planner 디스패치 (기존 동일)
      │
      ▼
3. Planner (full 모드에서만):
   - CLAUDE.md, README, package.json 탐색
   - PLAN.md 작성 (WORK ID, REQ 코드, 언어, 의존성 DAG, Execution-Mode: full)
   - TASK-XX.md 개별 파일 생성
   - TASK-XX_progress.md 템플릿 생성 (v1.2)
   - 사용자 승인 요청
      │
      ▼
4. Scheduler (full 모드에서만, 각 READY TASK에 대해 루프):
   │
   ├─ 4a. Builder 디스패치
   │       - Serena MCP 우선 탐색 → 코드 구현
   │       - 빌드/린트 자가 검증
   │       - progress.md 갱신 (STARTED → IN_PROGRESS → COMPLETED)
   │       - <task-result> XML 반환
   │
   ├─ 4b. Verifier 디스패치 (읽기 전용)
   │       - progress.md Gate 검사 (Step 0) (v1.2)
   │       - 빌드/린트/테스트/인수조건 검증
   │       - FAIL 시 → Builder 재시도 (최대 3회)
   │
   └─ 4c. Committer 디스패치
           - progress.md Gate 검사 (Step 0) (v1.2)
           - TASK-XX_result.md 생성
           - PROGRESS.md 업데이트
           - git add -A && git commit
           - 커밋 해시 백필
           - TaskCallback 전송 (v1.2)
           - 다음 READY TASK 보고
      │
      ▼
5. 모든 TASK 완료 → "WORK-NN 완료!" (WORK-LIST 갱신 안 함)
      │
      ▼
6. 사용자 "push 해줘" 요청 시:
   - WORK-LIST.md IN_PROGRESS → COMPLETED 갱신
   - git push (Runner pollGitPush() 자동 처리, v1.1)
```

### 3.4 에이전트 간 통신 — XML 스키마 (v1.3 보강)

> v1.0은 디스패치/결과 XML 예시만 제시하였다. v1.2에서 전체 구조를 반영하고, v1.3에서 `execution-mode` 속성을 추가하였다.

**4종 XML 요소:**

| 요소 | 방향 | 용도 |
|------|------|------|
| `<dispatch>` | Dispatcher → Receiver | 작업 지시 (context, task-spec, previous-results, cache-hint) |
| `<task-result>` | Receiver → Dispatcher | 작업 결과 보고 (summary, files-changed, verification, context-handoff) |
| `<context-handoff>` | task-result 내부 | 컨텍스트 전달 (what/why/caution/incomplete, detail-level 속성) |
| **`execution-mode`** | **dispatch 속성 (v1.3 신규)** | **에이전트 동작 수준 제어 (direct/pipeline/full)** |

**`<dispatch>` 구조 (v1.3 — execution-mode 속성 추가):**
```xml
<dispatch to="{agent}" work="{WORK_ID}" task="{TASK_ID}"
          execution-mode="{direct|pipeline|full}">
  <context>
    <project>{프로젝트명}</project>
    <language>{언어 코드}</language>
    <plan-file>works/{WORK_ID}/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>{TASK 파일 경로}</file>
    <title>{TASK 제목}</title>
    <action>{implement|verify|commit|plan}</action>
  </task-spec>
  <previous-results>
    <context-handoff from="prev-task" task="{ID}" detail-level="{FULL|SUMMARY}">
      <what>...</what>
    </context-handoff>
  </previous-results>
  <cache-hint sections="output-language-rule,build-commands"/>
</dispatch>
```

**`execution-mode` 속성 규칙:**

| 값 | 설정자 | 의미 | 생략 시 기본값 |
|----|--------|------|--------------|
| `direct` | Router | 최소 파이프라인 (B+C만) | — |
| `pipeline` | Router | 중간 파이프라인 (B+V+C) | — |
| `full` | Planner/Scheduler | 전체 파이프라인 (P+S+B+V+C) | `full` (후방 호환) |

**속성 전파 체인:**
1. Router가 복잡도를 판정하여 mode를 결정
2. PLAN.md의 `> Execution-Mode:` 필드에 기록 (영속 저장)
3. XML dispatch의 `execution-mode` 속성으로 에이전트에 전달
4. 각 에이전트가 mode에 따라 자신의 동작을 간소화 (§3.12 참조)

**`<task-result>` 구조 (변경 없음):**
```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2줄 요약}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{경로}">{설명}</file>
  </files-changed>
  <verification>
    <check name="{check_type}" status="{PASS|FAIL|N/A}">{출력}</check>
  </verification>
  <context-handoff from="{agent}" detail-level="FULL">
    <what>{변경 사항 요약}</what>
    <why>{의사결정 근거}</why>
    <caution>{주의사항}</caution>
    <incomplete>{미완료 사항}</incomplete>
  </context-handoff>
  <notes>{후속 단계 안내}</notes>
</task-result>
```

**Dispatcher → Receiver 매핑 (v1.6 갱신 — spawn 결합 반영):**

| Dispatcher | Receiver | execution-mode | 흐름 | Spawn |
|------------|----------|:--------------:|------|:-----:|
| Main Claude | Builder | `direct` | TASK 구현 | 1 |
| Main Claude | Verifier+Committer | `direct` | 검증+커밋 단일 spawn | 1 |
| Main Claude | Specifier+Planner | `pipeline`만 | PLAN+TASK 생성 단일 spawn | 1 |
| Specifier+Planner | Builder | `pipeline`만 | TASK 1개 구현 | 1 |
| Main Claude | Verifier+Committer | `pipeline`만 | 검증+커밋 단일 spawn | 1 |
| Main Claude | Specifier+Planner | `full`만 | PLAN+TASK 생성 + Scheduler dispatch | 1 |
| Specifier+Planner | Scheduler | `full`만 | 계획된 WORK 실행 위임 | — |
| Scheduler | Builder | `full` (상속) | TASK N개 순차 구현 | N |
| Scheduler | Verifier+Committer | `full` (상속) | TASK N개 순차 검증+커밋 단일 spawn | N |
> **v1.2 대비 변경점:** `Router → Builder (stask="S-TASK-NNNNN")` 경로가 폐지되고, 모든 dispatch에 `work="WORK-NN"` + `execution-mode="{mode}"` 속성이 사용된다.
> **v1.6 대비 변경점:** Verifier와 Committer가 단일 spawn으로 결합. Specifier와 Planner도 단일 spawn 결합. 총 spawn 수 30% 감소.

**`<cache-hint>` 토큰 절감 메커니즘:**

`shared-prompt-sections.md`에 6개 공유 섹션이 정의되어 있으며, 각 섹션은 Anthropic API의 `cache_control: { type: "ephemeral" }` 마커로 표시된다.

| 섹션 | 적용 에이전트 | 내용 |
|------|-------------|------|
| output-language-rule | 6개 전체 | 언어 해석 우선순위 (PLAN.md → CLAUDE.md → en) |
| build-commands | builder, verifier | 빌드/린트/테스트 표준 명령 |
| file-path-patterns | 6개 전체 | WORK/TASK 파일 경로 규칙 |
| fs-discovery | router, planner, scheduler | 파일시스템 탐색 bash 스크립트 |
| task-result-xml | builder, verifier, committer | task-result XML 포맷 |
| task-callbacks | builder, committer | 외부 콜백 설정/실행 패턴 |

캐시 히트 시 해당 섹션의 토큰 비용이 90% 절감된다. 5개 이상 TASK가 있는 WORK에서 TASK당 200-500 토큰 절감.

### 3.5 파일 구조 & 명명 규칙 (v1.3 보강)

*(v1.0 기본 구조 유지. 이하 v1.3 추가 사항만 기술.)*

**PLAN.md 필수 메타데이터 (v1.3 — Execution-Mode 필드 추가):**

```markdown
# WORK-85: {WORK 제목}

> Created: {date}
> 요구사항: {REQ-XXX | N/A}
> Execution-Mode: {direct | pipeline | full}     ← v1.3 신규 필수 필드
> Project: {프로젝트명}
> Tech Stack: {스택}
> Language: {언어코드}
> Status: PLANNED
```

**Execution-Mode 필드 규칙:**

| 규칙 | 설명 |
|------|------|
| 필수 여부 | v1.3부터 필수. 생략 시 `full`로 간주 (후방 호환) |
| 설정 주체 | `direct`/`pipeline`: Router가 PLAN.md 생성 시 기록. `full`: Planner가 PLAN.md 생성 시 기록 |
| 변경 가능 | 생성 후 변경하지 않음 (실행 이력 추적용 불변 필드) |
| Runner 파싱 | Runner의 `parsePlanMd()`는 이 필드를 파싱하지 않아도 됨 (Runner에게 투명) |

**v1.3~v1.4에서 폐지되는 구조:**

| 폐지 항목 | 대체 | 시점 |
|-----------|------|------|
| `tasks/simple-tasks/` 디렉토리 | `works/WORK-NN/` (모든 경로) | v1.3 |
| `S-TASK-NNNNN` ID 체계 | `TASK-00` (단일 TASK WORK) | v1.3 |
| `tasks/multi-tasks/` 경로 | `works/` | v1.4 |
| `WORK-NN-TASK-XX.md` 프리픽스 파일명 | `TASK-XX.md` | v1.4 |
| `WORK-NN-TASK-XX-progress.md` 하이픈 구분 | `TASK-XX_progress.md` 언더스코어 구분 | v1.4 |
| `WORK-NN-TASK-XX-result.md` 하이픈 구분 | `TASK-XX_result.md` 언더스코어 구분 | v1.4 |

### 3.6 슬라이딩 윈도우 컨텍스트 핸드오프 (v1.2 신규)

> **SDD v1.0 대비:** 에이전트 간 정보 전달 메커니즘이 전혀 기술되지 않았다. context-policy.md에 정의된 슬라이딩 윈도우 정책은 TASK 수 증가 시에도 토큰 비용을 선형으로 유지하는 핵심 메커니즘이다.

**4-필드 구조:**

모든 에이전트가 task-result에 포함하는 context-handoff는 4개 필드로 구성된다:

| 필드 | 내용 | FULL 길이 | SUMMARY 길이 |
|------|------|-----------|-------------|
| `what` | 구체적 변경/검증 사항 요약 | 2-5줄 | 1-2줄 |
| `why` | 의사결정 근거, 기술적 이유 | 2-4줄 | 생략 |
| `caution` | 다음 에이전트 주의사항, 조건부 완료 | 1-3줄 | 생략 |
| `incomplete` | 미완료/보류 항목 | 1-2줄 | 생략 |

**슬라이딩 윈도우 규칙 — 거리 기반 압축:**

| 단계 거리 | Detail Level | 전달 내용 | 토큰 영향 |
|---------|-------------|-----------|-----------|
| 직전 (1단계) | **FULL** | 4필드 모두 | ~200-400 토큰 |
| 2단계 전 | **SUMMARY** | what만 1-3줄 | ~30-60 토큰 |
| 3단계 이상 | **DROP** | 전달하지 않음 | 0 토큰 |

**파이프라인 내부 적용 (단일 TASK):**

```
Builder → Verifier:   Builder context-handoff = FULL
Builder → Committer:  Builder context-handoff = SUMMARY (2단계 떨어짐)
Verifier → Committer: Verifier context-handoff = FULL (직전)
```

**TASK 간 의존성 적용:**

```
TASK-00 → TASK-01 → TASK-02 → TASK-03

TASK-03 builder 입력:
  TASK-02 context-handoff: FULL   (직전 의존)
  TASK-01 context-handoff: SUMMARY (2단계 전)
  TASK-00 context-handoff: DROP   (3단계 이상)
```

**Committer의 컨텍스트 종합:**

Committer는 result.md 작성 시 두 출처를 종합한다:
- Builder context-handoff (SUMMARY) → result.md "Builder Context" 섹션
- Verifier context-handoff (FULL) → result.md "Verifier Context" 섹션 (4필드 모두)

이 result.md가 다음 TASK의 builder에 FULL/SUMMARY/DROP 규칙으로 전달된다.

### 3.7 progress.md 체크포인트 + Gate 메커니즘 (v1.2 신규)

> **SDD v1.0 대비:** 에이전트 간 상태 검증 메커니즘이 기술되지 않았다.

**progress.md 생명주기:**

```
Planner 생성                    Builder 갱신               Verifier/Committer 검증
   │                              │                              │
   ▼                              ▼                              ▼
TASK-XX_progress.md              Status: STARTED →              Gate 검사:
Status: PENDING                  IN_PROGRESS →                  1. 파일 존재?
(템플릿)                          COMPLETED                      2. Status=COMPLETED?
                                 + Files changed 목록            3. Files changed 비어있지 않음?
```

**Planner의 progress 템플릿 사전 생성 (CRITICAL):**

Planner가 TASK 파일을 생성할 때 반드시 동일 디렉토리에 progress 템플릿도 함께 생성한다:
```markdown
# TASK-XX Progress
- Status: PENDING
- Started: (not started)
- Updated: (not started)
- Files changed:
```

이유: Builder가 progress 파일 생성을 누락하는 사고 방지. 파일이 이미 존재하면 "생성"이 아닌 "갱신"만 하면 된다.

**Builder의 체크포인트 기록:**

| 시점 | Status | 동작 |
|------|--------|------|
| 작업 시작 | STARTED | 타임스탬프 기록 |
| 파일 변경 후 | IN_PROGRESS | Files changed 목록 갱신 |
| 작업 완료 | COMPLETED | 최종 타임스탬프 |

**Gate 검사 (Verifier Step 0 + Committer Step 0):**

| Gate 조건 | 실패 시 동작 |
|-----------|------------|
| progress.md 미존재 | CRITICAL FAIL — Builder가 기록을 누락 |
| Status ≠ COMPLETED | CRITICAL FAIL — Builder 작업 미완료 |
| Files changed 비어있음 | CRITICAL FAIL — 변경 없음 |

Gate 실패 시 Verifier는 이후 검증 단계를 실행하지 않고 즉시 FAIL 반환. Committer도 동일하게 result.md를 생성하지 않고 FAIL 반환.

### 3.8 3중 재시도 메커니즘 (v1.2 신규)

> **SDD v1.0 대비:** "FAIL 시 Builder 재시도 (최대 3회)"만 언급되었다. 실제로는 3개의 서로 다른 재시도 경로가 존재한다.

**Level 1: Verifier FAIL → Builder 재시도**

| 항목 | 내용 |
|------|------|
| 트리거 | Verifier가 빌드/린트/테스트/인수조건에서 FAIL 반환 |
| 동작 | Scheduler가 failure-details를 포함하여 Builder 재디스패치 |
| Builder 행동 | 고장난 부분만 수정 → self-check 재실행 |
| 최대 횟수 | 3회 (초기 + 재시도 2회) |
| 3회 실패 시 | 파이프라인 중단, 사용자에게 보고 |

**Level 2: Committer FAIL → Builder 재디스패치 (progress.md 기반)**

| 항목 | 내용 |
|------|------|
| 트리거 | Committer Gate 검사 실패 (progress.md 미존재/미완료/빈 목록) |
| 동작 | Scheduler가 기존 progress.md를 포함하여 Builder 재디스패치 |
| Builder 행동 | progress.md에서 마지막 체크포인트 읽고 이어서 작업 |
| 최대 횟수 | 총 3회 시도 (2회 추가) |
| 3회 실패 시 | TASK를 FAILED로 마킹, 파이프라인 중단 |

**Level 3: Runner 프로세스 복구 (v1.1에서 기술)**

| 항목 | 내용 |
|------|------|
| 트리거 | Runner 프로세스 비정상 종료 (OOM, 서버 재부팅 등) |
| 동작 | Runner 재시작 시 `recoverRunningExecutions()` 자동 호출 |
| Runner 행동 | resume-claim → PROGRESS.md 기반 재개 프롬프트 생성 → runClaude() |
| 보완 | 백엔드 @Cron 타임아웃 스캐너 (30분 후 ABORTED) |

**3중 방어의 관계:**

```
사용자 요청
   │
   ▼
[Runner Level 3] — 프로세스 장애 복구
   │
   ▼
[Scheduler Level 1/2] — TASK 단위 재시도
   │
   ├─ Verifier FAIL → Builder 코드 수정 재시도
   └─ Committer FAIL → Builder 체크포인트 이어쓰기
```

### 3.9 모델 배치 전략 및 비용 최적화 (v1.2 신규)

> **SDD v1.0 대비:** 에이전트별 모델이 표에 기재되었으나 선택 근거가 없었다.

**모델 배치 원칙:**

| 모델 | 에이전트 | 호출 빈도 | 선택 근거 |
|------|---------|-----------|-----------|
| **Opus** (최고 지능) | Router, Planner | Router: 요청당 1회, Planner: WORK당 1회 | 복잡도 판정·TASK 분해는 최고 추론 능력 필요. Router는 execution-mode 판정 정확도가 전체 파이프라인 효율을 결정 |
| **Sonnet** (균형) | Builder | TASK당 1-3회 | 코드 구현은 정확성과 속도의 균형 필요. Serena MCP 연동으로 심볼 수준 편집 |
| **Haiku** (최저 비용) | Scheduler, Verifier, Committer | TASK당 각 1-3회 | 오케스트레이션·검증·커밋은 규칙 기반 작업. 추론보다 패턴 매칭이 핵심 |

**비용 구조 (TASK 1개 기준 추정):**

```
Router (Opus)       : 1회 × 고비용   ≒ 전체의 ~20% (요청당 1회)
Planner (Opus)      : 1회 × 고비용   ≒ 전체의 ~25% (WORK당 1회 분산)
Builder (Sonnet)    : 1-3회 × 중비용 ≒ 전체의 ~35%
Verifier (Haiku)    : 1-3회 × 저비용 ≒ 전체의 ~8%
Committer (Haiku)   : 1회 × 저비용   ≒ 전체의 ~4%
Scheduler (Haiku)   : N회 × 저비용   ≒ 전체의 ~8%
```

**토큰 절감 전략 (cache_control + 슬라이딩 윈도우):**

| 전략 | 절감 메커니즘 | 절감률 |
|------|-------------|--------|
| `cache_control: ephemeral` | 6개 공유 섹션의 반복 입력 캐시 | 입력 토큰 ~90% (캐시 히트 시) |
| 슬라이딩 윈도우 | 3단계 이상 이전 컨텍스트 DROP | TASK 수 비례 입력 증가 억제 |
| Serena MCP | 파일 전체 읽기 대신 심볼 단위 정밀 읽기 | Builder 입력 토큰 ~50-70% 절감 |
| progress.md 체크포인트 | 재시도 시 중복 작업 방지 | 재시도 출력 토큰 ~30-50% 절감 |

### 3.10 외부 시스템 콜백 (v1.2 신규)

> **SDD v1.0 대비:** §5.4 Callback 처리 흐름은 파이프라인 stage 콜백만 기술. TASK 단위 진행 상황/완료 콜백은 미기재.

**2종 콜백 메커니즘:**

| 콜백 | 호출 에이전트 | 시점 | Payload 핵심 |
|------|-------------|------|-------------|
| **ProgressCallback** | Builder | 파일 변경 후 매 체크포인트 | workId, taskId, status, checklist, currentReasoning |
| **TaskCallback** | Committer | git commit 완료 후 | workId, taskId, status, what/why/caution/incomplete, filesChanged, commitHash |

**설정 (CLAUDE.md):**
```markdown
## Task Callbacks
TaskCallback: http://your-system.com/api/v1/task-result
ProgressCallback: http://your-system.com/api/v1/task-progress
CallbackToken: <bearer-token>
```

**조건부 실행:** URL이 설정되지 않으면 콜백 전송을 건너뛴다. curl 실패 시 경고만 출력하고 파이프라인은 계속 진행한다.

**Stage 콜백과의 관계:**
- Stage 콜백 (§5.4): Scheduler가 BUILDER/VERIFIER/COMMITTER START/DONE 보고 → Runner가 감지 → 백엔드 ExecutionStageLog
- Task 콜백 (§3.10): Builder/Committer가 TASK 진행/완료를 외부 시스템에 직접 보고

두 콜백은 독립적으로 동작한다. Stage 콜백은 파이프라인 레벨, Task 콜백은 비즈니스 레벨 정보를 전달한다.

### 3.11 파일 I/O 권한 매트릭스 (v1.2 신규)

> **SDD v1.0 대비:** 에이전트별 쓰기 권한이 표에 간략히만 기재되었다.

**WORK 디렉토리 내 파일 소유자 (v1.3 — execution-mode별 차이 반영):**

| 파일 | pipeline/full 생성자 | direct 생성자 | 검증자 (읽기) |
|------|:-------------------:|:------------:|--------------|
| `PLAN.md` | Planner (full) / Router (pipeline) | **Router** (PLAN.md) | Scheduler, Builder |
| `PROGRESS.md` | Scheduler | — (direct에서 미사용) | — |
| `TASK-XX.md` | Planner (full) / Router (pipeline) | **Router** | Builder, Verifier |
| `TASK-XX_progress.md` | Planner(템플릿) → Builder(갱신) | **Router** (COMPLETED 즉시) | Verifier/Committer Gate |
| `TASK-XX_result.md` | **Committer** | **Router** (최소 포맷) | Runner, 다음 TASK Builder |
| 소스코드 | Builder | **Router** (직접 수정) | Verifier (읽기 전용) |
| `WORK-LIST.md` | Router | Router | Scheduler (현황) |

**파일명 규칙 (CRITICAL — planner.md에서 강제, v1.4 현행화):**

| 파일 종류 | 올바른 형식 | 잘못된 형식 |
|-----------|------------|------------|
| TASK 계획 | `TASK-01.md` (프리픽스 없음) | `WORK-75-TASK-01.md`, `TASK-01-plan.md` |
| TASK 결과 | `TASK-01_result.md` (언더스코어) | `TASK-01-result.md`, `RESULT.md` |
| progress | `TASK-01_progress.md` (언더스코어) | `TASK-01-progress.md`, `progress.md` |
| PLAN 제목 | `# WORK-80: 제목` | `# WORK-80 PLAN: 제목` (PLAN 키워드 금지) |

> **v1.4 변경:** v1.3까지 `WORK-NN-TASK-XX.md` 형식이었으나, WORK-13부터 프리픽스를 제거하고 구분자를 하이픈에서 언더스코어로 변경하였다. 파일은 이미 `works/WORK-NN/` 디렉토리 안에 있으므로 WORK ID 프리픽스가 불필요하다.

**PLAN.md 임베딩 절대 금지:**

PLAN.md의 `## Tasks` 섹션에 TASK 전체 내용(Files, Acceptance Criteria, Verify 등)을 포함하지 않는다. 요약 링크와 핵심 정보만 포함하고, 상세 내용은 반드시 개별 `TASK-XX.md` 파일에 작성한다.

이유: `collectWorkTasks()`가 파일명 패턴으로 TASK를 인식하므로, TASK 파일이 없으면 WorkDoc/WorkTask DB 등록이 실패한다.

### 3.12 에이전트별 execution-mode 반응 규칙 (v1.3 신규)

> 각 에이전트가 `execution-mode` 속성을 수신했을 때 동작을 어떻게 변경하는지 정의한다. 에이전트는 dispatch의 `execution-mode` 속성으로 자신의 동작 수준을 자율 조절한다.

**Router (mode 결정자 — 속성을 생성하고, direct에서는 전체 실행까지 수행):**

| Mode | Router 동작 |
|------|------------|
| `direct` | WORK dir + PLAN.md + TASK 1개 파일 + progress 템플릿 생성. **서브에이전트 dispatch 없이 Router 자신이 코드 수정 + self-check + result.md 생성 + git commit + 해시 백필 + COMMITTER DONE 콜백까지 직접 수행.** 세션 초기화 비용 0 |
| `pipeline` | WORK dir + PLAN.md + TASK 1개 파일 + progress 템플릿 생성. Builder → Verifier → Committer 순차 dispatch. Stage 콜백 대행 (BUILDER/VERIFIER/COMMITTER START/DONE) |
| `full` | Planner에 dispatch (기존 동일). PLAN.md 생성은 Planner 책임 |

> **direct에서 서브에이전트를 호출하지 않는 이유:** Committer를 Haiku로 dispatch하면 committer.md + xml-schema.md + context-policy.md 로딩만으로 입력 ~12,500 토큰이 소비된다. 1파일 5줄 수정의 result.md 출력은 ~120 토큰이므로, 세션 초기화 비용이 실제 작업의 100배에 달한다. Router 세션은 이미 열려 있으므로 Router가 직접 result.md를 생성하면 추가 세션 비용이 0이다.

**Builder (pipeline/full에서만 서브에이전트로 호출):**

| Mode | Builder 동작 변경 |
|------|------------------|
| `direct` | **호출되지 않음** — Router가 직접 코드 수정 + self-check 수행 |
| `pipeline` | 정상 실행. progress.md 전체 생명주기. context-handoff FULL 4필드. ProgressCallback 다회 호출 |
| `full` | 기존 동일 |

**Verifier (mode에 따라 호출 여부 결정):**

| Mode | Verifier 동작 |
|------|--------------|
| `direct` | 호출되지 않음 — Builder의 self-check(빌드+린트)만으로 검증 완료 간주 |
| `pipeline` | 7단계 검증 전체 실행. context-handoff FULL 4필드 출력 |
| `full` | 기존 동일 |

**Committer (pipeline/full에서만 서브에이전트로 호출):**

| Mode | Committer 동작 변경 |
|------|-------------------|
| `direct` | **호출되지 않음** — Router가 직접 result.md 생성 + git commit + COMMITTER DONE 콜백 수행 |
| `pipeline` | 정상 실행. result.md 전체 포맷 (Builder SUMMARY + Verifier FULL 종합). context-handoff 섹션 포함. **COMMITTER DONE 콜백 전송** |
| `full` | 기존 동일. **COMMITTER DONE 콜백 전송** |

**direct 모드: Router가 직접 생성하는 result.md 최소 포맷:**

```markdown
# WORK-NN-TASK-00 Result

> WORK: WORK-NN — {제목}
> Completed: {YYYY-MM-DD HH:MM}
> Execution-Mode: direct
> Status: **DONE**
> Commit: {hash}

## 요약
{1줄 변경 요약}

## 변경 파일
- `{path/to/file}` — {변경 내용}

## 검증
- Build: PASS (self-check)
- Lint: PASS (self-check)
```

이 최소 포맷이라도 Runner의 `parseTaskFilename()`이 `WORK-NN-TASK-00-result.md`를 인식하고, `collectAndSaveWorkDocs()`가 WorkDoc/WorkTask DB에 등록할 수 있다. Router가 직접 생성하므로 Committer 세션 초기화 비용(~12,500 입력 토큰)이 발생하지 않는다.

**Planner (full에서만 호출):**

| Mode | Planner 동작 |
|------|-------------|
| `direct` / `pipeline` | 호출되지 않음 — Router가 PLAN.md 생성을 대행 |
| `full` | 기존 동일. PLAN.md에 `> Execution-Mode: full` 기록 |

**Scheduler (full에서만 호출):**

| Mode | Scheduler 동작 |
|------|---------------|
| `direct` / `pipeline` | 호출되지 않음 — Router가 직접 dispatch 오케스트레이션 |
| `full` | 기존 동일. DAG 관리 + 콜백 + [B→V→C]×N |

**불변 보장 (모든 mode에서 반드시 수행 — 누가 하느냐만 다름):**

| 불변 항목 | direct에서 수행 주체 | pipeline/full에서 수행 주체 | 이유 |
|-----------|:-------------------:|:-------------------------:|------|
| `works/WORK-NN/` 디렉토리 | Router | Router (direct/pipeline) / Planner (full) | Runner 탐색 대상 |
| `PLAN.md` 파일 존재 | Router (PLAN.md) | Router (mini) / Planner (full) | Runner `parsePlanMd()` |
| `TASK-XX.md` 파일명 패턴 | Router | Router / Planner | Runner `parseTaskFilename()` |
| `TASK-XX_result.md` 생성 | **Router** | **Committer** | Runner WorkTask DB 등록 |
| COMMITTER DONE 콜백 전송 | **Router** | **Committer** | REQ 상태 전이 |
| WORK-LIST.md IN_PROGRESS 추가 | Router | Router | 현황 관리 |

---

### 3.13 ref-cache Reference File Caching (v1.5 신규)

`<ref-cache>`는 에이전트 파이프라인에서 참조 파일(shared-prompt-sections, xml-schema 등) 콘텐츠를 사전 로드하여 전달하는 선택적 XML 요소이다. 반복적인 디스크 읽기를 제거하여 파이프라인 효율을 높인다.

#### Phase 1 — 체인 전파

첫 에이전트(specifier)가 참조 파일을 읽고 task-result에 `<ref-cache>`를 포함하면, Main Claude가 이를 다음 에이전트 dispatch에 그대로 복사한다.

```
specifier (no ref-cache) → reads files → returns with <ref-cache>
  ↓ Main Claude copies <ref-cache>
planner (ref-cache in) → skips file reads → returns with <ref-cache>
  ↓
builder → verifier → committer → ...
```

#### Phase 2 — 선택 전달 (Selective Section Delivery)

Main Claude가 파이프라인 시작 시 참조 파일을 한 번 읽고, 에이전트별로 필요한 섹션만 추출하여 전달한다. 전체 파일 대비 dispatch 토큰 50~70% 절감.

| Agent | shared-prompt-sections | file-content-schema | xml-schema | context-policy | work-activity-log |
|-------|:---:|:---:|:---:|:---:|:---:|
| specifier | §1,§7,§8,§9,§11 | §0,§1,§2,§3 | §1,§3 | — | full |
| planner | §1,§2,§11 | §1,§2,§3 | — | — | full |
| scheduler | §4,§8,§10 | §1,§6 | §1,§3,§4,§5 | full | full |
| builder | §1,§2,§10,§12 | §2,§3 | §1,§2,§4 | Builder section | full |
| verifier | §1,§2,§12 | — | §1,§2,§4 | Verifier section | full |
| committer | §1,§2,§8,§10 | §3,§4,§5,§6,§7 | §1,§2,§4 | Committer+Retry | full |

#### 측정 결과

| 지표 | Before | After | 개선 |
|------|--------|-------|------|
| 파일 읽기 횟수 | 30회/WORK | 11회/WORK | **64% 감소** |
| 프롬프트 토큰 | baseline | -15% | **15% 절감** |

> 상세 구현: `agents/en/agent-flow.md` § ref-cache Chain Propagation
> XML 스키마: `agents/en/xml-schema.md` § 6 ref-cache Element Definition
> 파이프라인 스펙: `docs/spec_pipeline-architecture_v1.3.md` § 16

---

## 4. Runner (scripts/runner.ts)

### 4.1 역할 및 위치

`C:\rnd\uc-teamspace\scripts\runner.ts`

Runner는 **상주 프로세스(daemon)** 로 동작하는 Bun 스크립트다. 백엔드 API를 5초 간격으로 폴링하여 대기 중인 실행을 수신하고, Claude Code CLI를 subprocess로 실행한 뒤 그 출력을 분석하여 백엔드에 실시간 피드백을 제공한다.

> **v1.1 보강:** v1.0에서는 "백엔드에 의해 subprocess로 spawn"이라고 기술하였으나, 실제 코드에서는 Runner가 독립 프로세스로 실행되며 `poll()`/`pollGitPush()` 루프를 통해 백엔드로부터 작업을 가져오는 pull-based 아키텍처다.

**환경변수:**
```env
API_BASE_URL=http://localhost:3000   # 백엔드 API 주소
RUNNER_API_KEY=<secret>              # 인증 키
LOG_LEVEL=INFO                       # DEBUG|INFO|WARN|ERROR
POLL_INTERVAL_MS=5000                # 폴링 주기 (내부 상수)
```

### 4.2 시작 흐름

> **v1.1 보강:** projectRoot 존재 검증 (REQ-109) 및 복구 단계 추가.

```
Runner 프로세스 시작 (bun scripts/runner.ts)
         │
         ▼
초기화:
  - .env 자동 로드 (packages/backend/.env 폴백)
  - RUNNER_API_KEY 검증 (없으면 process.exit(1))
  - LOG_LEVEL 설정
  - SIGTERM/SIGINT 핸들러 등록 (gracefulShutdown)
         │
         ▼
[v1.1] recoverRunningExecutions():     ← §4.8 참조
  - GET /api/v1/runner/running
  - 비정상 종료된 RUNNING execution 복구
         │
         ▼
병렬 루프 2개 시작:
  ┌─ poll() 루프 (5초 간격)            ← 실행 폴링
  │    │
  │    ├─ GET /runner/next → execution 수신
  │    ├─ POST /runner/:id/claim → 점유
  │    ├─ [v1.1] existsSync(projectRoot) 검증  ← REQ-109
  │    │    → 실패 시 즉시 complete(FAILED)
  │    ├─ runClaude() → Claude Code CLI 실행
  │    ├─ DONE → collectAndSaveWorkDocs()
  │    ├─ sendStageTokens() (stage별 4종)
  │    └─ complete(status, tokens)
  │
  └─ pollGitPush() 루프 (5초 간격)     ← §4.7 (v1.1 신규)
       ├─ GET /runner/git-push-next
       ├─ execAsync('git push', {cwd})
       └─ POST /runner/git-push-result
```

### 4.3 스트림 파싱 & 토큰 수집

*(v1.0 내용 유지)*

Claude CLI는 `--output-format=stream-json` 모드로 각 이벤트를 NDJSON 형식으로 출력한다.

**토큰 추출 (`extractTokensFromStreamJsonLine`):**
```
stream-json 이벤트 타입: "assistant"
message.usage 필드:
  - input_tokens              → inputTokens
  - output_tokens             → outputTokens
  - cache_creation_input_tokens → cacheCreationTokens  (REQ-043 추가)
  - cache_read_input_tokens   → cacheReadTokens        (REQ-043 추가)
```

**Windows 인코딩 처리:**
CP949 환경에서 한글이 깨지는 문제를 `decodeChunkWithFallback()`으로 해결.
UTF-8 디코딩 시 replacement char(`\uFFFD`) 감지 → EUC-KR fallback.

### 4.4 파이프라인 단계 감지

> **v1.1 보강:** 이중 감지 전략 — 스트림 파싱 + 백엔드 폴링.

**`extractStageChangeFromStreamJsonLine(line, callbackUrl)`:**

에이전트가 백엔드 콜백 API를 curl로 호출할 때 runner가 stream에서 직접 감지:

```
감지 방법 (우선순위):
1. tool_use (Bash) 의 command 필드에서 curl JSON body 파싱
   예: -d '{"stage": "BUILDER", "event": "START"}'
   + command 필드가 callbackUrl을 포함하는 경우 stage 정규식 추출
2. tool_use (WebFetch/HTTP) 의 url이 /callback 포함 시 body/data/json 필드 파싱
3. assistant 텍스트의 [PIPELINE] BUILDER START 패턴
4. system/tool_result 이벤트의 [PIPELINE] 패턴
5. JSON 파싱 실패 시 원본 라인에서 [PIPELINE] 정규식 직접 매칭 (최종 폴백)
```

**[v1.1 신규] 보조 감지: 백엔드 Stage 폴링 (4초 간격)**

sub-agent(scheduler가 builder/verifier/committer를 dispatch)의 콜백은 outer stream-json에 나타나지 않는 경우가 있다. 이 한계를 보완하기 위해 runner는 runClaude() 실행 중 별도의 async 루프로 백엔드 DB의 `currentStage`를 4초 간격으로 조회한다.

```
(async IIFE — runClaude 내부 백그라운드 루프)
  │
  while (stagePollActive):
  │  await sleep(4_000)
  │  GET /api/v1/runner/:executionId/stage
  │  backendStage !== currentStage → currentStage 갱신
  │
  proc.exited 시 stagePollActive = false → 루프 종료
```

**설계 근거:** 에이전트가 `curl`로 콜백을 보내면 해당 요청은 Claude Code CLI의 tool_use 이벤트로 outer stream에 출력되지만, sub-agent가 Task tool 내부에서 콜백을 보내면 outer stream에 노출되지 않을 수 있다. 이중 감지 전략(stream 우선 + 폴링 보완)으로 stage 추적의 신뢰성을 확보한다.

**스테이지 순서:**
```
PLANNER → SCHEDULER → BUILDER → VERIFIER → COMMITTER → REVIEWER
```

### 4.5 WorkDoc 자동 등록

*(v1.0 내용 유지 — 상세 보강은 §7 참조)*

### 4.6 완료 보고

*(v1.0 내용 유지)*

### 4.7 Git Push 백그라운드 루프 (v1.1 신규)

> **SDD v1.0 대비:** v1.0 §12에서는 "사용자가 'push 해줘' 요청 시 Claude가 직접 수행"이라고만 기술하였다. 실제 구현에서는 Runner가 Git Push 작업을 백그라운드 루프로 자동 처리한다.

**`pollGitPush()` — Git Push 자동 실행 루프:**

```
Runner main() 진입 시 poll()과 별도의 async IIFE로 시작
  │
  while (running):
  │  GET /api/v1/runner/git-push-next
  │     │
  │     ├─ 200 OK + job 존재:
  │     │    job: { id, projectRoot, status: 'PENDING' }
  │     │    │
  │     │    ▼
  │     │  execAsync('git push', { cwd: job.projectRoot })
  │     │    │
  │     │    ├─ exitCode === 0:
  │     │    │    POST /runner/git-push-result { jobId, status: 'DONE' }
  │     │    │
  │     │    └─ exitCode !== 0:
  │     │         POST /runner/git-push-result { jobId, status: 'FAILED', error }
  │     │
  │     └─ 404 / job 없음 → 스킵
  │
  │  await sleep(5_000)
```

**`GitPushJob` 인터페이스:**
```typescript
interface GitPushJob {
  id: string;
  projectRoot: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  errorMessage?: string;
}
```

**`execAsync()` 헬퍼:**
```typescript
async function execAsync(
  command: string,
  options: { cwd?: string },
): Promise<{ stdout: string; stderr: string; exitCode: number }>
```
- `Bun.spawn()`으로 프로세스 생성
- stdout/stderr를 각각 ReadableStream으로 수집
- `proc.exited`로 종료 코드 대기

**설계 근거:** 백엔드(NestJS)는 Docker 컨테이너 내부에서 실행되어 호스트 파일시스템의 git 저장소에 직접 접근할 수 없다. Runner는 호스트에서 실행되므로 git push를 대행할 수 있다. 프론트엔드에서 사용자가 push를 요청하면 백엔드가 GitPushJob을 DB에 생성하고, Runner가 폴링으로 수신하여 처리한다.

**Runner API 엔드포인트 (§5.3에 추가 필요):**
```
GET    /api/v1/runner/git-push-next      → 대기 중인 Git Push Job 조회
POST   /api/v1/runner/git-push-result    → Git Push 결과 보고
```

### 4.8 비정상 종료 복구 (v1.1 신규)

> **SDD v1.0 대비:** v1.0 §13.6은 타임아웃과 SIGTERM 처리만 기술하였다. 실제 구현에는 Runner 재시작 시 미완료 실행을 자동 복구하는 자가 치유 메커니즘이 포함되어 있다.

**`recoverRunningExecutions()` — Runner 시작 시 자동 복구:**

```
Runner main() 진입 직후 (poll 루프 시작 전)
  │
  ▼
GET /api/v1/runner/running → RUNNING 상태 execution 목록 수신
  │
  ├─ 0건 → "복구할 execution 없음" 로그 후 정상 진행
  │
  └─ N건 → 순차 복구:
       │
       for each execution:
       │
       ├─ POST /api/v1/runner/:id/resume-claim
       │    → 새 callbackToken 발급
       │
       ├─ resumePrompt 자동 구성:
       │    "[WORK 시작] 이전 파이프라인 실행이 비정상 종료되어 재개합니다.
       │     PROGRESS.md를 확인하고 완료된 TASK는 건너뛰고
       │     미완료 TASK부터 이어서 진행해줘.
       │     콜백 URL: {{CALLBACK_URL}}
       │     콜백 토큰: {{CALLBACK_TOKEN}}"
       │
       ├─ runClaude(execution.id, resumePrompt, ...)
       │    → 정상 실행과 동일한 흐름 (토큰 수집, stage 감지 등)
       │
       ├─ DONE → collectAndSaveWorkDocs()
       ├─ sendStageTokens()
       └─ complete(status, '재개 실행 완료/실패')
```

**Runner API 엔드포인트 (§5.3에 추가 필요):**
```
GET    /api/v1/runner/running             → RUNNING 상태 execution 목록
POST   /api/v1/runner/:id/resume-claim    → 복구용 callbackToken 재발급
```

**설계 근거:** Runner 프로세스가 비정상 종료(OOM, 서버 재부팅 등)되면 RUNNING 상태의 execution이 DB에 고아로 남는다. 백엔드의 @Cron 타임아웃 스캐너는 30분 후에야 ABORTED로 전환하므로, 그 사이 Runner가 재시작되면 즉시 복구를 시도하여 파이프라인 연속성을 유지한다.

**재개 프롬프트의 핵심:** `PROGRESS.md를 확인하고 완료된 TASK는 건너뛰고`라는 지시로 에이전트가 이미 완료된 TASK를 중복 실행하지 않도록 한다.

### 4.9 환경변수 격리 (v1.1 신규)

> **SDD v1.0 대비:** CLI 실행 시 환경변수 조작에 대한 기술이 없었다.

**runClaude()에서 subprocess 환경변수 격리:**

```typescript
const { ANTHROPIC_API_KEY: _removed, CLAUDECODE: _cc, ...envWithoutKey } = process.env;
```

| 제거 변수 | 제거 이유 |
|-----------|-----------|
| `ANTHROPIC_API_KEY` | API 크레딧 대신 claude.ai 구독 계정으로 인증하도록 강제 |
| `CLAUDECODE` | Claude Code 세션 내부에서 중첩 실행 차단 방지 (무한 재귀 방지) |

**Windows UTF-8 환경변수 추가 (isWindows === true 일 때):**

```typescript
const utf8Env = {
  LANG: 'en_US.UTF-8',
  LC_ALL: 'en_US.UTF-8',
  PYTHONIOENCODING: 'utf-8',
  PYTHONUTF8: '1',
};
```

**subprocess에 주입되는 환경변수:**
```typescript
env: {
  ...envWithoutKey,      // ANTHROPIC_API_KEY, CLAUDECODE 제외
  ...utf8Env,            // Windows UTF-8 강제
  CALLBACK_URL: callbackUrl,
  CALLBACK_TOKEN: callbackToken,
}
```

### 4.10 동시성 모델 (v1.1 신규)

> **SDD v1.0 대비:** Runner의 동시성 구조에 대한 명시적 기술이 없었다.

Runner는 총 **6개의 비동기 루프**가 동시에 작동하는 구조다.

**main() 레벨 (2개):**
| 루프 | 주기 | 역할 |
|------|------|------|
| `poll()` | 5초 | 실행 큐에서 다음 execution 수신 → runClaude → 완료 보고 |
| `pollGitPush()` | 5초 | Git Push Job 수신 → git push 실행 → 결과 보고 |

**runClaude() 레벨 (4개 — 실행 중에만 활성):**
| 루프 | 주기 | 역할 |
|------|------|------|
| stdout 파싱 | 이벤트 구동 | NDJSON 스트림 → stage 감지 + 토큰 추출 + 로그 전송 |
| stderr 파싱 | 이벤트 구동 | 에러 로그 수집 → 백엔드 전송 |
| stage 폴링 | 4초 | GET /runner/:id/stage → currentStage 동기화 |
| 타임아웃 | 1회 | setTimeout(N분) → proc.kill() → resolve(FAILED) |

**공유 상태 (클로저 변수):**

6개 루프 중 runClaude 내부 4개는 다음 변수를 공유한다:

| 변수 | 타입 | 접근 패턴 |
|------|------|-----------|
| `collectedInputTokens` 등 4종 | `number` | stdout 루프: 증분 누적, proc.exited: 읽기 |
| `stageTokenMap` | `Map<string, {input,output,cacheCreation,cacheRead}>` | stdout 루프: 쓰기, proc.exited: 읽기 |
| `currentStage` | `PipelineStage \| null` | stdout 루프: 쓰기, stage 폴링: 쓰기, accumulateStageTokens: 읽기 |
| `stagePollActive` | `boolean` | proc.exited: false 설정, stage 폴링: 루프 조건 |

**경쟁 조건 분석:** Bun의 이벤트 루프는 단일 스레드이므로 명시적 lock은 불필요하다. 다만 `currentStage`가 stdout 파싱과 stage 폴링 양쪽에서 갱신될 수 있어, 동일 시점에 서로 다른 stage를 감지하면 "마지막 쓰기 승리" 동작이 된다. 현재 코드는 `detectedStage !== currentStage` 조건으로 중복 갱신을 방지한다.

---
## 5. 백엔드 — Execution 생명주기

### 5.1 DB 스키마 핵심 모델

**CliExecution:**
```
id                     String   @id
requirementId          String   → Requirement
executorId             String   → Member
profileId              String?  → CliProfile
status                 ExecutionStatus (PENDING|RUNNING|DONE|FAILED|ABORTED)
projectRoot            String
maxTurns               Int      @default(50)
timeoutMinutes         Int      @default(30)
prompt                 String   @db.Text
currentStage           PipelineStage?
pid                    Int?
callbackToken          String?
batchGroupId           String?  (배치 묶음 ID)
batchSeq               Int?     (배치 내 순서)
startedAt              DateTime?
endedAt                DateTime?
totalInputTokens       Int      @default(0)
totalOutputTokens      Int      @default(0)
totalCacheCreationTokens Int    @default(0)
totalCacheReadTokens   Int      @default(0)
```

**ExecutionStageLog:**
```
id           String   @id
executionId  String   → CliExecution
stage        PipelineStage
event        String   (START|DONE|FAILED)
occurredAt   DateTime @default(now())
durationMs   Int?     (DONE/FAILED 시 단계 소요시간)
```

**ExecutionTokenUsage:**
```
id                  String   @id
executionId         String   → CliExecution
stage               PipelineStage? (null = 전체 집계)
inputTokens         Int      @default(0)
outputTokens        Int      @default(0)
totalTokens         Int      @default(0)
cacheCreationTokens Int      @default(0)
cacheReadTokens     Int      @default(0)
recordedAt          DateTime @default(now())
```

**CliExecutionLog:**
```
id           String   @id
executionId  String   → CliExecution
seq          Int      (순서)
stream       LogStream (STDOUT|STDERR|SYSTEM)
message      String   @db.Text
createdAt    DateTime
```

### 5.2 CliExecution 상태 머신

```
PENDING ──────────────────► RUNNING ──────────────────► DONE
   │                           │                          │
   │ (abort)                   │ (abort)         (완료 후 검토 필요 시)
   ▼                           ▼                          ▼
ABORTED                     ABORTED              (REVIEWING → DONE)
                               │
                               │ (오류/타임아웃)
                               ▼
                            FAILED
```

- `PENDING → RUNNING`: Runner가 프로세스 시작 후 첫 콜백 시점
- `RUNNING → DONE/FAILED`: Runner `complete()` 호출
- `RUNNING → ABORTED`: 사용자 abort 요청
- 자동 타임아웃: `@Cron(EVERY_5_MINUTES)` — 30분(기본) 초과 시 ABORTED

### 5.3 API 엔드포인트 목록

**CLI Execution** (`/api/v1/cli-executions`):
```
POST   /start                 → 실행 시작 (batch 지원)
POST   /:id/abort             → 실행 중단
GET    /                      → 목록 조회 (페이지네이션)
GET    /:id                   → 단건 조회
GET    /:id/stream            → SSE 실시간 로그 스트림
GET    /:id/logs              → 저장된 로그 목록
POST   /:id/callback          → 파이프라인 콜백 수신
GET    /:id/stage-stats       → 단계별 소요시간 + 토큰 통계
```

**Runner** (`/api/v1/runner`):
```
POST   /:id/log               → 로그 저장
POST   /:id/complete          → 실행 완료 보고
POST   /:id/stage-tokens      → 단계별 토큰 저장
```

**Work-Doc** (`/api/v1/work-docs`):
```
POST   /                      → WorkDoc 생성 (RunnerApiKeyGuard)
POST   /:docId/tasks          → WorkTask 생성
PUT    /:docId/tasks/:taskId  → WorkTask 결과 업데이트
GET    /by-execution/:id      → executionId로 조회
GET    /                      → requirementId로 조회
GET    /:docId                → 단건 조회 (workTasks 포함)
```

### 5.4 Callback 처리 흐름

에이전트가 `POST /api/v1/cli-executions/:id/callback` 호출:

```json
{
  "stage": "BUILDER",
  "event": "START",
  "workId": "WORK-76",    // PLANNER DONE 시 필수
  "taskId": "WORK-76-TASK-01",
  "inputTokens": 1234,
  "outputTokens": 567,
  "message": "선택적 메시지"
}
```

백엔드 처리:
1. `callbackToken` 검증
2. `ExecutionStageLog` 기록 (START: 시작, DONE: durationMs 계산)
3. `CliExecution.currentStage` 업데이트
4. PLANNER DONE 시: `handleWorkDocSave()` → PLAN.md 파싱 + WorkDoc 등록
5. 최종 COMMITTER DONE: Requirement 상태 `IN_PROGRESS → REVIEWING` 전환
6. SSE 브로드캐스트

---
## 6. 요구사항 관리 시스템

### 6.1 Requirement 상태 흐름

```
DRAFT ──► REVIEW ──► APPROVED ──► PENDING ──► IN_PROGRESS ──► REVIEWING ──► DONE
                                    │                               │
                                    │ (실행 시작)                    │ (검토 결과)
                                    ▼                               ▼
                                 Runner 실행                   승인(DONE) / 반려(FAILED)
                                                                     │
                                                              HOLD (일시 중단)
                                                              FAILED (실패)
```

**상태 전환 규칙:**
| From | To | 트리거 |
|------|----|--------|
| DRAFT | REVIEW | 작성자 제출 |
| REVIEW | APPROVED | 리더/관리자 승인 |
| APPROVED | PENDING | 실행 대기열 등록 |
| PENDING | IN_PROGRESS | Runner 실행 시작 |
| IN_PROGRESS | REVIEWING | COMMITTER DONE 콜백 |
| REVIEWING | DONE | reviewApprove() |
| REVIEWING | FAILED | reviewReject() |

### 6.2 DB 스키마

**Requirement:**
```
id                 String   @id
teamId             String   → Team
projectId          String?  → Project
reqCode            String   ("REQ-001", 팀 내 자동 채번)
title              String
category           RequirementCategory (FR|NFR|CR)
priority           RequirementPriority (P0|P1|P2|P3)
size               RequirementSize?    (XS|S|M|L|XL)
assigneeId         String?  → Member
tags               String[]
body               String   @db.Text
acceptanceCriteria String   @db.Text
status             RequirementStatus
authorId           String   → Member
```

**RequirementStatusLog:**
```
id              String   @id
requirementId   String   → Requirement
fromStatus      RequirementStatus
toStatus        RequirementStatus
changedById     String?  (null = 시스템 자동)
changedAt       DateTime
memo            String?
```

**RequirementDependency:**
```
id              String   @id
requirementId   String   (이 REQ가)
preconditionId  String   (이 REQ에 의존)
```

### 6.3 API 엔드포인트 목록

```
GET    /api/v1/requirements                    → 목록 조회 (다중 필터)
POST   /api/v1/requirements                    → 생성
GET    /api/v1/requirements/analytics/summary  → 기간별/프로젝트별 집계
GET    /api/v1/requirements/analytics/pivot    → 피벗 분석 (행/열 차원, 메트릭)
GET    /api/v1/requirements/:id                → 단건 조회
PATCH  /api/v1/requirements/:id               → 수정
DELETE /api/v1/requirements/:id               → 삭제 (DONE 상태 불가)
PATCH  /api/v1/requirements/:id/status        → 상태 변경 (상태 머신)
POST   /api/v1/requirements/:id/dependencies  → 의존성 추가 (순환 방지)
DELETE /api/v1/requirements/:id/dependencies/:preconditionId
GET    /api/v1/requirements/:id/lead-time     → 리드타임 통계
POST   /api/v1/requirements/:id/retry         → 실패 실행 재시도
POST   /api/v1/requirements/:id/review-approve → 검토 승인
POST   /api/v1/requirements/:id/review-reject  → 검토 반려 (memo 필수)
```

### 6.4 의존성 관리

- `checkCircularDependency()`: BFS 탐색으로 순환 참조 검출
- 의존 REQ가 DONE 상태가 아니면 실행 불가 (PENDING 전환 방지)
- 의존성 시각화: Analytics 피벗에서 의존성 체인 확인 가능

---

## 7. WorkDoc 자동 등록 흐름

> **시각화 참조: VIS-15 (§7 WorkDoc 자동 등록 + 3분기 멱등성)**

### 7.1 개요

Runner 실행 완료 시, `projectRoot/works/WORK-NN/` 디렉토리를 스캔하여
PLAN.md + TASK 파일들을 파싱한 뒤 WorkDoc/WorkTask API로 저장한다.

### 7.2 등록 트리거와 흐름

```
Runner 완료 (complete() 호출 전)
    │
    ▼
collectAndSaveWorkDocs(executionId, projectRoot)
    │
    ▼
works/ 스캔
WORK-* 디렉토리 목록 (PLAN.md mtime 기준 최신 정렬)
    │
    ▼
GET /api/v1/work-docs/by-execution/:id
    존재하면 → 스킵 (멱등성)
    없으면  → 계속
    │
    ▼
가장 최신 WORK 디렉토리의 PLAN.md 파싱
parsePlanMd(content) → { workId: "WORK-76", title: "..." }
    │
    ▼
POST /api/v1/work-docs → WorkDoc 생성
{ executionId, workId, title, planContent }
    │
    ▼
collectWorkTasks(workDir):
  - 파일명 패턴: TASK-NN.md (plan)
  - 파일명 패턴: TASK-NN_result.md (result)
  - title 추출: 첫 줄 "# TASK-01: ..." 파싱
    │
    ▼
POST /api/v1/work-docs/:docId/tasks (N개 순차 생성)
{ taskId, title, planContent, resultContent, sortOrder }
```

### 7.3 파일명 패턴 (parseTaskFilename)

```typescript
// v1.4 현행 패턴 (works/WORK-NN/ 디렉토리 내부)
// 결과 파일 패턴
/^TASK-(\d+)_result\.md$/
// 계획 파일 패턴
/^TASK-(\d+)\.md$/

// v1.3 이전 레거시 패턴 (후방 호환)
// /^(WORK-\d+-TASK-(\d+))-result\.md$/
// /^(WORK-\d+-TASK-(\d+))\.md$/
```

> **v1.4 변경:** 파일명에서 WORK-NN 프리픽스를 제거하고 구분자를 하이픈에서 언더스코어로 변경하였다. Runner의 `parseTaskFilename()`은 두 패턴 모두 인식할 수 있도록 후방 호환을 유지한다.
### 7.4 멱등성 보장 (v1.1 보강)

> **v1.1 보강:** docId 재사용 로직 추가 기술.

`existData?.data ?? existData` 패턴으로 `{ success, data, message }` 래핑 구조를 처리한다.

**v1.0 기술:** 동일 executionId로 중복 호출 시 두 번째부터는 조용히 스킵.

**v1.1 보강 — 3분기 판정 로직:**

```
GET /api/v1/work-docs/by-execution/:executionId
  │
  ├─ existingDoc.id 존재 + workTasks.length > 0:
  │    → 조기 return (완전한 중복 — 기존 동작)
  │
  ├─ existingDoc.id 존재 + workTasks.length === 0:
  │    → existingDocId = existingDoc.id (docId 재사용)
  │    → TASK 등록만 진행 (WorkDoc 재생성 없음)
  │
  └─ existingDoc 없음:
       → 정상 흐름 (POST /work-docs → 신규 생성)
```

**설계 근거:** Runner가 WorkDoc 생성 후 TASK 등록 중 비정상 종료되면 WorkDoc은 존재하지만 workTasks가 비어있는 상태가 된다. 재시작 시 기존 docId를 재사용하여 TASK만 보충 등록함으로써 WorkDoc 중복 생성을 방지한다.

### 7.5 PLAN.md 폴백 파싱 — REQ-050-4 (v1.1 신규)

> **SDD v1.0 대비:** TASK 파일이 반드시 존재한다고 가정하였으나, 구형 WORK에서는 PLAN.md 내부에 TASK가 임베딩되어 있는 경우가 있다.

**`parsePlanMdForTasks(planContent, workId)` — PLAN.md 내부 TASK 파싱:**

```
collectWorkTasks(workDir) 호출
  │
  ├─ TASK 파일 1개 이상 → 정상 처리 (기존 흐름)
  │
  └─ taskMap.size === 0 → 폴백 진입:
       │
       ├─ PLAN.md 읽기
       ├─ parsePlanMd() → workId 추출
       ├─ parsePlanMdForTasks(planContent, workId):
       │    줄 단위 스캔 → /^###\s+(WORK-\d+-TASK-(\d+)):\s+(.+)$/
       │    workId 일치 검사: taskId.startsWith(workId + '-TASK-')
       │    → 다른 WORK의 TASK 혼입 방지
       │
       └─ fallbackTasks 반환 (sortOrder 기준 정렬)
```

**파싱 패턴:**
```markdown
### WORK-56-TASK-01: DB 스키마 마이그레이션
### WORK-56-TASK-02: API 엔드포인트 구현
```

> h2(`##`)가 아닌 **h3(`###`)** 레벨만 인식한다. h2 레벨 임베딩은 §7.6 규격 위반 감지에서 경고 대상이다.
> **v1.4 참고:** 이 폴백 파싱은 레거시 WORK (WORK-12 이전)에만 적용된다. WORK-13 이후의 TASK 파일은 `TASK-XX.md` 형식으로 개별 파일로 존재한다.

### 7.6 규격 위반 감지 — `validateWorkDirectory()` (v1.1 신규)

> **SDD v1.0 대비:** 에이전트가 파일명 규칙을 어길 수 있다는 현실적 시나리오에 대한 방어 코드가 기술되지 않았다.

**위반 3종 분류:**

| 타입 | 감지 조건 | 영향 |
|------|-----------|------|
| `NON_STANDARD_RESULT` | 파일명에 'result' 포함 but `/^WORK-\d+-TASK-\d+-result\.md$/` 불일치 | WorkTask DB 등록 누락 |
| `H2_TASK_EMBEDDING` | PLAN.md 내 `## WORK-NN-TASK-XX:` (h2 레벨) | 폴백 파싱(h3 기준)에서 미인식 |
| `MISSING_RESULT` | TASK-XX.md 존재 but TASK-XX-result.md 부재 | 미완료 TASK (파이프라인 비정상 종료) |

**감지 흐름:**
```
collectAndSaveWorkDocs() → WorkDoc/WorkTask 등록 직전
  │
  ▼
validateWorkDirectory(workDir, workId)
  │
  ├─ readdirSync(workDir) → 파일 목록
  │
  ├─ 1. 비표준 result 파일 감지:
  │    filename.includes('result') && !STANDARD_PATTERN.test(filename)
  │    예: RESULT.md, WORK-NN-RESULT.md, result-TASK-01.md
  │
  ├─ 2. PLAN.md 내 h2 TASK 임베딩 감지:
  │    /^##\s+(WORK-\d+-TASK-(\d+)):\s+(.+)$/
  │    h3(###)이 아닌 h2(##) → 폴백 파서 미인식 경고
  │
  └─ 3. result 없는 TASK 파일 감지:
       taskFiles Set — resultFiles Set → 차집합
```

**위반 처리:**
- 위반은 `logWarn()`으로 경고 기록 (실행 중단하지 않음)
- `MISSING_RESULT` 위반 taskId → `taskStatus: 'WARN'` 플래그로 WorkTask API 전송
- 프론트엔드에서 WARN 상태 TASK를 시각적으로 구분 가능

---
## 8. 토큰 수집 & 비용 추적

### 8.1 토큰 타입 4종

| 필드명 | 의미 | 비용 |
|--------|------|------|
| `inputTokens` | 실제 입력 토큰 | 표준 입력 요금 |
| `outputTokens` | 출력 토큰 | 표준 출력 요금 |
| `cacheCreationTokens` | 캐시 저장 토큰 | 쓰기 요금 (상대적으로 고가) |
| `cacheReadTokens` | 캐시 읽기 토큰 | 읽기 요금 (표준의 ~10%) |

> **REQ-043 변경사항:** 기존 `inputTokens`에 cache 토큰을 합산하던 방식에서
> 4종 분리 수집으로 변경. CliExecution에 `totalCacheCreationTokens`, `totalCacheReadTokens` 필드 추가.

### 8.2 수집 구조

```
Claude CLI stream-json 이벤트
        │
        │ (매 assistant 이벤트)
        ▼
extractTokensFromStreamJsonLine():
  → { inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens }
        │
        ▼
Runner 내부 누적 (stageTokenMap + totalTokens)
  - 현재 감지된 stage 기준으로 분류
        │
        ▼
complete() 호출 시:
  - POST /runner/:id/complete (total tokens)
  - POST /runner/:id/stage-tokens (stage별 tokens)
        │
        ▼
백엔드 저장:
  - CliExecution.totalInput/Output/CacheCreation/CacheRead 업데이트
  - ExecutionTokenUsage rows (stage별)
```

### 8.3 단계별 집계 (ExecutionTokenUsage)

```
executionId: "exec-123"
stage: "BUILDER"
inputTokens: 15000
outputTokens: 3200
cacheCreationTokens: 8000
cacheReadTokens: 45000
totalTokens: 18200
```

`stage: null` → 전체 실행 집계 레코드 (summary)

---

## 9. 통계 & 피벗 분석 (Analytics)

### REQ-047 반영 예정

**Summary 집계** (`GET /api/v1/requirements/analytics/summary`):
- 기간별 / 프로젝트별 집계
- 각 버킷에 포함된 실행의 토큰 합산 필요:
  - `totalInputTokens`, `totalOutputTokens`
  - `totalCacheCreationTokens`, `totalCacheReadTokens`
  - 예상 비용 환산 (모델별 단가 적용)

**Pivot 분석** (`GET /api/v1/requirements/analytics/pivot`):
```
rowDimension1: "category"        (FR|NFR|CR)
rowDimension2: "priority"        (P0|P1|P2|P3)
colPeriod: "week"                (주별)
metric: "token_cost"             → cacheCreation/cacheRead 포함 환산
```

**비용 환산 공식 (모델: claude-sonnet-4-6 기준):**
```
cost = inputTokens      × $3.00/MTok
     + outputTokens     × $15.00/MTok
     + cacheCreation    × $3.75/MTok
     + cacheRead        × $0.30/MTok
```

---

## 10. 로그 관리 (LOG_LEVEL)

### REQ-048 반영 예정

**현재 구조:**
- Runner가 Claude CLI stdout/stderr를 모두 `POST /runner/:id/log`로 전송
- 백엔드가 `CliExecutionLog`에 저장
- SSE를 통해 프론트엔드 실시간 스트리밍

**LOG_LEVEL 환경변수:**
```
DEBUG → 모든 메시지 저장 (기술 디버깅 시)
INFO  → 의미 있는 메시지만 저장 (기본)
WARN  → 경고 이상만
ERROR → 오류만
```

**필터링 대상 (INFO 레벨에서 제외):**
- 반복적인 JSON 메타데이터 라인 (`{"type":"system",...}`)
- 파이프라인 내부 상태 업데이트 중 중복 메시지
- 토큰 카운팅 중간 집계 로그

**유지 대상 (항상 저장):**
- 사용자에게 보여야 할 에이전트 출력 텍스트
- PIPELINE stage 전환 이벤트
- 오류 메시지

---

## 11. 프론트엔드 화면 연계

**실행 목록** (`/executions`):
- CliExecution 목록, 상태 배지, 요구사항 연결

**실행 상세** (`/executions/:id`):
- SSE 실시간 로그 스트림
- 단계별 소요시간 타임라인
- 토큰 사용량 (4종 분리 표시)

**요구사항 목록** (`/requirements`):
- 필터: status, category, priority, assignee, tag, search
- 연결된 실행 수, 마지막 실행 상태

**요구사항 상세** (`/requirements/:id`):
- 상태 흐름 시각화
- WorkDoc 목록 (PLAN.md + TASK별 결과)
- 실행 이력 + 토큰 누적

**통계 대시보드** (`/analytics`):
- Summary: 기간/프로젝트별 막대/라인 차트
- Pivot: 다차원 표 (행=카테고리/우선순위, 열=주차/월)
- 비용 환산 표시 (REQ-047)

---
## 12. WORK-LIST 상태 관리 규칙 (v1.1 보강)

> **v1.1 보강:** Git Push 자동화 루프 반영.

**`works/WORK-LIST.md` 갱신 규칙:**

| 이벤트 | 담당 | 동작 |
|--------|------|------|
| WORK 생성 | router | `IN_PROGRESS` 추가 |
| TASK 완료 | committer | **아무것도 안 함** |
| "WORK 완료!" 선언 | scheduler | **아무것도 안 함** |
| `git push` 요청 | Claude (수동) | `IN_PROGRESS → COMPLETED` 갱신 |
| **[v1.1] push 실행** | **Runner (자동)** | **pollGitPush()로 git push 자동 처리** |

**push 처리 순서 (v1.1 보강):**

```
1. [기존] 사용자가 프론트엔드에서 push 요청
2. [기존] Claude (에이전트)가 WORK-LIST.md IN_PROGRESS → COMPLETED 갱신
3. [기존] git add + git commit
4. [v1.1] 백엔드가 GitPushJob 생성 (DB 저장)
5. [v1.1] Runner의 pollGitPush()가 Job 수신
6. [v1.1] execAsync('git push', { cwd: projectRoot })
7. [v1.1] POST /runner/git-push-result (DONE/FAILED)
```

> **설계 변경 이유:** 백엔드가 Docker 컨테이너 내부에서 실행되는 경우 호스트의 git 저장소에 직접 접근할 수 없다. Runner가 호스트에서 실행되므로 git push를 대행하는 구조가 필요하다.

---

## 13. 알려진 제약사항 & 주의사항

> **시각화 참조: VIS-16 (§13 v1.3 문제 원인-해결 인과 관계)**

### 13.1 WORK ID 결정 (FILESYSTEM-FIRST)
- Planner는 MEMORY.md를 절대 참조하지 않음
- `ls -d works/WORK-*` 파일시스템 스캔이 유일한 소스
- 안전장치: 할당 예정 디렉토리가 이미 존재하면 즉시 중단

### 13.2 WorkDoc 등록 스킵 조건
- PLAN.md가 없거나 첫 줄 패턴이 다른 경우 (`# WORK-NN: 제목` 형식 필수)
- 이미 해당 executionId로 WorkDoc이 존재하는 경우
- 최신 WORK 디렉토리에서 가장 최근 수정된 PLAN.md를 사용 (다중 WORK 존재 시 주의)

### 13.3 멱등성 체크 버그 (수정 완료)
- **증상:** 백엔드 응답이 `{ success, data, message }` 래핑 구조라 `existData !== null` 조건이 항상 true
- **수정:** `const docData = existData?.data ?? existData` 로 실제 데이터 확인

### 13.4 PLANNER DONE 콜백 workId 전달
- PLANNER 단계 완료 시 콜백에 `workId` 필드를 반드시 포함해야 함
- 누락 시 백엔드에서 WorkDoc 자동 등록을 위한 PLAN.md 경로 탐색 불가
- 에이전트 프롬프트에 명시: `{"stage": "PLANNER", "event": "DONE", "workId": "WORK-XX"}`

### 13.5 배치 실행 (Batch)
- 여러 REQ를 동시 실행 시 `batchGroupId` + `batchSeq`로 묶음 관리
- 각 실행은 독립적인 subprocess
- 의존성 있는 REQ는 순차 실행 보장 (의존 REQ DONE 확인 후 시작)

### 13.6 타임아웃 처리
- 기본값: 30분 (`timeoutMinutes`)
- `@Cron(EVERY_5_MINUTES)` 스캐너가 RUNNING 상태 실행 중 초과분 ABORTED 처리
- Runner SIGTERM 수신 시 `complete(id, 'FAILED')` 후 종료

---
### 13.7 projectRoot 존재 검증 — REQ-109 (v1.1 신규)

- 백엔드는 Docker 컨테이너 내부에서 실행될 수 있어 호스트 파일시스템 경로 접근이 불가능하다
- 따라서 projectRoot 경로의 존재 여부는 **Runner 실행 시점**에 `existsSync()`로 검증한다
- 검증 실패 시:
  - `logError()` 출력 (executionId 포함)
  - 즉시 `complete(executionId, 'FAILED', errMsg)` 호출
  - runClaude()를 호출하지 않고 poll() 루프로 복귀

```typescript
if (!existsSync(execution.projectRoot)) {
  const errMsg = `projectRoot 경로가 존재하지 않습니다: ${execution.projectRoot}`;
  logError(`${errMsg} (executionId: ${execution.id})`);
  await complete(execution.id, 'FAILED', errMsg);
  currentExecutionId = null;
  return;
}
```

### 13.8 환경변수 격리의 부작용 (v1.1 신규)

- `ANTHROPIC_API_KEY` 제거로 인해 Claude CLI는 반드시 claude.ai 구독 인증으로 실행된다
- API 크레딧 기반 실행이 필요한 경우 Runner 코드 수정이 필요하다
- `CLAUDECODE` 제거로 인해 에이전트가 내부에서 `claude` CLI를 다시 호출하는 중첩 실행이 차단된다

### 13.9 동시성 제약 (v1.1 신규)

- Runner는 현재 **단일 execution만 순차 처리**한다 (`poll()`이 동기적으로 runClaude() 완료를 대기)
- 병렬 execution 처리가 필요하면 Runner 인스턴스를 여러 개 실행하거나 poll() 내부를 비동기 큐로 개선해야 한다
- Git Push 루프는 실행 루프와 독립적이므로, 실행 중에도 push 작업이 처리된다

### 13.10 Stage 폴링과 스트림 감지의 경쟁 (v1.1 신규)

- `currentStage`가 stdout 파싱과 백엔드 stage 폴링 양쪽에서 갱신될 수 있다
- Bun 단일 스레드 이벤트 루프이므로 동시 쓰기는 발생하지 않으나, 감지 시점 차이로 인해 짧은 구간에서 stage가 뒤바뀌는 순서 역전이 이론적으로 가능하다
- 현재 코드는 `detectedStage !== currentStage` 조건으로 불필요한 중복 갱신을 방지한다
- 토큰 분류 정확도에 미미한 영향 가능 (해당 구간의 토큰이 이전/이후 stage에 잘못 배분)

### 13.11 execution-mode 후방 호환 (v1.3 신규)

- PLAN.md에 `> Execution-Mode:` 필드가 없는 기존 WORK는 `full`로 간주한다
- Runner의 `parsePlanMd()` 정규식은 Execution-Mode 필드를 파싱하지 않으므로 Runner 코드 수정이 불필요하다
- 기존 `tasks/simple-tasks/` 디렉토리의 S-TASK 결과 파일은 v1.3 이전에 생성된 이력으로 유지하되, 새로운 실행에서는 사용하지 않는다
- v1.3 이전에 생성된 WORK-NN의 PLAN.md에 Execution-Mode를 소급 추가할 필요는 없다 (기본값 full로 처리)

### 13.12 direct 모드의 검증 생략 위험 (v1.3 신규)

- `direct` 모드에서 Verifier를 호출하지 않으므로, Router의 self-check(빌드+린트)가 유일한 품질 게이트가 된다
- `build_test_required == false` 판정이 잘못되면(Router의 복잡도 판정 오류) 검증 없이 커밋되는 위험이 있다
- 완화 방안: `.agent/router_rule_config.json`으로 프로젝트별 판정 기준을 세밀하게 조정
- 향후 개선: Router의 복잡도 판정을 검증하는 post-hoc 메커니즘 검토

### 13.13 파일명 패턴 후방 호환 (v1.4 신규)

- v1.4부터 TASK 파일명이 `TASK-XX.md` (프리픽스 없음, 언더스코어 구분)로 변경됨
- WORK-12 이전의 레거시 파일(`WORK-NN-TASK-XX.md`, `WORK-NN-TASK-XX-result.md`)은 그대로 유지
- Runner의 `parseTaskFilename()`은 레거시 패턴과 신규 패턴 모두를 인식해야 함
- 에이전트 파일(planner.md, committer.md 등)은 신규 패턴만 생성하도록 업데이트 완료

---

## 부록 A. Runner API 엔드포인트 전체 목록 (v1.1 신규)

> v1.0 §5.3의 Runner 엔드포인트를 확장. 코드 역분석으로 발견된 미기재 엔드포인트 포함.

**Runner** (`/api/v1/runner`):
```
GET    /next                     → 다음 실행 대기열 조회 (poll)
POST   /:id/claim                → 실행 점유 (callbackToken 발급)
POST   /:id/resume-claim         → [v1.1] 복구용 점유 (새 callbackToken)
GET    /running                  → [v1.1] RUNNING 상태 execution 목록
GET    /:id/stage                → [v1.1] 현재 stage 조회 (폴링용)
POST   /:id/log                  → 로그 저장
POST   /:id/complete             → 실행 완료 보고
POST   /:id/stage-tokens         → 단계별 토큰 저장
GET    /git-push-next            → [v1.1] 대기 중인 Git Push Job
POST   /git-push-result          → [v1.1] Git Push 결과 보고
```

---

## 부록 B. 시각화 인덱스 (v1.3 신규)

> SDD 본문의 각 섹션에 대응하는 시각화 자료 목록. 별도 파일 `SDD_v1.3_Visual_Appendix_B.html`에 인라인 SVG 다이어그램으로 수록.

| VIS ID | SDD 참조 섹션 | 시각화 내용 |
|--------|-------------|-----------|
| **VIS-01** | §2 아키텍처 전체 구조 | 3계층(TeamSpace, Runner, WORK-PIPELINE) + 6개 에이전트 배치도 |
| **VIS-02** | §3.1 에이전트 목록 | 에이전트별 모델·도구 권한·쓰기 권한 매트릭스 |
| **VIS-03** | §3.2 세 가지 실행 경로 | execution-mode 3종(direct/pipeline/full) 파이프라인 비교 + 통일 산출물 |
| **VIS-04** | §3.2 Router PLAN.md | Router가 Planner 대신 WORK 구조를 생성하는 6단계 흐름 |
| **VIS-05** | §3.4 XML 스키마 | dispatch / task-result / context-handoff 3종 XML 중첩 관계 |
| **VIS-06** | §3.4 속성 전파 체인 | execution-mode가 결정→저장→전달→소비되는 4단계 흐름 |
| **VIS-07** | §3.5 파일 구조 & 명명 규칙 | PLAN.md 필수 메타데이터 + Runner 정규식 패턴 |
| **VIS-08** | §3.6 슬라이딩 윈도우 (파이프라인) | 단일 TASK 내 Builder→Verifier→Committer FULL/SUMMARY 흐름 |
| **VIS-09** | §3.6 슬라이딩 윈도우 (TASK 간) | TASK 의존성 체인에서 거리 기반 FULL/SUMMARY/DROP 비교 |
| **VIS-10** | §3.7 progress.md Gate | PENDING→STARTED→COMPLETED 생명주기 + Verifier/Committer Gate 조건 |
| **VIS-11** | §3.8 3중 재시도 | Level 1(Verifier FAIL) + Level 2(Committer FAIL) + Level 3(Runner 복구) |
| **VIS-12** | §3.9 모델 배치 · 비용 | TASK당 비용 비율 + 4대 토큰 절감 전략 |
| **VIS-13** | §3.12 execution-mode 반응 | 에이전트 × mode 행동 매트릭스 + result.md 생성 주체 |
| **VIS-14** | §4 Runner 동시성 | main() 2개 + runClaude() 4개 비동기 루프 구조 + 공유 상태 |
| **VIS-15** | §7 WorkDoc 등록 | 3분기 멱등성 판정 + 규격 위반 3종 감지 + PLAN.md 폴백 파싱 |
| **VIS-16** | §13 v1.3 문제-해결 | Router 산출물 불일치 → 3가지 장애 → execution-mode 통일 해결 인과 관계 |

---, v1.0 원본 SDD, runner.ts (1,462줄) 코드 역분석, 에이전트 프롬프트 9건 역분석, 그리고 Router-Runner 산출물 불일치 문제 분석을 기반으로 합니다. v1.3에서 execution-mode 속성 설계를 통해 3경로 산출물 구조를 통일하였습니다.*

*이 문서는 Claude Code (claude-sonnet-4-6)가 생성하였으며, v1.0 원본 SDD, runner.ts (1,462줄) 코드 역분석, 에이전트 프롬프트 9건 역분석, 그리고 Router-Runner 산출물 불일치 문제 분석을 기반으로 합니다. v1.3에서 execution-mode 속성 설계를 통해 3경로 산출물 구조를 통일하였습니다.*
