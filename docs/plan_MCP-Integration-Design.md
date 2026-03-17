# uc-taskmanager MCP Server 통합 설계 명세서

**문서 버전**: v1.4
**작성일**: 2026-03-17
**최종 수정**: 2026-03-18 (v1.4 — Phase 1.5 CLAUDE.md MCP 프롬프트 전환 설계 반영)
**작성자**: UC. Jung (P&T 선행연구개발팀)
**대상 시스템**: uc-taskmanager-claude-agent + UC TeamSpace
**상태**: 설계 초안 (Design Draft)

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-03-17 | 초안 작성 |
| v1.1 | 2026-03-17 | WORK-27 검토 리포트 반영 — CRITICAL 1건, HIGH 6건, MEDIUM 7건 수정 |
| v1.2 | 2026-03-18 | Callback/Webhook 전략 반영 — 3.9절 신규, sync_callbacks Tool, webhook-relay 모듈, callback_status.json 스키마 |
| v1.3 | 2026-03-18 | TASK 간 의존성 context-handoff 전달 로직 반영 — 3.7절 보강, 3.3.2절 보강, 7.3절 보강 |
| v1.4 | 2026-03-18 | Phase 1.5 CLAUDE.md MCP 프롬프트 전환 설계 반영 — 3.10절 신규, 6절 로드맵 보강, 8절 호환성 보강 |

---

## 1. 개요

### 1.1 배경

현재 uc-taskmanager는 Claude Code CLI 기반의 **파일 시스템 + 서브에이전트 프롬프트** 방식으로 동작한다. 6개 Agent(router, planner, scheduler, builder, verifier, committer)가 `~/.claude/agents/*.md` (전역) 및 `agents/*.md` (프로젝트 로컬) 파일을 통해 정의되고, `works/WORK-XX/` 디렉터리에 PLAN.md, TASK-XX.md, TASK-XX_result.md 형태로 산출물이 쌓이는 구조다.

이 구조는 **단일 워크스테이션 + Claude Code CLI** 환경에서는 잘 동작하지만, 다음과 같은 확장 요구가 발생했다:

- **UC TeamSpace 웹 UI**에서 파이프라인 상태를 실시간으로 조회/제어하고 싶다
- **여러 클라이언트**(Claude Desktop, VS Code, 커스텀 웹앱)에서 동일한 파이프라인에 접근하고 싶다
- **AI Agent 플랫폼 사업모델**에서 외부 고객이 파이프라인을 API로 호출하는 시나리오가 필요하다
- **Runner(daemon)** 가 현재 Claude Code CLI를 직접 spawn하는데, MCP 표준 프로토콜로 전환하면 클라이언트 독립성이 확보된다

### 1.2 목표

uc-taskmanager의 핵심 파이프라인 기능을 **MCP 서버**로 래핑하여, 어떤 MCP 호환 클라이언트에서도 WORK Pipeline을 생성/실행/모니터링할 수 있게 한다.

### 1.3 설계 원칙

- **기존 파일 구조 유지**: `works/WORK-XX/` 디렉터리, PLAN.md, TASK-XX.md, TASK-XX_result.md 형식은 그대로 사용
- **파이프라인 깊이는 분기하되 산출물 구조는 통일한다** (SDD v1.3 핵심 원칙)
- **점진적 전환**: 기존 CLI 방식과 MCP 방식이 공존 가능하도록 설계
- **Transport 이중 지원**: stdio (로컬 개발) + Streamable HTTP (원격/프로덕션)
- **Execution-Mode 체계 유지**: direct/pipeline/full 3모드 판정 체계를 MCP 도구 레벨에서도 동일하게 적용

---

## 2. 아키텍처

### 2.1 현재 아키텍처 (As-Is)

```
┌──────────────────────────────────────────────────┐
│  UC TeamSpace (웹 UI)                             │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Frontend │──│ Backend  │──│  PostgreSQL/Redis │ │
│  │(React)  │  │(NestJS)  │  │                  │ │
│  └─────────┘  └────┬─────┘  └──────────────────┘ │
│                     │ polling                      │
│              ┌──────┴──────┐                       │
│              │   Runner    │  (systemd daemon)     │
│              │ (Bun/TS)   │                        │
│              └──────┬──────┘                       │
│                     │ spawn                        │
│              ┌──────┴──────┐                       │
│              │ Claude Code │                       │
│              │    CLI      │                       │
│              └──────┬──────┘                       │
│                     │ reads/writes                  │
│              ┌──────┴──────┐                       │
│              │ ~/.claude/  │                       │
│              │  agents/*.md│  (전역 에이전트 정의)  │
│              │  works/     │                       │
│              │  WORK-XX/   │                       │
│              └─────────────┘                       │
└──────────────────────────────────────────────────┘
```

### 2.2 목표 아키텍처 (To-Be)

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Clients                             │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Claude   │  │ Claude   │  │  UC Team-  │  │  외부 고객 │ │
│  │ Desktop  │  │  Code    │  │  Space UI  │  │  웹앱     │ │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └─────┬─────┘ │
│       │ stdio        │ stdio        │ HTTP/SSE       │ HTTP  │
│       └──────────────┴──────────────┴────────────────┘      │
│                            │                                 │
│  ┌─────────────────────────┴─────────────────────────┐      │
│  │          uc-taskmanager MCP Server                 │      │
│  │                                                    │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │              Tool Layer                      │  │      │
│  │  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │  │      │
│  │  │  │ Pipeline │ │  Task    │ │  Monitor    │ │  │      │
│  │  │  │ Tools    │ │  Tools   │ │  Tools      │ │  │      │
│  │  │  └──────────┘ └──────────┘ └─────────────┘ │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  │                                                    │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │            Resource Layer                    │  │      │
│  │  │  WORK 목록 · PLAN.md · TASK 파일 · result   │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  │                                                    │      │
│  │  ┌─────────────────────────────────────────────┐  │      │
│  │  │            Prompt Layer                      │  │      │
│  │  │  router · planner · scheduler · builder     │  │      │
│  │  │  · verifier · committer 프롬프트 템플릿      │  │      │
│  │  └─────────────────────────────────────────────┘  │      │
│  └────────────────────────┬──────────────────────────┘      │
│                           │ reads/writes                     │
│                    ┌──────┴──────┐                            │
│                    │  File System │                           │
│                    │  works/      │                           │
│                    │  WORK-XX/    │                           │
│                    └──────┬──────┘                            │
│                           │ (optional)                       │
│                    ┌──────┴──────┐                            │
│                    │ UC TeamSpace│                            │
│                    │ Backend API │                            │
│                    └─────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 핵심 변경점

| 구분 | As-Is | To-Be |
|------|-------|-------|
| 인터페이스 | Claude Code CLI 직접 호출 | MCP Tools/Resources/Prompts |
| Transport | 프로세스 spawn (stdin/stdout) | stdio + Streamable HTTP |
| 상태 관리 | 파일 시스템 기반 상태 머신 (`TASK-XX_progress.md`: PENDING -> STARTED -> IN_PROGRESS -> COMPLETED) | MCP Resources로 추상화 (동일 상태 머신 유지) |
| 에이전트 프롬프트 | `~/.claude/agents/*.md` (전역) + `agents/*.md` (로컬) | MCP Prompts로 노출 (동일 파일 참조) |
| Runner 연동 | CLI spawn -> 결과 파싱 | MCP Client로서 Tool 호출 |
| 클라이언트 | Claude Code 단일 | 다중 MCP 클라이언트 지원 |
| 에이전트 통신 | dispatch XML / task-result XML | MCP Tool 호출/응답으로 대체 |

### 2.4 XML -> MCP 매핑 테이블

현행 에이전트 간 XML 통신이 MCP Tool 호출/응답으로 대체되는 매핑:

| 현행 XML | MCP 대응 | 설명 |
|----------|---------|------|
| `<dispatch to="planner">` | `create_work` tool 호출 | Router -> Planner |
| `<dispatch to="scheduler">` | `execute_work` tool 호출 | Router -> Scheduler |
| `<dispatch to="builder">` | `execute_task` 내부 처리 | Scheduler -> Builder |
| `<dispatch to="verifier">` | `execute_task` 내부 처리 | Builder -> Verifier |
| `<dispatch to="committer">` | `execute_task` 내부 처리 | Verifier -> Committer |
| `<task-result status="PASS">` | Tool 응답의 `status` 필드 | 각 에이전트 -> Dispatcher |
| `<context-handoff>` | Tool 응답의 `context` 필드 (3.7절 참조) | 컨텍스트 전달 |
| `<previous-results>` | `execute_task`의 `previous_context` 파라미터 | 이전 TASK 결과 전달 |

---

## 3. MCP Server 상세 설계

### 3.1 기술 스택

| 구성요소 | 선택 | 근거 |
|---------|------|------|
| 언어 | TypeScript | 기존 uc-taskmanager/Runner가 TS/Bun 기반, UC TeamSpace Backend도 NestJS |
| MCP SDK | `@modelcontextprotocol/sdk` (^1.2+) | 공식 TypeScript SDK. `server.tool()` API 사용 (v1.2+ 권장) |
| Transport | `StdioServerTransport` + `StreamableHTTPServerTransport` | 로컬+원격 이중 지원 |
| 런타임 | Bun (우선) / Node.js (호환) | Runner와 동일 런타임 |
| 파일 I/O | Node.js `fs/promises` | PLAN.md, TASK.md 파일 CRUD |

### 3.2 프로젝트 구조

