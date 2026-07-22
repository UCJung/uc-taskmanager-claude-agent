# TASK-00 Result

> WORK: WORK-54 — uctm update 갱신 범위 누락 수정
> Completed: 2026-07-22 15:00
> Status: **DONE**

## 요약

`copyPluginResources()`와 `copyDirRecursive()` 함수를 `npm/lib/init.mjs`에서 `npm/lib/constants.mjs`로 이동하여 공용화했다. 함수 본문 로직과 init 호출부는 변경 없이 순수 리팩터링을 완료했으며, 이를 통해 TASK-01의 update.mjs가 동일 함수를 재사용할 수 있게 준비했다.

## 완료 체크리스트

- [x] `npm/lib/constants.mjs`에 `copyDirRecursive`, `copyPluginResources` export 추가
- [x] `npm/lib/constants.mjs`의 fs import에 `mkdirSync`, `copyFileSync`, `readdirSync`, `statSync` 추가
- [x] `npm/lib/init.mjs`의 로컬 함수 정의 삭제
- [x] `npm/lib/init.mjs`에서 `copyPluginResources` import 추가
- [x] `npm/lib/init.mjs`의 미사용 import(`__dirname`, `fileURLToPath`, `readdirSync`, `statSync`) 정리
- [x] 함수 본문 로직 무변경 (순수 이동)
- [x] `init()` 호출 순서 및 출력 문자열 무변경
- [x] `existsSync` 소스 부재 가드 유지 (NFR-02)
- [x] `node --check` 검증 통과 (양쪽 파일)
- [x] `uctm --version` 정상 동작

## 검증 결과

- Build: N/A (스크립트 없음)
- Lint: N/A (스크립트 없음)
- Tests: ✅ (인수 기준 7개 항목 전수 검증 통과)
  - 정의 개수: copyPluginResources 1곳, copyDirRecursive 1곳 (constants.mjs)
  - init.mjs 로컬 정의 제거 확인
  - constants.mjs import 확인
  - 패키지 루트 해석: npm/ (스모크 테스트)
  - existsSync 가드 유지 확인
  - git diff 상 init() 본문 무변경
  - node --check 양쪽 통과
  - uctm --version = 2.0.1

## 변경 파일

### Created
None

### Modified
- `npm/lib/constants.mjs` — fs import 확장, copyDirRecursive / copyPluginResources export 추가
- `npm/lib/init.mjs` — 두 함수 로컬 정의 삭제, constants.mjs에서 copyPluginResources import

## 발생 이슈

None

## 후속 TASK 참고사항

TASK-01(update.mjs에 plugin resource 갱신 추가)과 TASK-02(constants.mjs:46 버전 주석 정정)는 constants.mjs 공용화 기반 위에서 독립적으로 진행 가능하다. copyPluginResources가 constants.mjs 내부의 copyDirRecursive를 호출하고 재귀 자기호출을 하지만, 모듈 스코프이므로 export 선언과 무관하게 정상 동작한다.

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)

constants.mjs에 copyDirRecursive(src,dest)·copyPluginResources(destBaseDir)를 export function으로 추가하고(pruneObsolete 뒤, REQUIRED_PERMISSIONS 앞), fs import에 mkdirSync/copyFileSync/readdirSync/statSync를 보강했다. init.mjs는 두 함수의 로컬 정의와 미사용 __dirname/fileURLToPath/readdirSync/statSync import를 삭제하고 constants.mjs에서 copyPluginResources를 import하도록 바꿨다(dirname은 mergePermissions에서 계속 사용하므로 유지). init() 호출부와 출력 문자열은 원문 그대로다.

### Verifier Context (FULL)

**what**: TASK-00의 인수 기준 7개를 전수 검증해 모두 통과했다. (1) copyPluginResources·copyDirRecursive가 constants.mjs에 각각 정확히 1곳만 정의됨(constants.mjs:89, constants.mjs:69). (2) init.mjs에 로컬 정의가 남아 있지 않음. (3) init.mjs가 ./constants.mjs에서 copyPluginResources를 import함. (4) 패키지 루트 해석이 npm/을 가리킴 — 스모크 테스트로 5개 파일 복사, .claude-plugin/plugin.json 존재, skills 4종 확인. (5) existsSync 소스 부재 가드 유지(NFR-02). (6) git diff로 init() 함수 본문 무변경 확인. (7) node --check 양쪽 통과, uctm --version이 2.0.1 반환. 범위 준수: update.mjs 무변경, constants.mjs:46의 2.1.0 주석 무변경, 외부 의존성 추가 없음.

**why**: 공용 위치(constants.mjs)로 옮겨 TASK-01의 update.mjs가 동일 함수를 재사용할 수 있게 하는 것이 목적이며, join(__dirname,'..')이 constants.mjs에서도 init.mjs와 동일하게 npm/을 가리키므로(둘 다 npm/lib/ 소재) 경로 해석이 불변이다. 로직 변경 없는 순수 리팩터링으로 init/update 간 코드 중복을 제거했다.

**caution**: copyPluginResources가 같은 모듈 안의 copyDirRecursive를 호출하고 copyDirRecursive는 재귀 자기호출을 하지만, 모듈 스코프 함수이므로 export 선언과 무관하게 정상 동작한다. TASK-01(update.mjs)·TASK-02(constants.mjs:46 주석)는 간섭 없이 진행 가능하다.

**incomplete**: None
