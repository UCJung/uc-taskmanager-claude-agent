# Requirement — WORK-56

> 복잡도: **Medium**
> 예상 영향 범위: `develop/skills/*/SKILL.md` (3개 파일), `README.md` — `develop/references/*.md`는 검사 결과 현행과 일치하여 **수정 불필요**, `develop/agents/*.md`는 정본(수정 대상 아님)
> 생성 주체: specifier / 언어: ko / mode: auto

---

## Original Request
> Agent 정의 기준 references/skills/README 전수검사 현행화.
> 이것은 이 저장소 자신의 파이프라인 문서를 정합화하는 메타 작업이다. mode=auto. WORK ID는 WORK-56으로 고정.
> **정본(source of truth)**: `develop/agents/*.md` (orchestrator, specifier, planner, builder, verifier, committer 및 존재하는 모든 에이전트 정의).
> **목표**: `develop/agents/*.md`의 현행 정의를 기준으로 아래 대상 문서들이 현행 Agent 정의와 어긋나는 서술을 갖는지 전수검사하고 현행화 대상을 도출한다.
> - 검사 대상 1: `develop/references/*.md` (전체)
> - 검사 대상 2: `develop/skills/*/SKILL.md` (전체)
> - 검사 대상 3: `README.md` (및 README가 참조하는 `docs/*.md` 중 파이프라인 서술 부분)
>
> **제약**: (1) references 수정 시 CLAUDE.md의 "레퍼런스 수정 절차(ref-cache 연동)" 준수 — 섹션 번호 재번호/재사용 금지(삭제는 결번 처리), 각 파일 상단 "섹션 소비 매트릭스" 갱신, orchestrator.md 2곳 중복 기재 동기화, 검증(`grep "^## §"`). (2) 배포 사본(plugin/, npm/) 동기화는 이 WORK에서 하지 않음 — Push 절차에 위임. (3) 정본 `develop/agents/*.md` 자체는 수정 대상 아님(기준으로만 사용). agents 내부 상호 불일치 발견 시 needs-decision으로 보고만.

---

## 배경 및 목적
- **해결하려는 문제**: WORK-55에서 committer가 deprecated 처리되고 커밋이 orchestrator 인라인 절차로 흡수되었으며(자식 spawn 대상은 4종: specifier/planner/builder/verifier), 커밋/결과파일 작성 주체가 orchestrator로 이동했다. 이 정본 변경이 references에는 반영되었으나 **skills·README 일부에 미반영 잔재**가 남아 문서 간 정합이 깨져 있다. 추가로 README에는 현행 정의에 존재하지 않는 **구형 `progress.md`/`PROGRESS.md` 체크포인트 모델** 서술과 **specifier에게 `[]`-태그 감지를 귀속**시키는 구형 서술이 잔존한다.
- **이해관계자**: 파이프라인을 구동하는 Main Claude / orchestrator, 문서를 읽는 사용자·기여자, 배포 사본(plugin/npm)을 동기화하는 Push 절차.
- **기존 시스템/프로세스 관계**: 문서 정본은 `develop/agents/*.md` + `develop/references/*.md`. skills는 트리거·오케스트레이션 요약, README는 사용자 대면 설명. 이들이 정본과 어긋나면 사용자·에이전트가 잘못된 모델을 학습한다.

---

## 전수검사 결과 (근거 — 실제 파일 대조)

### 검사 대상 1: `develop/references/*.md` → **현행과 일치 (수정 불필요)**
`agent-flow.md`, `context-policy.md`, `file-content-schema.md`, `shared-prompt-sections.md`, `work-activity-log.md`, `xml-schema.md` 전수 확인 결과, 인라인 커밋·자식 4종·3+2N·ref-cache·result.md 작성 주체(orchestrator)·WORK-LIST DONE 전환 주체(orchestrator) 모두 현행 agents 정의와 일치. committer/progress.md 잔재 없음.
→ **본 WORK에서 references는 수정하지 않는다.** 따라서 CLAUDE.md "레퍼런스 수정 절차(ref-cache 매트릭스+orchestrator.md 동기화)"는 트리거되지 않는다. (단, 후속 단계에서 신규 reference 편집이 필요하다고 판단되면 그 절차를 반드시 적용해야 함 — CON-01 참조.)