```
uc-taskmanager-claude-agent/
├── agents/                          # 기존 에이전트 프롬프트 (유지)
│   ├── planner.md
│   ├── scheduler.md
│   ├── builder.md
│   ├── verifier.md
│   ├── committer.md
│   ├── router.md
│   ├── shared-prompt-sections.md
│   ├── context-policy.md
│   └── xml-schema.md
├── mcp-server/                      # ★ 신규: MCP 서버 패키지
│   ├── src/
│   │   ├── index.ts                 # 엔트리포인트 (transport 선택)
│   │   ├── server.ts                # McpServer 인스턴스 생성
│   │   ├── tools/
│   │   │   ├── pipeline.ts          # WORK 파이프라인 도구
│   │   │   ├── task.ts              # TASK 단위 도구
│   │   │   ├── monitor.ts           # 상태 조회 도구
│   │   │   └── git.ts               # Git 연동 도구
│   │   ├── resources/
│   │   │   ├── index.ts             # 리소스 등록 래퍼
│   │   │   ├── work-list.ts         # WORK 목록 리소스
│   │   │   ├── plan.ts              # PLAN.md 리소스
│   │   │   ├── task-file.ts         # TASK 파일 리소스
│   │   │   └── result.ts            # result.md 리소스
│   │   ├── prompts/
│   │   │   ├── index.ts             # 프롬프트 등록 래퍼
│   │   │   ├── router.ts            # router 프롬프트 템플릿 (★ 추가)
│   │   │   ├── planner.ts           # planner 프롬프트 템플릿
│   │   │   ├── scheduler.ts
│   │   │   ├── builder.ts
│   │   │   ├── verifier.ts
│   │   │   └── committer.ts
│   │   ├── core/
│   │   │   ├── file-manager.ts      # 파일 시스템 추상화
│   │   │   ├── work-parser.ts       # WORK/TASK 파싱 로직
│   │   │   ├── dag.ts               # 의존성 DAG 관리
│   │   │   ├── execution-mode.ts    # ★ 신규: Execution-Mode 판정 엔진
│   │   │   ├── context-window.ts    # ★ 신규: 슬라이딩 윈도우 컨텍스트 관리
│   │   │   ├── activity-log.ts      # ★ 신규: Activity Log MCP 래퍼
│   │   │   ├── webhook-relay.ts     # ★ 신규: Webhook Relay 모듈 (콜백 발송/상태 관리)
│   │   │   ├── callback-status.ts   # ★ 신규: callback_status.json 읽기/쓰기
│   │   │   └── config.ts            # 설정 관리
│   │   └── integrations/
│   │       └── teamspace-api.ts     # UC TeamSpace Backend 연동 (옵션)
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── works/                           # 기존 WORK 디렉터리 (유지)
│   ├── WORK-LIST.md                 # WORK 목록 관리
│   └── WORK-XX/                     # 각 WORK 산출물
└── CLAUDE.md                        # 기존 마스터 가이드 (유지)
```

### 3.3 Tools 설계

#### 3.3.1 Pipeline Tools

| Tool 이름 | 설명 | 입력 | 출력 |
|-----------|------|------|------|
| `create_work` | 새 WORK 생성 (Router -> Planner 역할). execution-mode 자동 판정 포함 | `{ description: string, project_path?: string, execution_mode?: "direct" \| "pipeline" \| "full" }` | `{ work_id: string, execution_mode: string, plan_path: string, tasks: TaskSummary[] }` |
| `execute_work` | WORK 파이프라인 실행 | `{ work_id: string, mode: "manual" \| "auto" }` | `{ status: string, current_task: string }` |
| `approve_plan` | PLAN 승인 (full 모드에서만 필요. direct/pipeline은 즉시 실행) | `{ work_id: string }` | `{ approved: boolean, next_step: string, execution_mode: string }` |
| `resume_work` | 중단된 WORK 재개 | `{ work_id: string }` | `{ resumed_from: string, remaining: number }` |

> **Execution-Mode 판정 로직**: `create_work` 호출 시 `execution_mode` 파라미터가 명시되지 않으면, `.agent/router_rule_config.json`의 판정 기준에 따라 자동 결정한다:
> - `build_test_required: false` -> direct (Router 단독 처리)
> - `build_test_required: true` + `single_domain` + `sequential DAG` -> pipeline
> - `task_count > 5` 또는 `multi_domain` 또는 `complex DAG` -> full

#### 3.3.2 Task Tools

| Tool 이름 | 설명 | 입력 | 출력 |
|-----------|------|------|------|
| `get_next_task` | 다음 실행 가능한 TASK 반환 (DAG 기반: result file exists -> DONE, ALL deps DONE -> READY, else -> BLOCKED) | `{ work_id: string }` | `{ task_id: string, dependencies_met: boolean, spec: string }` |
| `execute_task` | 단일 TASK 실행 (builder -> verifier -> committer). `previous_context`는 `execute_work` 내부에서 자동 주입 (아래 상세 참조) | `{ work_id: string, task_id: string, previous_context?: string }` | `{ status: "pass" \| "fail", result_path: string, commit_hash?: string, context_handoff: ContextHandoff }` |
| `retry_task` | 실패한 TASK 재시도. 재시도 대상(builder/committer)을 구분하여 처리 | `{ work_id: string, task_id: string, retry_target?: "builder" \| "committer" }` | `{ attempt: number, max_attempts: 3, target: string, status: string }` |
| `approve_task` | TASK 결과 승인 (수동 모드) | `{ work_id: string, task_id: string }` | `{ approved: boolean }` |

> **`previous_context` 자동 주입 로직**: `execute_work` (또는 `get_next_task`) 내부에서 다음 절차를 수행하여 `execute_task`의 `previous_context`를 자동 생성한다:
>
> 1. **DAG 조회**: PLAN.md의 Task Dependency Graph에서 현재 TASK의 의존 TASK 목록을 파악
> 2. **context-handoff 추출**: 각 의존 TASK의 `TASK-XX_result.md`에서 `## Context Handoff` 섹션을 파싱
> 3. **의존 거리 계산**: DAG shortest path로 현재 TASK까지의 거리를 산출
> 4. **윈도우 적용**: `applyTaskDependencyWindow()` (3.7절 참조)로 FULL/SUMMARY/DROP 변환
> 5. **주입**: 변환된 context-handoff 결과를 `execute_task`의 `previous_context` 파라미터로 전달
>
> 이 로직은 `execute_work`가 DAG 순서대로 TASK를 순회할 때 매 TASK마다 자동 수행되므로, MCP 클라이언트가 `previous_context`를 수동으로 구성할 필요가 없다. 단, 클라이언트가 `execute_task`를 직접 호출하면서 `previous_context`를 명시적으로 전달한 경우에는 자동 주입을 건너뛴다.

> **재시도 정책**: builder 최대 3회, committer 최대 3회 (각각 독립 카운트). Committer Gate Check 실패 시(progress.md 미존재, Status != COMPLETED, Files changed 비어있음) builder 재디스패치.

#### 3.3.3 Monitor Tools

| Tool 이름 | 설명 | 입력 | 출력 |
|-----------|------|------|------|
| `list_works` | 전체 WORK 목록 + 진행률 | `{}` | `{ works: WorkSummary[] }` |
| `get_work_status` | 특정 WORK 상세 상태 | `{ work_id: string }` | `{ progress: "3/5", execution_mode: string, tasks: TaskStatus[], dag: DagInfo }` |
| `get_task_result` | TASK result.md 내용 조회 | `{ work_id: string, task_id: string }` | `{ content: string, verification: VerifyResult }` |
| `get_pipeline_log` | 파이프라인 Activity Log 조회 (`work_{WORK_ID}.log` 파싱, `[timestamp]_AGENT_STAGE_DESC` 포맷) | `{ work_id: string, last_n?: number }` | `{ entries: LogEntry[] }` |
| `sync_callbacks` | 미전송/실패 콜백 일괄 재전송 (배치 트랙). 수동 Tool로만 제공 (자동 실행 없음) | `{ days?: number, work_id?: string }` | `{ synced: number, failed: number, details: SyncResult[] }` |

> **sync_callbacks 상세**: `works/` 디렉터리를 스캔하여 최근 N일(기본 2일) 이내의 `callback_status.json`에서 `FAILED` 또는 `PENDING` 상태인 건을 수집하고, 일괄 POST(5초 타임아웃)를 수행한다. `work_id`를 지정하면 해당 WORK만 대상으로 한다.

#### 3.3.4 Git Tools

| Tool 이름 | 설명 | 입력 | 출력 |
|-----------|------|------|------|
| `commit_work` | WORK 산출물 커밋 | `{ work_id: string, message?: string }` | `{ commit_hash: string, files_changed: number }` |
| `push_work` | 커밋된 변경사항 푸시 (Push 절차 3단계 자동 실행) | `{ work_id: string, update_readme?: boolean }` | `{ pushed: boolean, remote: string, steps_completed: string[] }` |

> **Push 절차** (`push_work` 내부 3단계):
> 1. README.md 업데이트 여부 확인 (변경 내용 반영)
> 2. `works/WORK-LIST.md`에서 해당 WORK를 `IN_PROGRESS` -> `COMPLETED`로 변경 + 커밋
> 3. `git push`

### 3.4 Resources 설계

MCP Resources는 LLM이 참조할 수 있는 읽기 전용 데이터를 노출한다.

| Resource URI | 설명 | MIME |
|-------------|------|------|
| `work://list` | 전체 WORK 목록 (`works/WORK-LIST.md` 기반) | `text/markdown` |
| `work://{work_id}/plan` | 해당 WORK의 PLAN.md | `text/markdown` |
| `work://{work_id}/progress` | PROGRESS.md (진행 상황) | `text/markdown` |
| `work://{work_id}/task/{task_id}` | TASK 명세 파일 | `text/markdown` |
| `work://{work_id}/task/{task_id}/result` | TASK 실행 결과 (`TASK-XX_result.md`) | `text/markdown` |
| `config://agents` | 에이전트 설정: 6개 에이전트 목록, 각 에이전트의 역할, `.agent/router_rule_config.json` 판정 기준 포함 | `application/json` |
| `config://project` | 프로젝트 기술 스택 감지 결과 + execution-mode 판정에 필요한 메타정보 | `application/json` |

### 3.5 Prompts 설계

기존 `~/.claude/agents/*.md` 파일의 내용을 MCP Prompts로 노출하여, 클라이언트가 에이전트별 최적 프롬프트를 활용할 수 있게 한다. **6개 에이전트 프롬프트** + **6개 참조문서**를 모두 포함한다.

| Prompt 이름 | 설명 | Arguments | 참조문서 병합 전략 |
|------------|------|-----------|------------------|
| `router` | 요청 분석 + execution-mode 판정 프롬프트 | `{ request: string, project_path?: string }` | `shared-prompt-sections.md`, `router_rule_config.json` 자동 병합 |
| `planner` | 프로젝트 분석 + TASK 분해 프롬프트 | `{ project_description: string, tech_stack?: string }` | `shared-prompt-sections.md`, `file-content-schema.md` 자동 병합 |
| `scheduler` | DAG 기반 실행 순서 결정 프롬프트 | `{ work_id: string, mode: "manual" \| "auto" }` | `shared-prompt-sections.md`, `xml-schema.md` 자동 병합 |
| `builder` | 코드 구현 프롬프트 | `{ task_spec: string, context_handoff?: ContextHandoff }` | `shared-prompt-sections.md`, `context-policy.md` 자동 병합 |
| `verifier` | 빌드/린트/테스트 검증 프롬프트 | `{ task_id: string, verification_commands: string[] }` | `shared-prompt-sections.md` 자동 병합 |
| `committer` | 결과 보고 + 커밋 프롬프트 | `{ task_result: string, work_progress: string }` | `shared-prompt-sections.md`, `file-content-schema.md` 자동 병합 |

