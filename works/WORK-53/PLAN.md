# WORK-53: WORK-52 반영 README 3종 현행화

> Created: 2026-07-21
> Requirement: works/WORK-53/Requirement.md — "[WORK] works\WORK-52 수정사항으로 readme.md 파일 현행화 해줘"
> Execution-Mode: pipeline
> Project: uc-taskmanager-claude-agent
> Tech Stack: Markdown 문서 (Node.js/npm 패키지 `uctm` + Claude Code Plugin 저장소) — 문서 전용, 빌드/테스트 대상 아님
> Language: ko
> Status: PLANNED

## 목표

WORK-52(Orchestrator Agent 도입)로 바뀐 에이전트 구성·디렉터리 구조·npm 설치기 산출물을 `README.md`·`npm/README.md`·`README_KO.md` 3종에 반영하여, 사용자 노출 문서에서 삭제된 `scheduler` 에이전트 안내와 실존하지 않는 경로 기술을 제거한다.

## 설계

### 1. 아키텍처 방향

- **접근 방식**: 기존 수정 (문서 3종 편집). 코드·에이전트 정의·플러그인 매니페스트는 무변경(CON-01).
- **구조**: 단일 진실 원본(SSOT) 방식 — `README.md`를 확정본으로 먼저 정정하고, `npm/README.md`는 그 **사본**(CON-02), `README_KO.md`는 그 **한국어 대응본**(NFR-02)으로 파생시킨다.
- **데이터 흐름**:

```
저장소 실제 상태 (develop/ · plugin/ · npm/ · npm/lib/constants.mjs)
        │  (사실 대조)
        ▼
   README.md (확정본)  ──파일 복사──▶ npm/README.md
        │
        └──구조 대응 재작성──▶ README_KO.md
                    │
                    ▼
        통합 정합성 검증 (grep / diff / 경로 존재)
```

- **확정된 사실 기준선** (2026-07-21 저장소 실측 — 하위 TASK는 추측 없이 이 표를 근거로 작성):

| 항목 | 실측값 |
|------|--------|
| `develop/agents/` | 6개 — builder, committer, orchestrator, planner, specifier, verifier |
| `develop/references/` | **8개** — agent-flow, callback-protocol, context-policy, file-content-schema, ref-cache-protocol, shared-prompt-sections, work-activity-log, xml-schema |
| `develop/skills/` | 4개 — sdd-pipeline, uctm-init, work-pipeline, work-status (각 `SKILL.md`) |
| `develop/.claude-plugin/plugin.json` | 존재 (v1.6.0, agents 6종 / skills 4종) |
| `develop/hooks/` | **미존재** |
| `plugin/` | agents(6), references(8), skills(sdd-pipeline·uctm-init·work-pipeline·work-status — 각 `SKILL.md`만), `.claude-plugin/plugin.json` |
| `plugin/skills/sdd-pipeline/references/` | **미존재** |
| `plugin/README.md` | **미존재** |
| `npm/` | agents(6), references(**8**), skills(4), bin/cli.mjs, lib/(constants·init·update), .agent/, .claude-plugin/, package.json, package-lock.json, .npmignore, LICENSE, README.md |
| `npm/lib/constants.mjs` | `AGENT_FILES` 6종(orchestrator 포함, scheduler 없음) + `REFERENCE_FILES` 8종 |
| `npm/lib/init.mjs` | 에이전트 → `.claude/agents/`, 레퍼런스 → `.claude/references/`, `.claude-plugin` + `skills` 복사 |
| `npm/package.json` version | 1.6.0 |

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | 없음 |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | 해당 없음 (문서 전용 WORK) |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| 저장소 방문자용 문서 | 파일 (Markdown) | `README.md` | FR-01 ~ FR-04 |
| npmjs.com 패키지 페이지 | 파일 (Markdown, `README.md` 사본) | `npm/README.md` | FR-05 |
| 한국어 독자용 문서 | 파일 (Markdown, `README.md` 대응본) | `README_KO.md` | FR-06 |

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | 문서에 기재된 경로 중 미존재 경로 0건 | 각 TASK Verify에 `ls -d` 기반 경로 전수 확인 명령 배치 + TASK-04에서 3종 통합 재확인. "존재하면 안 되는 경로"(`develop/hooks`, `plugin/README.md`, `plugin/skills/init`)는 역방향(No such file) 확인으로 검출 |
| NFR-02 | `README.md` ↔ `README_KO.md` 섹션·수치 상호 모순 없음 | `README_KO.md`를 `README.md` **확정본 이후**에 작성(DAG 의존), `^## ` / `^### ` 헤더 개수 일치 검증, 스폰 카운트 표(`2 + 3N` / `3 + 3N`)·에이전트 6종 표를 동일 수치로 기재 |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | `README.md` 잔여 구조·경로 오류 정정 | 없음 | 1 | Must | FR-01, FR-02, FR-03, FR-04, NFR-01 | M |
| TASK-02 | `npm/README.md` 동기화 (`README.md` 사본) | TASK-01 | 2 | Must | FR-05, NFR-01 | S |
| TASK-03 | `README_KO.md` orchestrator 기준 전면 현행화 | TASK-01 | 2 | Must | FR-06, NFR-01, NFR-02 | L |
| TASK-04 | 3종 문서 통합 정합성 검증 및 재동기화 | TASK-02, TASK-03 | 3 | Must | NFR-01, NFR-02 (AC-01~07 전수) | S |