### 검사 대상 2: `develop/skills/*/SKILL.md` → **드리프트 5건**
| # | 파일:라인 | 현재 서술 | 현행 정의와의 불일치 |
|---|-----------|----------|---------------------|
| S1 | `sdd-pipeline/SKILL.md:3` | "파이프라인 에이전트(orchestrator, specifier, planner, builder, verifier, **committer**)가 참조..." | committer는 deprecated 스텁이며 참조 주체 아님 |
| S2 | `work-pipeline/SKILL.md:39` | "specifier/planner/builder/verifier/**committer**는 orchestrator가 내부에서 중첩 spawn" | committer는 spawn되지 않음(커밋은 orchestrator 인라인) |
| S3 | `work-pipeline/SKILL.md:65` | 축퇴 모드 "specifier/planner/builder/verifier/**committer**를 직접 spawn(depth=1)" | 축퇴 시 자식 4종만 직접 spawn, 커밋은 인라인 수행 |
| S4 | `work-pipeline/SKILL.md:74` | "축퇴 모드에서는 Main Claude가 자식 **5종**을 직접 spawn" | 자식은 **4종** |
| S5 | `work-status/SKILL.md:21` | "`DONE` \| 모든 TASK 커밋됨 — **committer가 마지막 TASK에서 자동 설정**" | DONE 전환 주체는 **orchestrator**(인라인 커밋) |

### 검사 대상 3: `README.md` → **드리프트 3군**
**R-A. committer/자식 수 미세 오류 (2건)** — README 대부분은 현행(스텁·3+2N·인라인 커밋)을 정확히 서술하나 아래 2곳만 불일치:
| # | 라인 | 현재 서술 | 불일치 |
|---|------|----------|--------|
| R1 | `README.md:450` | 축퇴 모드 "spawning the **five children** directly at depth 1" | 자식은 4종(specifier/planner/builder/verifier), 커밋은 인라인 |
| R2 | `README.md:468` | "**Five agents are nested by orchestrator**" | orchestrator는 자신을 nest하지 않음 — nest 대상은 4종(표는 orchestrator 포함 5행). 문장이 후속 "orchestrator nests the rest[=4]"와 상충 |

**R-B. 구형 `progress.md`/`PROGRESS.md` 체크포인트 모델 잔재 (현행 agents/references에 부재)** — 현행 정의에는 progress.md/PROGRESS.md/TASK-NN_progress.md 개념이 없다(빌더는 task-result XML의 context-handoff 반환, orchestrator가 result.md 인라인 작성, 재개는 `work_{WORK}.log` 기반):
| # | 라인 | 현재 서술(요지) |
|---|------|----------------|
| R3 | `:106` | 예시 출력 "Updating **PROGRESS.md** and finalizing WORK-31" |
| R4 | `:278` | "Orchestrator reads **PROGRESS.md** and result.md files to report current state" |
| R5 | `:474` | planner 역할 "pre-create **progress templates**" |
| R6 | `:475` | builder 역할 "**progress.md** checkpoint recording" |
| R7 | `:476` | verifier 역할 "**Progress gate (Status=COMPLETED)**" (현행 verifier엔 없는 단계) |
| R8 | `:491` | file-content-schema 설명이 "**progress.md**" 포맷 정의 포함이라 기술(실제 미정의) |
| R9 | `:507` | 파일 트리 "**PROGRESS.md** ← Progress tracking (auto-updated)" |
| R10 | `:511` | 파일 트리 "**TASK-00_progress.md** ← Real-time checkpoint (builder writes)" |
| R11 | `:524` | 파일명 규칙표 "Progress checkpoint \| **TASK-NN_progress.md**" |
| R12 | `:527` | 파일명 규칙표 "Work progress \| **PROGRESS.md**" |
| R13 | `:591` | "Orchestrator reads work_{WORK}.log (and **PROGRESS.md**)" |
| R14 | `:668` | file-content-schema가 "**progress.md**" 포맷 정의라 기술(실제 미정의) |
| R15 | `:803` | builder "writing a **progress.md** checkpoint" (Result responsibility shift 문단) |

