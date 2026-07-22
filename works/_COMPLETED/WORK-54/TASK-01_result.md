# TASK-01 Result

> WORK: WORK-54 — uctm update 갱신 범위 누락 수정
> Completed: 2026-07-22 (pending commit)
> Status: **DONE**

## 요약

uctm update가 이제 설치처의 `.claude-plugin/plugin.json`과 `skills/` 디렉터리를 갱신한다. 이전에는 init 과정에만 이들 파일을 배치하였으나, update 실행 후에도 plugin.json 버전이 정체돼 있던 문제를 해결했다. npm/lib/update.mjs에서 pruneObsolete() 호출 직전에 copyPluginResources()를 삽입하고, 복사 개수를 출력 라인에 반영했다.

## 완료 체크리스트

- [x] copyPluginResources 호출이 pruneObsolete() 바로 앞에 위치
- [x] 호출이 global/project 분기 밖의 단일 지점 (NFR-01 충족)
- [x] 설치처 `.claude-plugin/plugin.json`이 npm 패키지 소스와 일치 확인
- [x] 설치처 `skills/` 하위의 4개 SKILL.md가 npm/skills/과 일치 확인
- [x] `N plugin resource files updated` 출력 라인 포함 확인
- [x] 기존 출력 라인 4종 (agent/reference/obsolete/CLAUDE.md) 순서 유지
- [x] update 2회 연속 실행 시 출력 및 결과 동일성 확인 (NFR-02)
- [x] 설치처에 CLAUDE.md 포함되어도 update 후 미변경 확인 (NFR-01)
- [x] 소스 `.claude-plugin/`·`skills/` 부재 시 exit code 0, 예외 없음 (NFR-02)
- [x] node --check 문법 검증 통과

## 검증 결과

- Build: N/A
- Lint: N/A
- Tests: ✅ (10 acceptance criteria passed)
  - 호출 순서: copyPluginResources(43행) < pruneObsolete(44행)
  - baseDir 단일 변수 + 분기 밖 호출 ✓
  - 실행 후 plugin.json 버전 일치 ✓
  - 설치처 skills: sdd-pipeline, uctm-init, work-pipeline, work-status (4개) ✓
  - 출력 라인: 임시 설치 루트 project 모드, resCount=5 → "5 plugin resource files updated" ✓
  - 멱등성: 2회 연속 실행 후 출력 동일 ✓
  - 소스 부재 시: exit code 0, resCount=0 → 라인 미출력 ✓
  - CLAUDE.md 무변경 ✓
  - 기존 라인 순서 유지 ✓
  - node --check 통과 ✓

## 변경 파일

### Modified
- `npm/lib/update.mjs` — copyPluginResources import 추가, 호출 로직 삽입, 조건부 출력 라인 추가

## 발생 이슈

None

## 후속 TASK 참고사항

- TASK-02: constants.mjs의 주석 버전 표기 정정 (2.1.0 → 2.0.1) — 현재 작업 트리에 변경 포함되어 있으나 이 commit에 포함되지 않음. 별도로 staging되어야 함.
- TASK-03, TASK-04: 미진행 상태

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)

npm/lib/update.mjs의 import 라인에 copyPluginResources를 추가하고, update() 안에서 `const resCount = copyPluginResources(baseDir);`를 `const removed = pruneObsolete(baseDir);` 바로 앞에 넣었다. 출력부에는 reference 라인 뒤·obsolete 조건문 앞에 `if (resCount > 0)` 조건부 `N plugin resource files updated` 라인을 삽입했다. 기존 출력 라인과 순서는 그대로다.

### Verifier Context (FULL)

**What:**
TASK-01의 인수 기준 10개를 전수 검증해 모두 통과했다. update.mjs가 constants.mjs에서 copyPluginResources를 import하며 로컬 재정의가 없다. 호출 순서 확인: copyPluginResources(43행) < pruneObsolete(44행). baseDir는 isGlobal 분기 후의 단일 변수이고 호출은 분기 밖 단일 지점이라 NFR-01을 충족한다. 실제 실행 검증: 임시 설치 루트에서 resCount=5로 "5 plugin resource files updated" 출력, plugin.json version 일치 true, skills 4종(sdd-pipeline·uctm-init·work-pipeline·work-status) 복사 확인, 설치처 CLAUDE.md 무변경 true, 2회 연속 실행 멱등성 true. 소스 부재 시나리오에서 exit code 0·resCount=0으로 라인 미출력(NFR-02). 기존 출력 라인 4종(agent/reference/obsolete/CLAUDE.md)의 내용과 순서가 유지된다. node --check 통과. 범위: init.mjs 무변경, constants.mjs는 TASK-02의 주석 한 줄 변경만 존재(범위 침범 아님).

**Why:**
copyPluginResources가 baseDir(global/project 분기 후의 단일 결과 변수) 하나만 인자로 받으므로 분기 밖 단일 호출 지점이 자연스럽고, 이것이 두 설치 경로 모두를 한 번에 충족시킨다(NFR-01). resCount===0일 때 출력 라인을 생략한 설계는 소스 부재 시 잡음 없는 무오류 종료를 만들며, 가짜 패키지 루트 테스트로 예외 없음과 라인 미출력을 실증했다(NFR-02).

**Caution:**
이 TASK는 constants.mjs의 copyPluginResources에 의존한다(TASK-00 산출물, 커밋 fcb9312로 반영됨). git diff에 보이는 constants.mjs 주석 변경(2.1.0 → 2.0.1)은 병행 TASK-02 소관이며 TASK-01이 커밋할 대상이 아니다.

**Incomplete:**
None
