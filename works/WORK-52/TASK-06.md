# TASK-06: plugin.json 갱신

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 플러그인 매니페스트에서 orchestrator를 등록하고 scheduler를 제거해 에이전트 목록을 새 아키텍처와 일치시킨다 |
| 매핑 요구사항 | FR-2, FR-7 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | TASK-02 완료 후 (scheduler.md 삭제 반영) — orchestrator.md(TASK-01) 존재 전제 |
| Phase | Phase 3 |

## Scope

`develop/.claude-plugin/plugin.json`의 `agents` 배열을 수정한다.
- `./agents/orchestrator.md` 추가.
- `./agents/scheduler.md` 제거.
- 결과: orchestrator, specifier, planner, builder, verifier, committer (6개).
- 필요 시 `description` 문구의 "6-agent full pipeline with DAG-based orchestration"을 orchestrator 중심 서술로 소폭 갱신(선택). JSON 유효성 유지.

**범위 밖**: skills 배열은 변경 없음. README(TASK-07), plugin/·npm 동기화(TASK-08).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/.claude-plugin/plugin.json` | MODIFY | agents에 orchestrator 추가, scheduler 제거 |

## Acceptance Criteria
- [ ] `agents`에 `./agents/orchestrator.md` 포함
- [ ] `agents`에 `./agents/scheduler.md` 미포함
- [ ] JSON이 유효하게 파싱됨
- [ ] agents 총 6개 유지

## Verify
```bash
node -e "const a=require('./develop/.claude-plugin/plugin.json').agents; if(!a.includes('./agents/orchestrator.md')) throw 'no orchestrator'; if(a.includes('./agents/scheduler.md')) throw 'scheduler present'; console.log('OK', a.length)"
```

---