**R-C. specifier 역할/트리거 귀속 오류 (구형 모델)** — 현행: `[]`-태그 감지·파이프라인 트리거는 `work-pipeline` 스킬(Main Claude)의 역할이고, Main Claude가 spawn하는 것은 orchestrator 1개뿐. specifier.md에는 `[]`-태그 감지 서술이 없다:
| # | 라인 | 현재 서술 | 불일치 |
|---|------|----------|--------|
| R16 | `:473` | specifier 역할에 "`[]` tag detection" 포함 | 트리거 감지는 스킬 담당 |
| R17 | `:895` | 파일 트리 "specifier.md ← **[] tag detection** + requirement analysis" | 동일 |
| R18 | `:300`,`:303` | CLAUDE.md 등록 스니펫 "`[]` 태그로 시작하는 요청 → **specifier 에이전트 호출**" | 현행은 work-pipeline 스킬→orchestrator 트리거. "Main Claude never calls specifier directly"(:358)와 상충 |

**참고(저강도 관찰, 필수 아님)**: `:473` specifier MCP 설명 "Serena (codebase exploration)"은 `specifier.md § 4`("코드베이스 심층 탐색은 planner 전담")와 표현상 다소 상충. 표현 정밀화는 선택.

### 검사 대상 3-보조: README가 참조하는 `docs/*.md`
README는 `docs/spec_sliding-window-context.md`(:807), `docs/spec_SDD_with_ucagent_requirement.md`(:1012)를 링크하고 파일 트리에 `docs/spec_pipeline-architecture_v1.3.md`(:943)를 나열한다. 이들은 **버전이 명기된 설계 스냅샷**(v1.3 등)으로, 운영 정본이 아니라 설계 이력 문서다. → 스코프 경계 결정 필요(§ 가정사항 ASM-01 / needs-decision 후보).

---

## 범위 (Scope)

### In-Scope
- `develop/skills/sdd-pipeline/SKILL.md`, `develop/skills/work-pipeline/SKILL.md`, `develop/skills/work-status/SKILL.md`의 현행화 (드리프트 S1~S5).
- `README.md`의 현행화 (드리프트 R1~R18).
- `develop/references/*.md` 검사 결과 "현행 일치" 확인 및 무변경 명시.

### Out-of-Scope
- `develop/agents/*.md` 수정 (정본 — 기준으로만 사용). 내부 상호 불일치 발견 시 보고만.
- 배포 사본 `plugin/`, `npm/` 동기화 (Push 절차에 위임).
- `develop/references/*.md` 실질 편집 (검사 결과 무변경). 단 후속에서 편집 필요 판단 시 CLAUDE.md ref-cache 절차 적용 조건부.
- `docs/spec_*.md` 버전 명기 설계 스냅샷 수정 (ASM-01 권고: 제외 / 검사·보고만) — 최종 확정은 결정 필요.

---

## Functional Requirements