> **참조문서 병합 전략**: 각 프롬프트 생성 시, 해당 에이전트의 `.md` 파일 + 관련 참조문서(`shared-prompt-sections.md`, `file-content-schema.md`, `context-policy.md`, `xml-schema.md`, `work-activity-log.md`)를 자동으로 병합하여 단일 프롬프트로 반환한다. 병합 순서: (1) 에이전트 프롬프트 본문 (2) 관련 공유 섹션 (3) 동적 컨텍스트(요구사항, 기술 스택 등).

### 3.6 Execution-Mode 판정 엔진 (`core/execution-mode.ts`)

MCP 서버가 WORK 생성 시 Router와 동일한 판정 로직을 수행한다.

```typescript
// core/execution-mode.ts
interface ModeDecision {
  mode: "direct" | "pipeline" | "full";
  reason: string;
}

async function determineExecutionMode(
  description: string,
  projectPath: string,
  configPath?: string
): Promise<ModeDecision> {
  // 1. .agent/router_rule_config.json 로드 (존재 시)
  const config = await loadRouterConfig(configPath || ".agent/router_rule_config.json");

  // 2. 프로젝트 분석
  const analysis = await analyzeRequest(description, projectPath);

  // 3. 판정 흐름 (config.decision_flow 기반)
  if (!analysis.buildTestRequired) {
    return { mode: "direct", reason: "빌드/테스트 검증 불필요" };
  }
  if (analysis.singleDomain && analysis.dagComplexity === "sequential" && analysis.taskCount <= (config?.rules?.pipeline?.criteria?.max_tasks ?? 5)) {
    return { mode: "pipeline", reason: "단일 도메인 + sequential DAG" };
  }
  return { mode: "full", reason: analysis.fullReason };
}
```

### 3.7 슬라이딩 윈도우 컨텍스트 관리 (`core/context-window.ts`)

현행 `context-policy.md`의 FULL/SUMMARY/DROP 3단계 윈도우를 MCP 도구 레벨에서 구현한다.

```typescript
// core/context-window.ts
type DetailLevel = "FULL" | "SUMMARY" | "DROP";

interface ContextHandoff {
  from: string;          // 에이전트명
  detailLevel: DetailLevel;
  what: string;          // 변경/검증 사항 (항상 포함)
  why?: string;          // 의사결정 근거 (FULL only)
  caution?: string;      // 주의사항 (FULL only)
  incomplete?: string;   // 미완료 사항 (FULL only)
}

/**
 * execute_task 내부에서 builder -> verifier -> committer 간 컨텍스트 전달 시 사용.
 *
 * 윈도우 정책:
 * - 직전 에이전트 결과: FULL (what, why, caution, incomplete 모두 전달)
 * - 2단계 이전 결과: SUMMARY (what만 1-3줄)
 * - 3단계+ 이전 결과: DROP (전달하지 않음)
 */
function applyContextWindow(
  results: ContextHandoff[],
  currentStep: number
): ContextHandoff[] {
  return results.map((result, idx) => {
    const distance = currentStep - idx;
    if (distance <= 1) return { ...result, detailLevel: "FULL" };
    if (distance === 2) return { from: result.from, detailLevel: "SUMMARY", what: result.what };
    return null; // DROP
  }).filter(Boolean);
}
```

> **MCP 도구 레벨 적용**: `execute_task`가 내부적으로 builder -> verifier -> committer를 순차 호출할 때, 각 단계의 결과를 `ContextHandoff` 형태로 누적하고, 다음 단계 호출 시 `applyContextWindow()`를 적용하여 전달한다.

#### 3.7.1 TASK 간 의존성 context-handoff 전달

`applyContextWindow()`는 단일 TASK 내부(builder -> verifier -> committer)의 에이전트 간 윈도우를 처리한다. 이와 별도로, **TASK 간 의존성**에서도 동일한 FULL/SUMMARY/DROP 윈도우가 적용된다. 현행 `context-policy.md`의 "TASK 간 의존성 전달" 규칙을 MCP 도구 레벨에서 구현한다.

```typescript
// core/context-window.ts (추가)

interface TaskResultContextHandoff {
  taskId: string;
  builderContext: ContextHandoff;   // result.md의 Builder Context 섹션
  verifierContext: ContextHandoff;  // result.md의 Verifier Context 섹션
}

/**
 * TASK 간 의존성 context-handoff 윈도우 적용.
 *
 * result.md의 Context Handoff 섹션에서 Builder/Verifier context를 추출하고,
 * DAG 의존 거리에 따라 FULL/SUMMARY/DROP을 적용한다.
 *
 * 윈도우 정책 (context-policy.md 기준):
 * - 직전 의존 TASK (거리 1): FULL (4개 필드 모두 전달)
 * - 2단계 전 (거리 2): SUMMARY (what만 1-3줄)
 * - 3단계 이상 (거리 3+): DROP (전달하지 않음)
 *
 * @param currentTaskId  현재 실행할 TASK ID
 * @param dag            PLAN.md에서 파싱한 DAG 구조
 * @param resultDir      works/WORK-XX/ 디렉터리 경로
 * @returns              윈도우 적용된 previous_context 문자열
 */
async function applyTaskDependencyWindow(
  currentTaskId: string,
  dag: TaskDag,
  resultDir: string
): Promise<string | undefined> {
  // 1. DAG에서 현재 TASK의 모든 의존 TASK를 조회
  const dependencies = dag.getDependencies(currentTaskId);
  if (dependencies.length === 0) return undefined;

  // 2. 각 의존 TASK에 대해 DAG shortest path로 거리 계산
  const contextEntries: Array<{ taskId: string; distance: number; handoff: TaskResultContextHandoff }> = [];

  for (const depTaskId of dependencies) {
    const distance = dag.shortestPath(depTaskId, currentTaskId);
    const resultPath = `${resultDir}/TASK-${depTaskId.replace("TASK-", "")}_result.md`;

    // 3. result.md에서 Context Handoff 섹션 파싱
    const handoff = await extractContextHandoffFromResult(resultPath);
    if (handoff) {
      contextEntries.push({ taskId: depTaskId, distance, handoff });
    }
  }

  // 4. 거리순 정렬 (가까운 것부터)
  contextEntries.sort((a, b) => a.distance - b.distance);

  // 5. 윈도우 적용
  const windowedResults: string[] = [];

  for (const entry of contextEntries) {
    if (entry.distance <= 1) {
      // FULL: 4개 필드 모두 전달
      windowedResults.push(
        `### ${entry.taskId} (FULL - 직전 의존)\n` +
        formatFullContext(entry.handoff)
      );
    } else if (entry.distance === 2) {
      // SUMMARY: what만 1-3줄
      windowedResults.push(
        `### ${entry.taskId} (SUMMARY - 2단계 전)\n` +
        `- what: ${entry.handoff.builderContext.what}`
      );
    }
    // distance >= 3: DROP (추가하지 않음)
  }

  return windowedResults.length > 0 ? windowedResults.join("\n\n") : undefined;
}

/**
 * result.md 파일에서 Context Handoff 섹션을 추출한다.
 *
 * result.md 구조 (file-content-schema.md SS 4 참조):
 *   ## Context Handoff
 *   ### Builder Context (SUMMARY)
 *   {builder what 필드 1-3줄}
 *   ### Verifier Context (FULL)
 *   {verifier context-handoff 4개 필드}
 */
async function extractContextHandoffFromResult(
  resultPath: string
): Promise<TaskResultContextHandoff | null> {
  try {
    const content = await readFile(resultPath, "utf-8");

    // "## Context Handoff" 섹션부터 파일 끝 또는 다음 ## 섹션까지 추출
    const handoffMatch = content.match(
      /## Context Handoff\n([\s\S]*?)(?=\n## |\n---|\Z)/
    );
    if (!handoffMatch) return null;

    const handoffSection = handoffMatch[1];

    // Builder Context 파싱
    const builderMatch = handoffSection.match(
      /### Builder Context[^\n]*\n([\s\S]*?)(?=\n### |\Z)/
    );
    // Verifier Context 파싱
    const verifierMatch = handoffSection.match(
      /### Verifier Context[^\n]*\n([\s\S]*?)(?=\n### |\Z)/
    );

    return {
      taskId: resultPath.match(/TASK-(\d+)/)?.[0] || "UNKNOWN",
      builderContext: parseContextFields(builderMatch?.[1] || ""),
      verifierContext: parseContextFields(verifierMatch?.[1] || ""),
    };
  } catch {
    return null; // result.md가 없으면 null 반환 (아직 미완료 TASK)
  }
}

/**
 * DAG shortest path 계산.
 * BFS 기반으로 fromTask에서 toTask까지의 최단 거리를 반환한다.
 */
interface TaskDag {
  getDependencies(taskId: string): string[];   // 직접 의존 TASK 목록
  getAllAncestors(taskId: string): string[];    // 모든 선행 TASK (재귀)
  shortestPath(from: string, to: string): number; // BFS 최단 거리
}
```

> **핵심 설계 결정**:
> - `execute_work`가 DAG 순서대로 TASK를 순회할 때, 각 TASK 실행 전에 `applyTaskDependencyWindow()`를 호출하여 `previous_context`를 자동 생성한다
> - DAG shortest path는 BFS로 계산하며, 복잡 DAG(다이아몬드 의존성 등)에서도 올바른 거리를 산출한다
> - result.md가 아직 존재하지 않는 TASK(미완료)는 자동으로 건너뛴다

### 3.8 Activity Log MCP 래퍼 (`core/activity-log.ts`)

현행 `work_{WORK_ID}.log` 파일 기록 메커니즘을 MCP 서버 환경에서 유지한다.

```typescript
// core/activity-log.ts
import { appendFile, mkdir } from "fs/promises";

const STAGE_TABLE = ["INIT", "REF", "PLAN", "IMPL", "BUILD", "COMMIT", "DISPATCH"] as const;

