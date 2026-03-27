---
name: uctm-init
description: Initialize uc-taskmanager for the current project. Creates works/ directory, updates CLAUDE.md with agent invocation rules, and configures Bash permissions in .claude/settings.local.json. Use when the user says "uctm init", "initialize uctm", "uctm 초기화", or "초기화".
---

# uc-taskmanager Init

Initialize the current project for uc-taskmanager pipeline execution.

## Steps

### 1. Create works/ directory

```
if works/ does not exist:
  create works/
  report: ✓ works/ directory created
else:
  report: - works/ already exists
```

### 2. Update CLAUDE.md

Detect language from `$ARGUMENTS` (look for "ko", "한국어") — default: en.

If CLAUDE.md does NOT already contain "Agent 호출 규칙" or "Agent Invocation Rules" or "agent-flow.md", **append** the appropriate section below.

**English section:**
```markdown
## Agent Invocation Rules

Requests starting with a `[]` tag → read `.claude/agents/agent-flow.md` and execute the pipeline.

- **Main Claude is the orchestrator.** All agent invocations are performed directly by Main Claude.
- On `[]` tag detection → invoke specifier (first agent)
- Each agent only returns results (dispatch XML or task-result XML) after completing its work.
- Main Claude receives return values and invokes the next agent in sequence.
- Pipeline flow follows `.claude/agents/agent-flow.md`.

Examples: `[new-feature]`, `[bugfix]`, `[enhancement]`, `[new-work]`, etc.
```

**Korean section (한국어):**
```markdown
## Agent 호출 규칙

`[]` 태그로 시작하는 요청 → `.claude/agents/agent-flow.md` 를 읽고 파이프라인을 실행한다.

- **Main Claude가 오케스트레이터**다. 모든 에이전트 호출은 Main Claude가 직접 수행한다.
- `[]` 태그 감지 시 → specifier 호출 (첫 번째 에이전트)
- 각 에이전트는 작업 완료 후 결과(dispatch XML 또는 task-result XML)만 반환한다.
- Main Claude가 반환값을 받아 다음 에이전트를 순서대로 호출한다.
- 파이프라인 흐름은 `.claude/agents/agent-flow.md` 기준을 따른다.

예: `[추가기능]`, `[버그수정]`, `[리팩토링]`, `[WORK 시작]` 등
```

```
if section appended:
  report: ✓ CLAUDE.md updated
else:
  report: - CLAUDE.md already has agent rules
```

### 3. Configure Bash Permissions

**Ask the user first:** "에이전트에 필요한 Bash 권한을 .claude/settings.local.json에 자동 설정할까요? (recommended) [Y/n]"

If the user approves (or says yes/Y/확인):

Read `.claude/settings.local.json` (create if not exists). Merge the following permissions into `permissions.allow` array — **skip any that already exist** (do not duplicate):

```json
[
  "Read(/**)",
  "Edit(/**)",
  "Write(/**)",
  "Read(**)",
  "Edit(**)",
  "Write(**)",
  "Bash(ls:*)",
  "Bash(cat:*)",
  "Bash(mkdir:*)",
  "Bash(basename:*)",
  "Bash(find:*)",
  "Bash(wc:*)",
  "Bash(sort:*)",
  "Bash(tail:*)",
  "Bash(head:*)",
  "Bash(echo:*)",
  "Bash(printf:*)",
  "Bash(grep:*)",
  "Bash(sed:*)",
  "Bash(cut:*)",
  "Bash(tr:*)",
  "Bash(node:*)",
  "Bash(npm run:*)",
  "Bash(npm test:*)",
  "Bash(bun run:*)",
  "Bash(yarn:*)",
  "Bash(cargo:*)",
  "Bash(go build:*)",
  "Bash(go test:*)",
  "Bash(python:*)",
  "Bash(ruff:*)",
  "Bash(make:*)",
  "Bash(git add:*)",
  "Bash(git commit:*)",
  "Bash(git log:*)",
  "Bash(git rev-parse:*)",
  "Bash(curl:*)"
]
```

Preserve any existing entries in `permissions.allow` and `permissions.deny` — only add missing ones.

```
if permissions added:
  report: ✓ {N} permissions added to .claude/settings.local.json (total: {T})
else if skipped by user:
  report: - Skipped permission setup
else:
  report: - All permissions already configured
```

### 4. Summary

After all steps, show a summary:

```
uc-taskmanager initialized!

  ✓ works/ directory ready
  ✓ CLAUDE.md agent rules configured
  ✓ 30 Bash permissions configured

  Next: Type [new-feature] Add a hello world feature
```

## Arguments

$ARGUMENTS
