# TASK-00 Result

> WORK: WORK-24 — agents 파일 분석 기반 Pipeline Architecture 스펙 문서 갱신
> Completed: 2026-03-15 00:00
> Status: **DONE**
> Commit: 38d5fcc

## 요약

agents/ 디렉토리의 12개 에이전트 정의 파일을 전수 분석하고, v1.0 및 v1.1 스펙 문서와의 차이점을 식별하여 v1.2 갱신 시 반영해야 할 항목 목록을 작성하였다.

## 완료 체크리스트

- [x] agents/ 디렉토리 12개 파일 전수 분석 완료
- [x] v1.0 스펙과의 차이점 목록 작성 완료
- [x] v1.1 스펙과의 차이점 목록 작성 완료
- [x] 누락/추가/변경 항목이 명확히 분류됨

---

## 1. agents/ 12개 파일 주요 내용 요약

### 1.1 agent-flow.md

Main Claude 오케스트레이션 가이드. 핵심 원칙: **모든 에이전트 호출은 Main Claude가 수행**.

- **3종 실행 모드 흐름:**
  - `direct`: router 단독 처리 완료
  - `pipeline`: router → builder → verifier → committer (4단계)
  - `full`: router → planner → scheduler → [B→V→C]×N
- **에이전트 역할 요약 테이블**: 6개 에이전트 + 반환값 + 호출 주체 명시
- **슬라이딩 윈도우 컨텍스트**: 직전=FULL, 2단계 전=SUMMARY, 3단계+=DROP

### 1.2 builder.md

TASK 구현 전담 에이전트. 모델: sonnet.

- **수행업무 8가지**: TASK 분석, 코드 탐색(Serena MCP 우선), 구현, Self-Check, Progress 기록, ProgressCallback 전송, 결과 반환, Activity Log
- **Serena 탐색 우선순위**: list_dir → get_symbols_overview → find_symbol(depth=1) → find_symbol(include_body=true) → find_referencing_symbols → Read(최후)
- **Self-Check**: build + lint 자동 감지 실행
- **Progress Checkpoint**: STARTED → IN_PROGRESS → COMPLETED
- **ProgressCallback 전송**: CLAUDE.md의 ProgressCallback URL + CallbackToken 사용
- **Context-Handoff 출력**: `<self-check>` 요소 포함 (xml-schema.md 표준 task-result와 일부 다름)
- **Retry Protocol**: 3단계 (실패 상세 읽기 → 수정 → self-check 재실행)

### 1.3 committer.md

result.md 생성 후 git commit 에이전트. 모델: haiku.

- **실행 순서 7단계**: Gate Check → result.md 생성 → PROGRESS.md 갱신 → git commit → 커밋 해시 백필 → TaskCallback 전송 → 결과 보고
- **Gate Check 3조건**: progress.md 존재 + Status=COMPLETED + Files changed 비어있지 않음
- **TaskCallback**: CLAUDE.md의 TaskCallback URL + X-Runner-Api-Key 헤더
- **Backfill Hash**: amend 방식으로 result.md에 commit hash 백필
- **Commit type 분류**: feat / fix / chore / test / docs / refactor (항상 영어)
- **결과 보고**: `<commit>`, `<result-file>`, `<progress>`, `<next-tasks>` 포함 XML

### 1.4 context-policy.md

에이전트 간 슬라이딩 윈도우 컨텍스트 전달 규칙.

- **슬라이딩 윈도우**: FULL(직전) / SUMMARY(2단계) / DROP(3단계+)
- **context-handoff 4개 필드**: what, why, caution, incomplete
- **에이전트별 입출력**: Builder, Verifier, Committer 각각 명시
- **Scheduler dispatch 예시**: Verifier/Committer/다음TASK Builder dispatch XML 예시
- **Committer 재시도**: 최대 2회(총 3회), 3회 실패 시 TASK FAILED

### 1.5 file-content-schema.md

산출물 파일 포맷 단일 정의.

- **7개 섹션**: PLAN.md(§1), TASK-XX.md(§2), progress.md(§3), result.md-full/pipeline(§4), result.md-direct(§5), PROGRESS.md(§6), 파일명 규칙(§7)
- **PLAN.md 7개 필수 메타정보**: Created, 요구사항, Execution-Mode, Project, Tech Stack, Language, Status
- **Compliance 테이블**: 각 파일 위반 시 결과 명시
- **다국어 result.md**: en/ko/ja 섹션 헤더 매핑 테이블