async function logWork(
  workId: string,
  agent: string,
  stage: typeof STAGE_TABLE[number],
  description: string
): Promise<void> {
  const workDir = `works/${workId}`;
  await mkdir(workDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "");
  const entry = `[${timestamp}]_${agent}_${stage}_${description}\n`;
  await appendFile(`${workDir}/work_${workId}.log`, entry);
}
```

> **MCP Tool 연동**: 모든 Tool 실행 시 자동으로 `logWork()`를 호출하여 Activity Log를 기록한다. `get_pipeline_log` Tool이 이 로그를 파싱하여 클라이언트에 반환한다.

### 3.9 Callback/Webhook 전략

MCP 전환 시 기존 CLAUDE.md 기반 콜백 설정을 MCP 서버 config로 이전하고, 구조화된 콜백 관리 체계를 도입한다.

#### 3.9.1 인증 헤더 통일

3종 콜백(TaskCallback, ProgressCallback, PipelineStageCallback) 모두 동일한 인증 헤더를 사용한다:

```
X-Runner-Api-Key: {token}
```

- 기존 Scheduler의 `Authorization: Bearer` 방식을 `X-Runner-Api-Key` 헤더로 통일
- 토큰 값은 MCP 서버 config에서 관리 (3.9.5절 참조)

#### 3.9.2 2트랙 콜백 전략

콜백 전송을 **실시간 트랙**과 **배치 트랙** 2단계로 분리하여, 콜백 실패가 파이프라인을 중단하지 않으면서도 누락을 보정할 수 있게 한다.

```
[실시간 트랙]                        [배치 트랙]
execute_task 내부                    MCP Tool: sync_callbacks
  |                                    |
  +-- webhook 발사 (5s timeout)        +-- works/ 스캔 (최근 1~2일)
  +-- 성공 -> callback_status.json     +-- FAILED/PENDING 건 수집
  +-- 성공 -> Activity Log             +-- 일괄 POST (5s timeout)
  +-- 실패 -> callback_status.json     +-- 결과 업데이트
      +-- Activity Log
      (파이프라인은 계속)
