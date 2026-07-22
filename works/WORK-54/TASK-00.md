# TASK-00: 복사 로직 공용화 (copyPluginResources / copyDirRecursive)

## WORK
WORK-54: uctm update 갱신 범위 누락 수정

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | `copyPluginResources()` 와 `copyDirRecursive()` 가 `npm/lib/constants.mjs` 에 단 하나만 정의되고, `init.mjs` 가 이를 import 해서 쓰게 된다. 이후 TASK-01 에서 `update.mjs` 도 같은 함수를 재사용할 수 있다. |
| 매핑 요구사항 | FR-01, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

`npm/lib/init.mjs` 에만 있는 두 함수를 `npm/lib/constants.mjs` 로 **이동**(복제 아님)하고 export 한다. `init.mjs` 는 로컬 정의를 삭제하고 기존 import 문에 두 심볼을 추가한다.

**동작 변경 금지** — 함수 본문 로직, init 의 호출 위치와 출력 문자열은 그대로 둔다. 이 TASK는 순수 리팩터링이다.

### 구현 지침

1. `npm/lib/constants.mjs`
   - 상단 fs import 에 `mkdirSync`, `copyFileSync`, `readdirSync`, `statSync` 를 추가한다 (현재: `readFileSync, existsSync, rmSync`).
   - `pruneObsolete()` 정의 **뒤**에 `copyDirRecursive(src, dest)` 와 `copyPluginResources(destBaseDir)` 를 `export function` 으로 추가한다. 본문은 `init.mjs` 의 현재 구현(41~74행)을 **그대로** 옮긴다.
   - `copyPluginResources()` 내부의 `const pkgRoot = join(__dirname, '..')` 은 그대로 유지한다. `constants.mjs` 도 `npm/lib/` 에 있으므로 `pkgRoot` 는 동일하게 `npm/` 을 가리킨다 (이미 파일 상단에 `__dirname` 이 정의되어 있으므로 재정의하지 않는다).
   - `existsSync(pluginSrc)` / `existsSync(skillsSrc)` 가드를 **삭제하지 않는다** (NFR-02).
   - JSDoc 한 줄 주석을 붙여 "init/update 공용" 임을 명시한다 (영문, 기존 주석 톤 유지).
2. `npm/lib/init.mjs`
   - 로컬 `copyDirRecursive` / `copyPluginResources` 정의(41~74행)를 삭제한다.
   - 기존 `import { ... } from './constants.mjs'` 에 `copyPluginResources` 를 추가한다. `copyDirRecursive` 는 `init.mjs` 에서 직접 쓰지 않으므로 import 하지 않는다.
   - `node:fs` import 목록에서 이제 쓰이지 않는 심볼(`readdirSync`, `statSync`)을 제거한다. `mkdirSync`/`copyFileSync` 는 `copyAgents`/`copyReferences`/`ensureWorksDir` 에서 계속 쓰이므로 유지한다.
   - `__dirname` 상수가 `init.mjs` 에서 더 이상 사용되지 않으면 해당 선언과 `dirname`/`fileURLToPath` import 를 정리한다. **주의**: `dirname` 은 `mergePermissions()` 에서 사용 중이므로 남겨야 한다 — 실제 사용처를 확인한 뒤 판단할 것.
   - `init()` 내부의 두 `copyPluginResources(...)` 호출부(149행, 170행)와 출력 문자열은 변경하지 않는다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `npm/lib/constants.mjs` | MODIFY | fs import 확장, `copyDirRecursive` / `copyPluginResources` export 추가 |
| `npm/lib/init.mjs` | MODIFY | 두 함수의 로컬 정의 삭제, constants.mjs 에서 `copyPluginResources` import, 미사용 import 정리 |

## Acceptance Criteria

- [x] `npm/lib/` 전체에서 `copyPluginResources` 의 **정의**가 1곳(`constants.mjs`), `copyDirRecursive` 의 정의가 1곳(`constants.mjs`)
- [x] `init.mjs` 에 두 함수의 로컬 정의가 남아 있지 않음
- [x] `init.mjs` 가 `./constants.mjs` 에서 `copyPluginResources` 를 import 해 사용
- [x] `copyPluginResources()` 가 해석하는 패키지 루트가 `npm/` (즉 `npm/.claude-plugin` 과 `npm/skills` 가 존재하는 디렉터리)
- [x] `existsSync` 소스 부재 가드가 유지됨
- [x] `init()` 의 호출 순서·출력 문자열이 변경 전과 동일 (git diff 상 `init()` 본문 무변경)
- [x] 두 파일 모두 `node --check` 통과, `uctm --version` 정상 동작

## Verify

```bash
node --check npm/lib/constants.mjs
```

```bash
node --check npm/lib/init.mjs
```

```bash
node npm/bin/cli.mjs --version
```

정의 개수 확인 (각 1이어야 함):

```bash
grep -rn "function copyPluginResources" npm/lib/
```

```bash
grep -rn "function copyDirRecursive" npm/lib/
```

패키지 루트 해석 + 실제 복사 동작 스모크 (임시 디렉터리에 복사되고 개수가 0보다 커야 함):

```bash
node -e "const p=require('node:path'),u=require('node:url'),fs=require('node:fs'),os=require('node:os');const d=fs.mkdtempSync(p.join(os.tmpdir(),'uctm-t0-'));import(u.pathToFileURL(p.resolve('npm/lib/constants.mjs')).href).then(m=>{const n=m.copyPluginResources(d);console.log('copied:',n);console.log('plugin.json exists:',fs.existsSync(p.join(d,'.claude-plugin','plugin.json')));console.log('skills:',fs.readdirSync(p.join(d,'skills')).join(','));});"
```

init 모듈 로드 스모크 (`function` 출력 기대):

```bash
node -e "const p=require('node:path'),u=require('node:url');import(u.pathToFileURL(p.resolve('npm/lib/init.mjs')).href).then(m=>console.log(typeof m.init));"
```

```bash
git diff --stat npm/lib/
```
