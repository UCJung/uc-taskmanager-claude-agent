# TASK-08: README.md committer 인라인 반영 (스폰수·다이어그램·에이전트표)

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 사용자 대면 정본 문서인 루트 README.md를 committer 인라인 흡수·스폰수 축소에 맞춰 정합화한다. (ASM-02/D-02: docs 중 현행 파이프라인을 권위 있게 기술하는 유일 문서로 README만 포함.) |
| 매핑 요구사항 | FR-06, NFR-01, ASM-02(D-02) |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-03 완료 후 (vocabulary 정본 일치) |
| Phase | Phase 2 |

## Scope

루트 `README.md`만 편집. `npm/README.md`로의 복사는 TASK-09 SYNC(CLAUDE.md Push 4단계와 동일)에서 수행하므로 이 TASK에서는 npm/README.md를 건드리지 않는다.

수정 지점(주요 — grep로 전수 확인):
1. **스폰 수 표** (line 383 `| 1 | 1 | 1 | N | N | N | **3 + 3N** |`) — Committer 열 제거, 합계 `3 + 3N` → `3 + 2N`. 인접 설명(line 385 등)도 정합.
2. **STEP C 루프 서술** (line 100, 200, 237, 372, 377, 403, 435, 454 등) — `builder → verifier → committer` → `builder → verifier`(+ orchestrator 인라인 커밋). "no gates" 취지는 유지.
3. **파이프라인 요약/헤더** — line 18 plugin.json description은 별도(패키징) — README 본문의 "6-agent full pipeline" 류 표현은 committer가 spawn 자식이 아님을 반영해 조정(예: "orchestrator가 인라인 커밋을 수행"). "6개 에이전트" 문구는 committer가 정의 파일로는 스텁 잔존하나 spawn 파이프라인은 아님을 오인시키지 않도록 정합(전면 재작성 불필요, 핵심 오해 소지만 제거).
4. **에이전트 표** (line 465~474 등) — committer 행(line 474 "Gate check → write result.md → git commit … nested by orchestrator, per TASK")을 처리: committer가 per-TASK로 nested spawn된다는 서술을 제거하고, 인라인 커밋 역할을 orchestrator 행(line 469)에 반영. committer 행은 제거하거나 "absorbed into orchestrator (WORK-55)"로 각주.
5. **다이어그램**(line 362~372, 416~420, 454~460 등) — nested spawn 다이어그램에서 committer 노드를 제거하고 orchestrator 인라인 커밋 주석 반영.
6. **결과 책임 서술**(line 799 "The committer synthesizes builder + verifier context-handoffs into the final result.md") — 주체를 orchestrator 인라인으로 변경.
7. **DONE 전환 서술**(line 539, 543, 557) — "set automatically by committer" → "set by orchestrator (inline commit) on last TASK".
8. **파일 참조 표**(line 508, 694/860 등 committer가 result.md 작성) — 생성 주체 orchestrator로 정합. (line 860 "Commit message format | committer.md" 는 스텁 전환 후에도 커밋 타입 규칙 위치가 바뀌므로 orchestrator.md STEP C 참조로 갱신.)
9. **degraded/축퇴 서술**(line 447, 722 등 자식 열거) — committer 제거.
10. **레퍼런스 로딩·설치 안내**(line 332, 350 "6 agents … committer") — committer.md가 스텁으로 잔존하므로 "6 files"는 사실이나 "6 spawn agents" 오인 방지 문구로 정합.

> 전면 재작성이 아니라 committer **spawn/커밋 주체** 오해 소지와 `3 + 3N`을 제거하는 정합화다. vocabulary는 orchestrator.md(TASK-03)와 일치.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | 스폰수표 3+3N→3+2N, 루프·다이어그램·에이전트표·결과책임·DONE전환에서 committer spawn 제거·orchestrator 인라인 반영 |

## Acceptance Criteria
- [x] README 스폰 수 표에서 Committer 열이 제거되고 합계가 `3 + 2N`이다
- [x] `builder → verifier → committer` 루프 표현이 `builder → verifier`(+ orchestrator 인라인 커밋)로 정합화되었다
- [x] 에이전트 표/다이어그램에서 committer가 per-TASK nested spawn 자식으로 남지 않으며, 인라인 커밋 역할이 orchestrator에 반영되었다
- [x] result.md 작성·DONE 전환 주체가 orchestrator(인라인 커밋)로 기술된다
- [x] `3 + 3N` 표기가 README에 남지 않는다
- [x] vocabulary가 orchestrator.md와 일치한다 (npm/README.md 복사는 TASK-09에서 수행)

## Verify
```bash
grep -n "3 + 3N\|3+3N" README.md
```
```bash
grep -n "verifier → committer\|verifier→committer\|nested by orchestrator, per TASK" README.md
```
```bash
grep -n "3 + 2N\|inline\|인라인" README.md
```
> 첫·둘째 grep에 `3 + 3N`·`verifier → committer` per-TASK committer spawn 표현이 남지 않아야 한다. 셋째 grep으로 `3 + 2N`·인라인 커밋 반영을 확인한다.