### 1.6 planner.md

WORK 생성 및 TASK 분해 에이전트. 모델: opus.

- **수행업무 6가지**: WORK ID 결정, 프로젝트 탐색, TASK 분해, 파일 생성, 사용자 승인, Activity Log
- **WORK ID 결정**: 파일시스템 스캔만 사용 (MEMORY.md 참조 금지)
- **사용자 승인 후** 파일 생성 (승인 없이 파일 생성 금지)
- **TASK 분해 기준**: 각 TASK ~30분~2시간, 독립 커밋 가능
- **Sequential Thinking 사용 조건**: TASK 4개 이상 또는 의존성 복잡한 경우
- **생성 책임 분리**: PLAN.md+TASK+progress(템플릿)=Planner, PROGRESS.md=Scheduler, progress(갱신)=Builder, result.md=Committer

### 1.7 router.md

요청 분석 및 실행 전략 결정 에이전트. 모델: opus.

- **수행업무 7가지**: 요청 분석, direct/pipeline/full 실행, WORK ID 결정, WORK-LIST 관리, Activity Log
- **WORK ID 결정**: FS + WORK-LIST.md 양쪽 스캔 후 최댓값+1 (planner와 방법이 다름)
- **Config 우선**: `.agent/router_rule_config.json` 존재 시 내장 기준 무시
- **direct 모드**: 14단계 실행 순서 (WORK 폴더 생성 필수, 생략 금지)
- **pipeline 모드**: builder dispatch XML 반환 (Main Claude가 B→V→C 호출)
- **full 모드**: planner 또는 scheduler dispatch XML 반환
- **WORK-LIST 관리**: 생성 시 IN_PROGRESS 추가, COMPLETED 변경은 git push 시에만

### 1.8 scheduler.md

WORK 파이프라인 실행 에이전트. 모델: haiku.

- **수행업무 10가지**: WORK 식별, DAG Resolution, 사용자 승인, Builder/Verifier/Committer Dispatch, 재시도 처리, 진행 보고, Pipeline Stage Callbacks, Activity Log
- **DAG Resolution**: result 존재=DONE, ALL deps DONE=READY, 그 외=BLOCKED
- **Pipeline Stage Callbacks**: 각 단계 START/DONE 이벤트 (curl 전송)
- **Committer FAIL 재시도**: `<reason>` 읽기 → builder 재dispatch → 최대 2회(총 3회)
- **PROGRESS.md 업데이트**: TASK 완료 후 갱신
- **사용자 승인 인터페이스**: 요약 출력 후 승인/건너뛰기/자동 선택

### 1.9 shared-prompt-sections.md

공통 재사용 섹션 (에이전트 공유 규칙).

- **§1 Output Language Rule**: PLAN.md > CLAUDE.md > en 우선순위
- **§2 Build and Lint Commands**: 자동 감지 빌드/린트 명령
- **§3 WORK and TASK File Path Patterns**: 파일 경로 패턴 명시
- **§4 File System Discovery Scripts**: 미완료 TASK 감지 스크립트
- **§5 Task Result XML Format**: 표준 task-result XML (verification 태그 사용)
- **§7 PLAN.md 필수 메타정보 7개 필드**: 테이블 정의
- **§8 WORK-LIST.md 갱신 규칙**: IN_PROGRESS → COMPLETED 규칙, committer/scheduler COMPLETED 변경 금지

### 1.10 verifier.md

READ-ONLY 검증 에이전트. 모델: haiku.

- **수행업무 8가지**: Progress Gate, 빌드, 린트, 테스트, TASK 특화 검증, 파일 존재, 컨벤션, 결과 XML
- **Step 0 (CRITICAL)**: progress.md 존재 + Status=COMPLETED (실패 시 즉시 중단)
- **Step 1 (CRITICAL)**: 빌드 (exit ≠ 0 → FAIL)
- **Step 2**: 린트 (실패=WARN, CRITICAL 아님)
- **Step 3~6**: 테스트, TASK 특화 검증, 파일 존재, 컨벤션
- **결과 XML**: `<verification>` 7개 check + `<failure-details>` + context-handoff

