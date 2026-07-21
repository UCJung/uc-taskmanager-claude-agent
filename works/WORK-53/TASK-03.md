# TASK-03: README_KO.md orchestrator 기준 전면 현행화

## WORK
WORK-53: WORK-52 반영 README 3종 현행화

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 한국어 문서가 WORK-52 이후의 orchestrator 중심 중첩 spawn 모델을 반영하게 되어, 삭제된 `scheduler` 에이전트(현재 18건)와 폐기된 "세 가지 실행 모드" 서술이 사라지고 `README.md`와 1:1로 대응된다 |
| 매핑 요구사항 | FR-06, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | L |
| 의존관계 | TASK-01 완료 후 |
| Phase | Phase 2 |

## Scope

`README_KO.md`(현재 1,065줄, 2026-03-29 이후 미갱신)를 **TASK-01에서 확정된 `README.md`의 한국어 대응본**으로 재작성한다.

### 작성 원칙

1. **구조 대응**: `README.md`의 `##` / `###` / `####` 섹션 구성을 순서 그대로 1:1 대응시킨다. 표·다이어그램·코드블록은 구조를 그대로 이식한다(표의 수치·에이전트명·경로는 동일해야 함).
2. **기계적 직역 금지**: 서술문은 한국어 문서로서 자연스럽게 다시 쓴다. 기존 `README_KO.md`의 문체와 용어(예: "초단순 수정", "저장소 구조", "산출물 언어", "더 큰 그림")를 최대한 재사용한다.
3. **영문 유지 대상**: 파일명·경로·명령어·XML/JSON 예시·태그(`[new-feature]` 등)·`mode=gated`/`mode=auto`·`[GATE-1]`/`[GATE-2]`는 영문 그대로 둔다.
4. **`README.md` 수정 금지**: 이 TASK는 `README_KO.md`만 변경한다. 영문 문서에 오류를 발견하면 직접 고치지 말고 `## 후속 TASK 참고사항`(notes)으로 보고한다 — TASK-04가 처리한다(R-01).
5. **보존**: 상단 배지 4종, `**[English Documentation](README.md)**` 링크, `## 라이선스`, Serena MCP 섹션, 산출물 언어 섹션 등 WORK-52와 무관한 내용은 유지한다(CON-04 / AC-07).

### 반드시 교체해야 할 내용 (현행 KO → 신규)

