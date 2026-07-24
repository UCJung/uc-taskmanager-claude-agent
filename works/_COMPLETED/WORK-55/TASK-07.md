# TASK-07: committer.md → 폐기 스텁 전환 (인라인 흡수 명시)

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | committer.md의 오해 소지 있는 "spawn되어 커밋 수행" 절차 전문을 제거하고, orchestrator 인라인 흡수 사실을 명시하는 폐기 스텁으로 축소한다. 파일은 삭제하지 않는다(패키징 매니페스트 불변 — CON-01). |
| 매핑 요구사항 | FR-04, ASM-01(D-01) |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | TASK-03 완료 후 (스텁이 orchestrator 인라인 절차를 정본으로 가리킴) |
| Phase | Phase 2 |

## Scope

`develop/agents/committer.md`만 편집(정본). plugin/npm 미러는 TASK-09.

### 처리 방식 (D-01 근거)
완전 삭제 시 `npm/lib/constants.mjs`(AGENT_FILES에서 제거 + OBSOLETE_PATHS에 추가)와 `plugin.json`(agents 배열 ×3) 수정이 필요해 CON-01(런타임 코드 불변)에 저촉된다. 따라서 **스텁 전환**한다:
1. **front-matter** — `name: committer` 유지(패키징/스키마 안정). `description`을 폐기 안내로 교체: 예) `Deprecated in WORK-55: the commit procedure is now performed inline by the orchestrator after verifier PASS. This agent is no longer spawned. See orchestrator.md STEP C.` `model`/`tools`는 유지하거나 최소화 가능(스텁이므로 tools 축소 허용).
2. **본문 전체 축소** — § 1~4의 상세 커밋 절차(result.md 생성·git add/commit·게이트 체크·XML 필드)를 제거하고, 다음 취지의 짧은 안내로 대체:
   - 이 에이전트 정의는 WORK-55에서 orchestrator 인라인 절차로 흡수되었다.
   - 파이프라인은 더 이상 committer를 자식으로 spawn하지 않는다.
   - result.md 작성 → WORK-LIST 갱신 → git commit의 정본 절차는 `orchestrator.md` STEP C(인라인 커밋)를 참조하라.
   - 결과 파일/커밋 형식 규칙은 `file-content-schema.md § 3`·`§ 5`, `shared-prompt-sections.md § 8`을 참조하라.
3. 스텁에는 committer를 "spawn하라"거나 "커밋을 수행하는 활성 에이전트"로 오인시키는 표현을 남기지 않는다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/agents/committer.md` | MODIFY | 상세 커밋 절차 제거, 폐기 스텁(인라인 흡수 안내 + orchestrator.md 참조)으로 축소. 파일 삭제·매니페스트 변경 없음 |

## Acceptance Criteria
- [x] committer.md가 폐기 스텁으로 축소되고, front-matter description이 폐기/인라인 흡수를 명시한다
- [x] 본문에 상세 git add/commit 절차·게이트 체크·XML 커밋 필드 등 활성 커밋 절차가 남지 않는다
- [x] 스텁이 정본으로 orchestrator.md(인라인 커밋)를 가리키고, 형식은 file-content-schema/shared 레퍼런스를 가리킨다
- [x] 파일은 삭제되지 않았고 `name: committer` front-matter가 유지된다(패키징 불변)
- [x] `npm/lib/constants.mjs`·`plugin.json`은 변경되지 않았다(CON-01)

## Verify
```bash
grep -n "git commit\|git add\|Deprecated\|orchestrator" develop/agents/committer.md
```
```bash
grep -rn "committer.md" npm/lib/constants.mjs
```
```bash
grep -rn "committer" plugin/.claude-plugin/plugin.json
```
> 첫 grep: 스텁이 orchestrator를 가리키되 활성 `git add/commit` 절차 블록이 없어야 한다. 둘째·셋째 grep: constants.mjs의 AGENT_FILES와 plugin.json의 agents 배열에 committer.md 항목이 **그대로 존재**해야 한다(스텁 방식이므로 매니페스트 불변).
