# TASK-04: agent-flow.md 정합화 (스폰수표 3+3N→3+2N·흐름·역할표·축퇴·resume)

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | Main Claude 역할 가이드(agent-flow.md)를 committer 인라인 흡수·스폰수 축소에 맞춰 정합화한다. TASK-03에서 확정한 vocabulary(`STAGE_DONE stage=commit`, builder→verifier 2단계)를 그대로 반영한다. |
| 매핑 요구사항 | FR-05, FR-06, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-03 완료 후 (vocabulary 정본 일치 필요) |
| Phase | Phase 2 |

## Scope

`develop/references/agent-flow.md`만 편집(정본). plugin/npm 미러는 TASK-09.

수정 지점:
1. **§ 4 모드/스폰 수 (line 124~131)** — 표 헤더에서 `→ Committer` 열 제거, 합계 `3 + 3N` → `3 + 2N`. 표 아래 설명이 committer를 집계하면 정합화.
2. **§ 2 STEP C (line 49~53)** — "TASK별로 builder → verifier → committer를 순차 spawn" → "builder → verifier를 순차 spawn 후 orchestrator가 인라인 커밋 수행". "verifier/committer가 FAIL을 반환하면" → "verifier가 FAIL을 반환하면".
3. **§ 2 STEP D 이벤트 순서 (line 55~58)** — 이벤트 열에 `STAGE_DONE stage=commit`(비-spawn) 반영. `STAGE_START`가 자식 목록을 열거하면 committer 제거.
4. **§ 2 재개 규칙 표 (line 60~72)** — stage 값 예시에서 committer 흔적 정합화. commit 마커 미완 시 인라인 커밋 재개 취지가 필요하면 1줄 반영(핵심 불변식과 모순 없게).
5. **§ 2 슬라이딩 윈도우 예시** — committer 대상 언급이 있으면 인라인 커밋 취지로 정합.
6. **§ 3 고정 게이트/판단 기준** — committer 관련 표현 없음 확인(변경 최소).
7. **§ 6 에이전트 역할 요약 표 (line 147~154)** — committer 행(line 154)을 처리: committer는 더 이상 spawn되지 않으므로 행을 제거하거나 "orchestrator 인라인(committer 흡수)"로 각주 처리. 권고: committer 행 제거 + orchestrator 행 설명에 "인라인 커밋(result.md+git commit)"을 포함해 역할이 사라지지 않게 반영.
8. **§ 7 축퇴 모드** — line 200,215 등 "specifier/planner/builder/verifier/committer는 반드시 별도 spawn"류 열거에서 committer 제거(축퇴에서도 커밋은 orchestrator 역할을 넘겨받은 Main Claude가 인라인 수행). "레퍼런스 5종" 읽기 목록은 파일 개수 불변이므로 유지.
9. **본문 전역 committer 스폰 열거 (line 5, 88, 182, 186 등)** — 자식 열거 `specifier/planner/builder/verifier/committer`에서 committer 제거.

> NFR-01: agent-flow.md의 스폰수·흐름·역할표가 orchestrator.md(TASK-03)와 정확히 일치해야 한다. `3 + 2N`, `builder → verifier`, `STAGE_DONE stage=commit` 표기를 orchestrator.md와 대조한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/references/agent-flow.md` | MODIFY | § 4 스폰수표 3+3N→3+2N·committer 열 제거, § 2 흐름·재개, § 6 역할표, § 7 축퇴, 전역 자식 열거 committer 제거 |

## Acceptance Criteria
- [x] § 4 스폰 수 표에 Committer 열이 없고 합계가 `3 + 2N`이다
- [x] § 2 STEP C가 `builder → verifier` + orchestrator 인라인 커밋으로 기술되고, 재시도가 "verifier FAIL"로 정합화되었다
- [x] § 6 역할 요약에서 committer가 별도 spawn 에이전트로 남지 않으며, 인라인 커밋 역할이 orchestrator 쪽에 반영되었다
- [x] § 7 축퇴 모드의 자식 spawn 열거에서 committer가 제거되었다
- [x] 본문 전역의 `specifier/planner/builder/verifier/committer` 자식 열거에서 committer가 제거되었다
- [x] 스폰수·흐름·이벤트 vocabulary가 orchestrator.md(TASK-03)와 일치한다

## Verify
```bash
grep -n "3 + 3N\|3+3N\|committer" develop/references/agent-flow.md
```
```bash
grep -n "3 + 2N\|stage=commit\|builder → verifier" develop/references/agent-flow.md
```
> 첫 grep에 `3 + 3N`·committer 스폰 열거가 남지 않아야 한다. 둘째 grep으로 `3 + 2N`·인라인 커밋 vocabulary 반영을 확인한다.