### 1.11 work-activity-log.md

Activity Log 기록 규칙.

- **log_work 함수**: `[timestamp]_AGENT_STAGE_DESC` 형식
- **STAGE 테이블**: INIT / REF / PLAN / IMPL / BUILD / COMMIT / DISPATCH (7개)
- **필수 기록 항목**: 최초 실행 프롬프트, Callback 호출 정보, 작업 내용, 완료 시 전송 프롬프트

### 1.12 xml-schema.md

에이전트 간 XML 통신 포맷 정의.

- **Dispatch 포맷**: `<dispatch to task execution-mode>` + context/task-spec/previous-results/cache-hint
- **Task Result 포맷**: `<task-result work task agent status>` + summary/files-changed/verification/notes
- **Dispatcher-Receiver 매핑**: 9가지 조합 테이블
- **Context-Handoff Element**: FULL/SUMMARY/DROP 3종
- **execution-mode별 에이전트 행동**: 6개 에이전트 × 3모드 행동 테이블

---

## 2. v1.0 스펙과의 차이점 (현행 agents/ 기준)

### 2.1 v1.0에서 잘못 기재된 항목 (현행과 불일치)

| 항목 | v1.0 스펙 | 현행 agents/ 실제 |
|------|----------|-----------------|
| TASK 속성 `task` 값 | `WORK-NN-TASK-XX` (WORK prefix 포함) | `TASK-XX` (WORK prefix 금지) |
| dispatch XML `task` 속성 예시 | `task="WORK-NN-TASK-XX"` | `task="TASK-XX"` |
| task-result XML `task` 속성 예시 | `task="WORK-NN-TASK-XX"` | `task="TASK-XX"` |
| 에이전트 모델 레벨 | 추상적 표현(높음/중간/낮음) | 구체적 모델명: router=opus, planner=opus, scheduler=haiku, builder=sonnet, verifier=haiku, committer=haiku |
| context-handoff 위치 | dispatch XML 내 최상위 `<context-handoff>` | `<previous-results>` 내에 포함 |
| 오케스트레이션 주체 | "Router가 dispatcher" (암묵적) | **Main Claude가 오케스트레이터** (명시적) |

### 2.2 v1.0에 없고 현행 agents/에 있는 항목 (v1.0 누락)

| 항목 | 위치 | 설명 |
|------|------|------|
| Main Claude 오케스트레이션 명시 | agent-flow.md | "모든 에이전트 호출은 Main Claude가 수행" |
| Activity Log 시스템 | work-activity-log.md | log_work 함수, STAGE 테이블, 필수 기록 항목 |
| ProgressCallback 전송 (builder) | builder.md §3-7 | 체크포인트마다 ProgressCallback URL 호출 |
| Pipeline Stage Callbacks (scheduler) | scheduler.md §3-6 | 각 단계 START/DONE 이벤트 |
| Router 14단계 직접 실행 순서 | router.md §3-4 | 상세 실행 순서, WORK 폴더 생성 필수 경고 |
| Config 기반 라우팅 규칙 | router.md §3-2 | `.agent/router_rule_config.json` 우선 적용 |
| Verifier 6단계 상세 검증 | verifier.md §3-3~3-9 | Step 0~6 체계, CRITICAL 구분 |
| Committer Backfill Hash | committer.md §3-7 | 커밋 해시를 result.md에 amend로 백필 |
| WORK-LIST.md 갱신 규칙 | shared-prompt-sections.md §8 | committer/scheduler COMPLETED 변경 금지 |
| 파일명 규칙 §7 | file-content-schema.md §7 | WORK-NN-TASK-NN.md 금지 명시 |
| Sequential Thinking 사용 조건 | planner.md §3-4, router.md §3-2 | 구체적 조건 명시 |
| Builder Self-Check 상세 | builder.md §3-5 | 프로젝트별 빌드 명령 자동 감지 |
| IN_PROGRESS WORK 존재 시 처리 | router.md §3-3 | 단절된 WORK 재개 문의 |
| 재시도 3회 상세 | context-policy.md | builder 재dispatch → 최대 2회(총 3회) |
| `<self-check>` 요소 | builder.md §3-8 | builder task-result에 self-check 포함 |
| Verifier `<failure-details>` | verifier.md §3-10 | 실패 상세 구조화 |

