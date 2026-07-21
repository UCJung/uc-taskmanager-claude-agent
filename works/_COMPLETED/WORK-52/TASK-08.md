# TASK-08: plugin/npm 동기화 + E2E 검증

## WORK
WORK-52: Orchestrator Agent 도입 (중첩 sub-agent 기반 자율 파이프라인)

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | develop/ 변경을 plugin/·npm/에 동기화하고, 잔여 참조 스윕과 spawn 스모크로 새 파이프라인이 동작함을 검증한다 |
| 매핑 요구사항 | NFR-01, NFR-02, FR-1 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07 완료 후 |
| Phase | Phase 5 |

## Scope

CLAUDE.md "Push 절차"에 준하여 develop/ → plugin/·npm/ 동기화 및 검증을 수행한다. (실제 git push는 사용자/Main Claude의 push 절차에서 수행 — 이 TASK는 동기화·검증까지.)

1. **동기화** (Push 절차 1단계):
   - `develop/agents/*.md` → `plugin/agents/*.md`, `npm/agents/*.md` (신규 orchestrator.md 포함, scheduler.md는 양쪽에서 삭제).
   - `develop/references/*.md` → `plugin/references/*.md`, `npm/references/*.md`.
   - `develop/skills/*/SKILL.md` → `plugin/skills/`, `npm/skills/`.
   - `develop/.claude-plugin/plugin.json` → `plugin/.claude-plugin/`, `npm/.claude-plugin/`.
2. **잔여 참조 스윕** (R-03 대응): develop/·plugin/·npm/·README에서 `scheduler`, "can't nest"/"cannot nest" 잔여 표현이 의도된 곳(예: 변경 이력) 외에 남아있지 않은지 grep 확인.
3. **spawn 도구 스모크** (R-01, FR-1): orchestrator가 nested specifier 1개를 실제 spawn하는 최소 테스트로 `Agent`/`Task` 토큰 확정 → orchestrator.md frontmatter 최종 확정(필요 시 TASK-01 산출물 미세 조정).
4. **한도 점검** (NFR-02): 깊이 ≤5, `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`(기본 200) 대비 대형 WORK(N TASK×3) 여유 확인(문서상 점검).
5. 상세 절차는 `docs/guide_agent-testing.md` 준용. (headless auto / gated SendMessage 재개 / 동적 의사결정 / cross-session 재개 테스트는 대화형/headless 환경 필요 — 가능 범위 내 수행하고 미수행분은 결과에 한계로 기록.)

**범위 밖**: 실제 `git push`, npm publish(사용자 지시 시 별도 절차).

## Files
| Path | Action | Description |
|------|--------|-------------|
| `plugin/agents/*.md`, `npm/agents/*.md` | SYNC | orchestrator 추가, scheduler 삭제 반영 |
| `plugin/references/*.md`, `npm/references/*.md` | SYNC | 개정 레퍼런스 반영 |
| `plugin/skills/work-pipeline/SKILL.md`, `npm/skills/...` | SYNC | 간소화 SKILL 반영 |
| `plugin/.claude-plugin/plugin.json`, `npm/.claude-plugin/plugin.json` | SYNC | agents 목록 반영 |
| `npm/README.md` | SYNC | 영문 README 동기화 |

## Acceptance Criteria
- [ ] plugin/·npm/의 agents/references/skills/plugin.json이 develop/과 일치(orchestrator 포함, scheduler 없음)
- [ ] develop/·plugin/·npm/에 scheduler.md 파일이 존재하지 않음
- [ ] 잔여 `scheduler`/"nest" 참조 스윕 결과가 의도된 범위로 한정됨
- [ ] spawn 토큰(`Agent`/`Task`)이 스모크로 확정되고 orchestrator.md에 반영됨
- [ ] 깊이/세션 한도 점검 결과가 여유 있음(문서 기록)

## Verify
```bash
diff -r develop/agents plugin/agents
diff -r develop/references plugin/references
grep -rniE "can.?t nest|cannot nest" README.md npm/README.md
node -e "const a=require('./plugin/.claude-plugin/plugin.json').agents; console.log(a.includes('./agents/orchestrator.md')&&!a.includes('./agents/scheduler.md')?'OK':'FAIL')"
```

---
