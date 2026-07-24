# WORK-56: Agent 정의 기준 skills/README 현행화 (references·docs 검사)

> Created: 2026-07-24
> Requirement: works/WORK-56/Requirement.md
> Project: uc-taskmanager-claude-agent
> Tech Stack: Markdown 문서 (파이프라인 정의 문서군), grep 기반 검증
> Language: ko
> Status: PLANNED

## 목표
정본 `develop/agents/*.md`(WORK-55 이후: committer deprecated 스텁·자식 4종·orchestrator 인라인 커밋)를 기준으로, 종속 문서인 `develop/skills/*/SKILL.md`(드리프트 S1~S5)와 `README.md`(드리프트 R1~R18)를 현행화한다. `develop/references/*.md`는 검사 결과 현행 일치이므로 무변경 확인만, `docs/spec_*.md`는 버전 명기 설계 스냅샷이므로 드리프트 검사·보고만 한다(D-01=auto 확정).

## 설계

### 1. 아키텍처 방향
- **신규 구축 아님 — 기존 문서 정정(현행화)**. 코드 변경 없음, 순수 문서 편집.
- **정본 불변식(NFR-01/CON-02)**: `develop/agents/*.md`는 read-only. 모든 정정의 단일 근거이며 이 WORK에서 diff가 없어야 한다.
- **범위 격리(NFR-04/CON-03)**: `plugin/`·`npm/` 배포 사본은 건드리지 않는다(Push 절차에 위임). TASK Scope는 `develop/skills/`·`README.md`·(읽기전용) `develop/references/`·`docs/`로만 한정한다.
- **references 무변경 원칙(CON-01/NFR-02)**: references 편집은 기본적으로 발생하지 않는다. 만약 builder가 편집 필요를 발견하면 **임의 편집하지 않고 needs-decision으로 상향**하고, 부득이 편집 시 CLAUDE.md "레퍼런스 수정 절차"(§ 번호 재번호/재사용 금지·삭제는 결번, 섹션 소비 매트릭스 갱신, orchestrator.md 2곳 동기화, `grep "^## §"` 검증) 4개 하위 절차를 반드시 수반한다. 이 WORK에는 references 편집 전용 TASK를 두지 않는다.

### 2. 데이터 설계
해당 없음(스키마·DB 변경 없음). 편집 대상 산출물:
- `develop/skills/sdd-pipeline/SKILL.md`, `develop/skills/work-pipeline/SKILL.md`, `develop/skills/work-status/SKILL.md`
- `README.md`

### 3. 인터페이스 설계
해당 없음(API 변경 없음). 문서 서술 모델을 현행 파이프라인 모델로 통일:
- 커밋 주체: committer(스텁, 비-spawn) → **orchestrator 인라인 커밋**(result.md 작성 + WORK-LIST DONE 전환 + git commit)
- 중첩 spawn 대상: **자식 4종**(specifier/planner/builder/verifier)
- 체크포인트 모델: 구형 `progress.md`/`PROGRESS.md`/`TASK-NN_progress.md` 제거 → 현행(builder의 context-handoff → orchestrator 인라인 result.md, 재개는 `work_{WORK}.log` 기반)
- `[]`-태그 감지·트리거 귀속: specifier가 아니라 **work-pipeline 스킬(Main Claude) → orchestrator**

### 4. NFR 대응 설계
- **정합성(NFR-01/02)**: agents 무변경 + references 조건부 절차 준수를 각 TASK Acceptance/Verify에 명시.
- **일관성(NFR-03)**: 정정 후 `committer`/`progress`/`five children`/`자식 5종` 키워드 재검색으로 잔재 부재 검증(각 TASK Verify에 grep 포함).
- **범위 격리(NFR-04)**: 최종 커밋 검증에 `develop/agents/*.md`·`plugin/`·`npm/` 무변경 포함. 어떤 TASK도 이 경로를 Scope에 넣지 않는다.

## 작업 목록
| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | skills 3종 현행화 (S1~S5) | 없음 | 1 | Must | FR-01, FR-02, FR-03, NFR-03 | M |
| TASK-02 | README committer/자식수 정정 (R1~R2) | 없음 | 1 | Must | FR-04, NFR-03 | S |
| TASK-03 | README 구형 progress 모델 제거 (R3~R15) | TASK-02 완료 후 | 2 | Must | FR-05, NFR-03 | L |
| TASK-04 | README specifier 트리거 귀속 정정 (R16~R18) | TASK-03 완료 후 | 3 | Should | FR-06, NFR-03 | M |
| TASK-05 | references 무변경 확인 + docs 드리프트 검사·보고 | 없음 | 1 | Must | FR-07, FR-08, NFR-01, NFR-02, NFR-04 | M |

