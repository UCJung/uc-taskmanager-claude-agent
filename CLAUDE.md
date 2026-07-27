# CLAUDE.md — uc-taskmanager 프로젝트 지침

## Claude 실행 지침
- 임의로 판단하여 작업을 실행하지 않는다.
- 임의로 판단하여 작업 범위을 결정하지 않는다.
- 별도의 요청이 없는 한 실행 시 승인을 요청한다.
- 요구사항 구조화 지시사항을 파악하고 결정이 필요한 부분은 내용을 제시하고 대화형으로 진행한다.

## Push 절차

사용자가 "push"를 요청하면 다음 순서로 실행한다:

1. **develop/ 동기화** — develop/ 원본을 plugin/, npm/으로 복사
   - develop/agents/*.md → plugin/agents/*.md, npm/agents/*.md
   - develop/references/*.md → plugin/references/*.md, npm/references/*.md
   - develop/hooks/*.sh → plugin/hooks/*.sh
   - develop/skills/*/SKILL.md → plugin/skills/*/SKILL.md, npm/skills/*/SKILL.md
   - develop/.claude-plugin/plugin.json → plugin/.claude-plugin/, npm/.claude-plugin/
2. **DONE WORK 일괄 완료 처리** — WORK-LIST.md에서 DONE 상태인 WORK를 찾아 COMPLETED로 전환한다
   - WORK-LIST.md에서 `DONE` 상태인 행을 모두 찾아 제거
   - 해당 WORK 폴더(`works/WORK-NN/`)를 `works/_COMPLETED/`로 이동
   - 변경사항 스테이징 (`git add`)
3. **README.md 업데이트** — 이번 작업에서 추가/변경된 내용이 README에 반영되어 있는지 확인하고, 누락된 내용이 있으면 업데이트한다
4. **npm README 동기화** — `README.md` → `npm/README.md` 복사 (영문 README만, 한국어 제외)
5. **git push**

README 업데이트 범위:
- 새로운 에이전트 또는 기능이 추가된 경우 해당 섹션 반영
- 파일 구조가 변경된 경우 Repository Structure 섹션 반영
- 동작 방식이 변경된 경우 Pipeline 또는 Why This Approach 섹션 반영
- 변경 없으면 업데이트 생략

## npm 버전업 절차

사용자가 npm 버전업을 요청하면 다음을 추가로 수행한다:

1. develop/ 동기화 (Push 절차 1단계와 동일)
2. `npm version patch|minor|major` 실행
3. `npm publish`
4. 배포 검증 — 격리 환경에서 `uctm init` / `uctm update` 확인
   → [docs/guide_release-verification.md](docs/guide_release-verification.md)

## 레퍼런스 수정 절차 (ref-cache 연동 — 필수)

`develop/references/*.md`를 수정하면 **ref-cache 배분이 함께 깨진다.** 레퍼런스는 orchestrator가 1회 읽고 각 파일 상단의 **섹션 소비 매트릭스**를 기준으로 잘라 자식에게 전달하기 때문이다(→ `develop/references/xml-schema.md` § 4). 아래 절차를 반드시 함께 수행한다.

### 1. 섹션 번호 규칙

- **기존 § 번호를 재번호하거나 재사용하지 않는다.** 문서 전반에 § 상호참조가 40건 이상 걸려 있어 전부 깨진다.
- 섹션을 삭제하면 그 번호는 **결번으로 남긴다** (예: `shared-prompt-sections.md`의 § 10·§ 11).
- 새 섹션은 **맨 끝 번호 다음**으로 부여한다.

### 2. 매트릭스 갱신

| 변경 유형 | 수행할 것 |
|-----------|----------|
| 섹션 **추가** | 해당 파일 상단 매트릭스에 행 추가 + 어느 에이전트가 쓸지 ✅ 표기 |
| 섹션 **삭제** | 매트릭스 행 삭제 + 그 섹션을 가리키던 상호참조 전부 정리 |
| 섹션 **내용 변경** | 다른 § 를 새로 가리키게 됐으면, 그 § 도 같은 에이전트에게 배분돼 있는지 확인(전이적 참조) |
| 에이전트가 새 섹션을 **필요로 하게 됨** | 매트릭스 ✅ 추가 + **`orchestrator.md` 갱신**(아래 3) |

### 3. orchestrator.md 동기화 (중복 기재 지점)

자식별 섹션 목록이 `orchestrator.md`에 **2곳 중복 기재**되어 있다. 매트릭스를 바꾸면 반드시 함께 고친다.

- **STEP 1-1** 의 "자식별 조립 결과 요약" 표 (4행)
- **STEP A / STEP B / STEP C** 의 각 spawn 지시 라인 (specifier·planner·builder·verifier 4곳)

### 4. 자식 에이전트 정의

자식(`specifier`/`planner`/`builder`/`verifier`)의 STARTUP은 **`<ref-cache>`를 참조하여 작업을 수행한다** 한 줄뿐이다. 필요 섹션 목록을 자식 정의에 다시 적지 않는다 — 정본은 매트릭스 하나다.

**자식 정의 본문에 `xxx.md § N` 참조를 새로 넣으면**, 그 § 가 매트릭스에서 해당 자식에게 배분돼 있어야 한다. 배분 없이 참조만 넣으면 자식이 볼 수 없는 내용을 가리키게 된다.

### 5. 검증 (수정 후 필수)

```bash
# ① 매트릭스에 적힌 섹션이 실제로 존재하는가
grep -n "^## §" develop/references/*.md

# ② § 상호참조가 깨지지 않았는가 / 자식 본문 참조가 배분됐는가 / 전이적 누락이 없는가
#    → 아래 3가지를 확인한다
#    - 모든 "xxx.md § N" 참조의 대상 섹션이 존재
#    - 자식 정의가 참조하는 § 가 매트릭스에서 그 자식에게 ✅
#    - 자식이 받는 섹션의 본문이 가리키는 § 도 그 자식에게 ✅ (전이적)
```

> 전이적 누락 예: `xml-schema.md` § 6 본문이 `file-content-schema.md` § 4를 가리키는데 § 4는 orchestrator에게만 배분된 경우 → 참조를 없애거나 배분을 추가한다.

## Agent 테스트

Agent/Skill/Hook 변경 시 파이프라인 동작 검증 방법: [docs/guide_agent-testing.md](docs/guide_agent-testing.md)

## 진행 중 리펙토링

Agent/Skill/Hook 분리 리펙토링 진행 중: [TODO/todo_refactoring_seperate_agent_skill_hook.md](TODO/todo_refactoring_seperate_agent_skill_hook.md)
- § 5.1: 완료된 변경 (develop/ 구조 개편, en/ko 통합, hook 구현, 테스트)
- § 5.2: 남은 변경 대상 (REFERENCES_DIR 경로, Agent description 정비, plugin/npm 동기화)
- 이전 세션의 작업을 이어서 진행할 것

## Language

ko
CommitLanguage: en