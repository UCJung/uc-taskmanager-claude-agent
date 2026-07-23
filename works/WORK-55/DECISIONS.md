# DECISIONS — WORK-55

## D-01
> 시각: 2026-07-23T01:47:00Z
> 단계: planner
> 상태: RESOLVED

### 배경
FR-04 인라인화 후 `committer.md` 정의 파일을 잔존/삭제/축소 중 어떻게 처리할지 결정이 필요(ASM-01).

### 선택지
1. 완전 삭제
2. 폐기 스텁으로 전환(잔존, 오해 소지 문구 제거)
3. 대폭 축소 후 잔존

### 권고안
option 2 — 폐기 스텁 전환.

### 확정값
폐기 스텁 전환. 완전 삭제는 `npm/lib/constants.mjs`(AGENT_FILES·OBSOLETE_PATHS)와 `plugin.json`(agents 배열 ×3) 수정을 요구해 CON-01(런타임 코드 불변)에 저촉. 스텁은 committer 절차/스폰 문구를 모두 제거하면서 패키징 매니페스트를 불변으로 유지. orchestrator 참조 제거로 실제 spawn되지 않음이 보장됨.

### 결정주체
auto

---

## D-02
> 시각: 2026-07-23T01:47:00Z
> 단계: planner
> 상태: RESOLVED

### 배경
docs 하위에 committer 스폰/린트 WARN/planner 겸임을 서술한 가이드가 있으면 정합화 대상에 포함할지 결정 필요(ASM-02).

### 선택지
1. README.md만 포함, 구식 스냅샷 문서 제외
2. docs 전체 포함

### 권고안
option 1 — README.md만 포함.

### 확정값
README.md만 포함. `spec_pipeline-architecture_v1.3.md`·`_archive/*`·`*.html`·`spec_sliding-window-context.md`·`guide_agent-testing.md`는 scheduler/router/direct-pipeline-full 모드 등 이미 현행 정의와 괴리된 역사적 스냅샷이라 부분 편집으로 정합화 불가 → 범위 제외(알려진 괴리로 기록). README.md는 현행 파이프라인을 기술하는 유일한 사용자 대면 문서라 필수 포함.

### 결정주체
auto

---

## D-03
> 시각: 2026-07-23T01:47:00Z
> 단계: planner
> 상태: RESOLVED

### 배경
committer 미-spawn에 따라 committer용 ref-cache 배분(섹션 소비 매트릭스의 committer 열)을 어떻게 제거할지 결정 필요(ASM-03).

### 선택지
1. 5개 매트릭스에서 commit 열 제거 + orchestrator가 인라인 수행하는 부분의 ✅를 orch 열로 이관
2. commit 열만 제거

### 권고안
option 1.

### 확정값
5개 매트릭스에서 commit 열 제거 + orch 열로 책임 이관. orchestrator 인라인 수행분(file-content-schema § 3 result.md·§ 5 생성주체, shared § 8 WORK-LIST)의 ✅를 orch 열로 이관해 전이적 배분 정합을 유지.

### 결정주체
auto

---

## D-04
> 시각: 2026-07-23T01:47:00Z
> 단계: planner
> 상태: RESOLVED

### 배경
committer 인라인화 후 커밋 완료를 나타내는 활동 로그 이벤트 설계가 필요. 잘못 설계하면 resume 시 side-effecting git commit이 중복/스킵됨.

### 선택지
1. `STAGE_DONE — stage=commit task=TASK-NN` (STAGE_START 없는 비-spawn 액션)
2. committer STAGE_START/STAGE_DONE 쌍 유지

### 권고안
option 1.

### 확정값
`STAGE_DONE — stage=commit task=TASK-NN`(STAGE_START 없음). 커밋은 비-spawn orchestrator 액션이라 STAGE_START가 없음. stage 값 집합은 committer→commit로 변경. 마지막 TASK 판정은 orchestrator가 `STAGE_DONE stage=commit` 수를 카운트. resume 시 commit 마커 부재면 result.md/최신 커밋 확인 후 멱등 재개.

### 결정주체
auto
