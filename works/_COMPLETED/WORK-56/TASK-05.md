# TASK-05: references 무변경 확인 + docs 드리프트 검사·보고

## WORK
WORK-56: Agent 정의 기준 skills/README 현행화 (references·docs 검사)

## Task 개요
| 항목 | 내용 |
|------|------|
| 목적 | `develop/references/*.md` 6종이 현행 agents 정의와 일치함을 재확인(무변경)하고, README가 참조하는 `docs/spec_*.md`의 파이프라인 서술 드리프트 유무를 검사·보고(수정 없음, D-01=option1 확정) |
| 매핑 요구사항 | FR-07, FR-08, NFR-01, NFR-02, NFR-04 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope
이 TASK는 **읽기전용 검사·보고 전용**이다. 어떤 파일도 편집하지 않는 것이 정상 결과다.

### 1. references 무변경 확인 (FR-07 / NFR-01)
`develop/references/` 6개 파일(`agent-flow.md`, `context-policy.md`, `file-content-schema.md`, `shared-prompt-sections.md`, `work-activity-log.md`, `xml-schema.md`)에 committer 능동 서술·`progress.md` 잔재가 없음을 재확인한다. 실제 드리프트가 발견되면 **임의 편집하지 말고**(CON-01) needs-decision으로 상향하고, 편집이 불가피하면 CLAUDE.md "레퍼런스 수정 절차" 4개 하위 절차(§ 번호 재번호/재사용 금지·삭제는 결번, 상단 섹션 소비 매트릭스 갱신, `orchestrator.md` 2곳(STEP 1-1 요약표 + STEP A/B/C spawn 라인) 동기화, `grep "^## §"` 검증)를 수반해야 한다(NFR-02).

### 2. docs 드리프트 검사·보고 (FR-08 / D-01)
D-01(=auto, option1) 확정에 따라 `docs/spec_*.md`(버전 명기 설계 스냅샷)는 **수정하지 않고** 파이프라인 서술 드리프트 유무만 검사해 결과에 1줄 이상 보고한다. 대상:
- `docs/spec_pipeline-architecture_v1.3.md`
- `docs/spec_SDD_with_ucagent_requirement.md`
- `docs/spec_sliding-window-context.md`

검사 관점: committer 능동 서술, 자식 5종, `progress.md`/`PROGRESS.md` 등 구형 모델 흔적 유무. 결과는 task-result의 notes에 "드리프트 있음/없음 + 근거"로 요약한다.

**범위 제외**: 이 TASK는 `develop/references/*.md`·`docs/*.md`를 포함해 어떤 파일도 편집하지 않는다. `develop/agents/*.md`·`plugin/`·`npm/`도 무변경.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/references/*.md` (6종) | inspect | 무변경 확인(committer/progress 잔재 부재 재검사) |
| `docs/spec_pipeline-architecture_v1.3.md` | inspect | 파이프라인 서술 드리프트 검사·보고(수정 없음) |
| `docs/spec_SDD_with_ucagent_requirement.md` | inspect | 동일 |
| `docs/spec_sliding-window-context.md` | inspect | 동일 |

## Acceptance Criteria
- [ ] references 6개 파일에 committer 능동 서술·`progress.md` 잔재 없음이 재확인됨
- [ ] references 파일이 이 WORK에서 변경되지 않음(git diff 없음)
- [ ] `docs/spec_*.md` 링크 3종의 파이프라인 서술 드리프트 유무가 결과에 1줄 이상 보고됨
- [ ] D-01(option1)에 따라 `docs/spec_*.md` 파일이 변경되지 않음
- [ ] references 실드리프트 발견 시 임의 편집 없이 needs-decision 상향(발생 시)
- [ ] `develop/agents/*.md`·`plugin/`·`npm/` 무변경

## Verify
```bash
grep -rn "committer" develop/references/
```
```bash
grep -rni "progress" develop/references/
```
```bash
grep -rni "committer\|progress\|five children\|자식 5종" docs/spec_pipeline-architecture_v1.3.md docs/spec_SDD_with_ucagent_requirement.md docs/spec_sliding-window-context.md
```
```bash
git diff --name-only develop/references/ docs/ develop/agents/ plugin/ npm/
```
