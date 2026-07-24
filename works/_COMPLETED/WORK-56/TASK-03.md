# TASK-03: README 구형 progress 모델 제거 (R3~R15)

## WORK
WORK-56: Agent 정의 기준 skills/README 현행화 (references·docs 검사)

## Task 개요
| 항목 | 내용 |
|------|------|
| 목적 | 현행 정의에 부재한 `progress.md`/`PROGRESS.md`/`TASK-NN_progress.md` 체크포인트 모델 서술을 현행 모델(builder context-handoff → orchestrator 인라인 result.md, 재개는 `work_{WORK}.log` 기반)로 정정·제거 |
| 매핑 요구사항 | FR-05, NFR-03 |
| 우선순위 | Must |
| 예상 규모 | L |
| 의존관계 | TASK-02 완료 후 (동일 README.md 직렬 편집) |
| Phase | Phase 2 |

## Scope
드리프트 R3~R15(15개 지점)를 현행 산출물(result.md / `work_{WORK}.log` / context-handoff)로 정정하거나 삭제한다. 라인 번호는 TASK-02 편집으로 이동했을 수 있으니 **문자열 앵커**로 편집하고 grep으로 재확인한다.

| # | 원 라인 | 현재 서술(요지) | 정정 방향 |
|---|--------|----------------|----------|
| R3 | :106 | 예시 출력 "Updating **PROGRESS.md** and finalizing WORK-31" | result.md 작성/WORK 마무리 취지로 정정(예: "Writing result.md and finalizing WORK-31") |
| R4 | :278 | "Orchestrator reads **PROGRESS.md** and result.md files" | `work_{WORK}.log`와 result.md를 읽음으로 정정 |
| R5 | :474 | planner "pre-create **progress templates**" | 현행 planner 역할(PLAN.md + TASK 분해)로 정정, progress 템플릿 제거 |
| R6 | :475 | builder "**progress.md** checkpoint recording" | builder는 구현 + context-handoff 반환으로 정정 |
| R7 | :476 | verifier "**Progress gate (Status=COMPLETED)**" | 현행 verifier(build/lint/test 검증)로 정정, progress gate 제거 |
| R8 | :491 | file-content-schema 설명에 "**progress.md**" 포맷 포함 기술 | 포맷 목록에서 progress.md 제거(PLAN.md/TASK.md/result.md) |
| R9 | :507 | 파일 트리 "**PROGRESS.md** ← Progress tracking" | 해당 트리 줄 삭제 |
| R10 | :511 | 파일 트리 "**TASK-00_progress.md** ← Real-time checkpoint (builder writes)" | 해당 트리 줄 삭제 |
| R11 | :524 | 파일명 규칙표 "Progress checkpoint \| **TASK-NN_progress.md**" | 해당 표 행 삭제 |
| R12 | :527 | 파일명 규칙표 "Work progress \| **PROGRESS.md**" | 해당 표 행 삭제 |
| R13 | :591 | "Orchestrator reads work_{WORK}.log (and **PROGRESS.md**)" | "(and PROGRESS.md)" 제거 — `work_{WORK}.log` 기반 재개 |
| R14 | :668 | file-content-schema가 "**progress.md**" 포맷 정의라 기술 | 포맷 목록에서 progress.md 제거 |
| R15 | :803 | builder "writing a **progress.md** checkpoint" (Result responsibility shift) | builder가 context-handoff 반환으로 정정 |

정정 결과는 `file-content-schema.md § 5` 파일명 규칙(progress 파일 미정의)과 일치해야 한다.

**유지(ASM-02)**: committer 스텁 정상 서술은 손대지 않는다. **범위 제외**: specifier 트리거 서술(R16~R18)은 TASK-04 소관 — 이 TASK에서 건드리지 않는다. `develop/agents/*.md`, `plugin/`, `npm/`, `develop/skills/`, `develop/references/*.md`, `docs/` 편집 금지.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | modify | R3~R15 progress/PROGRESS/TASK-NN_progress 서술 정정·삭제(15개 지점) |

## Acceptance Criteria
- [x] R3~R15 각 지점이 현행 산출물(result.md / `work_{WORK}.log` / context-handoff)로 정정되거나 삭제됨
- [x] 정정 후 README 전체에 `progress.md`/`PROGRESS.md`/`_progress.md` 문자열이 현행에 부합하지 않는 형태로 잔존하지 않음
- [x] 파일명 규칙표·파일 트리에서 progress 관련 행/줄이 제거되어 `file-content-schema.md § 5`와 일치
- [x] committer 스텁 정상 서술·specifier 트리거 서술은 이 TASK에서 변경되지 않음
- [x] `develop/agents/*.md`·`plugin/`·`npm/`·`develop/skills/`·`develop/references/*.md`·`docs/` 무변경
- [x] (조건부 NFR-02) references 편집 미발생. 필요 판단 시 needs-decision 상향

## Verify
```bash
grep -ni "progress" README.md
```
```bash
grep -n "TASK-NN_progress\|TASK-00_progress\|PROGRESS.md" README.md
```
```bash
git diff --name-only develop/agents/ develop/skills/ develop/references/ plugin/ npm/ docs/
```
