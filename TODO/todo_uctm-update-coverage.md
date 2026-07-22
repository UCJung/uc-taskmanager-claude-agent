# TODO: `uctm update` 갱신 범위 및 배포 검증

작성일: 2026-07-22 (v2.0.1 배포 직후)

> 상태: §1·§2·§3 은 **WORK-54 에서 해결**됨. §4 는 이번 WORK 범위 밖으로 미처리 유지.

| 항목 | 상태 |
|---|---|
| §1 `uctm update` 갱신 범위 | ✅ 해결 — WORK-54 |
| §2 배포 경로 검증 (릴리스 검증 절차) | ✅ 해결 — WORK-54 (절차 문서화까지) |
| §3 `constants.mjs` 주석 버전 표기 | ✅ 해결 — WORK-54 |
| §4 정리 대상 문서 2건 | ⬜ 미처리 — WORK-54 범위 밖 |

## 배경

v2.0.1 배포 후 이 프로젝트에서 `uctm update`를 실행하고 결과를 확인하는 과정에서 발견한 항목들이다.
레지스트리 배포 자체는 정상이었다 — 게시된 tarball(24개 파일)의 agents 6종·references 6종·skills 4종이
`develop/`과 완전히 일치했고, `references/ref-cache-protocol.md`도 정상적으로 제외됐다.

---

## 1. `uctm update`가 `.claude-plugin/plugin.json`을 갱신하지 않는다 (우선순위: 높음)

> ✅ **해결 — WORK-54.** (a)안 채택. `copyPluginResources()`/`copyDirRecursive()` 를 `npm/lib/constants.mjs` 로 공용화하고, `update.mjs` 가 `pruneObsolete()` 직전에 호출하도록 수정. `N plugin resource files updated` 출력 추가.

### 현상

`uctm update` 실행 후에도 설치처의 `.claude/.claude-plugin/plugin.json` 버전이 `1.6.0`으로 남아 있다.
(이 프로젝트 기준 파일 mtime이 7/21 16:11 — 이후 여러 번의 update가 건드리지 않았다.)

| 대상 | update 갱신 여부 |
|---|---|
| `.claude/agents/` | ✅ 갱신됨 |
| `.claude/references/` | ✅ 갱신됨 (obsolete prune 포함) |
| `.claude/skills/` | ❌ 갱신 안 함 |
| `.claude/.claude-plugin/plugin.json` | ❌ 갱신 안 함 — **버전이 1.6.0으로 정체** |

### 원인

`npm/lib/update.mjs`가 `AGENT_FILES`와 `REFERENCE_FILES`만 복사한다 (`update.mjs:16-39`).
skills와 plugin manifest는 복사 대상에 아예 없다.

npm 패키지의 `files` 필드에는 `skills/`와 `.claude-plugin/`이 포함되어 있으므로
(→ `npm/package.json:9-16`) tarball에는 들어 있다. 배포가 아니라 **설치처 반영 단계의 누락**이다.

### 결정이 필요한 지점

`init`은 skills/plugin.json을 복사하는데 `update`는 하지 않는 것이 **의도된 설계인지 누락인지** 확인이 필요하다.

- (a) 누락이라면 → `update.mjs`가 skills와 `.claude-plugin/plugin.json`도 복사하도록 수정
- (b) 의도라면 → 왜 update 대상이 아닌지 근거를 남기고, 최소한 plugin.json 버전 불일치를
      경고로 알리는 정도는 검토

> 참고: skills는 이번 확인 시점에 내용이 우연히 `develop/`과 일치했다(다른 경로로 동기화된 것으로 보임).
> update가 갱신했기 때문이 아니므로 "문제 없음"으로 넘기면 안 된다.

### 관련 파일

- `npm/lib/update.mjs` — 복사 대상 정의
- `npm/lib/init.mjs` — init의 복사 범위와 비교 필요
- `npm/lib/constants.mjs` — `AGENT_FILES` / `REFERENCE_FILES` / `pruneObsolete`

---

## 2. 전역 설치가 심볼릭 링크라 실배포 경로가 미검증이다 (우선순위: 중간)

> ✅ **해결 — WORK-54.** 릴리스 검증 절차를 [docs/guide_release-verification.md](../docs/guide_release-verification.md) 에 문서화(격리 환경 설치 · `npm link` 해제/우회 · 통과 판정 기준)하고, `CLAUDE.md` 의 `## npm 버전업 절차` 에 검증 단계로 편입. 절차의 실제 수행은 다음 릴리스 시점.

### 현상

```
$ npm ls -g uctm
uctm@2.0.1 -> .\..\..\..\..\..\work\uc-taskmanager-claude-agent\npm
```

개발 환경의 전역 `uctm`이 `npm link` 상태다. 따라서 v2.0.1 배포 후 실행한 `uctm update`는
**레지스트리에서 받은 패키지가 아니라 로컬 `npm/` 폴더를 그대로 복사**한 것이다.

결과물이 `develop/`과 일치하기는 했지만, 이는 로컬 파일이 맞다는 것을 확인한 것일 뿐
실제 사용자가 `npm i -g uctm` 후 겪는 경로를 검증한 것이 아니다.

### 할 일

릴리스 검증 절차에 아래를 추가한다.

```bash
# 격리된 임시 폴더에서
npm i -g uctm@<version>     # 또는 npx uctm@<version>
uctm init                   # 신규 설치 경로 확인
uctm update                 # 기존 설치 갱신 경로 확인
```

`npm link` 상태에서는 이 검증이 성립하지 않으므로, 검증 시 link를 일시 해제하거나
별도 환경(컨테이너 등)을 쓰는 방법을 정한다.

---

## 3. `constants.mjs` 주석의 버전 표기 오류 (우선순위: 낮음)

> ✅ **해결 — WORK-54.** 주석 표기를 `2.1.0` → `2.0.1` 로 정정.

`npm/lib/constants.mjs:46`

```js
'references/ref-cache-protocol.md',// removed in 2.1.0 — protocol folded into xml-schema.md § 4
```

실제로는 **2.0.1**에 나갔다. 버전 범프를 minor에서 patch로 정하기 전에 쓴 주석이 남은 것이다.
`2.1.0` → `2.0.1`로 정정한다.

---

## 4. (별건) 정리 대상 문서 2건

> ⬜ **미처리 — WORK-54 범위 밖.** 사용자가 이번 WORK 에서 명시적으로 제외했다. 별도 WORK 로 처리한다.

이번 확인 중 눈에 띈, 위 항목과는 독립적인 정리거리다.

- **`TODO/ref-cache-phase2-selective-sections.md`** — Phase 2(에이전트별 섹션 선택 전달)는
  `c679b60`에서 **섹션 소비 매트릭스로 이미 구현됐다.** 문서에 남은 매핑표는 현재 매트릭스와
  다르고 이미 삭제된 `scheduler`까지 포함하고 있어, 그대로 두면 낡은 정보가 정본처럼 읽힌다.
  → `_TODO/DONE_` 으로 이동하거나 삭제.
- **`README_KO.md` 파이프라인 다이어그램** (약 425~426행) — `(complex WORK only)` 표기가 남아 있다.
  복잡도 분기 제거(`05a9a34`) 때 누락된 것으로, 영문 README에는 없다.
