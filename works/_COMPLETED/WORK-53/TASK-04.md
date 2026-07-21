# TASK-04: 3종 문서 통합 정합성 검증 및 재동기화

## WORK
WORK-53: WORK-52 반영 README 3종 현행화

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | `README.md` · `npm/README.md` · `README_KO.md` 3종이 상호 정합하고 저장소 실제 상태와 일치함을 인수 기준(AC-01~AC-07) 전수로 확인하여 WORK-53을 종결 가능한 상태로 만든다 |
| 매핑 요구사항 | NFR-01, NFR-02 (AC-01 ~ AC-07 전수) |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | TASK-02, TASK-03 완료 후 |
| Phase | Phase 3 |

## Scope

정적 점검만 수행한다(CON-03 — 빌드/린트/테스트 대상 아님). 아래 순서로 진행한다.

1. **AC 전수 점검** — Verify 블록의 명령을 순서대로 실행하고 결과를 기록한다.
2. **드리프트 보정 (조건부)** — TASK-03 진행 중 `README.md`가 변경되어 `diff README.md npm/README.md`에 차이가 생겼다면, `cp README.md npm/README.md`로 **재동기화**한 뒤 diff 무출력을 재확인한다(R-01 대응).
3. **헤더 1:1 대응 확인** — `README.md`와 `README_KO.md`의 `##` 헤더 목록을 나란히 출력해 순서·개수가 대응하는지 육안 대조한다. 불일치 시 누락/추가된 섹션을 `README_KO.md` 쪽에서 보정한다(영문 문서는 건드리지 않는다).
4. **잔여 이슈 보고** — 자체 보정으로 해소할 수 없는 항목(예: 요구사항 범위를 벗어나는 서술 오류)은 수정하지 말고 결과 보고의 `## 후속 TASK 참고사항`에 기록한다.

### 금지 사항

- Out-of-Scope 파일 수정 금지: `AGENTS.md`, `npm/bin/cli.mjs`, `docs/` 하위 문서, 루트 잔여 파일(`work_WORK-25.log`, `_TODO/`), `develop/`·`plugin/`·`npm/`의 에이전트·레퍼런스·스킬 원본
- 문서 내용의 임의 재구성 금지 — 이 TASK의 편집 권한은 (2)(3)의 보정 범위로 한정

## Files

| Path | Action | Description |
|------|--------|-------------|
| `npm/README.md` | MODIFY (조건부) | `README.md` 드리프트 발생 시에만 재동기화 |
| `README_KO.md` | MODIFY (조건부) | 헤더 1:1 대응 불일치 발견 시에만 보정 |

## Acceptance Criteria

- [x] AC-01: `README.md`, `npm/README.md`, `README_KO.md` 모두 `scheduler` 언급 0건
- [x] AC-02: `diff README.md npm/README.md` 출력 없음
- [x] AC-03: `README.md` / `README_KO.md`의 참조 문서 표가 `develop/references/`의 실제 8개 파일과 일치
- [x] AC-04: 3종 문서에 기재된 저장소 내부 경로가 모두 실제로 존재하고, 폐기 경로(`develop/hooks`, `plugin/README.md`, `plugin/skills/init`, `plugin/skills/sdd-pipeline/references`)는 어느 문서에도 남아 있지 않음
- [x] AC-05: `README_KO.md`의 `##` 헤더 목록이 `README.md`와 1:1 대응
- [x] AC-06: 3종 모두 6개 에이전트가 orchestrator / specifier / planner / builder / verifier / committer로 기재됨
- [x] AC-07: 배지, License, Serena MCP, 산출물 언어(Output Language) 등 기존 섹션이 3종 모두에 보존됨
- [x] Out-of-Scope 파일이 변경되지 않음 (본 builder 작업으로 인한 변경 없음; 세션 시작 전부터 존재하던 npm/bin/cli.mjs·AGENTS.md 변경 및 병렬 프로세스로 추정되는 work_WORK-53.log 변경은 무관)

## Verify

```bash
# AC-01
grep -c "scheduler" README.md
grep -c "scheduler" npm/README.md
grep -c "scheduler" README_KO.md

# AC-02 (출력이 비어 있어야 함 — 차이 발생 시 cp README.md npm/README.md 후 재실행)
diff README.md npm/README.md

# AC-03 — 실제 레퍼런스 8종과 문서 표 대조
ls -1 develop/references
grep -n "callback-protocol.md" README.md
grep -n "ref-cache-protocol.md" README.md
grep -n "callback-protocol.md" README_KO.md
grep -n "ref-cache-protocol.md" README_KO.md
grep -n "8 support files" README.md

# AC-04 — 존재해야 하는 경로 (전부 성공)
ls -d develop develop/agents develop/references develop/skills develop/.claude-plugin
ls -d npm npm/agents npm/bin npm/lib npm/references npm/skills npm/.agent npm/.claude-plugin
ls -d plugin plugin/agents plugin/references plugin/.claude-plugin
ls -d plugin/skills/sdd-pipeline plugin/skills/uctm-init plugin/skills/work-pipeline plugin/skills/work-status
ls -d docs docs/_archive works .claude
ls README.md README_KO.md CLAUDE.md LICENSE npm/README.md
ls docs/spec_pipeline-architecture_v1.3.md docs/spec_sliding-window-context.md docs/spec_callback-integration.md docs/spec_SDD_with_ucagent_requirement.md
ls docs/pipeline-architecture-v1.3-visual.html docs/SDD-requirement-visual.html docs/callback-integration-visual.html docs/sliding-window-context-visual.html

# AC-04 — 존재하면 안 되는 경로 (모두 No such file)
ls -d develop/hooks
ls plugin/README.md
ls -d plugin/skills/init

# AC-04 — 폐기 경로 문자열이 문서에 없어야 함 (무매치)
grep -n "skills/sdd-pipeline/references" README.md
grep -n "skills/sdd-pipeline/references" README_KO.md
grep -n "skills/sdd-pipeline/references" npm/README.md

# AC-05 — 헤더 목록 대조 (개수 일치 + 순서 육안 확인)
grep -c "^## " README.md
grep -c "^## " README_KO.md
grep -n "^## " README.md
grep -n "^## " README_KO.md

# AC-06 — 6개 에이전트
grep -n "orchestrator, specifier, planner, builder, verifier, committer" README.md
grep -n "orchestrator, specifier, planner, builder, verifier, committer" npm/README.md
grep -n "orchestrator, specifier, planner, builder, verifier, committer" README_KO.md

# AC-07 — 보존 확인
grep -n "img.shields.io" README.md
grep -n "img.shields.io" README_KO.md
grep -n "^## License" README.md
grep -n "Serena MCP" README_KO.md

# Out-of-Scope 무변경 확인 (README 3종 외 변경이 없어야 함)
git status --short
```
