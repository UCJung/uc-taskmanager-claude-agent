# WORK-46: Bash 명령을 Claude 내부 툴로 전환 (shared-prompt-sections § 9, § 11)

> Created: 2026-03-31
> Requirement: works/WORK-46/Requirement.md
> Execution-Mode: direct
> Project: uc-taskmanager
> Tech Stack: Node.js (Claude Code Agent Pipeline)
> Language: ko
> Status: PLANNED

## Goal
shared-prompt-sections.md의 section 9(Locale Detection)와 section 11(Project Discovery)에 남아있는 Bash 명령(grep, head, find)을 Claude 내부 툴(Grep, Read, Glob)로 전환하여 플랫폼 이식성과 가독성을 개선한다.

## Task Dependency Graph
```
TASK-00 (edit § 9 + § 11 + sync + commit)
```

## Tasks

### TASK-00: shared-prompt-sections.md Bash→Tool 전환 + 동기화
- **Depends on**: (none)
- **Scope**: 
  - § 9: `CLAUDE.md → check "Language: xx"` → Grep 도구 지시문. powershell/locale는 Bash 유지
  - § 11: `grep -oP` → Grep, `head -50` → Read(limit), `find .` → Glob
  - develop/ → plugin/, npm/ 동기화
- **Files**:
  - `develop/references/shared-prompt-sections.md` — § 9, § 11 수정
  - `plugin/references/shared-prompt-sections.md` — 동기화
  - `npm/references/shared-prompt-sections.md` — 동기화
