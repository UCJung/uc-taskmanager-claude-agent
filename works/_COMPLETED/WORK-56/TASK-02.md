# TASK-02: README committer/자식수 정정 (R1~R2)

## WORK
WORK-56: Agent 정의 기준 skills/README 현행화 (references·docs 검사)

## Task 개요
| 항목 | 내용 |
|------|------|
| 목적 | README 축퇴 모드·에이전트 수 서술의 "five children"/"Five agents are nested" 표현을 자식 4종 + orchestrator 인라인 커밋 모델로 정정 |
| 매핑 요구사항 | FR-04, NFR-03 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope
드리프트 R1~R2를 정정한다. 라인 번호가 아니라 문자열 앵커로 편집한다.

- **R1** `README.md:450` — 축퇴 모드 "spawning the **five children** directly at depth 1" → 자식 4종(specifier/planner/builder/verifier)을 직접 spawn하고 커밋 단계는 orchestrator가 인라인 수행함을 반영(예: "spawning the four children directly at depth 1 and performing the commit step inline"). skills TASK-01 S3/S4 정정과 표현 일치.
- **R2** `README.md:468` — "**Five agents are nested by orchestrator** ... orchestrator nests the rest itself" 문장의 내부 모순 제거. orchestrator는 자신을 nest하지 않으므로 "파이프라인은 orchestrator + 중첩 자식 4종(specifier/planner/builder/verifier)으로 구성, Main Claude는 orchestrator만 spawn하고 orchestrator가 4종을 nest" 취지로 정정(하단 표 5행=orchestrator 포함과 일관).

**유지(ASM-02 — 정정 금지)**: committer 스텁 정상 서술(`:332`,`:350`,`:351`,`:358`,`:386`,`:478`,`:899`)은 현행과 일치하므로 손대지 않는다. 이 TASK는 progress 모델(R3~R15)·specifier 트리거(R16~R18)를 건드리지 않는다(각각 TASK-03, TASK-04 소관).

**범위 제외**: `develop/agents/*.md`, `plugin/`, `npm/`, `develop/skills/`, `develop/references/*.md`, `docs/` 편집 금지.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | modify | R1(:450 축퇴 spawn 자식수), R2(:468 nested 문장 모순) 2곳 정정 |

## Acceptance Criteria
- [x] R1: `:450` "five children" 표현이 자식 4종 + 커밋 인라인으로 정정
- [x] R2: `:468` 문장이 "orchestrator가 자식 4종을 nest(총 5행 표는 orchestrator 포함)" 취지로 내부 모순 없이 정정
- [x] committer 스텁 정상 서술(ASM-02 지정 라인)은 변경되지 않음
- [x] progress 모델·specifier 트리거 서술은 이 TASK에서 변경되지 않음(TASK-03/04 소관)
- [x] `develop/agents/*.md`·`plugin/`·`npm/`·`develop/skills/`·`develop/references/*.md` 무변경
- [x] (조건부 NFR-02) references 편집 미발생. 필요 판단 시 needs-decision 상향

## Verify
```bash
grep -n "five children\|Five agents are nested" README.md
```
```bash
grep -n "nests the rest\|four children" README.md
```
```bash
git diff --name-only develop/agents/ develop/skills/ develop/references/ plugin/ npm/ docs/
```