> README를 편집하는 TASK-02/03/04는 **동일 파일 동시 편집을 피하기 위해 직렬(체인) 의존**으로 배치했다. TASK-01(skills)·TASK-05(읽기전용 검사)는 편집 대상 파일이 겹치지 않아 TASK-02와 병렬 실행 가능하다.

## Task 의존성 그래프
```
Phase 1 (병렬)        Phase 2            Phase 3
┌──────────┐
│ TASK-01  │ (skills)
└──────────┘
┌──────────┐        ┌──────────┐       ┌──────────┐
│ TASK-02  │──────▶ │ TASK-03  │─────▶ │ TASK-04  │  (README 직렬)
└──────────┘        └──────────┘       └──────────┘
┌──────────┐
│ TASK-05  │ (references+docs 검사, 읽기전용)
└──────────┘

병렬 그룹: {TASK-01, TASK-02, TASK-05}
직렬 체인: TASK-02 → TASK-03 → TASK-04 (모두 README.md 편집)
```

## 리스크 및 대응
| # | 리스크 | 등급 | 대응 |
|---|--------|------|------|
| RISK-01 | README 동일 파일을 여러 TASK가 동시 편집해 충돌 | 중 | TASK-02→03→04 직렬 의존으로 배치(동시 편집 배제) |
| RISK-02 | 라인 번호가 이전 TASK 편집으로 이동해 후속 TASK가 오탐/미탐 | 중 | 각 TASK는 라인 번호가 아니라 **문자열 앵커**로 편집하고, Verify에서 grep 재검색으로 확정 |
| RISK-03 | 진행 중 references 실제 드리프트를 builder가 발견 | 저 | 임의 편집 금지 — needs-decision 상향(CON-01/NFR-02). references 편집 전용 TASK 미생성 |
| RISK-04 | ASM-02 committer 스텁 정상 서술(:332,:350,:351,:358,:386,:478,:899)을 과잉 삭제 | 중 | 각 TASK Scope에 "committer 스텁 정상 서술은 유지" 명시, Verify grep은 '현행 모델에 반하는' 잔재만 겨냥 |
| RISK-05 | 정본 agents/plugin/npm 경로를 실수로 편집 | 중 | 어떤 TASK Scope에도 해당 경로 미포함, 최종 커밋 검증에서 diff 부재 확인 |

## 추적성 매트릭스
| FR/NFR | 매핑 TASK | 인수 근거 |
|--------|----------|----------|
| FR-01 (sdd-pipeline committer) | TASK-01 | S1 |
| FR-02 (work-pipeline 4종/인라인) | TASK-01 | S2, S3, S4 |
| FR-03 (work-status DONE 주체) | TASK-01 | S5 |
| FR-04 (README 자식수/네스팅) | TASK-02 | R1, R2 |
| FR-05 (README progress 제거) | TASK-03 | R3~R15 |
| FR-06 (README specifier 트리거) | TASK-04 | R16, R17, R18 |
| FR-07 (references 무변경 확인) | TASK-05 | references 6종 재검사 + diff 부재 |
| FR-08 (docs 드리프트 보고) | TASK-05 | spec_*.md 드리프트 1줄+ 보고 + 무변경 |
| NFR-01 (정본 불변) | 전체 TASK + TASK-05 | agents diff 부재 |
| NFR-02 (references 조건부 절차) | 전체 TASK(조건부) | 편집 미발생 or 4절차 완수 |
| NFR-03 (문서군 상호 정합) | TASK-01~04 | 키워드 재검색 잔재 부재 |
| NFR-04 (배포사본 격리) | 전체 TASK + TASK-05 | plugin/·npm/ diff 부재 |

## 자체 검증 체크리스트
- [x] 모든 FR(FR-01~FR-08)이 최소 1개 TASK에 매핑됨
- [x] 모든 NFR(NFR-01~NFR-04)이 TASK Acceptance/Verify에 반영됨
- [x] D-01(docs 수정 제외·보고만) 확정이 TASK-05에 반영됨
- [x] 정본(develop/agents/*.md)·plugin/·npm/를 편집하는 TASK 없음
- [x] references 편집 전용 TASK 없음(CON-01), 조건부 절차는 각 TASK에 명시
- [x] README 동시 편집 충돌 방지를 위한 직렬 의존 배치
- [x] ASM-02 committer 스텁 정상 서술 유지 지침 반영
