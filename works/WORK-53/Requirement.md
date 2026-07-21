# Requirement — WORK-53

> Created: 2026-07-21
> Complexity: **Medium (pipeline)** — 권고 범위(Option 3) 기준. 범위 결정(D-01)에 따라 Small로 하향 가능
> 예상 영향 범위: `README.md`, `npm/README.md`, `README_KO.md` (문서 전용, 코드 변경 없음)

---

## Original Request

> [WORK] works\WORK-52 수정사항으로 readme.md 파일 현행화 해줘

---

## 배경 및 목적

- **해결하려는 문제**: WORK-52("Orchestrator Agent 도입")로 에이전트 구성과 디렉터리 구조가 바뀌었으나, 저장소의 README 계열 문서가 현재 상태와 불일치한다.
  - `scheduler` 에이전트가 삭제되고 `orchestrator`가 신설됨
  - `develop/references/`가 6개 → **8개**로 증가 (`callback-protocol.md`, `ref-cache-protocol.md` 추가 반영 필요)
  - `npm/lib/constants.mjs` 정합화(커밋 `756cb3e`)로 npm 설치기가 `orchestrator.md` + 8개 reference를 설치하도록 변경됨
- **현재 상태 조사 결과**:

  | 파일 | 최종 갱신 | `orchestrator` 언급 | `scheduler` 언급 | 판정 |
  |------|----------|--------------------|-----------------|------|
  | `README.md` | `7375038` (WORK-52 TASK-07) | 55 | 0 | 본문 서술은 현행화됨 / **구조·경로 기술 잔여 오류 존재** |
  | `npm/README.md` | `d11e68e` (2026-03-31, WORK-52 이전) | 2 | **19** | 미반영 |
  | `README_KO.md` | `50ae5c4` (2026-03-29, WORK-52 이전) | 0 | **18** | 미반영 |

- **이해관계자**: 저장소 방문자(README.md), npm 패키지 `uctm` 이용자(npmjs.com에 노출되는 `npm/README.md`), 한국어 사용자(`README_KO.md`)
- **기존 프로세스 관계**: 프로젝트 `CLAUDE.md`의 Push 절차 3~4단계는 README 갱신 및 `README.md → npm/README.md` 동기화(영문만)를 요구한다.

---

## 범위

### In-Scope

1. `README.md` 잔여 불일치 항목 정정 (Support Files 섹션, Repository Structure 섹션, 레퍼런스 경로 표기, Manual 설치 절차)
2. `npm/README.md` — `README.md` 내용으로 전체 동기화
3. `README_KO.md` — orchestrator 중심 모델로 현행화 (`scheduler` 전면 제거)

### Out-of-Scope

- `develop/`, `plugin/`, `npm/` 하위 에이전트·레퍼런스·스킬 원본 파일 수정 (WORK-52에서 완료됨)
- 미커밋 상태인 `AGENTS.md`(신규, Codex용 지침 사본) 및 `npm/bin/cli.mjs`(개행 문자만 변경)의 처리 — 별도 WORK 대상
- `docs/` 하위 설계 문서(`spec_pipeline-architecture_v1.3.md` 등)의 orchestrator 반영 — 별도 WORK 대상
- 루트의 잔여 파일(`work_WORK-25.log`, `_TODO/`) 정리
- 코드/스크립트 변경, npm 버전업·publish

---

## Functional Requirements

