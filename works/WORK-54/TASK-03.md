# TASK-03: 릴리스 검증 절차 문서화

## WORK
WORK-54: uctm update 갱신 범위 누락 수정

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 배포 후 "레지스트리 패키지로 실제 사용자 경로를 검증하는" 절차가 `docs/guide_release-verification.md` 로 존재하게 되어, `npm link` 때문에 검증이 성립하지 않던 문제(TODO §2)가 재발하지 않는다. 아울러 `CLAUDE.md` 의 npm 버전업 절차가 이 검증 단계를 정식 단계로 포함한다. |
| 매핑 요구사항 | FR-05 |
| 우선순위 | Should |
| 예상 규모 | M |
| 의존관계 | 없음 (코드 TASK와 병렬 가능) |
| Phase | Phase 1 |

## 배치 위치 (확정 — DECISIONS.md D-02)

FR-05 절차 본문은 **`docs/guide_release-verification.md` 를 신설**해 담고, `CLAUDE.md` 의 `## npm 버전업 절차` 에는 **검증 단계 항목 + 한 줄 링크만** 추가한다.

- `CLAUDE.md` 는 상시 로드되는 지침 파일이므로 40~80행 규모의 bash 절차를 인라인하지 않는다 (컨텍스트 비용을 매 세션 지불하게 됨).
- 기존 `## Agent 테스트` → `docs/guide_agent-testing.md` 위임 선례와 동일한 패턴을 따른다.
- `docs/guide_agent-testing.md` 에는 **섞지 않는다** (해당 파일 수정 금지).

## Scope

### A. 신규 문서 `docs/guide_release-verification.md`

문서 언어는 ko, 명령 예시는 bash 코드 블록. 제목은 `# 릴리스 검증 가이드` 수준으로 하고, 아래 6개 구성요소를 모두 포함한다.

#### 1. 목적 / 적용 시점

- `npm publish` 직후, 레지스트리에 게시된 tarball 이 실제 사용자 환경에서 올바르게 설치·갱신되는지 확인하는 절차임을 명시.
- 개발 저장소에서의 `uctm` 실행만으로는 이 검증이 성립하지 않는다는 점(아래 2)을 먼저 언급.

#### 2. 사전 확인 — `npm link` 상태 (FR-05 AC 3)

- 상태 확인 명령: `npm ls -g uctm`
- 판별 기준: 출력이 `uctm@<version> -> ...\uc-taskmanager-claude-agent\npm` 처럼 `->` 링크 형태면 로컬 폴더가 실행되는 것이므로 검증 무효.
- 해제/우회 방법 2가지를 모두 기술:
  - **일시 해제**: `npm rm -g uctm` (또는 `npm unlink -g uctm`) → 검증 수행 → 검증 후 개발용으로 되돌리려면 `npm/` 에서 `npm link` 재실행.
  - **별도 환경**: 링크를 건드리지 않고 `npx uctm@<version> init` 사용, 또는 컨테이너/다른 사용자 계정 등 전역 링크가 없는 환경 사용.

#### 3. 격리 환경 준비 (FR-05 AC 1)

- 임시 폴더 생성 후 그 안에서 수행할 것(예: `mkdir /tmp/uctm-verify` 수준의 안내. 저장소 작업 트리 안에서 하지 말 것).
- 설치 명령: `npm i -g uctm@<version>` 또는 `npx uctm@<version>`
- 게시본 확인 보조 명령: `npm view uctm@<version> files` / `npm pack uctm@<version>` 로 tarball 내용을 확인하는 방법(선택 단계로 기술).

#### 4. `uctm init` 검증 (FR-05 AC 2)

- `uctm init` (project) 실행 → `.claude/agents/`(6), `.claude/references/`(6), `.claude/.claude-plugin/plugin.json`, `.claude/skills/`(4개 SKILL.md), `works/` 생성 확인.
- `uctm init --global` 은 `~/.claude/` 를 변경하므로 **격리 환경에서만** 수행하라는 주의 문구.

#### 5. `uctm update` 검증 (FR-05 AC 2)

- 기존 설치 상태를 만든 뒤(예: 구버전으로 init 하거나 init 후 파일을 임의 수정) `uctm update` 실행.
- 확인 항목: agent/reference 갱신, **`.claude-plugin/plugin.json` 의 version 이 설치한 패키지 버전과 일치**, `skills/` 갱신, obsolete prune 동작, `CLAUDE.md` 무변경.
- 출력에 `N plugin resource files updated` 라인이 나오는지 확인 (WORK-54 에서 추가된 동작).
- `uctm update` 를 2회 연속 실행해 결과·출력이 동일한지(멱등) 확인.

#### 6. 통과 판정 기준 (FR-05 AC 4)

체크리스트 형태(`- [ ]`)로 명시:

- [ ] `npm ls -g uctm` 이 링크가 아닌 실제 버전 설치를 보여준다
- [ ] init 후 `agents/` 6개, `references/` 6개, `skills/` 4개, `.claude-plugin/plugin.json` 존재
- [ ] `.claude-plugin/plugin.json` 의 `version` 이 설치한 npm 패키지 버전과 동일
- [ ] update 후 위 4개 대상이 모두 패키지 내용과 일치
- [ ] update 출력에 `plugin resource files updated` 라인 존재
- [ ] update 2회 실행 결과·출력 동일, `CLAUDE.md` 무변경
- [ ] 검증 종료 후 개발 환경의 `npm link` 상태를 복원했다