## Task 의존성 그래프

```
Phase 1                    Phase 2                        Phase 3

TASK-01 ──────────┬──▶ TASK-02 (npm/README.md) ──┐
(README.md        │                              ├──▶ TASK-04 (통합 검증)
 확정본)          └──▶ TASK-03 (README_KO.md) ───┘
```

- TASK-02 / TASK-03 은 서로 다른 파일만 수정하므로 **병렬 실행 가능**
- TASK-03 은 `README.md` 수정 금지 (R-01 방지) — 수정 필요 사항 발견 시 notes 로 보고
- TASK-04 는 `README.md` 변경 감지 시 `npm/README.md` 재동기화를 수행

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | TASK-03(KO) 진행 중 `README.md` 추가 수정이 필요해져, 병렬 완료된 `npm/README.md`와 diff가 깨짐 | 중 | 높 | 회피 + 완화 — TASK-03에 `README.md` 수정 금지 제약 명시(발견 시 notes 보고), TASK-04에서 `diff` 재확인 후 필요 시 `cp README.md npm/README.md` 재동기화 | AC-02 직결 |
| R-02 | `README_KO.md` 전면 재작성(1,065줄 → `README.md` 1,151줄 대응) 중 섹션 누락·기존 내용 삭제 | 높 | 중 | 완화 — `README.md`의 `##`/`###` 헤더 목록을 체크리스트로 사용해 섹션 단위 순차 작성, AC-07 보존 항목(배지·License·Serena MCP·산출물 언어) 명시적 확인, 헤더 개수 일치 검증 | 최대 규모 TASK |
| R-03 | 기계적 직역으로 한국어 문서 가독성 저하 | 중 | 중 | 완화 — 기존 `README_KO.md`의 문체·용어("초단순 수정", "저장소 구조" 등)를 최대한 재사용하고 표·다이어그램만 구조 이식. 서술문은 한국어로 재작성 | D-01 확정 조건 |
| R-04 | 개행 코드(CRLF/LF)·인코딩 차이로 `diff README.md npm/README.md` 불일치 | 낮 | 중 | 회피 — `npm/README.md`는 **재작성이 아닌 파일 복사**(`cp`)로만 생성 | 커밋 `756cb3e` 인접 이력에 `npm/bin/cli.mjs` 개행 변경 전례 있음 |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| WORK-52 수정사항 반영 (레퍼런스 6 → 8) | FR-01 | TASK-01 | AC-03 | `grep`("8 support files", 표 8행) + `ls -1 develop/references` |
| WORK-52 수정사항 반영 (디렉터리 구조) | FR-02 | TASK-01 | AC-04 | `ls -d` 경로 전수 확인 (정방향/역방향) |
| WORK-52 수정사항 반영 (레퍼런스 경로 표기) | FR-03 | TASK-01 | AC-04 | `grep -n "agents/xml-schema.md"` 무매치 |
| WORK-52 수정사항 반영 (설치기 정합, 커밋 `756cb3e`) | FR-04 | TASK-01 | AC-06 | `grep -n "npm/references"` 매치 + `constants.mjs` 대조 |
| readme.md 현행화 (배포 사본) | FR-05 | TASK-02 | AC-01, AC-02 | `diff README.md npm/README.md` 무출력 |
| readme.md 현행화 (한국어 문서) | FR-06 | TASK-03 | AC-01, AC-05, AC-06 | `grep -c "scheduler"` = 0, `^## ` 헤더 수 일치 |
| (전 항목 공통) 경로 정합성 | NFR-01 | TASK-01, TASK-03, TASK-04 | AC-04 | `ls -d` 전수 확인 |
| (전 항목 공통) 문서 간 일관성 | NFR-02 | TASK-03, TASK-04 | AC-05, AC-06 | 헤더 목록 대조 + 스폰 카운트 표 수치 대조 |
| (전 항목 공통) 기존 내용 보존 | CON-04 | TASK-01, TASK-03, TASK-04 | AC-07 | 배지 / License / Serena / Output Language 섹션 존재 `grep` |

---

## 자체 검증 체크리스트

- [x] 모든 FR이 최소 1개 Task에 매핑됨 (FR-01~04 → TASK-01, FR-05 → TASK-02, FR-06 → TASK-03)
- [x] 모든 NFR이 설계 또는 Task에 반영됨 (NFR-01 · NFR-02 → 설계 §4 + TASK-04)
- [x] Task 간 순환 의존 없음 (01 → {02, 03} → 04)
- [x] 제약조건 내 실현 가능 (CON-01 문서 전용 / CON-02 사본 / CON-03 정적 점검 / CON-04 보존)
- [x] 각 Task에 완료 조건이 있음 (Acceptance Criteria + 실행 가능한 Verify 명령)
- [x] 리스크가 식별되고 대응 전략이 있음 (R-01 ~ R-04)
- [x] 실행 순서가 의존관계와 일치함 (Phase 1 → 2 → 3)
- [x] Out-of-Scope 항목(`AGENTS.md`, `npm/bin/cli.mjs`, `docs/`, 루트 잔여 파일, 에이전트·플러그인 원본)이 TASK로 편성되지 않음

---