| ID | 요구사항 | 우선순위 | 인수 기준 |
|----|---------|---------|----------|
| FR-01 | (skills) `sdd-pipeline/SKILL.md`에서 파이프라인 에이전트 나열의 committer 잔재를 현행 정의(스텁·비-spawn)에 맞게 정정한다 | M | - [ ] S1 정정: committer가 능동 참조/spawn 주체로 나열되지 않음 (제거 또는 "스텁"으로 표기) |
| FR-02 | (skills) `work-pipeline/SKILL.md`의 정상·축퇴 spawn 서술을 자식 4종 + orchestrator 인라인 커밋 모델로 정정한다 | M | - [ ] S2 정정: 중첩 spawn 대상이 specifier/planner/builder/verifier 4종<br>- [ ] S3 정정: 축퇴 직접 spawn 대상이 4종, 커밋은 인라인 수행으로 서술<br>- [ ] S4 정정: "자식 5종" → "자식 4종" |
| FR-03 | (skills) `work-status/SKILL.md`의 DONE 전환 주체를 committer→orchestrator(인라인 커밋)로 정정한다 | M | - [ ] S5 정정: DONE 트리거가 "orchestrator(인라인 커밋)"로 기술됨 (`shared-prompt-sections.md § 8`과 일치) |
| FR-04 | (README) 축퇴 모드·에이전트 수 서술의 자식 수/네스팅 표현을 4종 기준으로 정정한다 | M | - [ ] R1 정정: `:450` "five children" → 자식 4종(커밋 인라인)<br>- [ ] R2 정정: `:468` 문장이 "orchestrator가 4종을 nest, 총 5 에이전트" 취지로 내부 모순 없이 서술 |
| FR-05 | (README) 현행 정의에 부재한 `progress.md`/`PROGRESS.md`/`TASK-NN_progress.md` 체크포인트 모델 서술을 현행 모델(context-handoff → orchestrator 인라인 result.md, 재개는 활동 로그 기반)로 정정·제거한다 | M | - [ ] R3~R15 각 지점이 현행 산출물(result.md/`work_{WORK}.log`/context-handoff)로 정정되거나 삭제됨<br>- [ ] 정정 후 README 전체에 `progress.md`/`PROGRESS.md`/`_progress.md` 문자열이 현행에 부합하지 않는 형태로 잔존하지 않음 (`file-content-schema.md § 5` 파일명 규칙과 일치) |
| FR-06 | (README) `[]`-태그 감지·파이프라인 트리거 귀속을 현행(work-pipeline 스킬/Main Claude→orchestrator)에 맞게 정정하고 specifier 역할 서술에서 트리거 감지를 제거한다 | S | - [ ] R16, R17 정정: specifier 역할 목록에서 "[] tag detection" 제거(요구분석/복잡도/ WORK-LIST 유지)<br>- [ ] R18 정정: CLAUDE.md 등록 스니펫이 현행 트리거(work-pipeline 스킬→orchestrator)와 모순되지 않게 정정, `:358` "Main Claude never calls specifier directly"와 일관 |
| FR-07 | (references) `develop/references/*.md`가 현행 agents 정의와 일치함을 확인하고 무변경으로 남긴다. 검사 중 실제 드리프트가 발견되면 임의 편집하지 않고 CLAUDE.md ref-cache 절차 적용 대상으로 보고한다 | M | - [ ] references 6개 파일에 committer 능동 서술/`progress.md` 잔재 없음이 재확인됨<br>- [ ] references 파일이 이 WORK에서 내용 변경되지 않음 (git diff 없음) |
| FR-08 | (docs 스코프) README가 참조하는 `docs/spec_*.md` 파이프라인 서술의 드리프트 여부를 검사하고, 버전 명기 설계 스냅샷은 수정하지 않고 보고만 한다(ASM-01 확정에 따름) | C | - [ ] `docs/spec_pipeline-architecture_v1.3.md` 등 링크된 설계 스냅샷의 파이프라인 서술 드리프트 유무가 결과에 1줄 이상 보고됨<br>- [ ] ASM-01이 "제외"로 확정된 경우 해당 docs 파일이 변경되지 않음 |

---

## Non-Functional Requirements

| ID | 구분 | 요구사항 | 인수 기준 |
|----|------|---------|----------|
| NFR-01 | 정합성/무결성 | 정본 불변식 준수 — `develop/agents/*.md`는 수정하지 않고 기준으로만 사용하며, 모든 정정은 현행 agents 정의를 단일 근거로 한다 | - [ ] 이 WORK의 git diff에 `develop/agents/*.md` 변경 없음 |
| NFR-02 | 정합성/무결성 | (조건부) `develop/references/*.md`를 편집하게 되면 CLAUDE.md "레퍼런스 수정 절차"를 완수한다 — § 번호 재번호/재사용 금지(삭제는 결번), 상단 섹션 소비 매트릭스 갱신, `orchestrator.md` 2곳(STEP 1-1 요약표 + STEP A/B/C spawn 라인) 동기화, `grep "^## §"` 검증 | - [ ] references 편집이 발생하지 않았거나(기본), 발생 시 위 4개 하위 절차 완수가 검증됨 |
| NFR-03 | 일관성 | 정정 후 skills·README·references 3개 문서군이 committer(비-spawn 스텁)·자식 4종·3+2N·인라인 커밋·result.md 작성 주체(orchestrator) 서술에서 상호 모순이 없다 | - [ ] `committer`/`progress`/`five children`/`자식 5종` 키워드 재검색 시 현행 모델에 반하는 잔재가 In-Scope 파일에 없음 |
| NFR-04 | 범위 격리 | 배포 사본(`plugin/`, `npm/`)은 이 WORK에서 변경하지 않는다 | - [ ] git diff에 `plugin/`·`npm/` 변경 없음 |