```

**실시간 트랙 정책:**
- 타임아웃: 5초
- 시도 횟수: 1회
- 실패 시: soft failure (파이프라인 계속 진행)
- 결과 기록: `callback_status.json` + Activity Log

**배치 트랙 정책:**
- `sync_callbacks` MCP Tool로 수동 실행 (자동 실행 없음)
- 최근 N일(기본 2일) 이내의 미전송/실패 건 일괄 재전송
- 타임아웃: 건당 5초

#### 3.9.3 콜백 상태 추적: callback_status.json

각 WORK 디렉터리에 `callback_status.json` 파일로 구조화된 콜백 상태를 관리한다.

**파일 경로**: `works/WORK-XX/callback_status.json`

**스키마 정의:**

```json
{
  "$schema": "callback_status/v1.0",
  "workId": "WORK-01",
  "tasks": {
    "TASK-00": {
      "taskCallback": {
        "status": "SENT",
        "url": "https://api.example.com/callbacks/task",
        "sentAt": "2026-03-18T10:30:00",
        "httpStatus": 200,
        "error": null
      },
      "progressCallback": {
        "status": "FAILED",
        "url": "https://api.example.com/callbacks/progress",
        "sentAt": "2026-03-18T10:30:01",
        "httpStatus": 503,
        "error": "Service Unavailable"
      },
      "stageCallbacks": {
        "BUILDER_START": {
          "status": "SENT",
          "sentAt": "2026-03-18T10:25:00",
          "httpStatus": 200
        },
        "BUILDER_DONE": {
          "status": "SENT",
          "sentAt": "2026-03-18T10:28:00",
          "httpStatus": 200
        },
        "VERIFIER_START": {
          "status": "PENDING",
          "sentAt": null,
          "httpStatus": null
        }
      }
    }
  }
}
```

**상태값:**
| 상태 | 설명 |
|------|------|
| `SENT` | 전송 성공 (HTTP 2xx 응답) |
| `FAILED` | 전송 실패 (타임아웃, HTTP 4xx/5xx, 네트워크 오류) |
| `PENDING` | 미발송 (콜백 비활성화 또는 아직 해당 단계 미도달) |

#### 3.9.4 PipelineStageCallback 정의

MCP 전환 시점에 정식 정의하는 파이프라인 단계별 콜백:

```typescript
interface PipelineStageCallback {
  workId: string;
  taskId: string;
  stage: "BUILDER" | "VERIFIER" | "COMMITTER";
  event: "START" | "DONE" | "FAILED";
  timestamp: string;  // ISO 8601
  detail?: string;    // 실패 시 오류 메시지
}
```

**콜백 발생 시점:**
| stage | event | 시점 |
|-------|-------|------|
| BUILDER | START | builder 에이전트 실행 시작 |
| BUILDER | DONE | builder 구현 완료 |
| BUILDER | FAILED | builder 구현 실패 (재시도 소진 후) |
| VERIFIER | START | verifier 검증 시작 |
| VERIFIER | DONE | verifier 검증 통과 |
| VERIFIER | FAILED | verifier 검증 실패 |
| COMMITTER | START | committer 커밋 시작 |
| COMMITTER | DONE | committer 커밋 완료 |
| COMMITTER | FAILED | committer 커밋 실패 |

#### 3.9.5 MCP 서버 콜백 설정

콜백 관련 설정은 MCP 서버 config에서 관리한다. 기존 CLAUDE.md의 콜백 설정을 MCP config로 이전한다.

**MCP 서버 config 예시:**

```json
{
  "mcpServers": {
    "uc-taskmanager": {
      "command": "bun",
      "args": ["run", "/path/to/mcp-server/src/index.ts"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "WORKS_DIR": "/path/to/project/works"
      },
      "config": {
        "callback": {
          "enableCallback": false,
          "taskCallbackUrl": "https://api.example.com/callbacks/task",
          "progressCallbackUrl": "https://api.example.com/callbacks/progress",
          "stageCallbackUrl": "https://api.example.com/callbacks/stage",
          "callbackToken": "your-api-key-here",
          "timeoutMs": 5000
        },
        "syncCallbacks": {
          "defaultDays": 2
        }
      }
    }
  }
}
```

**설정 항목:**
| 항목 | 기본값 | 설명 |
|------|--------|------|
| `enableCallback` | `false` | 콜백 전송 활성화 여부. false이면 모든 콜백 발송을 건너뛰고 callback_status.json에 PENDING으로 기록 |
| `taskCallbackUrl` | (없음) | TASK 완료 시 호출할 URL |
| `progressCallbackUrl` | (없음) | TASK 진행 상태 변경 시 호출할 URL |
| `stageCallbackUrl` | (없음) | PipelineStageCallback 전송 URL |
| `callbackToken` | (없음) | `X-Runner-Api-Key` 헤더 값 |
| `timeoutMs` | `5000` | 콜백 HTTP 요청 타임아웃 (ms) |
| `syncCallbacks.defaultDays` | `2` | sync_callbacks Tool의 기본 스캔 범위 (일) |

**CLAUDE.md 지침 추가 필요:**
- "최초 진입 시 콜백 설정 동기화" 지침: MCP 서버 시작 시 config의 `enableCallback` 값을 확인하여 콜백 활성화 상태를 초기화

**README.md 가이드 추가 필요:**
- 콜백 설정 방법 안내: enableCallback 활성화, URL/Token 설정, sync_callbacks 사용법

#### 3.9.6 Webhook Relay 모듈 (`core/webhook-relay.ts`)

콜백 전송의 단일 책임 모듈. 모든 콜백 발송은 이 모듈을 통해 수행된다.

**설정 소스**: MCP 서버 config (`callback` 섹션)
- 기존 CLAUDE.md의 TaskCallback/ProgressCallback/CallbackToken을 MCP config로 이전
- 환경변수 또는 config.json으로 주입

**책임 범위:**
- 콜백 URL/Token 관리
- HTTP POST 발송 (5초 타임아웃)
- `callback_status.json` 읽기/쓰기
- Activity Log에 콜백 결과 기록
- `sync_callbacks` Tool의 배치 재전송 로직

> **구현 예시**: 4.6절 참조

### 3.10 Phase 1.5: CLAUDE.md MCP 프롬프트 전환 (`[WORK 시작]` → MCP Prompt 경유)

Phase 1 완료 후, Phase 2(실행 도구) 구현 전에 **CLAUDE.md 지침만 수정**하여 기존 `[WORK 시작]` 워크플로우가 MCP 프롬프트를 경유하도록 전환한다. 파일 생성/수정은 Claude Code의 기본 파일 도구에 의존하며, MCP 서버에 실행 도구가 없어도 동작한다.

#### 3.10.1 전환 목표

| 항목 | 현행 (Agent 방식) | Phase 1.5 (MCP Prompt 경유) |
|------|-------------------|---------------------------|
| 프롬프트 소스 | `~/.claude/agents/*.md` 직접 읽기 | MCP `get_prompt("router", ...)` API 호출 |
| 참조문서 병합 | 에이전트가 수동으로 참조 | MCP Prompts가 자동 병합하여 반환 |
| 모니터링 | 파일 직접 읽기 | MCP `list_works`, `get_work_status` 도구 활용 |
| 파일 생성 | Claude 기본 파일 도구 | Claude 기본 파일 도구 (변경 없음) |
| Fallback | — | MCP 연결 실패 시 기존 Agent 방식으로 자동 전환 |

#### 3.10.2 CLAUDE.md 지침 변경 설계

**현행 CLAUDE.md 지침:**
```markdown
## Agent 호출 규칙
`[]` 태그로 시작하는 요청 → `~/.claude/agents/agent-flow.md` 를 읽고 파이프라인을 실행한다.
```

**Phase 1.5 변경 후:**
```markdown
## Agent 호출 규칙

`[]` 태그로 시작하는 요청 → 다음 절차로 파이프라인을 실행한다.

### MCP 모드 (기본)
uc-taskmanager MCP 서버가 연결되어 있으면 MCP 경유로 실행:
1. MCP `list_works` 도구로 기존 WORK 현황 확인
2. MCP `router` 프롬프트 호출 → execution-mode 판정 + 디스패치 결정
3. 판정 결과에 따라:
   - direct: router 프롬프트 지침대로 직접 처리
   - pipeline: MCP `builder` → `verifier` → `committer` 프롬프트 순차 호출
   - full: MCP `planner` → `scheduler` → `builder` → `verifier` → `committer` 프롬프트 순차 호출
4. 파일 생성(PLAN.md, TASK-XX.md, result.md 등)은 Claude 기본 파일 도구 사용
5. 상태 확인은 MCP `get_work_status`, `get_task_result` 도구 사용

### Fallback 모드
MCP 서버 미연결 시 기존 방식으로 자동 전환:
1. `~/.claude/agents/agent-flow.md` 를 읽고 파이프라인을 실행한다.
```

#### 3.10.3 실행 흐름 다이어그램

```
[WORK 시작] 태그 감지
     │
     ▼
  MCP 서버 연결 확인
     │
     ├── 연결됨 ──────────────────────────────────┐
     │                                             │
     │   MCP list_works ← 기존 WORK 현황           │
     │   MCP get_prompt("router", {request}) ← 판정 │
     │       │                                     │
     │       ├── direct  → router 지침대로 직접 처리  │
     │       ├── pipeline → MCP prompts 순차 호출   │
     │       └── full    → MCP prompts 순차 호출    │
     │                                             │
     │   파일 생성: Claude 기본 Write/Edit 도구       │
     │   상태 확인: MCP get_work_status 도구          │
     │                                             │
     └── 미연결 ──→ agent-flow.md 읽기 → 기존 방식   │
                                                   │
                    ◀──────────────────────────────┘
```

#### 3.10.4 MCP 프롬프트 활용 이점

1. **참조문서 자동 병합**: `shared-prompt-sections.md`, `file-content-schema.md` 등을 MCP 서버가 자동으로 병합하여 반환 → 에이전트가 개별로 읽을 필요 없음
2. **프롬프트 일원화**: 6개 에이전트 프롬프트의 소스가 MCP 서버 한 곳으로 집중 → 변경 시 MCP 서버만 재빌드
3. **모니터링 도구 활용**: `list_works`, `get_work_status` 등으로 파이프라인 상태를 구조화된 데이터로 조회
4. **점진적 전환**: Phase 2 실행 도구가 추가되면 파일 생성도 MCP로 이전 가능 (CLAUDE.md 지침만 추가 변경)

#### 3.10.5 한계 및 Phase 2에서의 해소

| Phase 1.5 한계 | Phase 2 해소 방안 |
|---------------|-----------------|
| 파일 생성은 Claude 기본 도구 의존 | `create_work`, `execute_task` 도구가 파일 생성 담당 |
| MCP 서버가 실행 상태를 모름 (stateless) | `execute_work`가 DAG 기반 상태 추적 |
| 에러 핸들링이 Claude에 분산 | MCP 서버 내부에서 zod 검증 + 재시도 로직 |
| 파일 구조 일관성 보장 없음 | MCP 서버가 파일명 규칙 강제 |

#### 3.10.6 구현 산출물

| 파일 | 변경 | 설명 |
|------|------|------|
| `CLAUDE.md` | MODIFY | Agent 호출 규칙 섹션을 MCP 모드 + Fallback 모드 이중 구조로 변경 |
| `README.md` | MODIFY | Phase 1.5 전환 가이드 추가 |
| `mcp-server/src/server.ts` | — | 변경 없음 (Phase 1 구현 그대로 사용) |

---

## 4. 핵심 코드 설계

### 4.1 서버 엔트리포인트

```typescript
// mcp-server/src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPipelineTools } from "./tools/pipeline.js";
import { registerTaskTools } from "./tools/task.js";
import { registerMonitorTools } from "./tools/monitor.js";
import { registerResources } from "./resources/index.js";
import { registerPrompts } from "./prompts/index.js";

const server = new McpServer({
  name: "uc-taskmanager",
  version: "1.1.0",
});

// Tool 등록
registerPipelineTools(server);
registerTaskTools(server);
registerMonitorTools(server);

// Resource 등록 (index.ts 래퍼가 4개 모듈을 통합 등록)
registerResources(server);

// Prompt 등록 (index.ts 래퍼가 6개 에이전트 프롬프트를 통합 등록)
registerPrompts(server);

// Transport 선택 (환경변수 기반)
const mode = process.env.MCP_TRANSPORT || "stdio";

if (mode === "stdio") {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("uc-taskmanager MCP Server running on stdio");
} else {
  // HTTP 모드 (프로덕션)
  // StreamableHTTPServerTransport 사용
  console.error(`uc-taskmanager MCP Server running on HTTP :${process.env.MCP_PORT || 8080}`);
}
```

### 4.2 Pipeline Tool 구현 예시

```typescript
// mcp-server/src/tools/pipeline.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FileManager } from "../core/file-manager.js";
import { WorkParser } from "../core/work-parser.js";
import { determineExecutionMode } from "../core/execution-mode.js";
import { logWork } from "../core/activity-log.js";

export function registerPipelineTools(server: McpServer) {
  const fm = new FileManager();
  const parser = new WorkParser();

  server.tool(
    "list_works",
    "전체 WORK 목록과 진행률을 조회합니다.",
    {},
    async () => {
      const works = await parser.listWorks();
      const summary = works.map(w => ({
        id: w.id,
        title: w.title,
        progress: `${w.completed}/${w.total}`,
        status: w.completed === w.total ? "완료" :
                w.completed > 0 ? "진행 중" : "대기",
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(summary, null, 2),
        }],
      };
    }
  );

  server.tool(
    "create_work",
    "새 WORK를 생성합니다. Planner가 프로젝트를 분석하고 TASK를 분해합니다.",
    {
      description: z.string().describe("구현할 기능/요구사항 설명"),
      project_path: z.string().optional().describe("대상 프로젝트 경로 (기본: cwd)"),
      execution_mode: z.enum(["direct", "pipeline", "full"]).optional()
        .describe("실행 모드 (미지정 시 자동 판정)"),
    },
    async ({ description, project_path, execution_mode }) => {
      const projectPath = project_path || process.cwd();

      // Execution-Mode 판정
      const modeDecision = execution_mode
        ? { mode: execution_mode, reason: "사용자 명시" }
        : await determineExecutionMode(description, projectPath);

      const workId = await parser.getNextWorkId();
      const workDir = await fm.createWorkDirectory(workId);

      // Activity Log 기록
      await logWork(workId, "MCP_SERVER", "INIT",
        `${workId} 생성 — Execution-Mode: ${modeDecision.mode} (${modeDecision.reason})`);

      // 프로젝트 기술 스택 감지
      const techStack = await parser.detectTechStack(projectPath);

      // PLAN.md 생성 (Planner 에이전트 프롬프트 기반)
      const planContent = await generatePlan(description, techStack, workId, modeDecision.mode);
      await fm.writeFile(`${workDir}/PLAN.md`, planContent);

      // TASK 파일 생성 — 파일명 규칙: TASK-XX.md (WORK prefix 금지)
      const tasks = parser.extractTasksFromPlan(planContent);
      for (const task of tasks) {
        // 파일명: TASK-00.md, TASK-01.md, ... (parseTaskFilename 정규식 준수)
        await fm.writeFile(
          `${workDir}/TASK-${task.id.padStart(2, "0")}.md`,
          task.content
        );
        // progress 파일 생성 (PENDING 초기 상태)
        await fm.writeFile(
          `${workDir}/TASK-${task.id.padStart(2, "0")}_progress.md`,
          generateProgressMd(task.id)
        );
      }

      // PROGRESS.md 초기화
      await fm.writeFile(`${workDir}/PROGRESS.md`, generateWorkProgressMd(workId, tasks));

      // WORK-LIST.md에 IN_PROGRESS 추가
      await parser.addToWorkList(workId, description, "IN_PROGRESS");

      await logWork(workId, "MCP_SERVER", "PLAN",
        `PLAN.md, TASK ${tasks.length}개 생성 완료`);

      // direct 모드: 즉시 실행 가능
      // pipeline 모드: 즉시 실행 가능
      // full 모드: approve_plan 필요
      const nextStep = modeDecision.mode === "full"
        ? `"approve_plan" 도구로 승인하면 실행을 시작합니다.`
        : `"execute_work" 도구로 즉시 실행할 수 있습니다.`;

      return {
        content: [{
          type: "text",
          text: `${workId} 생성 완료\n` +
                `Execution-Mode: ${modeDecision.mode} (${modeDecision.reason})\n` +
                `TASK ${tasks.length}개 분해\n` +
                `경로: ${workDir}\n\n` +
                nextStep,
        }],
      };
    }
  );

  server.tool(
    "execute_work",
    "승인된 WORK의 파이프라인을 실행합니다.",
    {
      work_id: z.string().describe("WORK ID (예: WORK-01)"),
      mode: z.enum(["manual", "auto"]).describe("manual: TASK마다 승인 필요, auto: 연속 실행"),
    },
    async ({ work_id, mode }) => {
      const status = await parser.getWorkStatus(work_id);
      const plan = await parser.readPlan(work_id);
      const executionMode = parser.extractExecutionMode(plan);

      // full 모드에서만 승인 필요
      if (executionMode === "full" && !status.approved) {
        return {
          content: [{
            type: "text",
            text: `${work_id}는 full 모드이며 아직 승인되지 않았습니다. "approve_plan"을 먼저 실행하세요.`,
          }],
        };
      }

      const nextTask = await parser.getNextExecutableTask(work_id);

      if (!nextTask) {
        return {
          content: [{
            type: "text",
            text: `${work_id} 모든 TASK 완료!`,
          }],
        };
      }

      await logWork(work_id, "MCP_SERVER", "DISPATCH",
        `파이프라인 시작 (${mode} 모드) — 다음 TASK: ${nextTask.id}`);

      return {
        content: [{
          type: "text",
          text: `${work_id} 파이프라인 시작 (${mode} 모드)\n` +
                `Execution-Mode: ${executionMode}\n` +
                `다음 TASK: ${nextTask.id} — ${nextTask.title}\n` +
                `진행률: ${status.completed}/${status.total}`,
        }],
      };
    }
  );
}
```

### 4.3 Resource 구현 예시

```typescript
// mcp-server/src/resources/work-list.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WorkParser } from "../core/work-parser.js";

export function registerWorkListResource(server: McpServer) {
  const parser = new WorkParser();

  // 정적 리소스: 전체 WORK 목록 (works/WORK-LIST.md 기반)
  server.resource(
    "work://list",
    "전체 WORK 목록 및 진행 현황",
    async () => {
      const content = await parser.readWorkList(); // works/WORK-LIST.md 파싱
      return {
        contents: [{
          uri: "work://list",
          mimeType: "text/markdown",
          text: content,
        }],
      };
    }
  );

  // 템플릿 리소스: 특정 WORK의 PLAN
  server.resourceTemplate(
    "work://{work_id}/plan",
    "{work_id}의 PLAN.md 내용",
    async ({ work_id }) => {
      const planContent = await parser.readPlan(work_id);
      return {
        contents: [{
          uri: `work://${work_id}/plan`,
          mimeType: "text/markdown",
          text: planContent,
        }],
      };
    }
  );
}
```

### 4.4 Prompt 구현 예시

```typescript
// mcp-server/src/prompts/planner.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "fs/promises";
import { resolve } from "path";

export function registerPlannerPrompt(server: McpServer) {
  server.prompt(
    "planner",
    "프로젝트를 분석하고 WORK/TASK를 분해하는 Planner 에이전트 프롬프트",
    {
      project_description: z.string().describe("구현할 기능 설명"),
      tech_stack: z.string().optional().describe("기술 스택 (자동 감지 가능)"),
    },
    async ({ project_description, tech_stack }) => {
      // 기존 planner.md 프롬프트 로드
      const agentPrompt = await readFile(
        resolve(__dirname, "../../../agents/planner.md"), "utf-8"
      );

      // 참조문서 병합: shared-prompt-sections.md + file-content-schema.md
      const sharedSections = await readFile(
        resolve(__dirname, "../../../agents/shared-prompt-sections.md"), "utf-8"
      );
      const fileSchema = await readFile(
        resolve(__dirname, "../../../agents/file-content-schema.md"), "utf-8"
      );

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: [
                agentPrompt,
                "\n---\n## 참조: 공유 규칙\n",
                sharedSections,
                "\n---\n## 참조: 파일 포맷 스키마\n",
                fileSchema,
                `\n---\n## 요구사항\n${project_description}`,
                tech_stack ? `\n## 기술 스택\n${tech_stack}` : "",
              ].join("\n"),
            },
          },
        ],
      };
    }
  );
}
```

### 4.5 Work Parser 파일명 규칙

```typescript
// core/work-parser.ts (핵심 파싱 규칙)

/**
 * TASK 파일명 정규식 — WORK prefix 포함 금지
 * 올바른 예: TASK-00.md, TASK-01.md
 * 잘못된 예: WORK-01-TASK-00.md (parseTaskFilename() 오류)
 */
