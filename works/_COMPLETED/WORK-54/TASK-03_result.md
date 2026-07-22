# TASK-03 Result

> WORK: WORK-54 — 릴리스 검증 절차 체계화
> Completed: 2026-07-22 00:00
> Status: **DONE**

## 요약

릴리스 검증 가이드 문서(docs/guide_release-verification.md)를 신설해 npm publish 후 레지스트리 패키지 검증 절차를 체계화했다. CLAUDE.md npm 버전업 절차의 번호 결번을 해소하고 새 가이드로 링크했다.

## 완료 체크리스트

- [x] docs/guide_release-verification.md 신설 (제목, § 1~6)
- [x] 목적/적용시점 명시 (npm publish 직후, npm link 무효화 설명)
- [x] npm link 상태 확인 명령 포함 (`npm ls -g uctm`)
- [x] npm link 해제 명령 포함 (`npm rm -g uctm`, `npm unlink -g uctm`)
- [x] npm link 우회 방법 포함 (`npx uctm@version`)
- [x] 격리 환경 준비 절차 포함 (저장소 작업 트리 외, `npm i -g uctm@version`)
- [x] uctm init 검증 내용 (agents/references/skills/plugin.json/works)
- [x] uctm update 검증 내용 (plugin.json version 일치, 출력 확인, 멱등성 2회)
- [x] 통과 판정 체크리스트 7항목 포함
- [x] CLAUDE.md npm 버전업 절차 번호 연속화 (1,3,4 → 1,2,3,4)
- [x] CLAUDE.md에 가이드 링크 추가

## 검증 결과

- Build: N/A
- Lint: N/A
- Tests: ✅ (인수 기준 11개 항목 전수 검증 통과)

## 변경 파일

### Created
- `docs/guide_release-verification.md` — npm 레지스트리 배포 후 검증 절차 가이드 (6개 섹션: 목적/npm link 관리/격리 환경/uctm init 검증/uctm update 검증/통과 체크리스트)

### Modified
- `CLAUDE.md` — npm 버전업 절차 섹션: 번호 연속화(1,3,4 → 1,2,3,4), 배포 검증 단계에 가이드 링크 추가

## 발생 이슈

None

## 후속 TASK 참고사항

실제 npm publish 시 이 문서 절차대로 최소 1회 수동 검증을 권장한다. 현재 문서는 절차 기술만 완료된 상태이고, 실제 명령 실행 검증은 배포 시점에 수행된다.

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)

docs/guide_release-verification.md를 신설했다(제목 "# 릴리스 검증 가이드", § 1~6 구성: 목적/적용시점, npm link 상태 확인·해제·우회, 격리 환경 준비, uctm init 검증, uctm update 검증·멱등성, 통과 판정 체크리스트 7항목). CLAUDE.md는 `## npm 버전업 절차` 섹션만 수정해 1.develop 동기화 2.npm version 3.npm publish 4.배포 검증(가이드 링크)으로 번호를 연속화했다(1,3,4 → 1,2,3,4).

### Verifier Context (FULL)

**what:** TASK-03의 인수 기준 11개를 전수 검증해 모두 통과했다. docs/guide_release-verification.md가 존재하며 요구된 6개 구성요소를 모두 담고 있다 — (1) 목적/적용시점(npm publish 직후 레지스트리 패키지 검증, npm link 무효화 문제 설명), (2) npm link 상태 확인 `npm ls -g uctm`(15행)·해제 `npm rm -g uctm`/`npm unlink -g uctm`(24·26행)·우회 `npx uctm@version`(38·57행), (3) 격리 환경 준비(저장소 작업 트리 밖 명시 45행, `npm i -g uctm@version` 55행), (4) uctm init 검증(agents 6·references 6·skills 4·plugin.json·works 생성 확인, 67-81행), (5) uctm update 검증(plugin.json version 일치, `plugin resource files updated` 출력, 2회 실행 멱등성, 83-105행), (6) 통과 판정 체크리스트 7항목(109-115행). CLAUDE.md는 41행에 `[docs/guide_release-verification.md](docs/guide_release-verification.md)` 링크가 있고 npm 버전업 절차 목록 번호가 1,2,3,4로 연속화됐다(기존 1,3,4 결번 해소). 범위 준수: git diff로 CLAUDE.md는 npm 버전업 절차 섹션만 변경됐고 Push 절차·레퍼런스 수정 절차·Agent 테스트 등 다른 섹션 무변경, docs/guide_agent-testing.md는 git status 무출력으로 미변경, README 계열 무변경 확인.

**why:** npm link로 인해 개발 환경 uctm이 레지스트리 패키지가 아닌 로컬 npm/을 실행해 배포 검증이 무효화됐던 문제(TODO §2)의 재발 방지가 목적이다. DECISIONS.md D-02 확정안(option b)에 따라 상시 로드되는 CLAUDE.md에 40~80행짜리 절차를 인라인하지 않고 별도 가이드로 위임했으며, 이는 기존 `## Agent 테스트` → guide_agent-testing.md 선례와 동일한 패턴이다.

**caution:** 실제 격리 환경에서 명령을 실행한 검증은 이 TASK 범위 밖이다(ASM-04) — 문서 작성만 완료된 상태이므로 향후 실제 npm publish 시 이 문서 절차대로 최소 1회 수동 검증을 권장한다. npm/lib/constants.mjs·init.mjs의 변경은 병행 TASK-00 소관으로 TASK-03 판정 범위가 아니다.

**incomplete:** None
