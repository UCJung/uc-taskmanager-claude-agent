# TASK-01: README.md 잔여 구조·경로 오류 정정

## WORK
WORK-53: WORK-52 반영 README 3종 현행화

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | `README.md`가 WORK-52 이후 저장소의 실제 파일 구성(레퍼런스 8종, plugin/npm 디렉터리, npm 설치기 산출물)과 일치하게 되어, 이후 `npm/README.md`·`README_KO.md`가 파생될 **확정본**이 된다 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, FR-04, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

`README.md`의 본문 서술(WORK-52 TASK-07 결과물)은 이미 orchestrator 중심으로 정확하다(ASM-01, `scheduler` 언급 0건). 이 TASK는 그 위에 남아 있는 **구조·경로 기술 오류만** 보정한다. 배지·License·Serena MCP·Output Language 등 WORK-52와 무관한 섹션은 손대지 않는다(CON-04 / AC-07).

수정 대상은 4개 지점이다.

### (A) "Support Files (included in Plugin)" 섹션 — FR-01 (현재 L499~511 부근)

- `"the plugin includes 6 support files"` → **8**로 정정
- 경로 `plugin/skills/sdd-pipeline/references/` → **`plugin/references/`** (해당 디렉터리는 실존하지 않음). npm 설치 시에는 `.claude/references/`에 설치된다는 점을 함께 표기할 것
- 표를 **8행**으로 확장(파일명 알파벳 순 권장). 추가 2건의 실제 내용 근거:
  - `callback-protocol.md` — 외부 시스템 콜백 프로토콜. orchestrator가 STAGE 단위 START/DONE/FAILED 이벤트를 **일괄 발신**하며, `CLAUDE.md`에 콜백 URL이 없으면 전 콜백을 생략한다
  - `ref-cache-protocol.md` — ref-cache 프로토콜(4단계). dispatch XML의 `<ref-cache>`를 확인해 캐시된 레퍼런스가 있으면 디스크 읽기를 건너뛴다
- 기존 6행(agent-flow / file-content-schema / shared-prompt-sections / context-policy / work-activity-log / xml-schema)의 설명 문구는 유지

### (B) 본문 레퍼런스 경로 표기 — FR-03

- L892 부근: ``See `agents/xml-schema.md` ... and `agents/shared-prompt-sections.md` ...`` → `references/xml-schema.md`, `references/shared-prompt-sections.md`
- L878 부근 예시 XML의 `path="agents/shared-prompt-sections.md"` → `path="references/shared-prompt-sections.md"` (동일 파일이 현재 `references/`에 위치하므로 일관성 정정)
- "ref-cache: Reference File Caching" 섹션(L685~697 부근): 프로토콜 정의 문서가 `references/ref-cache-protocol.md`임을 명시(현재는 `agent-flow.md`만 언급). 에이전트별 섹션 매핑이 `agent-flow.md`에 있다는 기존 서술은 유지 가능

### (C) Manual 설치 절차 — FR-04 (현재 L337~345 부근)