| ID | 요구사항 | 우선순위 | 인수 기준 |
|----|---------|---------|----------|
| FR-01 | `README.md`의 "Support Files (included in Plugin)" 섹션은 실제 레퍼런스 파일 구성과 일치해야 한다. | M | - [ ] "6 support files" → 실제 개수(8)로 정정<br>- [ ] 경로 `plugin/skills/sdd-pipeline/references/` → 실제 경로 `plugin/references/`로 정정<br>- [ ] 표에 `callback-protocol.md`, `ref-cache-protocol.md` 2건 추가 (총 8행) |
| FR-02 | `README.md`의 "Repository Structure" 트리는 실제 디렉터리 구조와 일치해야 한다. | M | - [ ] 존재하지 않는 `develop/hooks/` 항목 제거<br>- [ ] `develop/references/` 하위 8개 파일 반영<br>- [ ] `develop/.claude-plugin/plugin.json` 항목 추가<br>- [ ] `plugin/skills/init/` → 실제 이름 `uctm-init/`로 정정<br>- [ ] 존재하지 않는 `plugin/skills/sdd-pipeline/references/` 항목 제거<br>- [ ] 존재하지 않는 `plugin/README.md` 항목 제거<br>- [ ] `npm/` 하위에 실제 존재하는 `references/`, `skills/`, `README.md` 항목 추가하고 `npm/agents/` 설명("+ develop/references/") 정정<br>- [ ] 트리에 기재된 모든 경로가 실제로 존재함 (검증 스크립트 통과) |
| FR-03 | `README.md` 본문의 레퍼런스 파일 경로 표기가 현재 위치를 가리켜야 한다. | M | - [ ] `agents/xml-schema.md`, `agents/shared-prompt-sections.md` → `references/...`로 정정<br>- [ ] ref-cache 섹션이 `ref-cache-protocol.md`의 존재를 반영 |
| FR-04 | `README.md`의 Manual 설치 절차는 `npm/lib/constants.mjs`가 실제로 설치하는 산출물(에이전트 6종 + 레퍼런스 8종)과 일치해야 한다. | S | - [ ] `npm/references/*.md` 복사 단계가 포함됨<br>- [ ] 복사 대상 에이전트 목록에 `scheduler.md`가 없고 `orchestrator.md`가 포함됨 |
| FR-05 | `npm/README.md`가 최신 `README.md`와 동일해야 한다. | M | - [ ] `diff README.md npm/README.md` 결과 차이 없음<br>- [ ] `npm/README.md` 내 `scheduler` 언급 0건 |
| FR-06 | `README_KO.md`가 orchestrator 중심 중첩 파이프라인 모델을 반영해야 한다. | M | - [ ] `scheduler` 언급 0건<br>- [ ] 6개 에이전트 목록이 orchestrator/specifier/planner/builder/verifier/committer로 구성<br>- [ ] 실행 모드 서술이 `mode=gated`/`mode=auto` 및 [GATE-1]/[GATE-2] 체계로 대체됨<br>- [ ] `DECISIONS.md`, `work_{WORK}.log`, `SendMessage` 재개 서술 포함<br>- [ ] 섹션 구성이 `README.md`와 1:1 대응 |

> FR-06은 결정사항 D-01(범위)에서 Option 3이 확정될 때만 유효하다.

---

## Non-Functional Requirements

| ID | 구분 | 요구사항 | 인수 기준 |
|----|------|---------|----------|
| NFR-01 | 정합성 | 문서에 기재된 파일·디렉터리 경로 중 실제로 존재하지 않는 것이 없어야 한다. | - [ ] 3개 README에서 추출한 저장소 내부 경로 전수 확인 시 미존재 경로 0건 |
| NFR-02 | 일관성 | `README.md`와 `README_KO.md`의 섹션 구성·표 내용이 상호 모순되지 않아야 한다. | - [ ] 두 파일의 `##` 헤더 목록이 1:1 대응<br>- [ ] 에이전트 표·스폰 카운트 표의 수치가 동일 |

---

## 제약조건

- CON-01: 문서 전용 변경. 소스 코드·에이전트 정의·플러그인 매니페스트는 수정하지 않는다.
- CON-02: 프로젝트 `CLAUDE.md` Push 절차 4단계에 따라 `npm/README.md`는 영문 `README.md`의 사본이어야 하며, 한국어 내용을 포함하지 않는다.
- CON-03: 빌드/테스트 대상이 아니므로 검증은 grep/diff/경로 존재 확인 등 정적 점검으로 한정한다.
- CON-04: `README.md` 상단 배지·라이선스·외부 링크 등 WORK-52와 무관한 기존 내용은 보존한다.

## 가정사항

- ASM-01: `README.md` 본문의 orchestrator 서술(WORK-52 TASK-07 결과물)은 정확하며, 이번 WORK은 그 위의 잔여 구조·경로 오류만 보정한다. [확인 필요]
- ASM-02: `README_KO.md`는 `README.md`의 한국어 번역본 위치를 유지하며, 독자적 내용을 갖지 않는다. [합의 완료 — 기존 문서 구조상 자명]
- ASM-03: `develop/hooks/`는 의도적으로 제거된 것이며 향후 부활 계획이 없다. [확인 필요]
- ASM-04: 미커밋 상태의 `AGENTS.md`는 이번 WORK의 커밋 범위에 포함하지 않는다. [확인 필요]

## 용어 정의

| 용어 | 정의 |
|------|------|
| 현행화 | 문서 서술을 현재 코드베이스의 실제 상태와 일치시키는 작업 |
| 잔여 미반영분 | WORK-52 TASK-07(README 재작성) 이후에도 남아 있는 문서-실제 간 불일치 |
| 중첩 spawn | Main Claude가 orchestrator 1회만 호출하고, orchestrator가 나머지 에이전트를 depth 2로 호출하는 구조 |

