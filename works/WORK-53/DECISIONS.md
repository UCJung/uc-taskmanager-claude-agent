# DECISIONS — WORK-53

## D-01
> 시각: 2026-07-21T03:49:23Z
> 단계: specifier
> 상태: RESOLVED
> 해소 시각: 2026-07-21T03:50:49Z

### 배경
사용자 요청은 `readme.md`(단수)를 지칭했으나, 저장소에는 사용자 노출 README가 3개(`README.md`, `npm/README.md`, `README_KO.md`) 존재한다. `README.md`는 WORK-52 TASK-07에서 orchestrator 중심으로 재작성되었으나 Support Files 개수/경로·Repository Structure 트리 등 구조 기술에 잔여 오류가 남아 있고, `npm/README.md`(scheduler 19회)와 `README_KO.md`(scheduler 18회)는 WORK-52 이전 상태로 이미 삭제된 scheduler 에이전트를 문서화하고 있다. 확정 범위에 따라 실행 모드(direct/pipeline)와 FR-05/FR-06 포함 여부가 달라진다.

### 선택지
1. `README.md`만 정정 (FR-01~04) — 복잡도 Small(direct)
2. `README.md` + `npm/README.md` 동기화 (FR-01~05) — 복잡도 Small(direct)
3. `README.md` + `npm/README.md` + `README_KO.md` 전면 현행화 (FR-01~06) — 복잡도 Medium(pipeline)

### 권고안
Option 3 — `npm/README.md`는 npmjs.com 패키지 페이지로 직접 노출되고 `README_KO.md`는 `README.md` 상단에서 링크되므로, 둘 다 삭제된 scheduler 에이전트를 안내하는 것은 사용자 대상 오정보다. 또한 프로젝트 CLAUDE.md Push 절차 4단계가 `npm/README.md` 동기화를 이미 의무화하고 있어 어차피 수행이 필요하다.

### 확정값
Option 3 — `README.md` + `npm/README.md` + `README_KO.md` 전면 현행화 (FR-01~FR-06). 복잡도 Medium(pipeline) 확정, planner 중첩 spawn 진행.

세부 범위:
1. `README.md` — specifier가 식별한 잔여 오류 정정 (Support Files 6→8개, 경로 `plugin/skills/sdd-pipeline/references/` → `plugin/references/`, Repository Structure 트리에서 실존하지 않는 `develop/hooks/`·`plugin/README.md` 정리, `plugin/skills/init/` → `uctm-init/`, 커밋 `756cb3e` constants.mjs 정합화 반영)
2. `npm/README.md` — CLAUDE.md Push 절차 4단계에 따라 영문 `README.md`에서 동기화. scheduler 언급 0건.
3. `README_KO.md` — WORK-52 결과(orchestrator 중심 중첩 spawn, scheduler 삭제, gated/auto 모드, DECISIONS.md, SendMessage/TaskStop 재개) 반영. scheduler 언급 0건. `README.md`와 구조·내용이 대응되되 한국어 문서로서 자연스럽게 작성.

추가 검증 기준(AC):
- 3개 파일 모두 `scheduler` grep 결과 0건
- 3개 파일에 기재된 디렉터리·파일 경로가 실제 저장소에 존재하는지 확인

### 결정주체
user 승인

---

## D-02
> 시각: 2026-07-21T04:00:15Z
> 단계: planner
> 상태: RESOLVED
> 해소 시각: 2026-07-21T04:01:21Z

### 배경
GATE-2 — planner가 작성한 `PLAN.md` + TASK-01~04 DAG(01 → {02, 03} → 04)에 대한 승인 게이트.

### 선택지
1. 계획 승인 후 STEP C(TASK DAG 실행) 진입
2. 계획 수정 요청

### 권고안
Option 1 — 모든 FR/NFR이 TASK에 매핑되고 DAG에 순환이 없으며, Verify가 문서 전용 WORK에 맞는 정적 점검(grep/diff/경로 존재)으로 구성됨.

### 확정값
승인. STEP C 진입. TASK-02/TASK-03은 READY 시점에 병렬 dispatch. planner가 식별한 리스크 제약 유지: (1) TASK-03은 영문 문서(`README.md`, `npm/README.md`) 수정 금지, (2) `npm/README.md`는 `cp` 복사만 허용(개행 코드 보존), (3) TASK-04에서 헤더 개수 대조 및 조건부 재동기화 수행. STEP C 구간에서는 게이트를 올리지 않으며, 재시도 3회 실패 등 needs-decision 사유 발생 시에만 escalate.

### 결정주체
user 승인

