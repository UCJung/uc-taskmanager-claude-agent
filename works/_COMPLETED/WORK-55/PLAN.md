# WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

> Created: 2026-07-23
> Requirement: works/WORK-55/Requirement.md (FR-01~06 / NFR-01~03, 복잡도 Large)
> Project: uc-taskmanager-claude-agent
> Tech Stack: Markdown 에이전트/레퍼런스 정의 (Claude Code sub-agent 파이프라인) · Node.js npm CLI(본 WORK에서 미변경)
> Language: ko
> Status: PLANNED

## 목표

이 저장소 자신의 파이프라인 에이전트 정의를 개선한다: (1) specifier/planner의 What/How 경계를 문구로 정합화, (2) 빌드·린트 검증을 builder(빌드)·verifier(린트 FAIL 게이트)로 재분배, (3) committer를 orchestrator 인라인 절차로 흡수해 TASK당 스폰을 3→2(3+2N)로 축소한다. 변경은 `develop/` 원본을 정본으로 편집한 뒤 `plugin/`·`npm/` 사본과 README에 일관 반영한다.

## 설계

### 1. 아키텍처 방향

- **접근 방식**: 기존 수정 (문서/정의 정합화에 한정, CON-01 — 애플리케이션 런타임 코드 불변).
- **구조**: `develop/`(단일 정본) → `plugin/`·`npm/`(기계적 사본) 3-way 미러. CLAUDE.md Push 절차 1단계와 동일한 모델을 그대로 사용한다. 따라서 편집 TASK는 **`develop/` 원본 + 루트 README만** 수정하고, **전용 SYNC TASK 하나**가 `develop→plugin/npm` 미러 + `README→npm/README` 복사 + 저장소 전역 잔존 문구 감사를 수행한다. (중간 편집 TASK가 3벌을 각각 손대지 않으므로 동일 파일 경쟁·누락 위험이 제거된다.)
- **데이터 흐름**: (요구 FR-01~06) → develop 정본 편집(TASK-01~08) → 3-way 미러 + 감사(TASK-09) → develop=plugin=npm 일치 + 잔존 문구 0.

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | 없음 (런타임 파서/스키마 코드 불변, CON-01) |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | 문서/정의(md) 편집만. `npm/lib/constants.mjs`(AGENT_FILES/OBSOLETE_PATHS), `plugin.json`(agents 배열)은 **변경하지 않는다** — committer.md는 삭제가 아니라 스텁으로 잔존시키므로 패키징 매니페스트 변경이 불필요(ASM-01 근거). |

### 3. 인터페이스 설계

에이전트 간 인터페이스(XML dispatch/task-result/gate/decision)와 파일 산출 형식은 **형식 자체를 유지**한다(CON-04). 변경되는 것은 committer 단계의 "주체"뿐이다.