### 2.3 v1.0에 있고 현행 agents/에서 변경된 항목

| 항목 | v1.0 내용 | 현행 변경 내용 |
|------|----------|--------------|
| Routing 기준표 | `DB 스키마 변경` 필드 포함 | 제거됨; `신규 모듈 추가`, `단계 수` 필드로 교체 |
| pipeline 모드 stage 콜백 | Router가 stage 콜백 대행 | Main Claude가 B→V→C 직접 호출 (Router는 builder dispatch XML만 반환) |
| progress.md 작성 주체 | builder / router | builder(갱신) / planner(템플릿) / router(direct) |
| WORK-LIST.md COMPLETED | 변경 주체 불명확 | git push 시에만, committer/scheduler 변경 금지 명시 |
| Router WORK ID 결정 | FS 스캔만 언급 | FS + WORK-LIST.md 양쪽 스캔 후 최댓값+1 |
| 콜백 명칭 | "COMMITTER DONE 콜백" (단수) | TaskCallback + ProgressCallback + Pipeline Stage Callback (3종 분류) |

---

## 3. v1.1에서 이미 반영된 사항 vs 아직 누락된 사항

### 3.1 v1.1에서 이미 반영된 사항

v1.1은 WORK-23에서 agents/ 12개 파일 기반으로 전면 재작성되어, 다음 항목들이 반영되었다:

| 항목 | v1.1 섹션 |
|------|----------|
| TASK ID 포맷 수정 (`TASK-XX`, WORK prefix 금지) | §7 dispatch 속성 테이블 |
| 에이전트 모델 정확 반영 (opus/haiku/sonnet) | §2 에이전트 구성 테이블 |
| Activity Log 시스템 | §11 |
| Main Claude 오케스트레이션 역할 명시 | §2, §3 |
| MCP 도구 통합 섹션 확장 (builder Serena 우선순위) | §14 |
| Pipeline Stage Callbacks | §12 |
| 에이전트별 상세 역할 및 실행 순서 | §5 |
| Context-handoff 전달 정책 상세 | §8 |
| Progress 체크포인트 시스템 | §9 |
| Committer 7단계 실행 순서 | §5.6 |
| 외부 콜백 통합 3종 분류 | §12 |
| 파일 구조에 `work_WORK-NN.log` 추가 | §4 |
| Dispatcher-Receiver 매핑 테이블 | §7 |
| 산출물 파일 포맷 요약 | §13 |
| Config 기반 라우팅 규칙 | §3 |

### 3.2 v1.1에서 아직 누락된 사항 (현행 agents/와 불일치)

| 항목 | 현행 agents/ 내용 | v1.1 상태 |
|------|-----------------|----------|
| Builder `<self-check>` 요소 | builder.md §3-8 결과 XML에 포함 | xml-schema.md §2에서 `<verification>` 태그 사용, 불일치 |
| shared-prompt-sections.md §5 task-result | `<verification>` 태그 사용 | v1.1 §7에서 `<self-check>` 태그 사용, 혼재 |
| Verifier `<failure-details>` 구조 | verifier.md §3-10 | v1.1 §7 결과 반환 예시에 미포함 |
| Router 14단계 순서 vs v1.1 §3.1 14단계 | 동일하나 단계 15(WORK-LIST 추가) 위치 차이 | v1.1에서 단계14에 통합 (`log_work COMMIT → COMMITTER DONE 콜백`) |
| Committer dispatch XML 구조 | committer.md §3-2: `<builder-result>`, `<verifier-result>` | v1.1 §7 dispatch 예시에 미포함 |
| Verifier dispatch XML 구조 | verifier.md §3-2: `<builder-result>` | v1.1 §7 dispatch 예시에 미포함 |
| TaskCallback 헤더 명칭 | `X-Runner-Api-Key` (committer.md) | v1.1 §12에서 `CallbackToken`만 언급, 헤더명 미명시 |
| Router WORK-LIST 추가 시점 | direct 모드: 단계 16번 (가장 마지막) | v1.1 §3.1 실행 순서에 미포함 |
| builder.md STARTUP 파일 목록 | `agents/agent-flow.md` 포함 (4+1=5개) | v1.1 §5.4에 agent-flow.md 참조 미언급 |
| Scheduler 사용자 승인 인터페이스 | scheduler.md §3-4 (승인/건너뛰기/자동) | v1.1 §5.3에 언급 없음 |
| planner.md 언어 결정 방식 | §3-8: 시스템 로케일 자동 감지 포함 | v1.1 §1 언어 우선순위만 언급 |

