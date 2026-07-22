# TASK-01: uctm update 에 plugin resource 갱신 추가

## WORK
WORK-54: uctm update 갱신 범위 누락 수정

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | `uctm update` 가 설치처의 `.claude-plugin/`(plugin.json 포함) 과 `skills/` 를 갱신하게 되어, init 과 update 의 배포 범위 불일치(plugin.json 버전 정체)가 해소된다. |
| 매핑 요구사항 | FR-02, FR-03, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | TASK-00 완료 후 (constants.mjs 에 `copyPluginResources` 가 export 되어 있어야 함) |
| Phase | Phase 2 |

## Scope

`npm/lib/update.mjs` 만 수정한다. `copyPluginResources(baseDir)` 를 `pruneObsolete(baseDir)` 호출 **직전**에 추가하고, 복사 개수를 출력 라인에 반영한다.

### 구현 지침

1. import 에 `copyPluginResources` 를 추가한다 (기존 `./constants.mjs` import 구문에 심볼만 추가 — 새 import 문/새 모듈 금지).
2. 호출 위치: references 복사 루프 종료 후, `const removed = pruneObsolete(baseDir);` **바로 앞**.
   ```js
   const resCount = copyPluginResources(baseDir);
   const removed = pruneObsolete(baseDir);
   ```
   `copyPluginResources(baseDir)` 는 global/project 분기 **밖의 단일 호출 지점**이어야 한다 (NFR-01). 분기별로 중복 호출하지 않는다.
3. 출력 (FR-03): reference 라인 뒤, obsolete 라인 앞에 삽입한다.
   ```js
   if (resCount > 0) {
     console.log(`    ${green('✓')} ${resCount} plugin resource files updated`);
   }
   ```
   - 문구는 정확히 `N plugin resource files updated` 형식이어야 한다.
   - `resCount === 0` 이면 라인을 출력하지 않는다 (NFR-02 출력 멱등성 및 소스 부재 시 잡음 방지).
4. 기존 출력 라인(`agent files updated`, `reference files updated`, `obsolete files removed`, `CLAUDE.md untouched`)과 그 순서를 변경하지 않는다.
5. `existsSync(agentDestDir)` 미설치 가드와 에러 종료 로직은 그대로 둔다.
6. `npm/lib/init.mjs`, `npm/lib/constants.mjs` 는 이 TASK에서 수정하지 않는다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `npm/lib/update.mjs` | MODIFY | `copyPluginResources` import 추가, `pruneObsolete` 직전 호출, `N plugin resource files updated` 출력 라인 추가 |

## Acceptance Criteria

- [ ] `update.mjs` 에서 `copyPluginResources(baseDir)` 호출이 `pruneObsolete(baseDir)` 보다 앞에 위치
- [ ] `copyPluginResources` 호출이 코드상 1곳이며 global/project 분기 밖 (두 경로가 동일 코드 경로)
- [ ] update 실행 후 설치처 `.claude-plugin/plugin.json` 내용이 `npm/.claude-plugin/plugin.json` 과 일치
- [ ] update 실행 후 설치처 `skills/` 하위 파일이 `npm/skills/` 와 일치 (4개 SKILL.md)
- [ ] 출력에 `plugin resource files updated` 문자열과 개수가 포함
- [ ] 기존 출력 라인 4종이 그대로 유지되고 순서가 동일
- [ ] update 를 2회 연속 실행해도 출력과 결과가 동일 (NFR-02)
- [ ] 설치처에 `CLAUDE.md` 를 두어도 update 후 변경되지 않음 (NFR-01)
- [ ] 소스 `.claude-plugin/`·`skills/` 부재 상황에서도 예외 없이 exit code 0 (NFR-02)

## Verify

```bash
node --check npm/lib/update.mjs
```

호출 순서 확인 (`copyPluginResources` 행 번호 < `pruneObsolete` 행 번호):

```bash
grep -n "copyPluginResources\|pruneObsolete" npm/lib/update.mjs
```

임시 설치 루트에 project 모드 update 2회 실행 — 출력 비교(멱등성), plugin.json/skills 반영, CLAUDE.md 무변경 확인:

```bash
node -e "const fs=require('node:fs'),os=require('node:os'),p=require('node:path'),u=require('node:url');const src=u.pathToFileURL(p.resolve('npm/lib/update.mjs')).href;const pkg=p.resolve('npm');const d=fs.mkdtempSync(p.join(os.tmpdir(),'uctm-t1-'));fs.mkdirSync(p.join(d,'.claude','agents'),{recursive:true});fs.writeFileSync(p.join(d,'.claude','CLAUDE.md'),'KEEP');const out=[];const log=console.log;console.log=(...a)=>out.push(a.join(' '));process.chdir(d);import(src).then(m=>{m.update(false);const first=out.length;m.update(false);console.log=log;const a=out.slice(0,first).join('\n'),b=out.slice(first).join('\n');console.log('idempotent:',a===b);console.log('has-line:',/\d+ plugin resource files updated/.test(a));console.log('plugin.json match:',fs.readFileSync(p.join(d,'.claude','.claude-plugin','plugin.json'),'utf8')===fs.readFileSync(p.join(pkg,'.claude-plugin','plugin.json'),'utf8'));console.log('skills:',fs.readdirSync(p.join(d,'.claude','skills')).join(','));console.log('CLAUDE.md untouched:',fs.readFileSync(p.join(d,'.claude','CLAUDE.md'),'utf8')==='KEEP');console.log('---- run1 ----');console.log(a);});"
```

소스 부재 시나리오 — `.claude-plugin/`·`skills/` 없는 가짜 패키지 루트를 만들어 예외 없이 종료하는지 확인 (`exit:0` 기대):

```bash
node -e "const fs=require('node:fs'),os=require('node:os'),p=require('node:path'),u=require('node:url');const d=fs.mkdtempSync(p.join(os.tmpdir(),'uctm-t1b-'));const lib=p.join(d,'pkg','lib');fs.mkdirSync(lib,{recursive:true});for(const f of ['constants.mjs','update.mjs'])fs.copyFileSync(p.resolve('npm/lib',f),p.join(lib,f));fs.copyFileSync(p.resolve('npm/package.json'),p.join(d,'pkg','package.json'));const root=p.join(d,'root');fs.mkdirSync(p.join(root,'.claude','agents'),{recursive:true});process.chdir(root);import(u.pathToFileURL(p.join(lib,'update.mjs')).href).then(m=>{m.update(false);console.log('exit:0 no-throw, plugin dir created:',fs.existsSync(p.join(root,'.claude','.claude-plugin')));}).catch(e=>{console.log('FAIL',e.message);process.exit(1);});"
```
