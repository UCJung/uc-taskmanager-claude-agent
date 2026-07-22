# 요구사항 명세서 — uctm update 갱신 범위 누락 수정

- WORK ID: WORK-54
- 작성일: 2026-07-22
- 대상 브랜치: `dev`
- **복잡도: Medium** (FR 6 / NFR 2 / 관여 컴포넌트 3~4)
- 예상 영향 범위: `npm/lib/constants.mjs`, `npm/lib/init.mjs`, `npm/lib/update.mjs`, (신규 공용 모듈 도입 시) `npm/lib/*.mjs` 1개, 릴리스 검증 절차 문서 1건, `TODO/todo_uctm-update-coverage.md`

---

## 1. 원본 요청

> [WORK] uctm init 갱신 문제 확인하고 수정해줘

후속 대화에서 확정된 내용(재협의 불필요):

> 문제: `uctm update`가 `uctm init`과 달리 `skills/`와 `.claude-plugin/plugin.json`을 갱신하지 않는다.
> 설치처의 `.claude/.claude-plugin/plugin.json` 버전이 1.6.0으로 정체되어 있다.
> 배경 문서: `TODO/todo_uctm-update-coverage.md`
>
> 1. [TODO §1] update의 갱신 범위를 init과 일치시킨다 (우선순위: 높음)
>    - `npm/lib/init.mjs`의 `copyPluginResources()` / `copyDirRecursive()` 를 공용 위치
>      (예: `npm/lib/constants.mjs` 또는 신규 공용 모듈)로 옮겨 `init.mjs`와 `update.mjs`가
>      공유하도록 리팩터링한다. **중복 정의 금지.**
>    - `npm/lib/update.mjs`에서 `pruneObsolete()` 호출 직전에 `copyPluginResources(baseDir)`를
>      호출하고, 복사 개수를 `N plugin resource files updated` 형식으로 출력한다.
>    - global(`~/.claude/`) / project(`.claude/`) 두 경로 모두에서 동작해야 한다.
> 2. [TODO §3] 주석 버전 표기 정정 (우선순위: 낮음)
>    `npm/lib/constants.mjs:46` 의 주석 `// removed in 2.1.0 — protocol folded into
>    xml-schema.md § 4` 에서 `2.1.0` → `2.0.1` 로 정정한다.
> 3. [TODO §2] 릴리스 검증 절차 문서화 (우선순위: 중간)
>    격리 환경에서 `npm i -g uctm@<version>` (또는 `npx uctm@<version>`) 후 `uctm init` /
>    `uctm update` 를 각각 확인하는 검증 절차를 문서화한다. `npm link` 상태에서는 검증이
>    성립하지 않으므로 link 일시 해제 또는 별도 환경 사용 방법도 함께 명시한다.
>
> 범위 제외: TODO §4 의 문서 정리 2건.

---

## 2. 배경 및 목적

### 해결하려는 문제

`uctm init`은 설치처에 `agents/`, `references/`, `.claude-plugin/`, `skills/` 를 모두 배포하지만,
`uctm update`는 `AGENT_FILES`와 `REFERENCE_FILES`만 복사한다(`npm/lib/update.mjs:26-41`).
그 결과:

| 대상 | init | update |
|---|---|---|
| `agents/` | 복사 | 갱신 |
| `references/` | 복사 | 갱신 (obsolete prune 포함) |
| `skills/` | 복사 | **갱신 안 함** |
| `.claude-plugin/plugin.json` | 복사 | **갱신 안 함 — 버전 1.6.0 정체** |

npm 패키지 `files` 필드에는 `skills/`, `.claude-plugin/` 이 포함되어 있으므로(`npm/package.json:9-16`)
tarball에는 존재한다. 즉 **배포 단계가 아니라 설치처 반영 단계의 누락**이다.

부수적으로, 개발 환경의 전역 `uctm`이 `npm link` 상태(`uctm@2.0.1 -> ...\uc-taskmanager-claude-agent\npm`)여서
v2.0.1 배포 후 실행한 `uctm update`는 레지스트리 패키지가 아니라 로컬 `npm/` 폴더를 복사한 것이었다.
따라서 **실제 사용자 설치 경로가 미검증 상태**다.

### 이해관계자

- `uctm`을 `npm i -g` 로 설치해 쓰는 최종 사용자 — 갱신 누락의 직접 피해자
- 이 저장소 메인테이너 — 릴리스 검증 절차의 수행 주체

### 기존 시스템/프로세스 관계

- `npm/lib/init.mjs` / `npm/lib/update.mjs` / `npm/lib/constants.mjs` (CLI 구현체)
- `npm/lib/*.mjs`는 develop/ 동기화 대상 목록(agents, references, hooks, skills, plugin.json)에
  포함되지 않는다 → CLAUDE.md "Push 절차" 1단계와 무관