---

## 4. v1.2 갱신 시 반영해야 할 항목 목록

### 4.1 정확성 수정 (높은 우선순위)

| # | 항목 | 수정 내용 |
|---|------|---------|
| 1 | XML 태그 불일치 | `<self-check>` (builder) vs `<verification>` (xml-schema/shared) 통일. builder.md 기준(`<self-check>`)이 맞음 |
| 2 | Committer dispatch XML | `<builder-result>`, `<verifier-result>` 요소를 §7 dispatch 예시에 추가 |
| 3 | Verifier dispatch XML | `<builder-result>` 요소를 §7 dispatch 예시에 추가 |
| 4 | `<failure-details>` | Verifier 결과 XML 예시에 `<failure-details>` 추가 |
| 5 | Router direct 모드 WORK-LIST 추가 시점 | §3.1 실행 순서에 IN_PROGRESS 추가 단계 명시 (현재 단계 14 이후 누락) |
| 6 | TaskCallback 헤더명 | §12에서 `X-Runner-Api-Key` 헤더 명시 |

### 4.2 누락 내용 추가 (중간 우선순위)

| # | 항목 | 추가 내용 |
|---|------|---------|
| 7 | Verifier 전체 결과 XML 구조 | `<verification>` 7개 check + `<failure-details>` 전체 예시 |
| 8 | Committer dispatch XML 전체 구조 | builder-result, verifier-result 포함 전체 예시 |
| 9 | Scheduler 사용자 승인 인터페이스 | §5.3에 승인/건너뛰기/자동 선택 설명 추가 |
| 10 | builder STARTUP 참조 파일 | §5.4에 agent-flow.md 참조 추가 |
| 11 | Planner 언어 결정 방식 | §5.2에 시스템 로케일 자동 감지 로직 추가 |

### 4.3 구조 개선 (낮은 우선순위)

| # | 항목 | 개선 내용 |
|---|------|---------|
| 12 | §7 Dispatcher-Receiver 매핑 보완 | pipeline 모드 Router → Verifier, Router → Committer 매핑 추가 |
| 13 | §5 에이전트별 금지사항 | 각 에이전트 금지사항(NEVER) 목록 추가 (현재 일부만 있음) |
| 14 | §3.4 Routing 기준표 | 커스텀 config 우선 적용 및 사용자 지시 우선 규칙 추가 |
| 15 | §9 Retry 재개 전략 | builder 재dispatch 시 TASK-XX_progress.md 함께 전달 명시 |

---

## 검증 결과

- Build: N/A (문서 작업)
- Lint: N/A
- Tests: N/A

## 변경 파일

### Created
- `works/WORK-24/TASK-00_result.md` — agents/ 12개 파일 분석 및 v1.0/v1.1 스펙 차이점 보고서

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)
agents/ 12개 파일 전수 분석 완료. v1.0 스펙의 주요 오류(TASK ID 포맷, 모델 레벨 추상화, 오케스트레이터 주체 불명확)를 식별하고, v1.1에서 반영된 항목(15개)과 아직 누락된 항목(11개)을 분류하여 보고서를 작성하였다. v1.2 갱신 시 반영해야 할 15개 항목을 우선순위별로 목록화하였다.

### Verifier Context (FULL)
- **what**: TASK-00_result.md 생성. agents/ 12개 파일 분석, v1.0/v1.1 스펙 비교, v1.2 반영 항목 도출
- **why**: 현행 agents/ 파일이 실제 구현 기준이므로 스펙과의 불일치를 명확히 해야 v1.2 갱신 작업(TASK-01)이 정확하게 수행 가능
- **caution**: XML 태그 불일치(`<self-check>` vs `<verification>`) 항목은 v1.2 갱신 시 builder.md 기준으로 통일 필요. v1.1에 이미 `<self-check>` 예시가 있으므로 xml-schema.md §2와 shared-prompt-sections.md §5를 수정 대상으로 봐야 함
- **incomplete**: None
