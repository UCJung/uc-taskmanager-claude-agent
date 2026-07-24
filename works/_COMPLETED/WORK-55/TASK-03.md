# TASK-03: orchestrator.md committer 인라인 흡수 (핵심 — 인라인 커밋 절차·이벤트 정본)

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | committer가 수행하던 [result.md 작성 → WORK-LIST 갱신 → git commit]을 verifier PASS 직후 orchestrator가 인라인으로 수행하도록 orchestrator.md를 재작성한다. committer 스폰을 제거해 TASK당 스폰을 3→2(3+2N)로 축소하고, 검증 독립성(verifier read-only 독립 재실행)은 유지한다. 이 TASK가 인라인 커밋 절차·로그 이벤트 vocabulary의 **정본**이다. |
| 매핑 요구사항 | FR-04, FR-05, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | L |
| 의존관계 | 없음 (Phase 2 TASK들이 이 TASK의 vocabulary를 참조) |
| Phase | Phase 1 |

## Scope

`develop/agents/orchestrator.md`만 편집(정본). plugin/npm 미러는 TASK-09.

### 채택 설계 (PLAN D-04 — 반드시 이 vocabulary로 통일)
- verifier PASS 직후 orchestrator가 인라인으로 `[result.md 작성 → (마지막 TASK면) WORK-LIST 갱신 → git commit]`을 수행한다.
- 완료 시 활동 로그에 **`STAGE_DONE — stage=commit task=TASK-NN`** 를 기록한다. **`STAGE_START — stage=commit`는 없다**(비-spawn orchestrator 액션).
- stage 값 집합: `specifier / planner / builder / verifier / commit` (committer → commit; commit은 orchestrator 내부 액션).
- 마지막 TASK 판정: orchestrator가 `PLAN.md`의 전체 TASK 수와 로그의 `STAGE_DONE — stage=commit` 수를 비교(현재 TASK 포함)해 마지막이면 WORK-LIST를 IN_PROGRESS→DONE으로 갱신.
- resume: `STAGE_DONE stage=verifier`는 있으나 해당 TASK의 `STAGE_DONE stage=commit`이 없으면 인라인 커밋 단계부터 재개. 재개 시 result.md 존재·git 최신 커밋을 확인해 **중복 커밋을 방지**(멱등).
- 검증 독립성 유지: verifier는 여전히 read-only 독립 재검증. 인라인 커밋은 verifier 판정과 분리된 orchestrator 액션.

### 수정 지점 (파일 전반)
1. **front-matter description (line 3)** — "specifier→planner→builder→verifier→committer를 중첩 spawn" → "specifier→planner→builder→verifier를 중첩 spawn(커밋은 orchestrator 인라인 수행)". "committer" 스폰 표현 제거.
2. **§ 1 역할** line 13, 18 — 자식 목록에서 committer 제거. line 18 spawn 도구 대상명 목록도 `specifier/planner/builder/verifier`로.
3. **§ 2 수행업무 표** — line 30 "TASK별 builder→verifier→committer 중첩 spawn" → "builder→verifier 중첩 spawn 후 orchestrator 인라인 커밋". line 34 로그 이벤트 목록에 `stage=commit` 반영.
4. **STEP 1-1 자식별 조립 결과 요약 표 (line 115~121)** — **committer 행 제거**(NFR-02: orchestrator 2곳 중복 기재 중 1곳). specifier/planner/builder/verifier 4행만 유지.
5. **STEP A/B/C 스폰 지시 라인 (line 158,167,180~187)** — NFR-02 2곳 중 나머지. STEP C(line 180~187)를 재작성:
   - TASK별 순차: `builder → verifier`(2단계 spawn)로 변경. committer spawn 지시(line 183)를 **인라인 커밋 절차**로 대체.
   - verifier PASS 후 orchestrator 인라인 수행 서술 추가: result.md 작성(→ `file-content-schema.md` § 3), 마지막 TASK면 WORK-LIST 갱신(→ `shared-prompt-sections.md` § 8), git commit(→ Bash 규칙 `shared-prompt-sections.md` § 12), 그 후 `STAGE_DONE — stage=commit task=TASK-NN` 기록.
   - line 184 "각 단계는 게이트가 없으므로 성공 시 즉시 STAGE_DONE" — commit 포함하도록 조정.
   - line 185~186 재시도: "verifier 또는 committer가 FAIL" → "verifier가 FAIL". 인라인 커밋 실패(git 오류 등) 처리도 1줄 명시.
