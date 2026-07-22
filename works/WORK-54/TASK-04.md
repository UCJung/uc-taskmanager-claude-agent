# TASK-04: TODO 배경 문서 현행화 및 tracked 전환

## WORK
WORK-54: uctm update 갱신 범위 누락 수정

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 배경 문서 `TODO/todo_uctm-update-coverage.md` 가 git 에 tracked 되고, §1·§2·§3 이 WORK-54 로 해결되었음과 §4 가 범위 밖 미처리임이 문서에서 즉시 식별된다. |
| 매핑 요구사항 | FR-06 |
| 우선순위 | Should |
| 예상 규모 | S |
| 의존관계 | TASK-01, TASK-02, TASK-03 완료 후 (해결 표시가 실제 결과를 반영해야 함) |
| Phase | Phase 3 |

## Scope

`TODO/todo_uctm-update-coverage.md` **한 파일만** 수정하고 `git add` 로 tracked 상태로 만든다. 기존 본문(현상·원인·관련 파일 서술)은 **삭제하지 않는다** — 기록으로 남긴다. 상태 표시만 덧붙인다.

### 표시 방식 (planner 확정 — builder 재해석 금지)

**(1) 문서 상단 상태 요약** — 3행의 `작성일: 2026-07-22 (v2.0.1 배포 직후)` 바로 아래에 빈 줄을 두고 다음 블록을 삽입한다 (`## 배경` 앞).

```markdown
> 상태: §1·§2·§3 은 **WORK-54 에서 해결**됨. §4 는 이번 WORK 범위 밖으로 미처리 유지.

| 항목 | 상태 |
|---|---|
| §1 `uctm update` 갱신 범위 | ✅ 해결 — WORK-54 |
| §2 배포 경로 검증 (릴리스 검증 절차) | ✅ 해결 — WORK-54 (절차 문서화까지) |
| §3 `constants.mjs` 주석 버전 표기 | ✅ 해결 — WORK-54 |
| §4 정리 대상 문서 2건 | ⬜ 미처리 — WORK-54 범위 밖 |
```

**(2) 각 섹션 헤딩 직하 표시** — `## 1.` / `## 2.` / `## 3.` / `## 4.` 헤딩 바로 다음 줄(빈 줄 뒤)에 인용문 한 줄을 삽입한다.

- §1 (`## 1. ...`):
  ```markdown
  > ✅ **해결 — WORK-54.** (a)안 채택. `copyPluginResources()`/`copyDirRecursive()` 를 `npm/lib/constants.mjs` 로 공용화하고, `update.mjs` 가 `pruneObsolete()` 직전에 호출하도록 수정. `N plugin resource files updated` 출력 추가.
  ```
- §2 (`## 2. ...`):
  ```markdown
  > ✅ **해결 — WORK-54.** 릴리스 검증 절차를 [docs/guide_release-verification.md](../docs/guide_release-verification.md) 에 문서화(격리 환경 설치 · `npm link` 해제/우회 · 통과 판정 기준)하고, `CLAUDE.md` 의 `## npm 버전업 절차` 에 검증 단계로 편입. 절차의 실제 수행은 다음 릴리스 시점.
  ```
  경로는 TASK-03 에서 확정된 `docs/guide_release-verification.md` 이다 (DECISIONS.md D-02). 링크는 `TODO/` 기준 상대경로(`../docs/...`)이다. 상대경로가 부담되면 인라인 코드 `` `docs/guide_release-verification.md` `` 로 대체해도 무방하다 — 경로 문자열이 본문에 있으면 통과.
- §3 (`## 3. ...`):
  ```markdown
  > ✅ **해결 — WORK-54.** 주석 표기를 `2.1.0` → `2.0.1` 로 정정.
  ```
- §4 (`## 4. (별건) 정리 대상 문서 2건`):
  ```markdown
  > ⬜ **미처리 — WORK-54 범위 밖.** 사용자가 이번 WORK 에서 명시적으로 제외했다. 별도 WORK 로 처리한다.
  ```

**(3) git 등록** — 파일이 현재 untracked 이므로 `git add TODO/todo_uctm-update-coverage.md` 를 실행해 스테이징한다 (커밋은 committer 담당).

### 금지 사항 (FR-06 AC 5~7)

- §4 에 해결 표시(✅)를 붙이지 않는다.
- `TODO/ref-cache-phase2-selective-sections.md` 를 **이동·삭제·수정하지 않는다.**
- `README_KO.md` 를 수정하지 않는다 — `(complex WORK only)` 표기는 그대로 남는다.
- §1 의 "### 결정이 필요한 지점" 등 기존 서술을 삭제하지 않는다 (해결 인용문이 (a)안 채택을 이미 밝힘).
- 다른 TODO 문서나 코드 파일을 건드리지 않는다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `TODO/todo_uctm-update-coverage.md` | MODIFY | 상단 상태 요약 표 삽입 + §1·§2·§3 해결 인용문, §4 미처리 인용문 추가. `git add` 로 tracked 전환 |

## Acceptance Criteria

- [ ] `TODO/todo_uctm-update-coverage.md` 가 스테이징되어 untracked 상태가 아님
- [ ] 문서 상단에 §1~§4 상태 요약 표가 존재
- [ ] §1 헤딩 직하에 `✅ **해결 — WORK-54.**` 인용문 존재
- [ ] §2 헤딩 직하에 `✅ **해결 — WORK-54.**` 인용문 존재하며 확정 경로 `docs/guide_release-verification.md` 가 기재됨 (자리표시자 문구가 남아 있지 않음)
- [ ] §3 헤딩 직하에 `✅ **해결 — WORK-54.**` 인용문 존재
- [ ] §4 헤딩 직하에 `⬜ **미처리 — WORK-54 범위 밖.**` 인용문 존재하고 ✅ 표시가 없음
- [ ] 기존 본문(현상/원인/관련 파일/코드 블록)이 삭제되지 않음
- [ ] `TODO/ref-cache-phase2-selective-sections.md`, `README_KO.md` 가 변경되지 않음

## Verify

```bash
grep -n "WORK-54" TODO/todo_uctm-update-coverage.md
```

```bash
grep -n "^## \|^> " TODO/todo_uctm-update-coverage.md
```

§2 확정 경로 기재 확인 — 매치가 **있어야** 통과:

```bash
grep -n "guide_release-verification.md" TODO/todo_uctm-update-coverage.md
```

자리표시자 잔존 확인 — 매치가 **없어야** 통과:

```bash
grep -n "<문서 경로>" TODO/todo_uctm-update-coverage.md
```

tracked 여부 확인 (`A  TODO/todo_uctm-update-coverage.md` 기대):

```bash
git status --porcelain TODO/todo_uctm-update-coverage.md
```

범위 밖 파일 미변경 확인 — 두 명령 모두 출력이 **없어야** 통과:

```bash
git status --porcelain TODO/ref-cache-phase2-selective-sections.md
```

```bash
git status --porcelain README_KO.md
```

`(complex WORK only)` 잔존 확인 — 매치가 **있어야** 통과:

```bash
grep -n "complex WORK only" README_KO.md
```
