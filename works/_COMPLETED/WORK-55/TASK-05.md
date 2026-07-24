# TASK-05: 레퍼런스 정합화 ① context-policy.md + work-activity-log.md

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | committer 인라인 흡수에 맞춰 context-policy.md(핸드오프·재시도)와 work-activity-log.md(이벤트 체계·매트릭스)를 정합화한다. 섹션 소비 매트릭스의 commit 열을 제거하고, orchestrator 인라인 수행분을 반영한다. |
| 매핑 요구사항 | FR-04, FR-06, NFR-02, ASM-03(D-03) |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-03 완료 후 (vocabulary 정본 일치) |
| Phase | Phase 2 |

## Scope

`develop/references/context-policy.md` + `develop/references/work-activity-log.md`만 편집(정본). plugin/npm 미러는 TASK-09.

> **레퍼런스 수정 절차 준수(NFR-02/CON-03)**: § 번호 재번호·재사용 금지, 섹션 추가·삭제 없음(결번 불필요), 매트릭스는 committer **열 제거**만 수행(§ 재번호 아님).

### context-policy.md
1. **섹션 소비 매트릭스 (line 11~18)** — 표 헤더에서 `commit` 열 제거. 각 § 행의 commit ✅ 삭제. (§ 1,2,3에 있던 commit ✅는 제거; orchestrator는 전체 파일을 읽으므로 별도 orch 이관 불필요 — 이 파일 § 1~4는 이미 orch/build/verif 배분이 충분.)
2. **§ 3 파이프라인 단계별 입출력 (line 39~75)** — "### Committer" 서브섹션(line 67~75)을 **orchestrator 인라인 커밋** 취지로 재작성: 제목을 예) "### 인라인 커밋 (orchestrator)"로 바꾸고, 입력(verifier FULL + builder SUMMARY)·처리(result.md 작성 + git commit)·출력(result.md + 활동 로그 `STAGE_DONE stage=commit`) 주체를 orchestrator로 명시. (### 서브헤딩 변경은 § 번호 규칙과 무관.)
3. **§ 6 Committer 재시도 (line 108~112)** — § 번호 6은 **유지**(재번호 금지). 제목/본문을 "재시도" 일반 규칙으로 리타이틀: "verifier FAIL / 변경 파일 없음 → builder 재디스패치, 최대 2회(총 3회) → TASK FAILED"로 정합화(committer 고유 표현 제거). "파이프라인 중단"은 orchestrator의 needs-decision 상향 취지와 모순되지 않게 조정(TASK-03/orchestrator § 3-3와 일치).
4. **§ 5 Orchestrator 디스패치 (line 83~106)** — `<!-- Committer: Verifier FULL + Builder SUMMARY -->` dispatch 예시(line 93~97)는 committer spawn을 전제하므로 제거하거나 "orchestrator 인라인 커밋이 verifier FULL + builder SUMMARY를 직접 사용" 주석으로 대체. verifier·다음 TASK builder dispatch 예시는 유지.

### work-activity-log.md
5. **섹션 소비 매트릭스 (line 11~16)** — 표 헤더에서 `commit` 열 제거. § 2(형식)·§ 3(이벤트 체계)의 commit ✅ 제거. line 17 각주 "committer는 마지막 TASK 판정을 위해 로그를 읽기만 한다…"를 orchestrator 인라인 취지로 갱신(마지막 TASK 판정 주체가 orchestrator).
6. **§ 3 이벤트 체계 (line 35~50)** — `STAGE_START` 행(line 41)의 자식 열거에서 committer 제거. `STAGE_DONE` 행(line 45)에 `stage=commit`(orchestrator 인라인 커밋 완료, 비-spawn) 반영. line 48 "stage 값: specifier/planner/builder/verifier/committer" → "specifier/planner/builder/verifier/commit"(commit=orchestrator 내부 액션 주석). `by` 값 규칙은 유지.
7. **§ 1 규칙 (line 21~27)** — 기록 주체·게이트 규칙 유지. committer 언급 있으면 정합.

> vocabulary는 TASK-03 orchestrator.md와 정확히 일치시킨다: `STAGE_DONE — stage=commit task=TASK-NN`, STAGE_START 없음.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/references/context-policy.md` | MODIFY | 매트릭스 commit 열 제거, § 3 Committer 서브섹션→orchestrator 인라인, § 6 재시도 일반화, § 5 committer dispatch 예시 정합 |
| `develop/references/work-activity-log.md` | MODIFY | 매트릭스 commit 열 제거, § 3 이벤트 `stage=commit` 반영·stage 값 집합 갱신, 각주 갱신 |

## Acceptance Criteria
- [x] 두 파일의 섹션 소비 매트릭스에 `commit` 열이 없다
- [x] context-policy.md § 3의 Committer 서브섹션이 orchestrator 인라인 커밋으로 재작성되고, § 5의 committer spawn dispatch 예시가 제거/정합되었다
- [x] context-policy.md § 6이 § 번호 6을 유지한 채 재시도 일반 규칙으로 리타이틀되었다(재번호 없음)
- [x] work-activity-log.md § 3의 STAGE_START 자식 열거에서 committer가 제거되고, STAGE_DONE에 `stage=commit`가 반영되며 stage 값 집합이 `.../commit`로 갱신되었다
- [x] § 재번호·섹션 추가/삭제가 없다(결번 불필요)
- [x] vocabulary가 orchestrator.md와 일치한다

## Verify
```bash
grep -n "commit" develop/references/work-activity-log.md
```
```bash
grep -n "committer\|Committer" develop/references/context-policy.md
```
```bash
grep -n "^## §" develop/references/context-policy.md
```
> work-activity-log.md에 `stage=commit`가 존재하고 `committer` 스폰 열거는 없어야 한다. context-policy.md에 committer spawn 전제 표현이 남지 않아야 한다. 세 번째 grep으로 § 번호 실재(재번호·결번 이상 없음)를 확인한다.
