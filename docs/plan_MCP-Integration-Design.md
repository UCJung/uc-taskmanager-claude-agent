# uc-taskmanager MCP Server 통합 설계 명세서

**문서 버전**: v1.1
**작성일**: 2026-03-17
**최종 수정**: 2026-03-17 (v1.1 — WORK-27 검토 리포트 반영)
**작성자**: UC. Jung (P&T 선행연구개발팀)
**대상 시스템**: uc-taskmanager-claude-agent + UC TeamSpace
**상태**: 설계 초안 (Design Draft)

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-03-17 | 초안 작성 |
| v1.1 | 2026-03-17 | WORK-27 검토 리포트 반영 — CRITICAL 1건, HIGH 6건, MEDIUM 7건 수정 |

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
| `execute_task` | 단일 TASK 실행 (builder -> verifier -> committer) | `{ work_id: string, task_id: string, previous_context?: string }` | `{ status: "pass" \| "fail", result_path: string, commit_hash?: string, context_handoff: ContextHandoff }` |
| `retry_task` | 실패한 TASK 재시도. 재시도 대상(builder/committer)을 구분하여 처리 | `{ work_id: string, task_id: string, retry_target?: "builder" \| "committer" }` | `{ attempt: number, max_attempts: 3, target: string, status: string }` |
| `approve_task` | TASK 결과 승인 (수동 모드) | `{ work_id: string, task_id: string }` | `{ approved: boolean }` |

> **재시도 정책**: builder 최대 3회, committer 최대 3회 (각각 독립 카운트). Committer Gate Check 실패 시(progress.md 미존재, Status != COMPLETED, Files changed 비어있음) builder 재디스패치.

#### 3.3.3 Monitor Tools

| Tool 이름 | 설명 | 입력 | 출력 |
|-----------|------|------|------|
| `list_works` | 전체 WORK 목록 + 진행률 | `{}` | `{ works: WorkSummary[] }` |
| `get_work_status` | 특정 WORK 상세 상태 | `{ work_id: string }` | `{ progress: "3/5", execution_mode: string, tasks: TaskStatus[], dag: DagInfo }` |
| `get_task_result` | TASK result.md 내용 조회 | `{ work_id: string, task_id: string }` | `{ content: string, verification: VerifyResult }` |
| `get_pipeline_log` | 파이프라인 Activity Log 조회 (`work_{WORK_ID}.log` 파싱, `[timestamp]_AGENT_STAGE_DESC` 포맷) | `{ work_id: string, last_n?: number }` | `{ entries: LogEntry[] }` |

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

### Phase 2: Pipeline Execution (2주)

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK-05 | Execution-Mode 판정 엔진 (`.agent/router_rule_config.json` 기반) | `core/execution-mode.ts` |
| TASK-06 | Pipeline Tools (create_work + mode 판정, approve_plan + mode별 동작, execute_work) | `tools/pipeline.ts` |
| TASK-07 | Task Tools (get_next_task, execute_task + context-handoff, retry_task + target 구분) | `tools/task.ts` |
| TASK-08 | DAG 엔진 (의존성 해석: result file exists -> DONE, ALL deps DONE -> READY, else -> BLOCKED) | `core/dag.ts` |
| TASK-09 | 슬라이딩 윈도우 컨텍스트 관리 + Activity Log MCP 래퍼 | `core/context-window.ts`, `core/activity-log.ts` |
| TASK-10 | Git Tools (commit_work, push_work + 3단계 Push 절차) | `tools/git.ts` |

### Phase 3: Integration (1주)

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK-11 | Claude Desktop 연동 테스트 + config 생성 | 연동 가이드 |
| TASK-12 | Claude Code CLI 연동 (`claude mcp add`) + 기존 [태그] 방식 공존 확인 | 연동 스크립트 |
| TASK-13 | UC TeamSpace Runner MCP Client 전환 | Runner 코드 수정 |

### Phase 4: Production (1주)

| TASK | 내용 | 산출물 |
|------|------|--------|
| TASK-14 | HTTP Transport 추가 (Streamable HTTP) | `index.ts` HTTP 모드 |
| TASK-15 | 인증/인가 (OAuth 2.0 + API Key) | 인증 미들웨어 |
| TASK-16 | README, 설치 가이드, API 문서 | 문서 |

**총 예상 기간: 6주 (시니어 1명 + Claude Code SDD Pipeline)**
**SDD Pipeline 적용 시: 약 2~3주로 단축 가능**

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

---

## 8. 기존 CLI 방식과의 호환성

MCP 서버는 기존 CLI 방식과 **동일한 파일 시스템**을 공유하므로, 두 방식이 공존할 수 있다:

| 시나리오 | CLI 방식 | MCP 방식 |
|---------|---------|---------|
| WORK 생성 | `> [추가기능] planner로 계획 세워줘` | `create_work` tool 호출 |
| 상태 조회 | `> WORK 목록` | `list_works` tool / `work://list` resource |
| TASK 실행 | `> WORK-01 파이프라인 실행` | `execute_work` tool 호출 |
| 파일 구조 | `works/WORK-01/PLAN.md` | 동일 |
| TASK 파일 | `works/WORK-01/TASK-00.md` | 동일 |
| 산출물 | `works/WORK-01/TASK-00_result.md` | 동일 |
| 진행 상태 | `works/WORK-01/TASK-00_progress.md` | 동일 |
| WORK 목록 | `works/WORK-LIST.md` | 동일 |
| 에이전트 프롬프트 | `~/.claude/agents/*.md` | 동일 (MCP Prompts가 같은 파일 참조) |

MCP 서버를 도입해도 기존 CLI 사용자는 아무것도 바꿀 필요가 없다. MCP는 **추가 인터페이스**이지 대체가 아니다.

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