| 인터페이스 | 방식 | 형식 | 관련 FR |
|-----------|------|------|--------|
| 파이프라인 TASK 루프 | 중첩 spawn | `builder → verifier` (committer 스폰 제거, 인라인 흡수) | FR-04, FR-05 |
| 인라인 커밋 완료 로그 | 활동 로그 이벤트 | `STAGE_DONE — stage=commit task=TASK-NN` (STAGE_START 없음 — 비-spawn 액션) | FR-04, FR-05 |
| verifier 린트 게이트 | task-result `<check name="lint">` | `PASS \| FAIL \| N/A` (FAIL=게이트, WARN 제거) | FR-03 |
| builder self-check | `<self-check>` | `<check name="build">`만 (lint 체크 제거) | FR-02 |

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | 문서 정합성 (committer 서술 연쇄 정합) | committer 인라인화의 연쇄 정합 지점을 빠짐없이 TASK로 식별: orchestrator.md(STEP 1-1 요약 표·STEP C 루프·STEP D 이벤트·retry·description), agent-flow(§4 스폰수표 3+3N→3+2N·§2·§6 역할표·§7·resume 표), 5개 레퍼런스(committer 열 제거·생성주체 이관), README. TASK-09 감사가 최종 무모순을 검증. |
| NFR-02 | 레퍼런스 수정 규칙 준수 | 레퍼런스 편집(TASK-02 일부·TASK-05·TASK-06)은 CLAUDE.md "레퍼런스 수정 절차" 준수: **§ 번호 재번호·재사용 금지**(committer 열 삭제는 열 제거일 뿐 § 재번호 아님), 섹션 삭제 없음(결번 불필요), **섹션 소비 매트릭스 갱신**(commit 열 제거 + orch 열로 책임 이관), **orchestrator.md 2곳 중복 기재 동기화**(STEP 1-1 요약 표 = TASK-03 · STEP A/B/C 스폰 라인 = TASK-03). TASK-09가 `grep "^## §"` 실재·상호참조·전이적 배분을 검증. |
| NFR-03 | 배포 동기화 | TASK-01~08은 develop 원본만 편집. TASK-09가 develop→plugin/npm 미러 후 3-way diff=0을 인수 기준으로 확인. README.md→npm/README.md 복사 포함. |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | specifier/planner 경계 문구 정합화 (planner 겸임 문구 제거) | 없음 | 1 | Must | FR-01, CON-02 | S |
| TASK-02 | builder=빌드 self-check / verifier=린트 FAIL 게이트 재분배 | 없음 | 1 | Must | FR-02, FR-03 | M |
| TASK-03 | orchestrator.md committer 인라인 흡수 (핵심 — 인라인 커밋 절차·이벤트 정본) | 없음 | 1 | Must | FR-04, FR-05, NFR-01, NFR-02 | L |
| TASK-04 | agent-flow.md 정합화 (스폰수표 3+3N→3+2N·흐름·역할표·축퇴·resume) | TASK-03 | 2 | Must | FR-05, FR-06, NFR-01 | M |
| TASK-05 | 레퍼런스 정합화 ① context-policy.md + work-activity-log.md | TASK-03 | 2 | Must | FR-04, FR-06, NFR-02 | M |
| TASK-06 | 레퍼런스 정합화 ② file-content-schema + shared-prompt-sections + xml-schema (매트릭스 commit 열 제거·생성주체 이관) | TASK-03, TASK-02 | 2 | Must | FR-04, FR-06, NFR-02, ASM-03 | L |
| TASK-07 | committer.md → 폐기 스텁 전환 (인라인 흡수 명시) | TASK-03 | 2 | Must | FR-04, ASM-01 | S |
| TASK-08 | README.md committer 인라인 반영 (스폰수·다이어그램·에이전트표) | TASK-03 | 2 | Must | FR-06, NFR-01, ASM-02 | M |
| TASK-09 | 배포 3-way 미러 + 저장소 전역 잔존 문구 감사 + 매트릭스 무결성 검증 | TASK-01,02,03,04,05,06,07,08 | 3 | Must | FR-06, NFR-01, NFR-02, NFR-03 | M |

## Task 의존성 그래프