const TASK_FILENAME_REGEX = /^TASK-(\d+)\.md$/;
const TASK_PROGRESS_REGEX = /^TASK-(\d+)_progress\.md$/;
const TASK_RESULT_REGEX = /^TASK-(\d+)_result\.md$/;

/**
 * WORK 디렉토리 경로 패턴
 * 올바른 예: works/WORK-01/
 */
const WORK_DIR_PATTERN = "works/WORK-";
```

### 4.6 Webhook Relay 구현 예시

```typescript
// mcp-server/src/core/webhook-relay.ts
import { readFile, writeFile, mkdir } from "fs/promises";
import { logWork } from "./activity-log.js";

interface CallbackConfig {
  enableCallback: boolean;
  taskCallbackUrl?: string;
  progressCallbackUrl?: string;
  stageCallbackUrl?: string;
  callbackToken?: string;
  timeoutMs: number;
}

interface CallbackEntry {
  status: "SENT" | "FAILED" | "PENDING";
  url?: string;
  sentAt: string | null;
  httpStatus: number | null;
  error: string | null;
}

interface PipelineStagePayload {
  workId: string;
  taskId: string;
  stage: "BUILDER" | "VERIFIER" | "COMMITTER";
  event: "START" | "DONE" | "FAILED";
  timestamp: string;
  detail?: string;
}

export class WebhookRelay {
  private config: CallbackConfig;

  constructor(config: CallbackConfig) {
    this.config = config;
  }

  /**
   * 콜백 발송 (실시간 트랙)
   * - 5초 타임아웃, 1회 시도
   * - 실패 시 soft failure (예외를 던지지 않음)
   */
  async sendCallback(
    workId: string,
    taskId: string,
    callbackType: "task" | "progress" | "stage",
    payload: Record<string, unknown>
  ): Promise<CallbackEntry> {
    if (!this.config.enableCallback) {
      return { status: "PENDING", sentAt: null, httpStatus: null, error: null };
    }

    const url = this.getUrl(callbackType);
    if (!url) {
      return { status: "PENDING", sentAt: null, httpStatus: null, error: "URL not configured" };
    }

    const timestamp = new Date().toISOString();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Runner-Api-Key": this.config.callbackToken || "",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const entry: CallbackEntry = {
        status: response.ok ? "SENT" : "FAILED",
        url,
        sentAt: timestamp,
        httpStatus: response.status,
        error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
      };

      // Activity Log 기록
      await logWork(workId, "WEBHOOK", "COMMIT",
        `${callbackType} callback ${entry.status} — ${taskId} → ${url} (HTTP ${response.status})`);

      // callback_status.json 업데이트
      await this.updateCallbackStatus(workId, taskId, callbackType, entry);

      return entry;
    } catch (err) {
      const entry: CallbackEntry = {
        status: "FAILED",
        url,
        sentAt: timestamp,
        httpStatus: null,
        error: err instanceof Error ? err.message : String(err),
      };

      await logWork(workId, "WEBHOOK", "COMMIT",
        `${callbackType} callback FAILED — ${taskId} → ${url} (${entry.error})`);

      await this.updateCallbackStatus(workId, taskId, callbackType, entry);

      return entry;  // soft failure: 예외를 던지지 않음
    }
  }

  /**
   * PipelineStageCallback 전송
   */
  async sendStageCallback(payload: PipelineStagePayload): Promise<CallbackEntry> {
    return this.sendCallback(
      payload.workId,
      payload.taskId,
      "stage",
      payload as unknown as Record<string, unknown>
    );
  }

  /**
   * 배치 재전송 (sync_callbacks Tool에서 호출)
   */
  async syncFailedCallbacks(
    worksDir: string,
    days: number = 2,
    targetWorkId?: string
  ): Promise<{ synced: number; failed: number; details: Array<{ workId: string; taskId: string; type: string; status: string }> }> {
    // works/ 디렉터리 스캔하여 FAILED/PENDING 건 수집 후 일괄 재전송
    // 구현은 callback-status.ts와 연동
    // ...생략 (Phase 2 구현)
    return { synced: 0, failed: 0, details: [] };
  }

  private getUrl(type: "task" | "progress" | "stage"): string | undefined {
    switch (type) {
      case "task": return this.config.taskCallbackUrl;
      case "progress": return this.config.progressCallbackUrl;
      case "stage": return this.config.stageCallbackUrl;
    }
  }

  private async updateCallbackStatus(
    workId: string,
    taskId: string,
    callbackType: string,
    entry: CallbackEntry
  ): Promise<void> {
    const statusPath = `works/${workId}/callback_status.json`;
    let statusData: Record<string, unknown>;

    try {
      const raw = await readFile(statusPath, "utf-8");
      statusData = JSON.parse(raw);
    } catch {
      statusData = { "$schema": "callback_status/v1.0", workId, tasks: {} };
    }

    const tasks = (statusData as any).tasks || {};
    if (!tasks[taskId]) tasks[taskId] = {};
    tasks[taskId][`${callbackType}Callback`] = entry;
    (statusData as any).tasks = tasks;

    await mkdir(`works/${workId}`, { recursive: true });
    await writeFile(statusPath, JSON.stringify(statusData, null, 2));
  }
}
```

---

## 5. 연동 시나리오

### 5.1 Claude Desktop에서 사용

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "uc-taskmanager": {
      "command": "bun",
      "args": ["run", "/path/to/uc-taskmanager-claude-agent/mcp-server/src/index.ts"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "WORKS_DIR": "/path/to/project/works"
      }
    }
  }
}
```

사용자 대화 예시:
```
User: 블로그 시스템의 댓글 기능을 만들어줘

Claude: [create_work 도구 호출]
  WORK-03 생성 완료
  Execution-Mode: full (multi_domain: BE + FE 동시 변경)
  TASK 5개 분해:
    TASK-00: Comment 모델 + 마이그레이션
    TASK-01: 댓글 CRUD API
    TASK-02: 대댓글 (self-relation)
    TASK-03: 프론트엔드 댓글 컴포넌트
    TASK-04: 통합 + 알림

  full 모드이므로 승인이 필요합니다. 승인하시겠습니까?

User: 승인

Claude: [approve_plan -> execute_work(auto)]
  WORK-03 파이프라인 시작 (auto 모드)
  ...
```

### 5.2 Claude Code CLI에서 사용

```bash
# MCP 서버 등록
claude mcp add uc-taskmanager -- \
  bun run /path/to/mcp-server/src/index.ts

# 등록 확인
claude mcp list
# uc-taskmanager: connected

# 사용 — 기존 [태그] 기반 Agent 호출과 공존
# MCP 방식: claude 내에서 MCP Tool 자동 사용
# CLI 방식: [추가기능], [버그수정] 태그로 기존 파이프라인 사용
claude
> 이 프로젝트를 분석해서 WORK 계획을 세워줘
```

### 5.3 UC TeamSpace Runner에서 사용

Runner가 MCP Client로서 서버에 연결하는 방식:

```typescript
// UC TeamSpace Runner (기존 spawn 방식 -> MCP Client 방식)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class WorkPipelineRunner {
  private client: Client;

  async connect() {
    const transport = new StdioClientTransport({
      command: "bun",
      args: ["run", "/path/to/mcp-server/src/index.ts"],
    });

    this.client = new Client({ name: "uc-runner", version: "1.0.0" });
    await this.client.connect(transport);
  }

  async executeRequirement(reqId: string, description: string) {
    // 1. WORK 생성 (execution-mode 자동 판정)
    const createResult = await this.client.callTool({
      name: "create_work",
      arguments: { description },
    });

    // 2. full 모드일 때만 승인 필요
    const workId = parseWorkId(createResult);
    const status = await this.client.callTool({
      name: "get_work_status",
      arguments: { work_id: workId },
    });

    if (status.execution_mode === "full") {
      await this.client.callTool({
        name: "approve_plan",
        arguments: { work_id: workId },
      });
    }

    // 3. 자동 실행
    await this.client.callTool({
      name: "execute_work",
      arguments: { work_id: workId, mode: "auto" },
    });

    // 4. 상태 폴링
    let workStatus;
    do {
      workStatus = await this.client.callTool({
        name: "get_work_status",
        arguments: { work_id: workId },
      });
      await sleep(5000);
    } while (!isCompleted(workStatus));

    // 5. Push (README 업데이트 + WORK-LIST 갱신 + git push)
    await this.client.callTool({
      name: "push_work",
      arguments: { work_id: workId, update_readme: true },
    });

    // 6. UC TeamSpace Backend에 결과 보고
    await this.reportToTeamSpace(reqId, workId, workStatus);
  }
}
```

