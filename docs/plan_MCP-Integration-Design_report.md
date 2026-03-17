# MCP Integration Design 설계 명세서 검토 리포트

**문서 버전**: v1.0
**검토일**: 2026-03-17
**대상 문서**: `docs/plan_MCP-Integration-Design.md` (v1.0, 847줄)
**검토 범위**: agents/*.md 12개 파일의 현행 로직과의 정합성 분석
**검토자**: Router (WORK-27, direct mode)

---

## 1. 검토 요약 (Executive Summary)

설계 명세서는 uc-taskmanager의 파이프라인을 MCP 서버로 래핑하여 다중 클라이언트 접근을 가능하게 하는 방향을 제시한다. 전체적으로 현행 에이전트 아키텍처에 대한 이해가 높으며, MCP 표준 프로토콜 활용 전략이 타당하다. 다만 **현행 에이전트 파일 구조, 경로 규칙, 실행 모드 체계와의 불일치**가 다수 발견되었으며, 이를 반영하지 않으면 구현 단계에서 혼선이 발생할 수 있다.

| 구분 | 건수 |
|------|------|
| 경로/파일명 불일치 | 7건 |
| 현행 로직 미반영 | 6건 |
| 설계 보완 필요 | 5건 |
| 긍정 평가 | 4건 |

---

## 2. 섹션별 상세 검토

### 2.1 섹션 1: 개요 (1.1~1.3)

**평가: 양호 (보완 필요)**

#### 불일치 사항

| # | 위치 | 내용 | 현행 | 심각도 |
|---|------|------|------|--------|
| 1 | 1.1 배경, 15줄 | "`tasks/WORK-XX/` 디렉터리에 PLAN.md, TASK-XX.md, TASK-XX-result.md 형태로 산출물이 쌓이는 구조" | 현행 경로는 `works/WORK-XX/`이며, result 파일명은 `TASK-XX_result.md` (하이픈이 아닌 **언더스코어** 구분자) | HIGH |
| 2 | 1.3 설계 원칙, 31줄 | "`tasks/WORK-XX/` 디렉터리" 언급 | `works/WORK-XX/` (WORK-13부터 변경됨) | HIGH |

#### 보완 권고
- `tasks/` 경로를 전역적으로 `works/`로 수정
- `TASK-XX-result.md`를 `TASK-XX_result.md`로 수정 (파일명 규칙: `file-content-schema.md` S 7)

---

### 2.2 섹션 2: 아키텍처 (2.1~2.3)

**평가: 양호**

#### 긍정 평가
- As-Is/To-Be 아키텍처 다이어그램이 명확
- MCP 3-Layer(Tool/Resource/Prompt) 구조가 현행 에이전트 역할과 잘 대응
- 기존 파일 시스템 기반 동작 유지 원칙이 적절

#### 불일치 사항

| # | 위치 | 내용 | 현행 | 심각도 |
|---|------|------|------|--------|
| 3 | 2.1 As-Is 다이어그램 | `tasks/` 디렉토리 표시 | `works/` | MEDIUM |
| 4 | 2.2 To-Be 다이어그램 | `tasks/` 디렉토리 표시 | `works/` | MEDIUM |
| 5 | 2.3 핵심 변경점 | "상태 관리: 파일 시스템 직접 읽기" | 현행은 파일 시스템 + `TASK-XX_progress.md` 상태 머신 (PENDING -> STARTED -> IN_PROGRESS -> COMPLETED) 기반. 단순 "직접 읽기"보다 구조화되어 있음 | LOW |

#### 보완 권고
- 에이전트 프롬프트 경로가 `.claude/agents/*.md`로 표기되어 있으나, 현행은 **전역 경로 `~/.claude/agents/*.md`** 와 **프로젝트 로컬 `agents/*.md`** 이중 구조. MCP 서버가 어느 경로를 참조할지 명시 필요

---

### 2.3 섹션 3: MCP Server 상세 설계 (3.1~3.5)

**평가: 보완 필요**

#### 3.3 Tools 설계 검토

**Pipeline Tools (3.3.1)**

| # | 도구 | 검토 결과 | 심각도 |
|---|------|----------|--------|
| 6 | `create_work` | 현행 Router의 execution-mode 판정 로직(`.agent/router_rule_config.json` 기반)이 반영되지 않음. direct/pipeline/full 중 어떤 모드로 WORK를 생성할지 판정 단계가 누락됨 | HIGH |
| 7 | `execute_work` | 현행 Scheduler의 DAG Resolution + 사용자 승인 게이트가 mode="manual"일 때만 적용되는데, 이 동작이 정확히 기술되어 있음 | OK |
| 8 | `approve_plan` | 현행 Planner의 "승인 후 파일 생성" 패턴과 일치하나, full 모드에서만 승인이 필요하고 direct/pipeline은 즉시 실행. 이 모드 구분이 도구 설계에 반영되지 않음 | MEDIUM |

**Task Tools (3.3.2)**

| # | 도구 | 검토 결과 | 심각도 |
|---|------|----------|--------|
| 9 | `execute_task` | "builder -> verifier -> committer" 3단계 파이프라인이 정확. 다만 현행의 Committer Gate Check (progress.md 존재 + Status=COMPLETED + Files changed 비어있지 않음) 실패 시 builder 재디스패치 로직이 도구 수준에서 어떻게 처리될지 미기술 | MEDIUM |
| 10 | `retry_task` | 현행 Scheduler의 재시도 로직: builder 최대 3회, committer 최대 3회 (각각 독립). 도구에서는 단순히 `max_attempts: 3`으로만 표현되어 재시도 대상(builder vs committer)이 불분명 | MEDIUM |

**Monitor Tools (3.3.3)**

| # | 도구 | 검토 결과 | 심각도 |
|---|------|----------|--------|
| 11 | `get_pipeline_log` | 현행 Activity Log(`work_{WORK_ID}.log`) 형식과 대응. `[timestamp]_AGENT_STAGE_DESC` 포맷 파싱 필요 | OK |

**Git Tools (3.3.4)**

| # | 도구 | 검토 결과 | 심각도 |
|---|------|----------|--------|
| 12 | `push_work` | 현행 Push 절차(CLAUDE.md): README 업데이트 -> WORK-LIST.md COMPLETED 변경 -> git push. 이 3단계 절차가 도구에 반영되지 않음 | HIGH |

#### 3.4 Resources 설계 검토

| # | URI | 검토 결과 | 심각도 |
|---|-----|----------|--------|
| 13 | `work://list` | "BACKLOG.md 기반"이라고 기술되어 있으나, 현행은 `works/WORK-LIST.md` 파일 사용. BACKLOG.md는 존재하지 않음 | HIGH |
| 14 | `work://{work_id}/task/{task_id}/result` | 파일명 `TASK-XX_result.md` (언더스코어)와 일치하는지 구현 시 주의 필요 | LOW |
| 15 | `config://agents` | 현행 에이전트 설정은 `.agent/router_rule_config.json`(Router 판정 기준)만 존재. "에이전트 설정 목록"이 무엇을 의미하는지 구체화 필요 | MEDIUM |

#### 3.5 Prompts 설계 검토

| # | 프롬프트 | 검토 결과 | 심각도 |
|---|---------|----------|--------|
| 16 | 전체 | 현행 에이전트 6개(router, planner, scheduler, builder, verifier, committer) + 참조문서 6개(agent-flow, file-content-schema, shared-prompt-sections, xml-schema, context-policy, work-activity-log) = 12개 파일인데, MCP Prompts에는 5개 에이전트만 노출. **Router 프롬프트가 누락**됨 | MEDIUM |
| 17 | `builder` | `project_context` 인자가 있으나, 현행 Builder는 dispatch XML의 `<context-handoff>`와 `<previous-results>`로 컨텍스트를 받음. 인자 설계가 현행 XML 기반 컨텍스트 전달과 불일치 | MEDIUM |
| 18 | 전체 | 참조문서(shared-prompt-sections.md, file-content-schema.md 등)의 내용을 프롬프트에 어떻게 병합할지 전략이 `planner.ts` 예시에만 있고, 나머지 4개 에이전트에 대한 병합 전략은 미기술 | LOW |

---

### 2.4 섹션 4: 핵심 코드 설계 (4.1~4.4)

**평가: 보완 필요**

#### 코드 수준 불일치

| # | 위치 | 내용 | 현행 | 심각도 |
|---|------|------|------|--------|
| 19 | 4.2 Pipeline Tool, 359줄 | `${workDir}/${workId}-TASK-${task.id.padStart(2, "0")}.md` | 현행 파일명 규칙: `TASK-XX.md` (WORK prefix 금지). `${workId}-TASK-XX.md` 형식은 `parseTaskFilename()` 정규식 `/^TASK-(\d+)\.md$/`에 매칭되지 않아 파싱 실패 | CRITICAL |
| 20 | 4.1 엔트리포인트 | `registerResources(server)` 단일 호출이지만, Resources가 4개 모듈(work-list, plan, task-file, result)로 분리되어 있어 index.ts 래퍼가 필요 | LOW |
| 21 | 4.2 Pipeline Tool | `server.registerTool()` API 사용. MCP SDK의 실제 API는 `server.tool()` (v1.2+) | MEDIUM |

#### 현행 미반영 로직

| # | 내용 | 심각도 |
|---|------|--------|
| 22 | **Execution-Mode 판정**: create_work에서 Router의 execution-mode 판정 로직(build_test_required 기반)이 빠져 있음. MCP 서버가 WORK 생성 시 direct/pipeline/full 판정을 어떻게 수행할지 미설계 | HIGH |
| 23 | **슬라이딩 윈도우 컨텍스트 전달**: context-policy.md의 FULL/SUMMARY/DROP 3단계 윈도우가 MCP 도구 레벨에서 어떻게 구현될지 미기술. execute_task가 내부적으로 builder->verifier->committer를 호출할 때 context-handoff를 어떻게 전달할지 설계 필요 | HIGH |
| 24 | **Activity Log**: 현행 `work_{WORK_ID}.log` 파일 기록 메커니즘이 MCP 도구에서 어떻게 유지/대체될지 미기술 | MEDIUM |

---

### 2.5 섹션 5: 연동 시나리오 (5.1~5.4)

**평가: 양호**

#### 긍정 평가
- Claude Desktop, Claude Code CLI, UC TeamSpace Runner, 외부 웹앱 4가지 시나리오가 현실적
- Runner의 MCP Client 전환 패턴이 명확

#### 보완 필요

| # | 위치 | 내용 | 심각도 |
|---|------|------|--------|
| 25 | 5.2 CLI 등록 | `claude mcp add uc-taskmanager` 사용 예시가 있으나, 현행 CLI에서 `[추가기능]` 태그 기반 Agent 호출과의 공존 방법이 미기술 | LOW |
| 26 | 5.3 Runner | `parseWorkId(createResult)` 유틸이 필요하지만 미설계 | LOW |

---

### 2.6 섹션 6: 구현 로드맵 (Phase 1~4)

**평가: 보완 필요**

| # | 내용 | 심각도 |
|---|------|--------|
| 27 | Phase 1 TASK-01의 `core/work-parser.ts`가 현행 파일 구조(`works/WORK-XX/`)와 TASK 파일명 규칙(`TASK-XX.md`, `TASK-XX_progress.md`, `TASK-XX_result.md`)을 정확히 파싱해야 하는데, 이 규칙이 명세서 내에서 일관되게 적용되지 않음 | HIGH |
| 28 | Router/Scheduler의 DAG Resolution 로직을 core/dag.ts로 옮길 때, 현행 Scheduler의 "result file exists -> DONE / ALL dependencies DONE -> READY / else -> BLOCKED" 판정 로직을 충실히 이식해야 함 | MEDIUM |
| 29 | Phase 3-4에 **인증/인가**가 있으나, 현행 콜백 인증 체계(CLAUDE.md의 `CallbackToken:` + `X-Runner-Api-Key` 헤더)와의 관계가 미기술 | LOW |

---

### 2.7 섹션 7: 데이터 흐름 상세 (7.1~7.2)

**평가: 양호 (긍정)**

#### 긍정 평가
- WORK 생성 -> 실행 완료 전체 흐름 다이어그램이 현행 scheduler의 DAG 기반 병렬 실행과 정확히 대응
- 컨텍스트 격리 유지 설명이 현행 슬라이딩 윈도우 정책과 일관

#### 보완 필요

| # | 내용 | 심각도 |
|---|------|--------|
| 30 | 7.1 다이어그램에서 "PLAN.md에 APPROVED 마킹"이 있으나, 현행에는 PLAN.md에 APPROVED 상태를 기록하는 메커니즘이 없음. `Status: PLANNED`에서 바로 실행으로 진행됨 | MEDIUM |

---

### 2.8 섹션 8: 기존 CLI 방식과의 호환성

**평가: 보완 필요**

| # | 위치 | 내용 | 현행 | 심각도 |
|---|------|------|------|--------|
| 31 | 산출물 행 | `TASK-XX-result.md` | `TASK-XX_result.md` (언더스코어) | HIGH |
| 32 | 파일 구조 행 | `tasks/WORK-01/PLAN.md` | `works/WORK-01/PLAN.md` | HIGH |

---

### 2.9 섹션 9~10: 보안 고려사항 및 성공 지표

**평가: 양호**

보안 구분(stdio vs HTTP)이 적절하며, 성공 지표가 측정 가능한 형태로 정의됨.

---

## 3. 발견 사항 종합

### 3.1 CRITICAL (즉시 수정 필요)

| # | 요약 |
|---|------|
| C-1 | **파일명 규칙 위반**: `${workId}-TASK-XX.md` 형식 사용 (4.2절). 현행 `parseTaskFilename()` 정규식 `/^TASK-(\d+)\.md$/`에 매칭 불가. `TASK-XX.md`로 수정 필수 |

### 3.2 HIGH (설계 반영 필요)

| # | 요약 |
|---|------|
| H-1 | **경로 불일치**: `tasks/` -> `works/` 전역 수정 필요 (1.1, 1.3, 2.1, 2.2, 8절 등 7개소) |
| H-2 | **result 파일명**: `TASK-XX-result.md` -> `TASK-XX_result.md` (1.1, 8절) |
| H-3 | **Execution-Mode 판정 누락**: create_work에 Router의 mode 판정 로직 미반영 |
| H-4 | **슬라이딩 윈도우 미설계**: context-policy.md의 FULL/SUMMARY/DROP이 MCP 도구 레벨에서 미반영 |
| H-5 | **WORK-LIST.md 참조 오류**: "BACKLOG.md 기반" -> `works/WORK-LIST.md` |
| H-6 | **Push 절차 미반영**: push_work 도구에 README 업데이트 + WORK-LIST COMPLETED 변경 절차 누락 |

### 3.3 MEDIUM (구현 전 보완 권고)

| # | 요약 |
|---|------|
| M-1 | Router 프롬프트가 MCP Prompts에서 누락 |
| M-2 | MCP SDK API `registerTool()` -> `tool()` 확인 필요 |
| M-3 | approve_plan의 모드별 동작 구분 미흡 |
| M-4 | retry_task의 재시도 대상(builder/committer) 구분 미흡 |
| M-5 | PLAN.md "APPROVED" 마킹 메커니즘이 현행에 없음 |
| M-6 | config://agents 리소스의 구체적 내용 미정의 |
| M-7 | Activity Log의 MCP 환경 유지 전략 미기술 |

---

## 4. 에이전트별 정합성 매트릭스

현행 에이전트 12개 파일과 설계 명세서의 대응 관계:

| 에이전트 파일 | MCP 대응 | 정합성 | 비고 |
|-------------|---------|--------|------|
| `router.md` | create_work + execute_work (부분) | **낮음** | execution-mode 판정, direct 모드 처리 로직이 MCP 도구에 미반영 |
| `planner.md` | create_work (부분) + Prompt:planner | 중간 | TASK 분해 로직은 반영되었으나, 승인 게이트 세부사항 미흡 |
| `scheduler.md` | execute_work + get_next_task | 중간 | DAG Resolution은 대응되나, Pipeline Stage Callback이 MCP에서 미설계 |
| `builder.md` | execute_task (내부) + Prompt:builder | 중간 | Serena MCP 우선 탐색, ProgressCallback 미반영 |
| `verifier.md` | execute_task (내부) + Prompt:verifier | 중간 | 7단계 검증 절차가 도구 레벨에서 추상화됨 |
| `committer.md` | execute_task (내부) + Prompt:committer | 중간 | Gate Check, Backfill Hash, TaskCallback 미반영 |
| `agent-flow.md` | 전체 아키텍처 | 높음 | direct/pipeline/full 3모드 체계가 잘 대응 |
| `file-content-schema.md` | Resources (부분) | 중간 | 파일 포맷은 동일하나 경로/파일명 불일치 |
| `shared-prompt-sections.md` | 암묵적 참조 | 낮음 | Build/Lint 명령, WORK-LIST 규칙 등이 MCP에서 어떻게 적용될지 미기술 |
| `xml-schema.md` | N/A (MCP로 대체) | - | XML 통신이 MCP Tool 호출로 대체됨. 대체 매핑 문서 필요 |
| `context-policy.md` | 미반영 | **낮음** | 슬라이딩 윈도우가 MCP 환경에서 어떻게 구현될지 설계 필요 |
| `work-activity-log.md` | get_pipeline_log (부분) | 낮음 | 기록 메커니즘은 있으나 log_work 함수의 MCP 대응 미설계 |

---

## 5. 권고사항

### 5.1 즉시 수정 (설계 문서 수정)

1. **경로 전역 수정**: `tasks/` -> `works/` (검색-치환)
2. **파일명 수정**: `TASK-XX-result.md` -> `TASK-XX_result.md`, `${workId}-TASK-XX.md` -> `TASK-XX.md`
3. **BACKLOG.md 참조 제거**: `works/WORK-LIST.md`로 수정
4. **MCP SDK API 확인**: `registerTool()` -> 최신 SDK 버전의 실제 API 확인

### 5.2 설계 보완 (추가 섹션 필요)

1. **Execution-Mode 판정 Tool 추가**: `route_request` 또는 create_work에 mode 판정 파라미터/로직 포함
2. **슬라이딩 윈도우 MCP 구현 전략**: context-handoff를 MCP Tool 호출 간에 어떻게 전달할지 섹션 추가
3. **Push 절차 통합**: push_work에 README 업데이트 + WORK-LIST 상태 변경 포함
4. **콜백 메커니즘 MCP 매핑**: Pipeline Stage Callback, ProgressCallback, TaskCallback의 MCP 환경 구현 방법
5. **XML -> MCP 매핑 표**: 현행 dispatch XML/task-result XML이 MCP Tool 호출/응답으로 어떻게 대응되는지 매핑 테이블

### 5.3 구현 시 주의사항

1. `core/work-parser.ts` 구현 시 반드시 현행 파일명 정규식 `/^TASK-(\d+)\.md$/` 준수
2. progress.md 상태 머신 (PENDING -> STARTED -> IN_PROGRESS -> COMPLETED)을 정확히 이식
3. Committer Gate Check (3중 조건)을 execute_task 내부에 구현
4. Builder의 Serena MCP 우선 탐색 정책을 MCP Prompt에 반영
5. Router의 `.agent/router_rule_config.json` 기반 판정을 `config://project` 리소스와 연계

---

## 6. 결론

설계 명세서의 전체 방향성(MCP 래핑, 다중 클라이언트 지원, 점진적 전환)은 타당하며, 현행 아키텍처에 대한 이해도가 높다. 그러나 **WORK-13 이후의 경로 변경(`tasks/` -> `works/`)과 파일명 규칙 변경이 반영되지 않았고**, execution-mode 판정 체계와 슬라이딩 윈도우 컨텍스트 전달이라는 uc-taskmanager의 핵심 차별화 요소가 MCP 도구 레벨에서 설계되지 않은 점이 주요 보완 사항이다.

CRITICAL 1건, HIGH 6건을 수정한 후 Phase 1 구현에 착수하는 것을 권고한다.