### B. `CLAUDE.md` — `## npm 버전업 절차` 수정

이 섹션 **한 곳만** 수정한다. 현재 목록 번호가 `1, 3, 4` 로 깨져 있으므로, 검증 항목 추가와 함께 `1, 2, 3, 4` 연속 번호로 정정한다.

수정 후 목표 형태 (문구·링크 표기는 문서 톤에 맞춰 미세 조정 가능):

```markdown
## npm 버전업 절차

사용자가 npm 버전업을 요청하면 다음을 추가로 수행한다:

1. develop/ 동기화 (Push 절차 1단계와 동일)
2. `npm version patch|minor|major` 실행
3. `npm publish`
4. 배포 검증 — 격리 환경에서 `uctm init` / `uctm update` 확인
   → [docs/guide_release-verification.md](docs/guide_release-verification.md)
```

- 링크 형식은 기존 관례(`## Agent 테스트` 섹션의 `[docs/guide_agent-testing.md](docs/guide_agent-testing.md)`)를 따른다.
- 번호 정정 범위는 **`## npm 버전업 절차` 섹션에 한정**한다. `## Push 절차`, `## 레퍼런스 수정 절차` 등 다른 섹션의 목록은 건드리지 않는다.

### 범위 외 (금지)

- 실제 격리 환경 검증의 **실행**은 이번 WORK 범위가 아니다 (ASM-04). 문서화까지만 한다.
- 버전 범프·`npm publish` 실행 금지.
- `docs/guide_agent-testing.md` 수정 금지 (D-02: 기존 가이드에 섞지 않는다).
- `npm/lib/*.mjs` 수정 금지 (TASK-00~02 소관).
- `README.md` / `README_KO.md` 수정 금지.
- `CLAUDE.md` 의 다른 섹션 수정 금지.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `docs/guide_release-verification.md` | CREATE | 릴리스 검증 절차 본문 (Scope A 의 §1~§6) |
| `CLAUDE.md` | MODIFY | `## npm 버전업 절차` 에 4번 "배포 검증" 항목 + 문서 링크 추가, 목록 번호 1~4 연속 정정 (해당 섹션 한정) |

## Acceptance Criteria

- [x] `docs/guide_release-verification.md` 가 생성됨
- [x] 격리 환경 설치 명령(`npm i -g uctm@<version>` 또는 `npx uctm@<version>`)이 명시됨
- [x] 격리 환경을 저장소 작업 트리 밖에 두라는 안내가 있음
- [x] `uctm init` 검증 단계와 `uctm update` 검증 단계가 각각 기술됨
- [x] `npm ls -g uctm` 로 link 상태를 확인하는 방법과, 해제(`npm rm -g uctm`)·우회(별도 환경/npx) 방법이 모두 기술됨
- [x] `plugin resource files updated` 출력 확인과 update 2회 실행 멱등 확인이 포함됨
- [x] 통과 판정 기준이 체크리스트(`- [ ]`)로 기술됨
- [x] `CLAUDE.md` `## npm 버전업 절차` 에 `docs/guide_release-verification.md` 링크가 존재
- [x] `CLAUDE.md` `## npm 버전업 절차` 목록 번호가 `1, 2, 3, 4` 로 연속 (기존 `1, 3, 4` 결번 해소)
- [x] `CLAUDE.md` 의 다른 섹션과 `docs/guide_agent-testing.md` 가 변경되지 않음
- [x] `npm/lib/*` 및 README 계열 파일이 변경되지 않음

## Verify

신규 문서 존재 확인:

```bash
ls docs/guide_release-verification.md
```

문서 필수 항목 확인 — 아래 각 명령이 매치를 반환해야 통과:

```bash
grep -n "npm i -g uctm@\|npx uctm@" docs/guide_release-verification.md
```

```bash
grep -n "npm ls -g uctm" docs/guide_release-verification.md
```

```bash
grep -n "npm rm -g uctm\|npm unlink -g uctm" docs/guide_release-verification.md
```

```bash
grep -n "uctm init\|uctm update" docs/guide_release-verification.md
```

```bash
grep -n "plugin resource files updated" docs/guide_release-verification.md
```

통과 판정 체크리스트 존재 확인:

```bash
grep -n "^- \[ \]" docs/guide_release-verification.md
```

CLAUDE.md 링크 존재 확인:

```bash
grep -n "guide_release-verification.md" CLAUDE.md
```

CLAUDE.md 목록 번호 1~4 연속 확인 — 출력에서 `1.`, `2.`, `3.`, `4.` 가 순서대로 나와야 통과 (`3.` 이 `1.` 바로 뒤에 오면 실패):

```bash
grep -n -A 10 "## npm 버전업 절차" CLAUDE.md
```

`docs/guide_agent-testing.md` 미변경 확인 — 출력이 **없어야** 통과:

```bash
git status --porcelain docs/guide_agent-testing.md
```

범위 밖 파일 미변경 확인 (`npm/`, README 관련 출력이 없어야 함):

```bash
git status --porcelain
```