| 현재 `README_KO.md` | 교체 내용 |
|---------------------|-----------|
| `### npm CLI — v1.5.0` (L302) | 버전 표기 제거 → `### npm CLI` (`README.md`와 동일. 실제 `npm/package.json`은 1.6.0이므로 하드코딩하지 않음) |
| 설치 확인 주석 `# specifier, planner, scheduler, builder, verifier, committer → 6개 확인` (L342) | `# orchestrator, specifier, planner, builder, verifier, committer → 6개 확인` |
| `## 개념: 세 가지 실행 모드 (execution-mode)` (L347) | `## 개념: orchestrator 실행 모드 (gated vs auto)` — Main Claude는 orchestrator **1회만** spawn하고, orchestrator가 나머지 에이전트를 depth 2로 중첩 spawn한다는 서술 |
| `### WORK (다중 작업, full 모드)` / `### pipeline 모드 (단일 작업, 위임)` / `### direct 모드 (초단순)` (L383/393/402) | `### WORK (다중 작업, complex WORK)` / `### complex WORK (다중 TASK, 중첩)` / `### simple WORK (초단순, 중첩)` |
| `### 초단순 수정 (direct 모드)` / `### 간단한 작업 (pipeline 모드)` (L161/169) | `### 초단순 수정 (simple WORK)` / `### 간단한 작업 (simple WORK, 빌드/테스트 필요)` — 본문의 "Main Claude가 builder/committer를 순차 호출" 서술을 "orchestrator가 중첩 spawn" 서술로 교체 |
| 사용법 하위 항목 | `README.md`의 `#### 1. ~ #### 10.`(WORK 생성 / WORK 실행 / 기존 WORK 추가 / 상태 확인 / **Auto 모드·재개** / 특정 TASK 실행 / WORK 강제 생성 / 실패·재시도 / 진행 중 WORK에 TASK 추가 / 개별 TASK 상태) 전 항목 대응 |
| 파이프라인 다이어그램 (L414~455) | `README.md`의 중첩 spawn 다이어그램(Main Claude ─ spawn once ─▶ orchestrator ─ nested spawn(depth 2) ─▶ …)으로 교체. [GATE-1]/[GATE-2] 위치와 재시도 3회 후 `<needs-decision>` 에스컬레이션 표기 포함 |
| 에이전트 표 (L457~465) | 6행으로 교체 — `scheduler` 행 삭제, **orchestrator** 행 추가. 모델/권한/MCP/Spawn 열 값은 `README.md` 표와 동일하게: orchestrator(opus, read + nested spawn, Serena 선택, Main Claude가 WORK당 1회 spawn) / specifier(opus) / planner(opus, complex WORK만) / builder(sonnet) / verifier(haiku) / committer(haiku, 이하 orchestrator가 중첩 spawn). 활동 로그·콜백은 orchestrator가 일괄 기록한다는 주석 포함 |
| `### 참조 문서 (Plugin에 포함)` (L468~482) | **8개**로 확장(`callback-protocol.md`, `ref-cache-protocol.md` 추가), 경로를 `plugin/references/`로 정정(`plugin/skills/sdd-pipeline/references/`·`agents/en/` 표기 제거) |
| 파일 구조 트리 (L484~499) | `work_WORK-01.log`(orchestrator 활동 로그), `DECISIONS.md` 항목 추가. 하단 주석 `direct/pipeline/full 모두 여기에 출력` → `simple/complex WORK 모두 여기에 출력` |
| 파일 명명 규칙 표 (L501~) | 활동 로그 `work_{WORK_ID}.log`, 결정 로그 `DECISIONS.md` 행 추가 |
| `### 세 가지 실행 모드` (L782) | `### 승인 게이트, 중첩 자율성, 그리고 DECISIONS.md` — 고정 게이트 2개(`<gate type="stage">`), 동적 게이트(`<gate type="decision">`), yield/park 후 `SendMessage(agentId, decision)` 재개, 핸들 소실 시 `work_{WORK}.log` 기반 재spawn, 최종 보고 후 `TaskStop(agentId)`, `mode=auto`의 무게이트 동작과 `DECISIONS.md`(`PENDING`→`RESOLVED`) 기록 |
| `### Specifier 판정 기준 config` (L685~) | 유지하되, specifier의 `direct` 판정 → orchestrator의 **simple WORK**, `pipeline`/`full` 판정 → **complex WORK** 매핑 주석을 `README.md`와 동일하게 추가 |
| `### 컨텍스트 초기화 후 재개` (L563) | `work_{WORK}.log` + `PROGRESS.md` 기반 재개, 미해소 `GATE_WAIT`/`DECISION_WAIT`는 건너뛰지 않고 재제시된다는 서술로 교체 |
| `### 저장소 구조` 트리 (L938~) | TASK-01에서 확정한 `README.md`의 Repository Structure 트리와 동일한 구조(레퍼런스 8종, `develop/.claude-plugin/`, `npm/references/`·`npm/skills/`·`npm/README.md` 포함, `develop/hooks/`·`plugin/README.md`·`plugin/skills/sdd-pipeline/references/` 없음, `plugin/skills/uctm-init/`) |
| 참조 문서 경로 표기 (`agents/xml-schema.md` 등) | `references/xml-schema.md`, `references/shared-prompt-sections.md` |
| 스폰 카운트 표 | `README.md`와 동일 수치 — simple WORK: `2 + 3N`, complex WORK: `3 + 3N` (NFR-02) |
| 예제 세션 (L575~) | orchestrator 1회 spawn → specifier 중첩 → [GATE-1] → planner 중첩 → [GATE-2] → SendMessage 재개 → STEP C DAG 실행 흐름으로 교체 |