```
Phase 1 (병렬 — 서로소 파일):
  ┌─ TASK-01  specifier.md
  ├─ TASK-02  builder.md · verifier.md · shared-prompt-sections.md(§2)
  └─ TASK-03  orchestrator.md   ◀── 인라인 커밋 절차/이벤트 vocabulary 정본
                 │
      ┌──────────┼───────────┬───────────┬──────────┐
Phase 2 (병렬 — 모두 TASK-03 의존; TASK-06은 TASK-02도 의존):
   TASK-04     TASK-05      TASK-06        TASK-07     TASK-08
  agent-flow  ctx-policy+  file-schema+   committer   README.md
              work-log     shared+xml     (stub)
      └──────────┴───────────┴───────────┴──────────┘
                 │
Phase 3:
              TASK-09  (develop→plugin/npm 미러 + README→npm + 전역 감사)
              ◀── TASK-01..08 전체 의존
```

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | committer 서술이 여러 문서에 산재해 일부 잔존 (NFR-01 위반) | 높 | 높 | 완화 — TASK-09를 전역 grep 감사 게이트로 배치(`committer` 스폰/`3+3N`/린트 `WARN`/`assumes Planner` 잔존 0 확인). 편집 TASK ACWork에도 파일별 잔존 grep 포함. | 감사 대상: develop·plugin·npm·README |
| R-02 | 레퍼런스 편집 시 § 재번호/상호참조 파손 (NFR-02 위반) | 중 | 높 | 회피 — 섹션 **추가·삭제 없음**, committer는 매트릭스 "열" 제거일 뿐. § 재번호 발생 안 함. TASK-09가 `grep "^## §"` 실재 + `xxx.md § N` 상호참조 무결성 + 전이적 배분을 검증. | CLAUDE.md 레퍼런스 수정 절차 §5 |
| R-03 | 인라인 커밋 로그 이벤트 설계가 resume 머신을 깨뜨림 (side-effecting git commit 중복/스킵) | 중 | 높 | 회피 — `STAGE_DONE — stage=commit`를 TASK 완료 명시 마커로 정의(설계 §3). resume 시 commit 마커 부재면 result.md/commit 존재를 확인해 멱등 처리. orchestrator.md·work-activity-log·agent-flow resume 표에 동일 vocabulary 반영. | 설계 결정 — 아래 D-04 |
| R-04 | committer.md 완전 삭제 시 constants.mjs(AGENT_FILES/OBSOLETE_PATHS)·plugin.json 수정 필요 → CON-01 위반 | 중 | 중 | 회피 — 삭제 대신 **스텁**으로 잔존(ASM-01). 패키징 매니페스트 불변 → CON-01 준수. | 스텁이 spawn되지 않음은 orchestrator에서 참조 제거로 보장 |
| R-05 | 구식 아키텍처 스냅샷 문서(spec_pipeline-architecture_v1.3·_archive·*.html·scheduler-era 가이드)까지 손대면 범위 폭증 | 중 | 중 | 수용 + 경계 — 해당 문서는 scheduler/router/direct-pipeline-full 모드 등 **이미 현행 정의와 괴리된 역사적 스냅샷**이라 부분 편집으로 정합화 불가. 본 WORK 범위에서 **제외**하고 알려진 괴리로 기록(ASM-02). | 정합 대상은 현행 정본(agents·references·README)에 한정 |
| R-06 | verifier 린트 FAIL 승격을 위해 shared § 2 lint 스니펫의 `\|\| true`가 exit code를 삼켜 게이트가 무력화 | 중 | 중 | 완화 — TASK-02에서 lint 분기의 exit code 보존(게이트 판정 가능화) + verifier STEP 3 문구를 FAIL로 승격. builder는 lint 분기를 더 이상 호출하지 않음. | 실제 lint 스크립트 있는 프로젝트에서 게이트 동작(FR-03 의도) |

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| 1. specifier/planner 경계 | FR-01, CON-02 | TASK-01 | 겸임 문구 제거·What/How 명시·구조 무변경 | grep("assumes Planner"·"플래너 역할")=0, 스폰흐름 불변 diff 확인 |
| 2. builder self-check=빌드 | FR-02 | TASK-02 | self-check 빌드 단독·XML lint 제거·N/A 유지 | grep builder.md lint self-check=0, XML 예시 확인 |
| 2. 린트 verifier 일원화+FAIL | FR-03 | TASK-02 | 린트 FAIL 게이트·WARN 제거·N/A 유지 | grep verifier.md "WARN"=0, `<check name="lint">` FAIL 문구 |
| 3. committer 인라인 흡수 | FR-04 | TASK-03,05,06,07 | orchestrator 인라인 [result→WORK-LIST→commit]·committer 스폰 제거·생성주체 orchestrator | grep orchestrator "committer" spawn=0, 매트릭스 commit 열 제거 |
| 3. 스폰 3→2 (3+2N) | FR-05 | TASK-03,04 | TASK 루프 2단계·스폰수표 3+2N·retry 정합·검증 독립성 유지 | agent-flow §4 "3 + 2N", orchestrator STEP C 2단계 |
| Scope: 배포/레퍼런스/docs | FR-06, NFR-03 | TASK-04,05,06,08,09 | develop=plugin=npm 동일·README 반영·잔존 0 | 3-way diff=0, 전역 grep 감사 |
| 문서 정합성 | NFR-01 | TASK-03,04,08,09 | orchestrator 2곳 committer 제거·상호참조 무모순 | TASK-09 감사 |
| 레퍼런스 수정 규칙 | NFR-02 | TASK-05,06,09 | § 재번호 금지·매트릭스 갱신·orchestrator 2곳 동기화 | `grep "^## §"`·상호참조·전이 배분 |

