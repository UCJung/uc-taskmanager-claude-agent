# DECISIONS — WORK-54

## D-01
> 시각: 2026-07-22T04:57:54Z
> 단계: specifier
> 상태: RESOLVED

### 배경

specifier가 Requirement.md에 ASM-03을 [확인 필요]로 남겼다. `TODO/todo_uctm-update-coverage.md`는 untracked 상태이며, 이번 WORK(§1 update 갱신 범위, §2 릴리스 검증 절차, §3 constants.mjs 주석 정정)로 §1~§3이 해소되므로 이 문서를 커밋할지, 해결 표시를 남길지, §4를 어떻게 처리할지가 미결이었다.

### 선택지

1. TODO 문서를 이번 WORK에서 함께 커밋하고 §1~§3에 해결 표시를 남긴다 (§4는 미처리로 유지)
2. TODO 문서를 untracked로 그대로 두고 이번 WORK에서 건드리지 않는다
3. TODO 문서 전체를 삭제한다

### 권고안

option 1 — 이번 WORK가 §1~§3을 실제로 해소하므로 문서 상태를 현행화해 커밋하는 것이 추적성에 부합한다.

### 확정값

option 1. `TODO/todo_uctm-update-coverage.md`를 이번 WORK에서 함께 커밋한다.
- §1·§2·§3에 해결 표시를 남긴다. 표시 방식(각 섹션 상단 `> ✅ 해결 — WORK-54` 또는 상단 상태 요약 표 등)은 planner가 문서 톤에 맞춰 결정하며 별도 결정 게이트 없이 진행한다.
- §4(문서 정리 2건 — ref-cache-phase2 TODO 완료 처리, README_KO.md `(complex WORK only)` 표기 제거)는 미처리로 그대로 남기되, 이번 WORK 범위 밖임이 문서에서 드러나야 한다.
- 이 TODO 파일 수정을 FR-06으로 Requirement.md에 추가하고 커밋에 포함한다.

### 결정주체

user 승인

---

## D-02
> 시각: 2026-07-22T05:09:54Z
> 단계: planner
> 상태: RESOLVED

### 배경

FR-05(릴리스 검증 절차 문서화)의 **문서 배치 위치**가 미확정이다(Requirement.md ASM-01). planner가 실제 파일을 조사한 결과:

1. `CLAUDE.md`는 매 세션 컨텍스트에 상시 로드되는 에이전트 지침 파일이며, 상세 절차는 이미 `docs/`로 위임하는 선례가 있다 — `## Agent 테스트` 섹션이 본문 한 줄 + `docs/guide_agent-testing.md` 링크로 구성되어 있다.
2. 대상 절차는 격리 환경 준비 · `npm link` 해제/우회 · init 검증 · update 검증 · 통과 판정 체크리스트로 bash 블록 다수를 포함해 40~80행 규모다.
3. `docs/guide_agent-testing.md`는 agent/skill/hook 파이프라인 동작 테스트 하네스 문서(§1~§5, 테스트 이력 포함)로 npm 배포물 검증과는 관심사가 다르다.
4. `CLAUDE.md`의 `## npm 버전업 절차` 목록은 현재 번호가 `1, 3, 4`로 깨져 있어 어느 안을 택하든 이 섹션은 수정 대상이 된다.

문서 내용 명세 자체는 TASK-03에 이미 확정되어 있으며, 결정 대상은 "담을 그릇"뿐이다.

### 선택지

1. (a) `CLAUDE.md`의 "npm 버전업 절차" 섹션에 검증 단계를 인라인으로 추가 — 단일 파일로 끝나지만 40~80행 bash 절차가 모든 세션 컨텍스트에 상시 로드된다.
2. (b) `docs/guide_release-verification.md`를 신설하고 `CLAUDE.md`의 "npm 버전업 절차"에 한 줄 링크 + 검증 단계 항목을 추가 — 기존 `docs/guide_agent-testing.md` 위임 선례와 동일한 패턴.
3. (c) 기존 `docs/guide_agent-testing.md`에 `## 6. 릴리스 검증` 절을 추가 — 새 파일이 늘지 않지만 "에이전트 파이프라인 테스트" 문서에 npm 배포 검증이 섞인다.

### 권고안

option 2 (b) — CLAUDE.md는 상시 로드되는 지침 파일이라 긴 절차를 인라인하면 컨텍스트 비용을 매 세션 지불하게 되므로 (a)를 배제하고, `guide_agent-testing.md`는 관심사가 다르며 § 번호·테스트 이력 구조를 흐리므로 (c)를 배제한다. 이미 존재하는 "CLAUDE.md 한 줄 + docs/ 상세" 패턴을 그대로 따르는 것이 일관적이다. 확정 시 TASK-03의 `## Files`는 `docs/guide_release-verification.md` CREATE + `CLAUDE.md` MODIFY가 된다.

### 확정값

option 2 (b). FR-05 릴리스 검증 절차는 `docs/guide_release-verification.md`를 신설해 담고, `CLAUDE.md`의 "npm 버전업 절차"에는 검증 단계 항목 + 한 줄 링크만 추가한다.

- TASK-03의 `## Files` = `docs/guide_release-verification.md` CREATE + `CLAUDE.md` MODIFY
- 근거: `CLAUDE.md`는 상시 로드되는 지침 파일이라 40~80행 bash 절차를 인라인하면 컨텍스트 비용을 매 세션 지불하게 된다. 기존 `## Agent 테스트` → `docs/guide_agent-testing.md` 위임 선례와 동일 패턴을 따른다.
- `guide_agent-testing.md`에는 섞지 않는다 — 관심사가 다르고 § 번호·테스트 이력 구조를 흐린다.

**함께 처리할 것**: `CLAUDE.md`의 "npm 버전업 절차" 목록 번호가 `1, 3, 4`로 깨져 있는 것을 이번 수정에서 함께 정정한다. 최종 형태:

```
## npm 버전업 절차

사용자가 npm 버전업을 요청하면 다음을 추가로 수행한다:

1. develop/ 동기화 (Push 절차 1단계와 동일)
2. `npm version patch|minor|major` 실행
3. `npm publish`
4. 배포 검증 — 격리 환경에서 `uctm init` / `uctm update` 확인
   → [docs/guide_release-verification.md](docs/guide_release-verification.md)
```

문구·링크 표기는 문서 톤에 맞춰 조정 가능하며, 이 정정에 별도 게이트는 불필요하다.

### 결정주체

user 승인