## Files

| Path | Action | Description |
|------|--------|-------------|
| `README_KO.md` | MODIFY | 전면 재작성 — `README.md` 확정본과 1:1 대응하는 한국어 문서 |

## Acceptance Criteria

- [ ] `scheduler` 언급 0건 (FR-06 / AC-01)
- [ ] 에이전트 표가 orchestrator / specifier / planner / builder / verifier / committer 6종으로 구성 (FR-06 / AC-06)
- [ ] 실행 모드 서술이 `mode=gated` / `mode=auto` 및 `[GATE-1]` / `[GATE-2]` 체계로 대체됨 (FR-06)
- [ ] `DECISIONS.md`, `work_{WORK}.log`, `SendMessage` 재개 서술이 포함됨 (FR-06)
- [ ] 참조 문서 표가 8개 파일로 구성되고 경로가 `plugin/references/`로 표기됨 (FR-06 / AC-03)
- [ ] `##` 헤더 목록이 `README.md`와 1:1 대응하며 개수가 일치함 (NFR-02 / AC-05)
- [ ] 스폰 카운트 표 수치가 `README.md`와 동일함 (`2 + 3N`, `3 + 3N`) (NFR-02)
- [ ] 저장소 구조 트리에 기재된 모든 경로가 실제로 존재함 (NFR-01 / AC-04)
- [ ] 배지·영문 문서 링크·라이선스·Serena MCP·산출물 언어 섹션이 보존됨 (CON-04 / AC-07)
- [ ] `README.md` 및 `npm/README.md`가 이 TASK에서 변경되지 않음 (R-01)

## Verify

```bash
# AC-01 — scheduler 0건
grep -c "scheduler" README_KO.md

# NFR-02 / AC-05 — 헤더 개수 일치 (네 값 중 EN/KO 쌍이 각각 같아야 함)
grep -c "^## " README.md
grep -c "^## " README_KO.md
grep -c "^### " README.md
grep -c "^### " README_KO.md

# FR-06 — orchestrator 모델 반영 (모두 매치되어야 함)
grep -n "orchestrator" README_KO.md
grep -n "mode=gated" README_KO.md
grep -n "mode=auto" README_KO.md
grep -n "GATE-1" README_KO.md
grep -n "GATE-2" README_KO.md
grep -n "DECISIONS.md" README_KO.md
grep -n "SendMessage" README_KO.md
grep -n "callback-protocol.md" README_KO.md
grep -n "ref-cache-protocol.md" README_KO.md

# 폐기 표현이 남아있지 않은지 (무매치여야 함)
grep -n "세 가지 실행 모드" README_KO.md
grep -n "skills/sdd-pipeline/references" README_KO.md
grep -n "agents/en/" README_KO.md
grep -n "v1.5.0" README_KO.md

# NFR-02 — 스폰 카운트 수치 동일
grep -n "3N" README.md
grep -n "3N" README_KO.md

# NFR-01 / AC-04 — 트리 기재 경로 존재 확인 (전부 성공해야 함)
ls -d develop/agents develop/references develop/skills develop/.claude-plugin
ls -d npm/agents npm/references npm/skills npm/bin npm/lib npm/.agent npm/.claude-plugin
ls -d plugin/agents plugin/references plugin/.claude-plugin plugin/skills/uctm-init
ls npm/README.md

# NFR-01 — 존재하면 안 되는 경로 (모두 No such file 이어야 함)
ls -d develop/hooks
ls plugin/README.md
ls -d plugin/skills/init

# CON-04 / AC-07 — 보존 확인
grep -n "img.shields.io" README_KO.md
grep -n "English Documentation" README_KO.md
grep -n "Serena MCP" README_KO.md

# R-01 — README.md / npm/README.md 무변경 (출력이 비어 있어야 함)
git status --short README.md
git status --short npm/README.md
```
