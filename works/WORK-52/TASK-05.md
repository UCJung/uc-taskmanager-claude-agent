# TASK-05: 자식 에이전트 5종 수정 (specifier/planner/builder/verifier/committer)

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 자식 에이전트를 "orchestrator에 보고 + 모호점은 needs-decision 반환 + 로그/콜백 미기록 + Skill 트리거 문구 제거"로 정합화한다 |
| 매핑 요구사항 | FR-8, FR-6 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01 완료 후 (orchestrator 보고 대상·needs-decision 규약 확정) |
| Phase | Phase 3 |

## Scope

`develop/agents/`의 5개 자식 에이전트를 수정한다. (scheduler는 TASK-02에서 삭제 — 대상 아님.)

공통 변경:
- 보고 대상 문구 "Main Claude" → **"orchestrator"** ("역할 종료 후 orchestrator에 보고").
- **로그/콜백 기록 제거** — STARTUP의 콜백 START/DONE 및 활동 로그 기록 지시 삭제(orchestrator 일괄). 자식은 산출물 생성 + 결과 XML 반환만. STARTUP의 레퍼런스 읽기에서 callback-protocol/work-activity-log 의존이 로그·콜백 목적이면 제거하되, 산출물 양식에 필요한 참조는 유지.
- description frontmatter에서 **Skill 트리거 문구 제거**(리팩터링 §5.2 정합).
- 자식은 중첩 불필요 → `tools`에 `Agent` 추가 금지(현행 유지).

개별 변경:
- specifier/planner/builder: 모호점을 만나면 **`<needs-decision>`(배경+선택지+권고안)을 orchestrator에 반환**. gated면 orchestrator가 사용자 승인 요청으로, auto면 권고안 자동결정으로 처리 → 자식은 사용자를 직접 기다리지 않음(기존 "auto" 대기 금지 동작 확장).
- specifier: 기존 direct 모드에서 planner 겸임·게이트 처리 관련 서술이 있으면 orchestrator STEP 분기와 모순되지 않게 조정(WORK 생성·복잡도/모드 판정 반환은 유지).
- verifier/committer: 보고 대상·로그/콜백 제거만 적용(needs-decision 대상 아님이나, 필요 시 committer의 WORK-LIST DONE 전환 규칙은 유지).

**범위 밖**: orchestrator.md(TASK-01), plugin.json(TASK-06).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/agents/specifier.md` | MODIFY | 보고대상 orchestrator, needs-decision, 로그/콜백 제거, description 트리거 제거 |
| `develop/agents/planner.md` | MODIFY | 동일 + needs-decision |
| `develop/agents/builder.md` | MODIFY | 동일 + needs-decision |
| `develop/agents/verifier.md` | MODIFY | 보고대상 orchestrator, 로그/콜백 제거, description 트리거 제거 |
| `develop/agents/committer.md` | MODIFY | 동일 (WORK-LIST DONE 전환 규칙 유지) |

## Acceptance Criteria
- [ ] 5개 파일 모두 보고 대상이 orchestrator로 변경됨
- [ ] 5개 파일 모두 활동 로그/콜백 직접 기록 지시가 제거됨
- [ ] specifier/planner/builder에 `<needs-decision>` 반환 규칙이 추가됨
- [ ] description에서 Skill 트리거 문구가 제거됨
- [ ] 자식 tools에 `Agent`가 추가되지 않음(중첩 미허용 유지)
- [ ] committer의 WORK-LIST IN_PROGRESS→DONE 전환 규칙은 보존됨

## Verify
```bash
grep -rn "needs-decision" develop/agents/specifier.md develop/agents/planner.md develop/agents/builder.md
grep -rni "Main Claude" develop/agents/specifier.md develop/agents/planner.md develop/agents/builder.md develop/agents/verifier.md develop/agents/committer.md
grep -rniE "callback|활동 로그|work-activity-log" develop/agents/verifier.md develop/agents/committer.md
```

---