커밋 `756cb3e`로 정합화된 `npm/lib/constants.mjs`는 **에이전트 6종 + 레퍼런스 8종**을 설치한다(`npm/lib/init.mjs`: 에이전트 → `.claude/agents/`, 레퍼런스 → `.claude/references/`). Manual 절차도 동일 산출물을 만들도록 `npm/references/*.md` 복사 단계를 추가한다. 예:

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git /tmp/uc-tm
mkdir -p .claude/agents .claude/references
cp /tmp/uc-tm/npm/agents/*.md .claude/agents/          # 6 agents (orchestrator, specifier, planner, builder, verifier, committer)
cp /tmp/uc-tm/npm/references/*.md .claude/references/   # 8 reference files
rm -rf /tmp/uc-tm
git add .claude/agents/ .claude/references/ && git commit -m "chore: add uc-taskmanager agents"
```

- 복사 대상 에이전트 목록에 `scheduler.md`가 없고 `orchestrator.md`가 포함되어야 한다

### (D) "Repository Structure" 트리 — FR-02 (현재 L1021~1087 부근)

실측 구조에 맞춘다.

| 구분 | 조치 |
|------|------|
| `develop/references/` | "6 support files" → **8**, 하위 8개 파일 나열(agent-flow / callback-protocol / context-policy / file-content-schema / ref-cache-protocol / shared-prompt-sections / work-activity-log / xml-schema) |
| `develop/hooks/` | **제거** (미존재, ASM-03) |
| `develop/skills/` | 유지 (sdd-pipeline / uctm-init / work-pipeline / work-status) |
| `develop/.claude-plugin/plugin.json` | **추가** (실존, plugin.json 원본) |
| `npm/agents/` | 설명 `Synced from develop/agents/ + develop/references/` → `Synced from develop/agents/` 로 정정 |
| `npm/references/` | **추가** (8개, develop/references/ 동기화) |
| `npm/skills/` | **추가** (4개 SKILL.md, develop/skills/ 동기화) |
| `npm/.claude-plugin/` | **추가** (plugin.json) |
| `npm/README.md` | **추가** (README.md 동기화 사본, npmjs.com 노출) |
| `plugin/skills/sdd-pipeline/references/` | **제거** (미존재) |
| `plugin/skills/init/` | → **`uctm-init/`** 로 정정 (`/uctm-init` 스킬) |
| `plugin/README.md` | **제거** (미존재) |
| 기타 | `docs/`, `works/`, `.claude/`, 루트 파일 기술은 실존 확인됨 — 변경 불필요 |

## Files

| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | (A) Support Files 섹션 8건화 + 경로 정정, (B) 본문 레퍼런스 경로 표기, (C) Manual 설치 절차, (D) Repository Structure 트리 정정 |

## Acceptance Criteria

- [x] "Support Files" 섹션이 8개 파일을 기술하고 표가 8행이며, `callback-protocol.md`·`ref-cache-protocol.md`가 포함된다 (FR-01 / AC-03)
- [x] `plugin/skills/sdd-pipeline/references/` 문자열이 문서에서 사라지고 `plugin/references/`로 대체된다 (FR-01)
- [x] Repository Structure 트리에 `develop/hooks/`, `plugin/README.md`, `plugin/skills/init/`이 없다 (FR-02)
- [x] 트리에 `develop/.claude-plugin/plugin.json`, `npm/references/`, `npm/skills/`, `npm/README.md`가 포함된다 (FR-02)
- [x] 트리에 기재된 모든 저장소 내부 경로가 실제로 존재한다 (FR-02 / NFR-01 / AC-04)
- [x] 본문의 `agents/xml-schema.md`·`agents/shared-prompt-sections.md` 표기가 `references/...`로 정정된다 (FR-03)
- [x] Manual 설치 절차에 `npm/references/*.md` 복사 단계가 있고 에이전트 6종 기준과 일치한다 (FR-04)
- [x] `scheduler` 언급이 0건으로 유지된다 (AC-01)
- [x] 배지, `## License`, Serena MCP, `## Output Language` 등 기존 섹션이 삭제되지 않았다 (CON-04 / AC-07)

## Verify

```bash
# AC-01 — scheduler 0건 (매치 없으면 "0" 출력 + exit 1: 정상)
grep -c "scheduler" README.md

# FR-01 — Support Files 섹션
grep -n "8 support files" README.md
grep -n "callback-protocol.md" README.md
grep -n "ref-cache-protocol.md" README.md
grep -n "skills/sdd-pipeline/references" README.md   # 무매치여야 함

# FR-03 — 레퍼런스 경로 표기
grep -n "agents/xml-schema.md" README.md             # 무매치여야 함
grep -n "agents/shared-prompt-sections.md" README.md # 무매치여야 함
grep -n "references/xml-schema.md" README.md

# FR-04 — Manual 설치 절차
grep -n "npm/references" README.md

# FR-02 / NFR-01 — 트리 기재 경로가 실제로 존재 (전부 성공해야 함)
ls -d develop/agents develop/references develop/skills develop/.claude-plugin
ls -d npm/agents npm/bin npm/lib npm/references npm/skills npm/.agent npm/.claude-plugin
ls -d plugin/agents plugin/references plugin/.claude-plugin
ls -d plugin/skills/sdd-pipeline plugin/skills/uctm-init plugin/skills/work-pipeline plugin/skills/work-status
ls npm/README.md develop/.claude-plugin/plugin.json plugin/.claude-plugin/plugin.json

# FR-02 — 존재하면 안 되는 경로 (세 명령 모두 "No such file or directory" 여야 함)
ls -d develop/hooks
ls plugin/README.md
ls -d plugin/skills/init

# 실제 레퍼런스 8개 대조
ls -1 develop/references

# CON-04 / AC-07 — 보존 확인 (각각 매치되어야 함)
grep -n "^## License" README.md
grep -n "^## Output Language" README.md
grep -n "Serena MCP" README.md
grep -n "img.shields.io" README.md
```
