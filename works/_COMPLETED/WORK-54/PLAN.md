# WORK-54: uctm update 갱신 범위 누락 수정

> Created: 2026-07-22
> Requirement: works/WORK-54/Requirement.md — "[WORK] uctm init 갱신 문제 확인하고 수정해줘"
> Project: uc-taskmanager-claude-agent
> Tech Stack: Node.js >= 18 (ESM, "type": "module"), 외부 의존성 없음(node: 내장 모듈만), Markdown 문서
> Language: ko
> Status: PLANNED

## 목표

`uctm update`가 `uctm init`과 동일한 범위(`.claude-plugin/`, `skills/` 포함)를 설치처에 반영하도록 복사 로직을 공용화하고, 릴리스 검증 절차를 문서화하여 배포 경로 미검증 상태를 해소한다.

## 설계

### 1. 아키텍처 방향

- **접근 방식**: 기존 수정 (CLI 3파일 리팩터링 + 문서 신설)
- **구조**: `npm/bin/cli.mjs` → `npm/lib/{init,update}.mjs` → `npm/lib/constants.mjs`(공용 소스 경로·파일 목록·fs 동작). 기존 2계층 구조를 유지하고, 중복 가능성이 있는 복사 로직을 하위 공용 모듈로 내린다.
- **데이터 흐름**:
  `패키지 루트(npm/)` → `copyPluginResources(destBaseDir)` → `설치처(.claude/ 또는 ~/.claude/)`
  update 파이프라인: `agents 복사 → references 복사 → **plugin resources 복사(신규)** → pruneObsolete → 결과 출력`

**FR-01 공용 위치 결정 (ASM-02 — 구현 재량 범위)**: `npm/lib/constants.mjs` 채택. 근거:

1. `constants.mjs`는 이미 순수 상수 파일이 아니다 — `getAgentsSrcDir()` / `getReferencesSrcDir()`(소스 경로 해석)와 `pruneObsolete()`(fs 변경 동작)를 export 하고 있어, 이미 "두 명령이 공유하는 파일 배치 모듈" 역할을 한다.
2. `init.mjs` / `update.mjs` 모두 이미 `./constants.mjs` 를 import 하고 있어 **import 구문 추가 없이 심볼만 추가**하면 된다. 신규 모듈 도입 대비 변경 표면이 작다.
3. `constants.mjs` 는 `npm/lib/` 에 있으므로 `join(__dirname, '..')` 의 값이 `init.mjs` 와 **동일하게 `npm/`** 이다 → 패키지 루트 해석이 이동 후에도 불변 (FR-01 AC 4번).
4. `npm/package.json` 의 `files` 에 `lib/` 가 통째로 포함되어 있어 배포 영향 없음.

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | 없음 |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | DB/영속 스키마 없음. 파일 배치 대상만 확대(`.claude-plugin/`, `skills/` 가 update 대상에 추가) |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| `copyDirRecursive(src, dest)` | 모듈 export (`npm/lib/constants.mjs`) | 반환: 복사한 파일 개수(number) | FR-01 |
| `copyPluginResources(destBaseDir)` | 모듈 export (`npm/lib/constants.mjs`) | `destBaseDir` = 설치 루트. `.claude-plugin/` + `skills/` 복사, 반환: 총 파일 개수 | FR-01, FR-02 |
| `uctm update` CLI 출력 | stdout | `    ✓ N plugin resource files updated` (agents/references 라인 뒤, obsolete 라인 앞) | FR-03 |
| 릴리스 검증 절차 문서 | Markdown | `docs/guide_release-verification.md` 신설 (절차 본문) + `CLAUDE.md` `## npm 버전업 절차` 에 단계 항목·링크 추가 — **확정 (D-02)** | FR-05 |

**출력 라인 순서 (FR-03 / NFR-01 회귀 방지)**