## 자동 결정 사항 (planner 확정 — ASM + 설계 결정)

- **D-01 [ASM-01] committer.md 처리 = 폐기 스텁 전환** — 근거: 완전 삭제는 `npm/lib/constants.mjs`(AGENT_FILES·OBSOLETE_PATHS)와 `plugin.json`(agents 배열, ×3) 수정을 요구해 CON-01(런타임 코드 불변)에 저촉. 스텁은 오해 소지 있는 committer 절차/스폰 문구를 모두 제거하면서 패키징 매니페스트를 불변으로 유지하고 3벌 동일을 자명하게 만든다. orchestrator 참조 제거로 실제 spawn되지 않음이 보장된다.
- **D-02 [ASM-02] docs 정합 범위 = README.md만 포함, 구식 스냅샷 제외** — 근거: `spec_pipeline-architecture_v1.3.md`·`_archive/*`·`*.html`·`spec_sliding-window-context.md`·`guide_agent-testing.md`는 scheduler/router/direct-pipeline-full 모드/TaskCallback 등 **이미 현행 정의와 괴리된 역사적 스냅샷**이라 committer/린트/planner 부분 편집으로는 정합화 불가(여전히 존재하지 않는 scheduler를 서술). README.md는 현행 파이프라인을 권위 있게 기술하는 유일한 사용자 대면 문서(3+3N·committer 루프)라 반드시 반영.
- **D-03 [ASM-03] committer ref-cache 배분 = 5개 매트릭스에서 commit 열 제거 + orch 열로 책임 이관** — 근거: committer 미-spawn → orchestrator가 committer ref-cache를 조립하지 않음. 다만 orchestrator가 인라인 수행하는 부분(file-content-schema § 3 result.md·§ 5 생성주체, shared § 8 WORK-LIST)의 ✅는 orch 열로 이관해 전이적 배분 정합을 유지.
- **D-04 [설계] 인라인 커밋 로그 이벤트 = `STAGE_DONE — stage=commit task=TASK-NN`(STAGE_START 없음)** — 근거: 커밋은 비-spawn orchestrator 액션이라 STAGE_START가 없다. side-effecting git commit을 resume 시 스킵/중복하지 않도록 TASK 완료를 명시하는 별도 마커가 필요. stage 값 집합은 specifier/planner/builder/verifier/commit(committer→commit). 마지막 TASK 판정은 orchestrator가 `STAGE_DONE stage=commit` 수를 세어 수행.

## 자체 검증 체크리스트

- [x] 모든 FR이 최소 1개 Task에 매핑됨 (FR-01→T01, FR-02·03→T02, FR-04→T03/05/06/07, FR-05→T03/04, FR-06→T04/05/06/08/09)
- [x] 모든 NFR이 설계 또는 Task에 반영됨 (NFR-01→설계§4·T09, NFR-02→T05/06/09, NFR-03→T09)
- [x] Task 간 순환 의존 없음 (Phase 1→2→3 단방향 DAG)
- [x] 제약조건 내 실현 가능 (CON-01 런타임 불변: constants.mjs·plugin.json 미변경 / CON-02 문구 한정 / CON-03 레퍼런스 절차 / CON-04 형식 유지)
- [x] 각 Task에 완료 조건이 있음 (각 TASK Acceptance Criteria + Verify)
- [x] 리스크가 식별되고 대응 전략이 있음 (R-01~R-06)
- [x] 실행 순서가 의존관계와 일치함 (인라인 커밋 vocabulary를 정의하는 T03이 T04~08보다 선행)