- `TODO/todo_uctm-update-coverage.md` — 배경 문서 (현재 untracked → 이번 WORK에서 tracked로 전환, FR-06)

---

## 3. 범위

### In-Scope

1. `copyPluginResources()` / `copyDirRecursive()` 의 공용 모듈 추출 및 `init.mjs` 재사용 전환
2. `update.mjs`의 plugin resource 갱신 추가 + 출력 메시지
3. `constants.mjs:46` 주석 버전 표기 정정 (`2.1.0` → `2.0.1`)
4. 릴리스 검증 절차 문서화 (격리 환경 검증 + `npm link` 처리 방법)
5. TODO 배경 문서(`TODO/todo_uctm-update-coverage.md`) 상태 현행화 및 커밋 (§1·§2·§3 해결 표시, §4는 미처리 유지)

### Out-of-Scope

- **TODO §4 문서 정리 2건 — 사용자가 명시적으로 제외**
  - `TODO/ref-cache-phase2-selective-sections.md` 완료 처리
  - `README_KO.md` 파이프라인 다이어그램의 `(complex WORK only)` 표기 제거
  - 위 2건은 **해당 TODO 문서에 미처리 상태로 그대로 남긴다.** 해결 표시를 붙이지 않으며, 대상 파일(`TODO/ref-cache-phase2-selective-sections.md`, `README_KO.md`)도 이번 WORK에서 변경하지 않는다 (→ FR-06)
- 버전 범프 및 `npm publish` 실행 (별도 절차)
- `TODO §1 (b)안`(update 미갱신을 의도로 인정하고 버전 불일치 경고만 추가) — (a)안으로 확정되어 폐기
- `OBSOLETE_PATHS` 목록 자체의 추가/삭제 (주석 문구 정정만 수행)
- `uctm init` 의 기존 동작 변경

---

## 4. 기능 요구사항

| ID | 요구사항 | 우선순위 | 인수 기준 |
|----|---------|---------|----------|
| FR-01 | `copyPluginResources()` 와 그 의존 함수 `copyDirRecursive()` 는 `init.mjs`와 `update.mjs`가 함께 import할 수 있는 공용 위치(`npm/lib/constants.mjs` 또는 신규 공용 모듈)에 **단 하나만** 정의되어야 한다. | M | - [ ] `npm/lib/` 전체에서 `copyPluginResources` 정의가 1곳, `copyDirRecursive` 정의가 1곳<br>- [ ] `init.mjs`에 두 함수의 로컬 정의가 남아 있지 않음<br>- [ ] `init.mjs`가 공용 위치에서 import하여 사용<br>- [ ] 공용 모듈 내 패키지 루트 해석이 `npm/` 루트를 가리킴 (`__dirname` 기준 `..`) |
| FR-02 | `uctm update`는 `pruneObsolete()` 호출 **직전에** `copyPluginResources(baseDir)` 를 호출하여 `.claude-plugin/` 과 `skills/` 를 설치처에 갱신해야 한다. | M | - [ ] `update.mjs`에서 `copyPluginResources(baseDir)` 호출이 `pruneObsolete(baseDir)` 보다 앞에 위치<br>- [ ] update 실행 후 설치처 `.claude-plugin/plugin.json` 의 version이 패키지 `plugin.json` 과 일치<br>- [ ] update 실행 후 설치처 `skills/` 하위 파일이 패키지 `skills/` 와 내용 일치 |
| FR-03 | `uctm update`는 복사된 plugin resource 파일 개수를 `N plugin resource files updated` 형식으로 출력해야 한다. | M | - [ ] 출력에 `plugin resource files updated` 문자열과 개수가 포함<br>- [ ] 기존 출력 라인(agent/reference/obsolete/CLAUDE.md untouched)이 유지됨 |
| FR-04 | `npm/lib/constants.mjs` 의 `references/ref-cache-protocol.md` 항목 주석에서 제거 버전 표기를 `2.1.0` → `2.0.1` 로 정정해야 한다. | S | - [ ] `constants.mjs` 에 `removed in 2.0.1 — protocol folded into xml-schema.md § 4` 주석 존재<br>- [ ] `constants.mjs` 에 `2.1.0` 문자열이 남아 있지 않음<br>- [ ] `OBSOLETE_PATHS` 배열의 원소 값 자체는 변경되지 않음 |
| FR-05 | 릴리스 검증 절차가 문서화되어야 한다. 격리 환경에서 `npm i -g uctm@<version>`(또는 `npx uctm@<version>`) 후 `uctm init` / `uctm update` 를 각각 확인하는 단계와, `npm link` 상태에서는 검증이 성립하지 않으므로 link를 일시 해제하거나 별도 환경을 사용하는 방법을 포함한다. | S | - [ ] 문서에 격리 환경 설치 명령이 명시<br>- [ ] `uctm init` 검증 단계와 `uctm update` 검증 단계가 각각 기술<br>- [ ] `npm link` 상태 확인 방법(`npm ls -g uctm`)과 해제/우회 방법이 기술<br>- [ ] 검증 통과 판정 기준(무엇이 일치해야 통과인지)이 기술<br>- [ ] 문서 배치 위치가 ASM-01 결정에 따라 확정되어 반영됨 |
| FR-06 | 배경 문서 `TODO/todo_uctm-update-coverage.md` 를 이번 WORK에서 함께 커밋하고, 해결 상태를 문서에 현행화해야 한다. §1·§2·§3 은 이번 WORK로 해결되었음을 표시하고, §4 는 미처리 상태로 남기되 이번 WORK 범위 밖임이 문서에서 드러나야 한다. **표시 방식(예: 각 섹션 상단 `> ✅ 해결 — WORK-54` 주석, 또는 문서 상단 상태 요약 표 추가)은 문서 톤에 맞춰 planner 재량으로 정한다 — 별도 결정 게이트를 요구하지 않는다.** | S | - [ ] `TODO/todo_uctm-update-coverage.md` 가 git에 tracked 상태로 커밋됨 (`git ls-files` 에 등장, untracked 아님)<br>- [ ] §1 에 WORK-54로 해결되었다는 표시가 존재<br>- [ ] §2 에 WORK-54로 해결되었다는 표시가 존재<br>- [ ] §3 에 WORK-54로 해결되었다는 표시가 존재<br>- [ ] §4 에는 해결 표시가 없고, 이번 WORK 범위 밖(미처리)임이 문서에서 식별 가능<br>- [ ] `TODO/ref-cache-phase2-selective-sections.md` 가 이번 WORK의 커밋에서 변경되지 않음<br>- [ ] `README_KO.md` 가 이번 WORK의 커밋에서 변경되지 않음 (`(complex WORK only)` 표기 잔존) |

