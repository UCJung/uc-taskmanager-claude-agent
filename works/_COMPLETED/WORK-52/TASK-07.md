# TASK-07: README.md 재작성

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | README를 orchestrator 중심 중첩 흐름으로 재서술하고 "Subagents can't nest" 전제를 제거한다 |
| 매핑 요구사항 | FR-7 |
| 우선순위 | Must |
| 예상 규모 | L |
| 의존관계 | TASK-01, TASK-03, TASK-06 완료 후 (최종 아키텍처·flow·매니페스트 확정) |
| Phase | Phase 4 |

## Scope

`README.md`를 새 아키텍처에 맞게 재작성한다.

- **"Subagents can't nest…" 문장 제거**(약 132행 "Subagents can't nest — Main Claude orchestrates everything", 434행 "Subagents cannot nest — Main Claude (CLI terminal) orchestrates every call"). 중첩 지원 전제로 재서술.
- **Pipeline/Flow 재서술**: `[tag]` → orchestrator 1회 spawn → 내부 specifier→(planner)→builder→verifier→committer 중첩 흐름. scheduler 관련 서술(102, 211, 246, 258, 287, 358, 384, 393, 440, 481, 575, 589, 619, 692, 695, 819, 967, 1000행 등)을 orchestrator STEP C(DAG 흡수)로 대체/제거.
- **모드/스폰 표 갱신**: direct/pipeline/full 3-모드 → orchestrator gated/auto. 스폰 수 표를 orchestrator 기준으로.
- **"Why This Approach"** 절을 orchestrator 중심 + 자동결정 기록(DECISIONS.md) 설명 추가.
- 에이전트 표에서 scheduler 제거, orchestrator 추가.
- 파일 구조도(약 1000행)의 `scheduler.md` → `orchestrator.md` 반영.

**범위 밖**: `npm/README.md` 동기화는 TASK-08(및 push 절차). 이 TASK는 루트 `README.md`만.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | nest 문장 제거, orchestrator 중심 flow/모드/스폰/에이전트표/구조도 재작성, 자동결정 기록 설명 추가 |

## Acceptance Criteria
- [ ] "Subagents can't nest" / "Subagents cannot nest" 문장이 모두 제거됨
- [ ] orchestrator 중심 중첩 flow가 서술됨
- [ ] 모드 서술이 gated/auto 기준으로 갱신됨
- [ ] 에이전트 표/구조도에서 scheduler가 orchestrator로 대체됨
- [ ] 자동결정 기록(DECISIONS.md) 설명이 포함됨

## Verify
```bash
grep -niE "can.?t nest|cannot nest" README.md
grep -ni "orchestrator" README.md
grep -ni "scheduler" README.md
```

---