```
  Updating .claude/ ...
    ✓ 6 agent files updated
    ✓ 6 reference files updated
    ✓ N plugin resource files updated      ← 신규 (N > 0 일 때만)
    ✓ M obsolete files removed             ← 기존
    - CLAUDE.md untouched                  ← 기존
```

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | global/project 두 경로 동일 동작 + 기존 동작 무회귀 | `update()` 내부에서 `baseDir` 는 이미 global/project 분기 결과로 결정된 단일 변수다. `copyPluginResources(baseDir)` 를 **분기 밖 단일 호출 지점**에 두어 두 경로가 같은 코드 경로를 타게 한다. `CLAUDE.md` 는 어느 복사 대상에도 포함되지 않으므로 미변경이 자동 보장된다. init 은 함수 정의 위치만 바뀌고 호출부·출력 문자열은 그대로 둔다. |
| NFR-02 | 멱등성 + 소스 부재 시 무오류 종료 | `copyPluginResources()` 의 기존 `existsSync(pluginSrc)` / `existsSync(skillsSrc)` 가드를 그대로 유지(삭제 금지). 복사는 `copyFileSync` 덮어쓰기이므로 2회 실행 결과가 동일. 개수 0이면 출력 라인을 생략하여 출력도 동일. `mkdirSync(..., {recursive:true})` 로 대상 부재 시에도 예외 없음. |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-00 | 복사 로직 공용화 (copyPluginResources/copyDirRecursive → constants.mjs, init.mjs 재사용) | 없음 | 1 | Must | FR-01, NFR-01, NFR-02 | S |
| TASK-01 | uctm update 에 plugin resource 갱신 추가 + 출력 라인 | TASK-00 | 2 | Must | FR-02, FR-03, NFR-01, NFR-02 | S |
| TASK-02 | constants.mjs obsolete 주석 버전 표기 정정 (2.1.0 → 2.0.1) | TASK-00 | 2 | Should | FR-04 | S |
| TASK-03 | 릴리스 검증 절차 문서화 (`docs/guide_release-verification.md` 신설 + CLAUDE.md 링크·번호 정정) | 없음 | 1 | Should | FR-05 | M |
| TASK-04 | TODO 배경 문서 현행화 및 tracked 전환 | TASK-01, TASK-02, TASK-03 | 3 | Should | FR-06 | S |

## Task 의존성 그래프