---

## 5. 비기능 요구사항

| ID | 구분 | 요구사항 | 인수 기준 |
|----|------|---------|----------|
| NFR-01 | 호환성 | `uctm update`는 global(`~/.claude/`)과 project(`.claude/`) 두 설치 경로 모두에서 동일하게 동작해야 하며, 기존 동작(agents/references 갱신, obsolete prune, `CLAUDE.md` 미변경)을 회귀시키지 않아야 한다. | - [ ] `uctm update -g` 실행 시 `~/.claude/` 하위에 `.claude-plugin/`, `skills/` 갱신 확인<br>- [ ] `uctm update` (project) 실행 시 `.claude/` 하위에 동일 확인<br>- [ ] 두 경우 모두 `CLAUDE.md` 가 변경되지 않음<br>- [ ] `uctm init` 의 기존 출력·결과가 변경 전과 동일 |
| NFR-02 | 안정성 | `uctm update`는 멱등해야 하며, 소스에 `.claude-plugin/` 또는 `skills/` 가 없는 경우에도 오류 없이 종료해야 한다. | - [ ] 동일 조건에서 update를 2회 연속 실행 시 결과와 출력이 동일<br>- [ ] 소스 디렉터리 부재 시 예외 없이 해당 항목을 건너뛰고 정상 종료 (exit code 0) |

---

## 6. 제약조건

- CON-01: Node.js >= 18, ESM(`"type": "module"`) — `npm/package.json` 기준
- CON-02: 외부 의존성 추가 금지 — 현재 CLI는 `node:` 내장 모듈만 사용한다
- CON-03: `npm/lib/*.mjs` 는 develop/ 동기화 대상이 아니다. CLAUDE.md "Push 절차" 1단계의 복사 목록에 이 파일들을 추가하지 않는다
- CON-04: 작업 브랜치는 `dev`
- CON-05: 커밋 메시지 언어는 en (CLAUDE.md `CommitLanguage: en`), 문서/명세 언어는 ko

---

## 7. 가정사항