---

## 제약조건 (Constraints)
- **CON-01**: references 수정은 원칙적으로 하지 않는다. 부득이 필요 시 CLAUDE.md ref-cache 연동 절차를 반드시 수반해야 하며, 매트릭스/orchestrator.md 동기화가 깨진 중간 상태를 커밋하지 않는다.
- **CON-02**: `develop/agents/*.md`는 read-only 정본.
- **CON-03**: plugin/·npm/ 동기화 금지(Push 절차 위임).
- **CON-04**: Bash 명령 규칙(`shared-prompt-sections.md § 12`) 준수 — 복합 명령/`cd`/`git -C` 금지, 파일 작업은 전용 도구 우선.

## 가정사항 (Assumptions)
- **ASM-01**: `docs/spec_*.md`(버전 명기 설계 스냅샷: `spec_pipeline-architecture_v1.3.md`, `spec_SDD_with_ucagent_requirement.md`, `spec_sliding-window-context.md`)는 **수정하지 않고 검사·보고만** 한다. [확인 필요 — needs-decision으로 orchestrator 상향] 권고 근거: 버전이 고정된 설계 이력 문서로, 운영 정본이 아니며 현행화 대상은 운영 문서(skills/README)와 정본(agents/references)이다.
- **ASM-02**: README의 committer 스텁 서술(`:332`,`:350`,`:351`,`:358`,`:386`,`:478`,`:899`)은 현행과 정확히 일치하므로 유지한다(정정 대상 아님). [합의 완료 — 대조 확인됨]
- **ASM-03**: skills 정정은 committer 관련 서술을 "완전 삭제"가 아니라 현행 모델(인라인 커밋/4종)로 "정정"하는 방향을 기본으로 한다(스텁 존재 자체는 사실). [확인 필요 — 경미, planner/builder가 문맥에 맞게 결정]

## 용어 정의
| 용어 | 정의 |
|------|------|
| 정본(source of truth) | `develop/agents/*.md` — 다른 문서가 따라야 하는 기준 정의 |
| 드리프트 | 정본 변경이 반영되지 않아 종속 문서가 현행과 어긋난 상태 |
| 인라인 커밋 | verifier PASS 직후 orchestrator가 자식 spawn 없이 직접 수행하는 result.md 작성 + WORK-LIST 갱신 + git commit |
| 자식 4종 | orchestrator가 중첩 spawn하는 specifier/planner/builder/verifier |
| 3+2N | Main→orch(1)+orch→spec(1)+orch→plan(1)+builder(N)+verifier(N) 스폰 총합 |

## 추적성 매트릭스
| 원본 요청 항목 | 관련 FR/NFR | 인수 기준 근거 |
|--------------|------------|--------------|
| skills 전수검사·현행화 | FR-01, FR-02, FR-03 | S1~S5 |
| README 전수검사·현행화 | FR-04, FR-05, FR-06 | R1~R18 |
| references 전수검사(제약: ref-cache 절차) | FR-07, NFR-02, CON-01 | references 검사 결과 |
| docs/*.md 파이프라인 서술 검사 | FR-08, ASM-01 | docs 링크 대조 |
| 정본 불변·배포사본 격리 | NFR-01, NFR-04, CON-02, CON-03 | 제약 |
| 문서군 상호 정합 | NFR-03 | 키워드 재검색 |

## 질의응답 기록
| # | 질문 | 답변 | 일시 |
|---|------|------|------|
| Q1 | `docs/spec_*.md` 버전 명기 설계 스냅샷을 현행화 대상에 포함할 것인가? | needs-decision 상향(권고: 제외, 검사·보고만) | 2026-07-24 |

---

## 미해결 질문 / needs-decision 후보
1. **docs 스코프 경계(ASM-01)**: 버전 명기 설계 스냅샷(`docs/spec_*.md`)을 (a) 수정 제외·보고만 vs (b) 파이프라인 서술 부분만 현행화. 권고: (a).
