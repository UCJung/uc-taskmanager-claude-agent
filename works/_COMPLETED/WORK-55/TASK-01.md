# TASK-01: specifier/planner 경계 문구 정합화 (planner 겸임 문구 제거)

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | specifier 정의에서 "planner 역할 겸임" 문구를 제거하고 What(specifier)/How(planner) 경계를 명시한다. 코드베이스 심층 탐색·TASK 분해가 planner 전담임을 문구로 정합화한다. **구조 변경 없음.** |
| 매핑 요구사항 | FR-01, CON-02 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

`develop/agents/specifier.md`만 편집한다(정본). plugin/npm 사본은 TASK-09 SYNC에서 미러한다.

**구조 변경 절대 금지(CON-02).** 스폰 흐름, 역할 배치, 파일 산출 규칙(specifier는 Requirement.md만 생성), orchestrator가 planner를 별도 spawn하는 사실 — 이 모두는 그대로 유지한다. 이 TASK는 오직 "specifier가 planner를 겸한다"는 잔존 문구의 제거와 경계 문장 추가뿐이다.

수정 지점:
1. **front-matter `description` (line 3)** — "For simple requirements, assumes Planner role to create PLAN.md + TASKs directly." 문장을 제거하고, specifier가 What(요구사항 명세)만 담당하며 설계·TASK 분해는 planner로 인계함을 나타내는 문장으로 교체한다. 예: `Agent that analyzes user requests to create requirement specifications and WORK units (the What). Design and TASK decomposition are handed off to the planner (the How).`
2. **§ 7 제목/본문 (line 340~345 "## 7. Planner Agent역할 수행 (필요 시)")** — 제목이 "specifier가 planner 역할을 수행"을 함의하므로 제목을 겸임 없음을 명확히 하는 표현(예: `## 7. Planner 단계로의 인계 (역할 겸임 없음)`)으로 바꾸고, 본문을 "specifier는 planner 역할을 겸하지 않는다. 코드베이스 심층 탐색·TASK 분해는 planner 전담이며, orchestrator가 planner를 별도 중첩 spawn한다. specifier는 요구사항 명세와 복잡도 판정을 반환하고 종료한다."로 정리한다. (기존 본문의 취지는 유지하되 "역할 수행(필요 시)" 뉘앙스를 제거.)
3. **§ 1 역할 / § 4 역할 결정 확인** — line 12 "무엇을(What)만 다루고, 어떻게(How)는 다루지 않습니다"와 line 329 "이후 설계 분해는 planner가 전담한다"는 이미 경계를 진술하므로 유지. 필요 시 § 4에 "코드베이스 심층 탐색 역시 planner가 전담한다"를 1줄 보강한다.

`develop/agents/planner.md`는 이미 How(설계·탐색·TASK 분해)를 전담 기술하므로 **편집 불필요**(검토만). 필요하면 § 2 "프로젝트 탐색" 행에 "(코드베이스 심층 탐색은 planner 전담)"을 1줄 보강할 수 있으나 선택 사항이다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/agents/specifier.md` | MODIFY | description에서 planner 겸임 문구 제거, § 7 제목·본문 겸임 없음으로 정합화, What/How 경계 문장 유지·보강 |
| `develop/agents/planner.md` | REVIEW | How 전담이 이미 명시됨 — 편집 불필요(선택적 1줄 보강 허용) |

## Acceptance Criteria
- [x] `develop/agents/specifier.md` front-matter에 "assumes Planner role" 및 동등 표현이 없다
- [x] § 7 제목이 더 이상 "specifier가 planner 역할을 수행"을 함의하지 않으며, 본문이 "planner 전담·orchestrator 별도 spawn"을 명시한다
- [x] specifier=What, planner=How 경계가 정의 문구로 명시되어 있다
- [x] 코드베이스 심층 탐색·TASK 분해가 planner 전담임이 문구로 드러난다
- [x] **구조 무변경**: STEP 2~6 절차, 산출물 규칙(Requirement.md만 생성), § 6 승인요청 규칙, orchestrator 별도 spawn 서술이 변경되지 않았다

## Verify
```bash
grep -rn "assumes Planner" develop/agents/specifier.md
```
```bash
grep -rn "플래너 역할\|Planner 역할 수행\|Planner Agent역할" develop/agents/specifier.md
```
```bash
grep -n "What\|How\|planner\|Planner" develop/agents/specifier.md
```
> 처음 두 grep은 결과 0건이어야 한다(겸임 문구 제거 확인). 세 번째 grep으로 경계 문장이 잔존하는지 육안 확인한다.
