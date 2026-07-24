# TASK-01: skills 3종 현행화 (S1~S5)

## WORK
WORK-56: Agent 정의 기준 skills/README 현행화 (references·docs 검사)

## Task 개요
| 항목 | 내용 |
|------|------|
| 목적 | `develop/skills/*/SKILL.md` 3종의 committer/자식 5종 잔재를 현행 정의(committer 스텁·비-spawn, 자식 4종, orchestrator 인라인 커밋)로 정정 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, NFR-03 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope
드리프트 S1~S5를 현행 모델로 정정한다. ASM-03에 따라 committer 관련 서술은 "완전 삭제"가 아니라 문맥에 맞게 현행 모델(인라인 커밋/자식 4종)로 **정정**하는 것을 기본으로 한다(스텁 존재 자체는 사실).

- **S1** `develop/skills/sdd-pipeline/SKILL.md:3` — "파이프라인 에이전트(orchestrator, specifier, planner, builder, verifier, committer)가 참조..." 나열에서 committer를 능동 참조 주체에서 빼거나 "committer(deprecated 스텁)"로 표기해 능동 참조·spawn 주체로 오인되지 않게 정정.
- **S2** `develop/skills/work-pipeline/SKILL.md:39` — "specifier/planner/builder/verifier/committer는 orchestrator가 내부에서 중첩 spawn" → 중첩 spawn 대상을 **specifier/planner/builder/verifier 4종**으로 정정(커밋은 orchestrator 인라인).
- **S3** `develop/skills/work-pipeline/SKILL.md:65` — 축퇴 모드 "specifier/planner/builder/verifier/committer를 직접 spawn(depth=1)" → 축퇴 시 **자식 4종만 직접 spawn**, 커밋은 인라인 수행으로 정정.
- **S4** `develop/skills/work-pipeline/SKILL.md:74` — "Main Claude가 자식 5종을 직접 spawn" → **자식 4종**으로 정정.
- **S5** `develop/skills/work-status/SKILL.md:21` — "`DONE` | 모든 TASK 커밋됨 — committer가 마지막 TASK에서 자동 설정" → DONE 전환 주체를 **orchestrator(인라인 커밋)**로 정정(`shared-prompt-sections.md § 8` 취지와 일치).

**범위 제외**: `develop/agents/*.md`, `plugin/`, `npm/`, `README.md`, `develop/references/*.md` 편집 금지. references 실드리프트 발견 시 임의 편집하지 말고 needs-decision으로 상향(CON-01/NFR-02).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/skills/sdd-pipeline/SKILL.md` | modify | S1 정정 (committer 능동 나열 제거/스텁 표기) |
| `develop/skills/work-pipeline/SKILL.md` | modify | S2·S3·S4 정정 (중첩·축퇴 spawn 4종, 자식 5종→4종) |
| `develop/skills/work-status/SKILL.md` | modify | S5 정정 (DONE 전환 주체 orchestrator) |

## Acceptance Criteria
- [x] S1: `sdd-pipeline/SKILL.md`에서 committer가 능동 참조/spawn 주체로 나열되지 않음(제거 또는 "스텁" 표기)
- [x] S2: `work-pipeline/SKILL.md` 중첩 spawn 대상이 specifier/planner/builder/verifier 4종으로 서술
- [x] S3: 축퇴 직접 spawn 대상이 자식 4종, 커밋은 인라인 수행으로 서술
- [x] S4: "자식 5종" 표현이 "자식 4종"으로 정정
- [x] S5: DONE 트리거가 "orchestrator(인라인 커밋)"로 기술됨
- [x] `develop/agents/*.md`·`plugin/`·`npm/`·`README.md`·`develop/references/*.md` 무변경
- [x] (조건부 NFR-02) references 편집이 발생하지 않았음. 부득이 필요 판단 시 needs-decision 상향(임의 편집 금지)

## Verify
```bash
grep -rn "committer" develop/skills/sdd-pipeline/SKILL.md develop/skills/work-pipeline/SKILL.md develop/skills/work-status/SKILL.md
```
```bash
grep -rn "자식 5종\|5종을 직접 spawn" develop/skills/work-pipeline/SKILL.md
```
```bash
grep -n "committer가 마지막" develop/skills/work-status/SKILL.md
```
```bash
git diff --name-only develop/agents/ develop/references/ plugin/ npm/ README.md
```
