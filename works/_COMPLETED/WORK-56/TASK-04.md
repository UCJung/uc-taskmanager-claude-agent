# TASK-04: README specifier 트리거 귀속 정정 (R16~R18)

## WORK
WORK-56: Agent 정의 기준 skills/README 현행화 (references·docs 검사)

## Task 개요
| 항목 | 내용 |
|------|------|
| 목적 | `[]`-태그 감지·파이프라인 트리거를 현행(work-pipeline 스킬/Main Claude→orchestrator)에 맞게 정정하고, specifier 역할 서술에서 트리거 감지를 제거 |
| 매핑 요구사항 | FR-06, NFR-03 |
| 우선순위 | Should |
| 예상 규모 | M |
| 의존관계 | TASK-03 완료 후 (동일 README.md 직렬 편집) |
| Phase | Phase 3 |

## Scope
드리프트 R16~R18을 정정한다. 현행 모델: `[]`-태그 감지·파이프라인 트리거는 `work-pipeline` 스킬(Main Claude)의 역할이고 Main Claude가 spawn하는 것은 orchestrator 1개뿐이다. specifier.md에는 `[]`-태그 감지 서술이 없다.

- **R16** `README.md:473` — Agents 표 specifier 역할에서 "`[]` tag detection"을 제거하고 요구분석/복잡도 평가/WORK-LIST 관리/dispatch XML 반환은 유지.
- **R17** `README.md:895` — 파일 트리 "specifier.md ← **[] tag detection** + requirement analysis"에서 "[] tag detection"을 제거(예: "requirement analysis + complexity assessment").
- **R18** `README.md:300`,`:303` — CLAUDE.md 등록 스니펫 "`[]` 태그로 시작하는 요청 → **specifier 에이전트 호출**" 및 하단 설명을 현행 트리거(work-pipeline 스킬 → orchestrator)와 모순되지 않게 정정. `:358` "Main Claude never calls specifier directly"와 일관되어야 한다.

**선택(저강도, 필수 아님)**: `:473` specifier MCP 설명 "Serena (codebase exploration)"은 `specifier.md § 4`(코드베이스 심층 탐색은 planner 전담)와 표현상 상충. 표현 정밀화는 선택이며, 하려면 최소 수정으로 한다.

**유지(ASM-02)**: committer 스텁 정상 서술은 손대지 않는다. **범위 제외**: progress 모델(R3~R15)은 TASK-03에서 이미 처리 — 재편집 금지. `develop/agents/*.md`, `plugin/`, `npm/`, `develop/skills/`, `develop/references/*.md`, `docs/` 편집 금지.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | modify | R16(:473 표), R17(:895 트리), R18(:300/:303 CLAUDE.md 스니펫) specifier 트리거 귀속 정정 |

## Acceptance Criteria
- [x] R16: Agents 표 specifier 역할에서 "[] tag detection" 제거(요구분석/복잡도/WORK-LIST/dispatch 유지)
- [x] R17: 파일 트리 specifier.md 설명에서 "[] tag detection" 제거
- [x] R18: CLAUDE.md 등록 스니펫이 현행 트리거(work-pipeline 스킬→orchestrator)와 모순 없이 정정되고 `:358` "Main Claude never calls specifier directly"와 일관
- [x] committer 스텁·progress(TASK-03 결과) 서술은 이 TASK에서 변경되지 않음
- [x] `develop/agents/*.md`·`plugin/`·`npm/`·`develop/skills/`·`develop/references/*.md`·`docs/` 무변경
- [x] (조건부 NFR-02) references 편집 미발생. 필요 판단 시 needs-decision 상향

## Verify
```bash
grep -n "tag detection\|specifier 에이전트 호출\|delegates" README.md
```
```bash
grep -n "never calls specifier directly" README.md
```
```bash
git diff --name-only develop/agents/ develop/skills/ develop/references/ plugin/ npm/ docs/
```