---

## Acceptance Criteria

- [ ] AC-01: `grep -c "scheduler" README.md npm/README.md README_KO.md` 결과가 모두 0
- [ ] AC-02: `diff README.md npm/README.md` 결과 차이 없음
- [ ] AC-03: `README.md`의 Support Files 표가 `develop/references/`의 실제 8개 파일과 일치
- [ ] AC-04: `README.md` Repository Structure 트리에 기재된 모든 저장소 내부 경로가 실제로 존재
- [ ] AC-05: `README_KO.md`의 `##` 헤더 목록이 `README.md`와 1:1 대응
- [ ] AC-06: 3개 README 모두에서 6개 에이전트가 orchestrator/specifier/planner/builder/verifier/committer로 기재됨
- [ ] AC-07: WORK-52와 무관한 기존 섹션(배지, License, Serena MCP, Output Language 등)이 삭제되지 않음

---

## 추적성 매트릭스

| 원본 요청 항목 | 관련 FR/NFR | 인수 기준 |
|--------------|------------|----------|
| WORK-52 수정사항 반영 (에이전트 구성 변경) | FR-01, FR-03, FR-06 | AC-01, AC-03, AC-06 |
| WORK-52 수정사항 반영 (디렉터리/설치기 변경) | FR-02, FR-04, NFR-01 | AC-04 |
| readme.md 현행화 (배포 사본 포함) | FR-05, CON-02 | AC-02 |
| readme.md 현행화 (한국어 문서) | FR-06, NFR-02 | AC-05 |
| (전 항목 공통) 기존 내용 보존 | CON-04 | AC-07 |

---

## 결정사항

### D-01. "readme.md 현행화"의 대상 범위 — **RESOLVED: Option 3 (user 승인, 2026-07-21T03:50:49Z)**

> 확정: `README.md` + `npm/README.md` + `README_KO.md` 전면 현행화 (FR-01~FR-06 전부 유효). 복잡도 **Medium(pipeline)** 확정.
> 상세: `works/WORK-53/DECISIONS.md` D-01 참조.

- **배경**: 사용자 요청은 `readme.md`(단수)를 지칭했으나, 저장소에는 사용자 노출 README가 3개(`README.md`, `npm/README.md`, `README_KO.md`) 존재하며 뒤의 두 개는 WORK-52 이전 상태로 삭제된 `scheduler` 에이전트를 문서화하고 있다.
- **선택지**:
  1. `README.md`만 정정 (FR-01~04) → 복잡도 **Small(direct)**
  2. `README.md` + `npm/README.md` 동기화 (FR-01~05) → 복잡도 **Small(direct)**
  3. `README.md` + `npm/README.md` + `README_KO.md` (FR-01~06) → 복잡도 **Medium(pipeline)**
- **권고안**: **Option 3**. `npm/README.md`는 npmjs.com 패키지 페이지로 노출되고 `README_KO.md`는 `README.md` 상단에서 직접 링크되므로, 둘 다 삭제된 `scheduler` 에이전트를 안내하는 것은 사용자 대상 오정보다. 또한 프로젝트 `CLAUDE.md` Push 절차 4단계가 `npm/README.md` 동기화를 이미 의무화하고 있다.
- **영향**: 확정 결과에 따라 FR-05/FR-06 및 복잡도 판정이 달라진다.

## 질의응답 기록

| # | 질문 | 답변 | 일시 |
|---|------|------|------|
| Q1 | D-01 범위 결정 | Option 3 확정 (README.md + npm/README.md + README_KO.md) | 2026-07-21 |

---

## 자체 검증 체크리스트

- [x] 완전성: 3개 README 전수 조사 + WORK-52 커밋 10건의 변경 파일 전수 대조
- [x] 일관성: FR 간 모순 없음 (FR-05는 FR-01~04 완료 후 동기화, 순서 의존만 존재)
- [x] 검증 가능성: 모든 FR/NFR에 grep/diff/경로 존재 확인으로 검증 가능한 인수 기준 부여
- [x] 추적 가능성: 모든 FR이 원본 요청("WORK-52 수정사항", "readme 현행화")으로 매핑됨
- [x] 현실성: 문서 편집만으로 달성 가능, 빌드/테스트 불필요
- [x] 중복 없음: FR-01(Support Files)과 FR-02(Repository Structure)는 서로 다른 섹션을 다룸
- [x] 범위 명확: In/Out-of-Scope 명시, 경계 항목(AGENTS.md, docs/, cli.mjs)은 Out-of-Scope로 분류