- ASM-01: **FR-05 문서의 배치 위치는 미확정 상태다.** 후보는 (a) `CLAUDE.md` 의 "npm 버전업 절차" 섹션에 검증 단계 추가, (b) `docs/` 하위 신규 문서(예: `docs/guide_release-verification.md`) 신설 후 CLAUDE.md에서 링크, (c) 기존 `docs/guide_agent-testing.md` 에 절 추가. **planner 가 근거와 함께 권고안을 제시한 뒤 결정 게이트로 사용자 승인을 받는다.** 그 전까지는 미확정으로 유지한다. [확인 필요]
- ASM-02: FR-01의 공용 위치는 `npm/lib/constants.mjs` 또는 신규 공용 모듈 둘 다 허용된다. 사용자는 "중복 정의 금지"만 확정했고 파일 선택은 위임했다. [합의 완료 — 구현 재량]
- ASM-03: `TODO/todo_uctm-update-coverage.md` 는 untracked 상태였다. **확정: 이 문서를 이번 WORK에서 함께 커밋(untracked → tracked)하고, §1·§2·§3 에는 WORK-54로 해결되었다는 표시를 남기며, §4 는 미처리 상태로 두되 이번 WORK 범위 밖임이 드러나게 한다. 표시 방식은 planner 재량이다.** 본 가정은 요구사항으로 승격되었다 → **FR-06**. [결정 완료 — 사용자 승인, WORK-54 DECISIONS.md D-01]
- ASM-04: 인수 검증은 개발 환경(`npm link` 상태)에서의 실행 확인으로 수행하며, FR-05가 정의하는 격리 환경 실검증의 *실행*은 이번 WORK의 산출물(문서)에 따라 이후 릴리스 시점에 수행한다. 즉 이번 WORK는 절차 **문서화**까지다. [확인 완료 — 사용자 확인]

---

## 8. 용어 정의

| 용어 | 정의 |
|------|------|
| plugin resources | `.claude-plugin/`(plugin.json 포함) 과 `skills/` 를 합쳐 부르는 말. `copyPluginResources()` 의 복사 대상 |
| 설치처 (install root) | `uctm` 이 파일을 배포하는 대상 디렉터리. global이면 `~/.claude/`, project면 `<cwd>/.claude/` |
| prune | `OBSOLETE_PATHS` 에 등재된 구버전 잔존 파일을 설치처에서 삭제하는 동작 (`pruneObsolete()`) |
| npm link | 로컬 패키지 폴더를 전역 설치처럼 심볼릭 링크하는 npm 기능. 이 상태에서는 레지스트리 배포본이 아닌 로컬 소스가 실행된다 |

---

## 9. 추적성 매트릭스

| 원본 요청 항목 | 관련 FR/NFR | 인수 기준 |
|--------------|------------|----------|
| TODO §1 — 공용 모듈 추출, 중복 정의 금지 | FR-01 | FR-01 AC 전체 |
| TODO §1 — update가 pruneObsolete 직전 copyPluginResources 호출 | FR-02 | FR-02 AC 전체 |
| TODO §1 — `N plugin resource files updated` 출력 | FR-03 | FR-03 AC 전체 |
| TODO §1 — global/project 두 경로 모두 동작 | NFR-01 | NFR-01 AC 전체 |
| TODO §3 — 주석 버전 표기 정정 | FR-04 | FR-04 AC 전체 |
| TODO §2 — 릴리스 검증 절차 문서화 | FR-05 | FR-05 AC 전체 |
| TODO §2 — npm link 상태 처리 방법 | FR-05 | FR-05 AC 3번 |
| (요청 없음 — 회귀 방지) | NFR-01, NFR-02 | 해당 AC |
| 배경 문서 `TODO/todo_uctm-update-coverage.md` 커밋 및 §1·§2·§3 해결 표시 (ASM-03 결정) | FR-06 | FR-06 AC 1~4번 |
| TODO §4 — 문서 정리 2건 | FR-06 (미처리 유지 보장만 해당) | FR-06 AC 5~7번 |

---

## 10. 질의응답 기록

| # | 질문 | 답변 | 일시 |
|---|------|------|------|
| Q1 | update가 skills/plugin.json을 갱신하지 않는 것은 의도인가 누락인가 | 누락이다. init이 설치하는 것과 update가 갱신하는 것의 범위가 어긋난 것은 의도가 아니다 → (a)안 채택 | 2026-07-22 |
| Q2 | TODO §4 의 문서 정리 2건을 이번 WORK에 포함하는가 | 제외한다 | 2026-07-22 |
| Q3 | 릴리스 검증 절차 문서를 어디에 둘 것인가 | **미결 — planner가 권고안 제시 후 결정 게이트로 승인 예정 (ASM-01)** | 미정 |
| Q4 | `TODO/todo_uctm-update-coverage.md` 를 이번 WORK에서 커밋하고 상태를 갱신하는가 | 그렇다. 커밋하고 §1·§2·§3 에 해결 표시, §4 는 미처리로 유지. 표시 방식은 planner 재량 → FR-06 승격 (ASM-03) | 2026-07-22 |