### 5.4 외부 고객 웹앱에서 사용 (HTTP Transport)

```typescript
// 외부 고객 웹앱 -> MCP HTTP 연결
const response = await fetch("https://mcp.yourplatform.com/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <customer_api_key>",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "create_work",
      arguments: {
        description: "사용자 인증 기능 구현",
        project_path: "/workspace/customer-project",
      },
    },
  }),
});
```

---

## 6. 구현 로드맵

### Phase 1: Core MCP Server (2주)

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK-00 | 프로젝트 초기화, SDK 설치, 기본 서버 뼈대 | `mcp-server/` 디렉터리, package.json |
| TASK-01 | FileManager + WorkParser 코어 모듈. 파일명 정규식: `/^TASK-(\d+)\.md$/`, `/^TASK-(\d+)_progress\.md$/`, `/^TASK-(\d+)_result\.md$/` | `core/file-manager.ts`, `core/work-parser.ts` |
| TASK-02 | Monitor Tools (list_works, get_work_status, get_task_result, get_pipeline_log) | `tools/monitor.ts` |
| TASK-03 | Resources (WORK 목록 `works/WORK-LIST.md` 기반, PLAN, TASK, result) | `resources/*.ts` |
| TASK-04 | Prompts (6개 에이전트 프롬프트 + 참조문서 자동 병합) | `prompts/*.ts` |

### Phase 1.5: CLAUDE.md MCP 프롬프트 전환 (1~2일)

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK-P1 | CLAUDE.md Agent 호출 규칙 → MCP 모드 + Fallback 이중 구조로 변경 | `CLAUDE.md` 수정 |
| TASK-P2 | MCP 프롬프트 경유 파이프라인 동작 검증 (direct/pipeline/full 각 1건) | 검증 결과 기록 |
| TASK-P3 | README.md Phase 1.5 전환 가이드 + Fallback 동작 설명 추가 | `README.md` 수정 |

> **Phase 1.5 특징**: 코드 변경 없이 CLAUDE.md 지침만 수정. MCP 서버 Phase 1 구현을 그대로 활용하며, 파일 생성은 Claude 기본 도구에 의존. MCP 연결 실패 시 기존 Agent 방식으로 자동 Fallback.

### Phase 2: Pipeline Execution (2주)

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK-05 | Execution-Mode 판정 엔진 (`.agent/router_rule_config.json` 기반) | `core/execution-mode.ts` |
| TASK-06 | Pipeline Tools (create_work + mode 판정, approve_plan + mode별 동작, execute_work) | `tools/pipeline.ts` |
| TASK-07 | Task Tools (get_next_task, execute_task + context-handoff, retry_task + target 구분) | `tools/task.ts` |
| TASK-08 | DAG 엔진 (의존성 해석: result file exists -> DONE, ALL deps DONE -> READY, else -> BLOCKED) | `core/dag.ts` |
| TASK-09 | 슬라이딩 윈도우 컨텍스트 관리 + Activity Log MCP 래퍼 | `core/context-window.ts`, `core/activity-log.ts` |
| TASK-10 | Git Tools (commit_work, push_work + 3단계 Push 절차) | `tools/git.ts` |
| TASK-11 | Webhook Relay 모듈 (콜백 발송, callback_status.json 관리, 2트랙 전략) | `core/webhook-relay.ts`, `core/callback-status.ts` |
| TASK-12 | sync_callbacks Monitor Tool + 배치 재전송 로직 | `tools/monitor.ts` (sync_callbacks 추가) |

### Phase 3: Integration (1주)

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK-13 | Claude Desktop 연동 테스트 + config 생성 | 연동 가이드 |
| TASK-14 | Claude Code CLI 연동 (`claude mcp add`) + 기존 [태그] 방식 공존 확인 | 연동 스크립트 |
| TASK-15 | UC TeamSpace Runner MCP Client 전환 | Runner 코드 수정 |

### Phase 4: Production (1주)

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK-16 | HTTP Transport 추가 (Streamable HTTP) | `index.ts` HTTP 모드 |
| TASK-17 | 인증/인가 (OAuth 2.0 + API Key) | 인증 미들웨어 |
| TASK-18 | README, 설치 가이드, API 문서 | 문서 |

**총 예상 기간: 6주 + 1~2일 (시니어 1명 + Claude Code SDD Pipeline)**
**SDD Pipeline 적용 시: 약 2~3주로 단축 가능 (Phase 1.5는 1일 이내)**

---

## 7. 데이터 흐름 상세

### 7.1 WORK 생성 -> 실행 완료 전체 흐름

```
[Client] ─── create_work ──→ [MCP Server]
                                  │
                                  ├── determineExecutionMode()
                                  ├── detectTechStack()
                                  ├── generatePlan()  ← planner.md 프롬프트
                                  ├── write PLAN.md   (Status: PLANNED)
                                  ├── write TASK-00.md ~ TASK-04.md
                                  ├── write TASK-XX_progress.md (Status: PENDING)
                                  ├── write PROGRESS.md
                                  └── update WORK-LIST.md (IN_PROGRESS)
                                  │
              ┌───────────────────┤
              │ direct/pipeline   │ full
              │ (즉시 실행 가능)    │ (승인 필요)
              │                   │
              │         [Client] ─── approve_plan ──→ [MCP Server]
              │                                          │
              │                                          └── PLAN.md Status: PLANNED 유지
              │                                              (현행: 별도 APPROVED 마킹 없음,
              │                                               승인 상태는 서버 내부에서 관리)
              │                   │
              └───────────────────┤
                                  │
[Client] ─── execute_work ──→ [MCP Server]
                                  │
                      ┌───────────┴───────────┐
                      │   scheduler 프롬프트    │
                      │   DAG 해석 → 실행 순서  │
                      └───────────┬───────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼              ▼
              [TASK-00]    [TASK-03]       (의존성 대기)
              builder →    builder →
              verifier →   verifier →      context-handoff:
              committer    committer       FULL → SUMMARY → DROP
                    │             │
                    └──────┬──────┘
                           ▼
                     [TASK-01] ← TASK-00 의존
                     builder → verifier → committer
                           │
                           ▼
                     [TASK-02] ← TASK-01 의존
                           │
                           ▼
                     [TASK-04] ← TASK-02, TASK-03 의존
                           │
                           ▼
                      WORK 완료
                      PROGRESS.md 업데이트
                      (push_work 호출 시: README + WORK-LIST + git push)
```

### 7.2 컨텍스트 격리 유지

MCP 서버 방식에서도 핵심 장점인 **컨텍스트 격리**는 유지된다:

```
MCP Client (Claude Desktop/Code)의 컨텍스트:
  ┌───────────────────────────────────────┐
  │ MCP Tool 호출 요약만 누적              │
  │                                        │
  │ create_work → "WORK-03 생성, 5 TASK"  │  ~50 tokens
  │ execute_work → "TASK-00 시작"         │  ~30 tokens
  │ (서버 내부에서 builder 실행)            │
  │ → result: "20 files, PASS"            │  ~50 tokens
  │ (서버 내부에서 TASK-01 실행)            │
  │ → result: "15 files, PASS"            │  ~50 tokens
  │ ...                                    │
  │ Total after 5 TASKs: ~300 tokens      │
  └───────────────────────────────────────┘

  vs. 단일 세션: 50,000~100,000 tokens
```

### 7.3 슬라이딩 윈도우 컨텍스트 전달 상세

`execute_task` 내부에서 builder -> verifier -> committer 3단계를 순차 실행할 때:

```
Builder 실행 결과:
  context-handoff = { what, why, caution, incomplete }

Verifier 호출 시:
  Builder context → FULL (what, why, caution, incomplete 모두 전달)

Committer 호출 시:
  Verifier context → FULL
  Builder context  → SUMMARY (what만 1-3줄)

다음 TASK의 Builder 호출 시:
  이전 TASK의 Committer context → FULL
  이전 TASK의 Verifier context  → SUMMARY
  이전 TASK의 Builder context   → DROP
```

#### 7.3.1 TASK 간 의존성 context-handoff 전달 흐름

위의 에이전트 간 윈도우(builder -> verifier -> committer)와 별도로, **TASK 간 의존성**에서도 `applyTaskDependencyWindow()`가 적용된다. 아래는 TASK-00 -> TASK-01 -> TASK-02 체인에서의 context-handoff 전달 흐름이다.

```
TASK-00 실행 완료
  ├── TASK-00_result.md 생성
  │     └── Context Handoff:
  │           ├── Builder Context (SUMMARY): what 1-3줄
  │           └── Verifier Context (FULL): what, why, caution, incomplete
  │
  ▼
TASK-01 실행 시 (TASK-00에 의존, 거리=1)
  ├── applyTaskDependencyWindow("TASK-01", dag, resultDir)
  │     └── TASK-00 → 거리 1 → FULL
  │           result.md의 Context Handoff 4개 필드 모두 전달
  │
  ├── Builder 입력:
  │     ├── TASK-01 spec (TASK-01.md)
  │     └── previous_context:
  │           └── "### TASK-00 (FULL - 직전 의존)
  │                 what: ...
  │                 why: ...
  │                 caution: ...
  │                 incomplete: ..."
  │
  ├── TASK-01_result.md 생성
  │
  ▼
TASK-02 실행 시 (TASK-01에 의존, TASK-00은 2단계 전)
  ├── applyTaskDependencyWindow("TASK-02", dag, resultDir)
  │     ├── TASK-01 → 거리 1 → FULL
  │     └── TASK-00 → 거리 2 → SUMMARY (what만)
  │
  ├── Builder 입력:
  │     ├── TASK-02 spec (TASK-02.md)
  │     └── previous_context:
  │           ├── "### TASK-01 (FULL - 직전 의존)
  │           │     what: ...
  │           │     why: ...
  │           │     caution: ...
  │           │     incomplete: ..."
  │           └── "### TASK-00 (SUMMARY - 2단계 전)
  │                 what: ..."
  │
  ▼
TASK-03 실행 시 (TASK-02에 의존, TASK-00은 3단계 전)
  ├── applyTaskDependencyWindow("TASK-03", dag, resultDir)
  │     ├── TASK-02 → 거리 1 → FULL
  │     ├── TASK-01 → 거리 2 → SUMMARY
  │     └── TASK-00 → 거리 3 → DROP (전달하지 않음)
  │
  └── Builder 입력:
        ├── TASK-03 spec
        └── previous_context:
              ├── TASK-02 FULL
              └── TASK-01 SUMMARY
              (TASK-00은 DROP되어 포함되지 않음)
```