6. **STEP D 이벤트 매핑 표 (line 194~202)** — `STAGE_START — stage={agent}` 자식 목록에서 committer 제거. `STAGE_DONE` 행에 `stage=commit`(비-spawn 인라인 액션) 추가·설명.
7. **§ 3-3 재시도/에스컬레이션** — line 231 "재시도 3회 실패 (STEP C 참조)" 유지하되 committer 언급 제거. `context-policy.md`의 재시도 절 참조는 유지(TASK-05에서 해당 절 리타이틀).
8. **§ 3-4 컨텍스트 핸드오프** — line 258 "committer에는 verifier FULL + builder SUMMARY, 다음 TASK builder에는 …" 예시에서 committer 항목 제거. 인라인 커밋은 orchestrator가 verifier FULL + builder SUMMARY를 직접 사용해 result.md를 쓴다는 취지로 수정.
9. **§ 3-5 제약/금지 표 (line 269 등)** — 인라인 역할 대행 금지 규칙은 "Agent 도구 없음(축퇴)" 문맥이므로 유지. committer 관련 문구가 있으면 정합화.
10. 파일 전역에서 잔존 "committer" 스폰 표현이 없도록 최종 정리(역할 설명상 불가피한 "인라인 커밋" 표현은 허용).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/agents/orchestrator.md` | MODIFY | committer 스폰 제거·인라인 커밋 절차 삽입·STEP 1-1 요약 표 committer 행 제거·STEP C 2단계화·STEP D `stage=commit` 이벤트·재시도/핸드오프 정합 |

## Acceptance Criteria
- [x] front-matter·§ 1·§ 2에서 committer를 자식으로 spawn하는 표현이 제거되었다
- [x] STEP 1-1 "자식별 조립 결과 요약" 표에 committer 행이 없다(specifier/planner/builder/verifier 4행)
- [x] STEP C TASK 루프가 `builder → verifier` 2단계로 기술되고, verifier PASS 직후 orchestrator가 인라인으로 [result.md → (마지막 TASK) WORK-LIST → git commit]을 수행한다고 명시된다
- [x] 인라인 커밋 완료 시 `STAGE_DONE — stage=commit task=TASK-NN`를 기록하며 `STAGE_START — stage=commit`은 없다고 명시된다(STEP C·STEP D)
- [x] 재시도 규칙이 "verifier FAIL 시 builder 재디스패치"로 정합화되었다(committer FAIL 언급 제거)
- [x] verifier가 read-only 독립 재검증한다는 성질이 문구상 유지된다(검증 독립성)
- [x] result.md/WORK-LIST/commit의 수행 주체가 orchestrator로 일관 기술되고, 각각 `file-content-schema.md § 3`·`shared-prompt-sections.md § 8`·`§ 12`를 참조한다
- [x] resume 관련 서술이 commit 마커(멱등 재개)를 반영한다
- [x] 파일 전역에 committer **스폰** 잔존 표현이 없다

## Verify
```bash
grep -n "committer" develop/agents/orchestrator.md
```
```bash
grep -n "stage=commit" develop/agents/orchestrator.md
```
```bash
grep -n "builder → verifier\|builder→verifier" develop/agents/orchestrator.md
```
> 첫 grep 결과에 committer를 자식으로 spawn/조립하는 표현이 남지 않아야 한다(요약 표·STEP C·STEP D). `stage=commit` 이벤트가 STEP C/D에 존재하고, TASK 루프가 builder→verifier 2단계임을 확인한다.
