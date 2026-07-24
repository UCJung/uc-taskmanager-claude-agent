# TASK-09: 배포 3-way 미러 + 저장소 전역 잔존 문구 감사 + 매트릭스 무결성 검증

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | TASK-01~08에서 편집한 `develop/` 정본과 루트 README를 `plugin/`·`npm/` 배포 사본에 미러하고, 저장소 전역에서 옛 서술(committer spawn·3+3N·린트 WARN·assumes Planner) 잔존 0 및 섹션 소비 매트릭스 무결성을 검증한다. |
| 매핑 요구사항 | FR-06, NFR-01, NFR-02, NFR-03 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01,02,03,04,05,06,07,08 완료 후 |
| Phase | Phase 3 |

## Scope

CLAUDE.md Push 절차 1·4단계와 동일한 미러를 수행한다.

### 미러 (develop → plugin/npm, README → npm)
1. `develop/agents/*.md`(orchestrator·specifier·planner·builder·verifier·committer 6개) → `plugin/agents/*.md`, `npm/agents/*.md`로 복사(덮어쓰기).
2. `develop/references/*.md`(6개) → `plugin/references/*.md`, `npm/references/*.md`로 복사(덮어쓰기).
3. 루트 `README.md` → `npm/README.md`로 복사(영문 README — CLAUDE.md Push 4단계).
   - 파일 복사는 Bash `cp` 단일 명령(호출당 하나, `shared-prompt-sections.md § 12` 규칙 준수) 또는 Read+Write로 수행. `plugin.json`·`constants.mjs` 등 매니페스트/런타임 코드는 **변경하지 않는다**(CON-01).

### 검증 A — 3-way diff (NFR-03)
4. 각 agents/references 파일에 대해 `develop` == `plugin` == `npm` (diff 0). README.md == npm/README.md.

### 검증 B — 전역 잔존 문구 감사 (FR-06/NFR-01)
5. 저장소 전역(develop·plugin·npm·README, docs 스냅샷 제외)에서 다음이 **0건**:
   - `assumes Planner` / `플래너 역할` (FR-01)
   - agents/references 내 `3 + 3N` / `3+3N` (FR-05)
   - verifier의 린트 `WARN` (FR-03)
   - committer를 **자식으로 spawn**하는 표현(요약 표 committer 행·`builder → verifier → committer` 루프·`STAGE_START stage=committer` 등)
   - 섹션 소비 매트릭스의 `commit` 열
6. 반대로 다음이 **존재**: agents/references의 `3 + 2N`, `stage=commit`(orchestrator·work-activity-log·agent-flow), builder→verifier 2단계 루프.
   - 예외 허용: committer.md **스텁**의 폐기 안내 문구, docs/ 구식 스냅샷(ASM-02/D-02로 범위 제외)은 감사 대상이 아니다.

### 검증 C — 매트릭스/레퍼런스 무결성 (NFR-02)
7. `grep -n "^## §"` 로 5개 레퍼런스의 섹션이 실재하고 재번호·결번 이상이 없음을 확인(shared § 10·§ 11 결번 유지).
8. `xxx.md § N` 상호참조가 존재하는 대상 섹션을 가리키는지(파손 없음) 확인.
9. 전이적 배분: file-content-schema § 3·shared § 8의 orch 열 ✅ 이관이 반영되어, orchestrator 인라인 커밋이 가리키는 섹션이 orch에 배분됨을 확인.
10. orchestrator.md 2곳 중복 기재(STEP 1-1 요약 표 + STEP A/B/C 스폰 라인)에서 committer가 모두 제거되고 상호 일치함을 확인.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `plugin/agents/*.md` | MODIFY | develop/agents 사본 미러(6개) |
| `npm/agents/*.md` | MODIFY | develop/agents 사본 미러(6개) |
| `plugin/references/*.md` | MODIFY | develop/references 사본 미러(6개) |
| `npm/references/*.md` | MODIFY | develop/references 사본 미러(6개) |
| `npm/README.md` | MODIFY | 루트 README.md 사본 미러(영문) |

## Acceptance Criteria
- [x] develop/agents/*.md == plugin/agents/*.md == npm/agents/*.md (diff 0, 6파일)
- [x] develop/references/*.md == plugin/references/*.md == npm/references/*.md (diff 0, 6파일)
- [x] README.md == npm/README.md (diff 0)
- [ ] 전역 감사: `assumes Planner`·`플래너 역할`·agents/refs의 `3+3N`·verifier `WARN`·committer spawn 표현·매트릭스 `commit` 열 = 0건
- [ ] agents/refs에 `3 + 2N`·`stage=commit`·builder→verifier 루프가 존재
- [ ] 5개 레퍼런스 `^## §` 실재·결번 유지·상호참조 무파손·전이적 배분 정합
- [ ] orchestrator.md 2곳(요약 표 + 스폰 라인)에서 committer 제거·상호 일치
- [x] `plugin.json`·`npm/lib/constants.mjs`는 변경되지 않았다(CON-01)

## Verify
```bash
diff develop/agents/orchestrator.md plugin/agents/orchestrator.md
```
```bash
diff develop/agents/orchestrator.md npm/agents/orchestrator.md
```
```bash
diff README.md npm/README.md
```
```bash
grep -rn "assumes Planner\|플래너 역할\|3 + 3N\|3+3N" develop plugin npm README.md
```
```bash
grep -rn "commit |\| commit" develop/references plugin/references npm/references
```
```bash
grep -rn "^## §" develop/references
```
> diff 명령들은 출력이 없어야 한다(파일 동일). 넷째 grep(옛 문구)은 0건, 다섯째 grep(매트릭스 commit 열)은 0건이어야 한다. `git status`로 plugin.json·constants.mjs가 변경 목록에 없음을 확인한다. (파일별 세부 감사는 각 편집 TASK의 Verify를 함께 참조.)