**다이아몬드 의존성 예시:**

```
TASK-00 ──→ TASK-01 ──→ TASK-03
   └────→ TASK-02 ──────┘

TASK-03 실행 시:
  ├── TASK-01 → 거리 1 → FULL
  ├── TASK-02 → 거리 1 → FULL
  └── TASK-00 → 거리 2 (shortest path via TASK-01 or TASK-02) → SUMMARY
```

> **XML -> MCP 매핑**: 현행 dispatch XML의 `<previous-results>` 요소(xml-schema.md SS 1)가 `execute_task`의 `previous_context` 파라미터에 매핑된다. `execute_work` 내부에서 `applyTaskDependencyWindow()`가 이 매핑을 자동 수행하므로, MCP 클라이언트는 `<previous-results>`를 직접 구성할 필요가 없다.

---

## 8. 기존 CLI 방식과의 호환성

MCP 서버는 기존 CLI 방식과 **동일한 파일 시스템**을 공유하므로, 두 방식이 공존할 수 있다:

| 시나리오 | CLI 방식 (Agent) | Phase 1.5 (MCP Prompt 경유) | Phase 2+ (MCP Full) |
|---------|-----------------|---------------------------|-------------------|
| WORK 생성 | `[추가기능]` → agent-flow.md → planner.md 직접 읽기 | `[추가기능]` → MCP `router` prompt → Claude 파일 도구로 생성 | `create_work` tool 호출 |
| 상태 조회 | 파일 직접 읽기 | MCP `list_works` / `get_work_status` 도구 | 동일 |
| TASK 실행 | scheduler.md 직접 읽기 → dispatch | MCP `scheduler` prompt → Claude 파일 도구 | `execute_work` tool 호출 |
| 프롬프트 소스 | `~/.claude/agents/*.md` 직접 읽기 | MCP Prompts API (참조문서 자동 병합) | 동일 |
| 파일 생성 | Claude 기본 파일 도구 | Claude 기본 파일 도구 (변경 없음) | MCP 실행 도구 |
| 파일 구조 | `works/WORK-01/PLAN.md` | 동일 | 동일 |
| Fallback | — | MCP 미연결 시 Agent 방식 자동 전환 | — |

**전환 경로**: CLI 방식 → Phase 1.5 (CLAUDE.md만 수정) → Phase 2+ (MCP 실행 도구 추가). 각 단계에서 기존 사용자는 `[태그]` 방식을 그대로 사용하며, 내부 구현만 점진적으로 MCP로 이전된다.

---

## 9. 보안 고려사항

| 항목 | stdio 모드 | HTTP 모드 |
|------|-----------|-----------|
| 인증 | 프로세스 실행 권한에 의존 | OAuth 2.0 + PKCE 필수 |
| 인가 | 파일 시스템 퍼미션 | MCP scope 기반 (read/write/execute) |
| 데이터 | 로컬 파일 직접 접근 | API Gateway 통해 접근 |
| 비밀 관리 | 환경변수 | Secret Manager 연동 |
| 로깅 | stderr + Activity Log | 구조화된 로그 (JSON) + Activity Log |

---

## 10. 성공 지표

| 지표 | 목표 |
|------|------|
| Claude Desktop에서 WORK 생성 -> 완료 E2E | 동작 확인 |
| Claude Code CLI에서 기존 CLI 방식과 MCP 방식 공존 | 파일 충돌 없음, [태그] 방식과 MCP Tool 방식 동시 사용 가능 |
| UC TeamSpace Runner MCP Client 전환 | spawn 대비 안정성 동등 이상 |
| HTTP Transport를 통한 원격 접근 | 인증 포함 E2E |
| 컨텍스트 토큰 소비 | TASK 5개 실행 후 300 tokens 이하 (MCP 요약 기준) |
| Execution-Mode 판정 정확도 | CLI 방식과 동일한 판정 결과 |

---

## 부록 A: package.json 초안

```json
{
  "name": "@uc/taskmanager-mcp-server",
  "version": "1.1.0",
  "type": "module",
  "bin": {
    "uc-taskmanager-mcp": "./build/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "bun run src/index.ts",
    "start": "node build/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.2.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.7.0"
  }
}
```

## 부록 B: 참고 자료

- [MCP 공식 문서 - Build Server](https://modelcontextprotocol.io/docs/develop/build-server)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [uc-taskmanager SDD WORK Pipeline 방법론 v1.7](./SDD-WORK-Pipeline-Methodology.md)
- [UC TeamSpace SDD v1.3](./SDD_v1.3_Complete.md)

## 부록 C: 검토 리포트 반영 체크리스트

v1.1에서 반영된 WORK-27 검토 리포트 발견사항:

### CRITICAL (1건)
- [x] C-1: `${workId}-TASK-XX.md` -> `TASK-XX.md` 파일명 수정 (4.2절)

### HIGH (6건)
- [x] H-1: `tasks/` -> `works/` 경로 전역 수정 (1.1, 1.3, 2.1, 2.2, 3.2, 5.1, 8절)
- [x] H-2: `TASK-XX-result.md` -> `TASK-XX_result.md` 파일명 수정 (1.1, 8절)
- [x] H-3: create_work에 Execution-Mode 판정 로직 추가 (3.3.1, 3.6절 신규)
- [x] H-4: 슬라이딩 윈도우 컨텍스트 전달 MCP 구현 전략 추가 (3.7절 신규, 7.3절 신규)
- [x] H-5: `BACKLOG.md` -> `works/WORK-LIST.md` 참조 수정 (3.4절)
- [x] H-6: push_work에 Push 절차 3단계 반영 (3.3.4절)

### MEDIUM (7건)
- [x] M-1: Router 프롬프트 MCP Prompts에 추가 (3.5절)
- [x] M-2: MCP SDK API `registerTool()` -> `server.tool()` 수정 (4.2절)
- [x] M-3: approve_plan 모드별 동작 구분 추가 (3.3.1절 + 4.2절)
- [x] M-4: retry_task 재시도 대상(builder/committer) 구분 추가 (3.3.2절)
- [x] M-5: PLAN.md "APPROVED" 마킹 -> 서버 내부 승인 상태 관리로 변경 (7.1절)
- [x] M-6: config://agents 리소스 구체화 (3.4절)
- [x] M-7: Activity Log MCP 환경 유지 전략 추가 (3.8절 신규)

---

### v1.2 Callback/Webhook 전략 반영 체크리스트

| 항목 | 반영 위치 | 완료 |
|------|----------|------|
| 인증 헤더 통일 (`X-Runner-Api-Key`) | 3.9.1절 | [x] |
| 2트랙 콜백 전략 (실시간 + 배치) | 3.9.2절 | [x] |
| `callback_status.json` 스키마 정의 | 3.9.3절 | [x] |
| PipelineStageCallback 정식 정의 | 3.9.4절 | [x] |
| MCP 서버 콜백 설정 (`enableCallback` 등) | 3.9.5절 | [x] |
| Webhook Relay 모듈 설계 | 3.9.6절 | [x] |
| Webhook Relay 구현 예시 | 4.6절 | [x] |
| `sync_callbacks` Monitor Tool 추가 | 3.3.3절 | [x] |
| 프로젝트 구조에 `webhook-relay.ts`, `callback-status.ts` 추가 | 3.2절 | [x] |
| 로드맵 Phase 2에 Webhook Relay TASK 추가 (TASK-11, TASK-12) | 6절 | [x] |
| 로드맵 Phase 3~4 TASK 번호 재정렬 (TASK-13~18) | 6절 | [x] |

---

### v1.3 TASK 간 의존성 context-handoff 전달 로직 반영 체크리스트

| 항목 | 반영 위치 | 완료 |
|------|----------|------|
| `applyTaskDependencyWindow()` 함수 설계 (TypeScript 코드) | 3.7.1절 | [x] |
| `result.md`에서 context-handoff 추출 로직 (`extractContextHandoffFromResult`) | 3.7.1절 | [x] |
| DAG shortest path 계산 방법 (BFS 기반 `TaskDag` 인터페이스) | 3.7.1절 | [x] |
| `execute_task`의 `previous_context` 자동 주입 로직 상세 | 3.3.2절 | [x] |
| `execute_work` 내부에서 `applyTaskDependencyWindow()` 자동 호출 설명 | 3.3.2절, 3.7.1절 | [x] |
| TASK-00 -> TASK-01 -> TASK-02 체인 context-handoff 전달 다이어그램 | 7.3.1절 | [x] |
| 다이아몬드 의존성 예시 다이어그램 | 7.3.1절 | [x] |
| `<previous-results>` XML -> MCP 매핑 구현 상세 | 7.3.1절 | [x] |
| 문서 버전 v1.2 -> v1.3 업데이트 | 헤더, 변경 이력 | [x] |

---

### v1.4 Phase 1.5 CLAUDE.md MCP 프롬프트 전환 설계 반영 체크리스트

| 항목 | 반영 위치 | 완료 |
|------|----------|------|
| §3.10 Phase 1.5 CLAUDE.md MCP 프롬프트 전환 설계 신규 섹션 | 3.10절 | [x] |
| CLAUDE.md 지침 변경 전/후 설계 (MCP 모드 + Fallback) | 3.10.2절 | [x] |
| 실행 흐름 다이어그램 | 3.10.3절 | [x] |
| MCP 프롬프트 활용 이점 정리 | 3.10.4절 | [x] |
| Phase 1.5 한계 및 Phase 2 해소 방안 | 3.10.5절 | [x] |
| 구현 산출물 목록 | 3.10.6절 | [x] |
| 로드맵에 Phase 1.5 삽입 (TASK-P1~P3) | 6절 | [x] |
| 호환성 테이블 3열 → CLI / Phase 1.5 / Phase 2+ 비교 | 8절 | [x] |
| 문서 버전 v1.3 → v1.4 업데이트 | 헤더, 변경 이력 | [x] |