```
Phase 1                 Phase 2                      Phase 3
─────────               ─────────                    ─────────
TASK-00 ──────┬──────▶ TASK-01 (update.mjs) ──┐
              │                                │
              └──────▶ TASK-02 (comment fix) ──┼──▶ TASK-04 (TODO 현행화)
                                               │
TASK-03 (release doc) ─────────────────────────┘
   └── ASM-01(문서 배치 위치) 확정됨 — D-02, 결정 게이트 해소

병렬 가능: [TASK-00, TASK-03]  /  [TASK-01, TASK-02]
파일 충돌: 없음 (constants.mjs 를 공유하는 TASK-00·TASK-02 는 의존관계로 직렬화)
```

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | 함수 이동 시 `__dirname` 기준 패키지 루트가 어긋나 `npm/lib/` 를 루트로 오해석 | 낮음 | 높음 | 회피 — 이동 대상 파일이 동일 디렉터리(`npm/lib/`)이므로 `join(__dirname,'..')` 값 불변. TASK-00 Verify에서 해석 경로를 실제 출력해 확인 | FR-01 AC 4 |
| R-02 | ~~ASM-01(FR-05 문서 배치) 미결정으로 TASK-03 착수 불가~~ **해소됨** | — | — | 해소 — D-02 로 `docs/guide_release-verification.md` 신설 + `CLAUDE.md` 링크(option b) 확정. TASK-03 `## Files` 및 Scope 에 반영 완료, 착수 가능 | DECISIONS.md D-02 |
| R-03 | update 2회 실행 시 출력/결과가 달라져 멱등성 위반 | 낮음 | 중간 | 완화 — TASK-01 Verify에서 임시 설치 루트에 update 2회 연속 실행 후 출력 비교 | NFR-02 |
| R-04 | 개발 환경이 `npm link` 상태라 실제 배포 경로가 여전히 미검증 | 높음 | 중간 | 수용 — ASM-04에 따라 이번 WORK는 **절차 문서화까지**. 실검증 실행은 다음 릴리스 시점 (FR-05 산출물이 그 절차를 정의) | TODO §2 |
| R-05 | TASK-04에서 범위 밖 파일(`TODO/ref-cache-phase2-selective-sections.md`, `README_KO.md`)을 함께 수정 | 중간 | 중간 | 회피 — TASK-04에 변경 금지 파일 명시 + Verify에서 `git status --porcelain` 로 해당 2파일 미변경 확인 | FR-06 AC 6·7 |
| R-06 | `~/.claude/` 실환경에 global 경로를 실행 검증하면 사용자 환경이 변형됨 | 중간 | 낮음 | 회피 — 검증은 임시 디렉터리 기반 project 모드 실행 + global 분기가 동일 코드 경로임을 코드 검사로 확인. 실환경 global 실행은 사용자 수동 확인에 위임 | NFR-01 |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| TODO §1 — 공용 모듈 추출, 중복 정의 금지 | FR-01 | TASK-00 | FR-01 AC 1~4 | grep 정의 개수 확인 + 모듈 import 스모크 |
| TODO §1 — pruneObsolete 직전 copyPluginResources 호출 | FR-02 | TASK-01 | FR-02 AC 1~3 | 임시 설치 루트에 update 실행 후 plugin.json/skills 내용 대조 |
| TODO §1 — `N plugin resource files updated` 출력 | FR-03 | TASK-01 | FR-03 AC 1~2 | update 실행 출력 문자열 확인 |
| TODO §1 — global/project 두 경로 동작 | NFR-01 | TASK-00, TASK-01 | NFR-01 AC 1~4 | project 모드 실행 + 분기 밖 단일 호출 코드 검사 |
| (회귀 방지) update 멱등 / 소스 부재 허용 | NFR-02 | TASK-01 | NFR-02 AC 1~2 | update 2회 연속 실행 출력 비교, 소스 부재 시나리오 실행 |
| TODO §3 — 주석 버전 표기 정정 | FR-04 | TASK-02 | FR-04 AC 1~3 | grep (2.1.0 부재 / 2.0.1 존재) + `node --check` |
| TODO §2 — 릴리스 검증 절차 문서화 (`docs/guide_release-verification.md` 신설) | FR-05 | TASK-03 | FR-05 AC 1~5 | 문서 존재·항목 grep 체크 + 수동 리뷰 |
| TODO §2 — npm link 상태 처리 방법 | FR-05 | TASK-03 | FR-05 AC 3 | `grep "npm ls -g uctm" docs/guide_release-verification.md` |
| TODO §2 — 버전업 절차에 검증 단계 편입 (D-02) | FR-05 | TASK-03 | FR-05 AC 5 | `CLAUDE.md` `## npm 버전업 절차` 의 링크 존재 + 목록 번호 1~4 연속 확인 |
| 배경 문서 커밋 및 §1·§2·§3 해결 표시 | FR-06 | TASK-04 | FR-06 AC 1~4 | git 상태 확인 + 문서 grep |
| TODO §4 — 문서 정리 2건 (범위 밖 유지) | FR-06 | TASK-04 | FR-06 AC 5~7 | `git status --porcelain` 로 미변경 확인 |

---

## 자체 검증 체크리스트

- [x] 모든 FR이 최소 1개 Task에 매핑됨 (FR-01→00, FR-02·03→01, FR-04→02, FR-05→03, FR-06→04)
- [x] 모든 NFR이 설계 또는 Task에 반영됨 (NFR-01→설계 §4 + TASK-00/01, NFR-02→설계 §4 + TASK-01)
- [x] Task 간 순환 의존 없음 (DAG: 00→{01,02}→04, 03→04)
- [x] 제약조건 내 실현 가능 (CON-01 ESM 유지, CON-02 외부 의존성 없음, CON-03 develop/ 동기화 목록 미변경, CON-04 dev 브랜치, CON-05 커밋 en)
- [x] 각 Task에 완료 조건이 있음
- [x] 리스크가 식별되고 대응 전략이 있음 (R-01~R-06)
- [x] 실행 순서가 의존관계와 일치함 (Phase 1→2→3)
- [x] ASM-01 (FR-05 문서 배치 위치) **확정** — D-02, option (b): `docs/guide_release-verification.md` 신설 + `CLAUDE.md` 링크. TASK-03 반영 완료, 미확정 항목 없음

---
