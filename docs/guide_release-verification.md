# 릴리스 검증 가이드

> `npm publish` 이후 레지스트리에 게시된 패키지가 실제 사용자 환경에서 올바르게 설치·갱신되는지 확인하는 절차

## 1. 목적 / 적용 시점

- 이 절차는 `npm publish` 직후, 레지스트리에 게시된 tarball 이 실제 사용자 환경에서 올바르게 설치·갱신되는지 확인하기 위한 것이다.
- 개발 저장소에서 `uctm` 명령을 실행하는 것만으로는 이 검증이 성립하지 않는다. 개발 환경에는 `npm link` 로 전역 `uctm` 이 로컬 `npm/` 폴더에 연결돼 있는 경우가 흔한데, 이 상태에서는 `uctm init` / `uctm update` 가 레지스트리 패키지가 아니라 로컬 작업 트리를 그대로 복사한다. 따라서 아래 2의 link 상태 확인을 반드시 먼저 수행한다.

## 2. 사전 확인 — `npm link` 상태 (FR-05 AC 3)

상태 확인 명령:

```bash
npm ls -g uctm
```

- 출력이 `uctm@<version> -> ...\uc-taskmanager-claude-agent\npm` 처럼 `->` 링크 형태로 나오면, 전역 `uctm` 이 로컬 폴더를 가리키는 것이므로 이 상태에서의 실행 결과는 검증으로 인정하지 않는다.
- 해제 또는 우회 방법은 다음 2가지 중 하나를 사용한다.

**방법 A — 일시 해제**

```bash
npm rm -g uctm
# 또는
npm unlink -g uctm
```

검증을 마친 뒤 개발용으로 되돌리려면 `npm/` 디렉터리에서 다시 링크한다.

```bash
npm link
```

**방법 B — 별도 환경 사용 (링크를 건드리지 않음)**

```bash
npx uctm@<version> init
```

또는 컨테이너, 다른 사용자 계정 등 전역 링크가 없는 환경을 사용한다.

## 3. 격리 환경 준비 (FR-05 AC 1)

- 저장소 작업 트리 밖에 임시 폴더를 만들고 그 안에서 검증을 수행한다. 저장소 작업 트리 안에서 하지 않는다.

```bash
mkdir /tmp/uctm-verify
cd /tmp/uctm-verify
```

- 설치 명령은 다음 중 하나를 사용한다.

```bash
npm i -g uctm@<version>
# 또는
npx uctm@<version>
```

- (선택) 게시본 내용을 실행 전에 미리 확인하려면 다음 보조 명령을 사용할 수 있다.

```bash
npm view uctm@<version> files
npm pack uctm@<version>
```

## 4. `uctm init` 검증 (FR-05 AC 2)

```bash
uctm init
```

실행 후 다음이 생성됐는지 확인한다.

- `.claude/agents/` — 6개
- `.claude/references/` — 6개
- `.claude/.claude-plugin/plugin.json`
- `.claude/skills/` — SKILL.md 4개
- `works/`

> `uctm init --global` 은 `~/.claude/` 를 변경하므로 **격리 환경에서만** 수행한다. 개발자 홈 디렉터리에서 실행하지 않는다.

## 5. `uctm update` 검증 (FR-05 AC 2)

기존 설치 상태를 만든 뒤 `uctm update` 를 실행한다. 기존 설치 상태는 구버전으로 `uctm init` 하거나, `init` 후 일부 파일을 임의로 수정하는 방식으로 만들 수 있다.

```bash
uctm update
```

확인 항목:

- agent / reference 파일이 갱신됐다.
- `.claude-plugin/plugin.json` 의 `version` 이 설치한 패키지 버전과 일치한다.
- `skills/` 가 갱신됐다.
- 더 이상 패키지에 없는 obsolete 파일이 정리(prune)된다.
- `CLAUDE.md` 는 변경되지 않는다.
- 출력에 `N plugin resource files updated` 라인이 나타난다 (WORK-54 에서 추가된 동작).

동일한 명령을 2회 연속 실행해 결과와 출력이 동일한지(멱등성) 확인한다.

```bash
uctm update
uctm update
```

## 6. 통과 판정 기준 (FR-05 AC 4)

- [ ] `npm ls -g uctm` 이 링크가 아닌 실제 버전 설치를 보여준다
- [ ] init 후 `agents/` 6개, `references/` 6개, `skills/` 4개, `.claude-plugin/plugin.json` 존재
- [ ] `.claude-plugin/plugin.json` 의 `version` 이 설치한 npm 패키지 버전과 동일
- [ ] update 후 위 4개 대상이 모두 패키지 내용과 일치
- [ ] update 출력에 `plugin resource files updated` 라인 존재
- [ ] update 2회 실행 결과·출력 동일, `CLAUDE.md` 무변경
- [ ] 검증 종료 후 개발 환경의 `npm link` 상태를 복원했다
