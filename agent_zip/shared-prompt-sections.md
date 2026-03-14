# Shared Prompt Sections for uc-taskmanager Agents

This document defines common, reusable prompt sections that appear across multiple agent definitions. These sections should be marked with Anthropic API's `cache_control` mechanism to optimize token usage in repeated invocations.

## Overview

- **Purpose**: Reduce duplicate content and enable Prompt Caching for up to 90% token savings on repeated sections
- **Usage**: Agent definitions reference these sections with cache_control markers
- **Format**: Each section includes example usage of JSON cache_control blocks

---

## 1. Output Language Rule

**Applies to**: planner, scheduler, builder, verifier, committer (5 agents)

**Description**: Standardized language resolution priority when processing tasks and outputting results.

**Content**:

```
## Output Language Rule

The agent respects the following language priority hierarchy when generating output and status messages:

1. **PLAN.md directive** (highest priority): If the task's PLAN.md file contains `> Language: {code}`, use that language for output
2. **CLAUDE.md directive**: If the project's CLAUDE.md contains `## Language: {code}`, use that language
3. **Default**: Use English (`en`) if neither is specified

Example PLAN.md header:
```markdown
> Language: ko
```

Example CLAUDE.md header:
```markdown
## Language
Korean (ko)
```

**When dispatching to other agents**: Always pass the resolved language code via the `<context><language>` XML field.
- **결과 파일의 섹션 헤더(##)도 resolved language로 작성한다.**
  각 에이전트 파일의 언어별 섹션 헤더 매핑 테이블(ko/en/ja)을 참조하여 resolved language에 맞는 헤더를 사용할 것.
```

**Cache Control Marker**:

```json
{
  "type": "text",
  "text": "[content of Output Language Rule section]",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

---

## 2. Build and Lint Commands

**Applies to**: builder, verifier (2 agents)

**Description**: 프로젝트 타입을 자동 감지하여 실행하는 표준 빌드/린트 명령어.

**Content**:

```
## Build and Lint Commands

### 자동 감지 빌드 (Auto-detect Build)
```bash
if [ -f "package.json" ]; then
  npm run build 2>&1 || bun run build 2>&1 || yarn build 2>&1
elif [ -f "Cargo.toml" ]; then
  cargo build 2>&1
elif [ -f "go.mod" ]; then
  go build ./... 2>&1
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  python -m py_compile $(find . -name "*.py" -not -path "*/venv/*" | head -20) 2>&1
elif [ -f "Makefile" ]; then
  make build 2>&1 || make 2>&1
fi
```

### 자동 감지 린트 (Auto-detect Lint)
```bash
if [ -f "package.json" ]; then
  npm run lint 2>&1 || bun run lint 2>&1 || true
elif [ -f "pyproject.toml" ]; then
  ruff check . 2>&1 || python -m flake8 . 2>&1 || true
fi
```

빌드 또는 린트 실패 시 보고 전에 반드시 수정한다.
```

**Cache Control Marker**:

```json
{
  "type": "text",
  "text": "[content of Build and Lint Commands section]",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

---

## 3. WORK and TASK File Path Patterns

**Applies to**: All 6 agents (router, planner, scheduler, builder, verifier, committer)

**Description**: Standardized file path conventions for WORK and TASK management.

**Content**:

```
## WORK and TASK File Path Patterns

All file paths follow these conventions:

### Directory Structure
```
works/{WORK_ID}/
  ├─ PLAN.md                          # WORK plan with task definitions
  ├─ PROGRESS.md                      # Progress tracking
  ├─ TASK-00.md                       # Task 00 specification (WORK prefix 없음)
  ├─ TASK-00_progress.md              # Task 00 progress (구분자: 언더스코어)
  ├─ TASK-00_result.md                # Task 00 result (구분자: 언더스코어)
  ├─ TASK-01.md
  ├─ TASK-01_progress.md
  ├─ TASK-01_result.md
  └─ ... (more tasks)
```

### File Naming Rules
- WORK ID format: `WORK-{2-digit number}` (e.g., `WORK-03`)
- TASK ID format: `TASK-{2-digit number}` (e.g., `TASK-00`) — **WORK prefix 포함 금지**
- Task spec file: `TASK-{2-digit number}.md` (프리픽스 없음)
- Progress file: `TASK-{2-digit number}_progress.md` (구분자: 언더스코어)
- Result file: `TASK-{2-digit number}_result.md` (구분자: 언더스코어)

### Path Resolution in Agents
When agents need to reference files:
- Absolute paths: `/c/rnd/agent/uc-taskmanager/works/{WORK_ID}/{file}`
- Relative patterns: `works/{WORK_ID}/{file}`
```

**Cache Control Marker**:

```json
{
  "type": "text",
  "text": "[content of WORK and TASK File Path Patterns section]",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

---

## 4. File System Discovery Scripts

**Applies to**: planner, scheduler, router (3 agents)

**Description**: Common bash patterns for discovering WORK directories and task files.

**Content**:

```
## File System Discovery Scripts

### Find Latest WORK with Remaining Tasks
```bash
for dir in $(ls -d works/WORK-* 2>/dev/null | sort -V -r); do
  WORK_ID=$(basename $dir)
  TOTAL=$(ls $dir/$TASK-*.md 2>/dev/null | grep -v result | wc -l)
  DONE=$(ls $dir/$TASK-*_result.md 2>/dev/null | wc -l)
  if [ "$DONE" -lt "$TOTAL" ]; then
    echo "$WORK_ID"
    break
  fi
done
```

### List All WORK Units
```bash
ls -d works/WORK-* 2>/dev/null | sort -V
```

### Count TASK Completion Status
```bash
WORK_ID="WORK-03"
TOTAL=$(ls works/${WORK_ID}/$TASK-*.md 2>/dev/null | grep -v result | wc -l)
DONE=$(ls works/${WORK_ID}/$TASK-*_result.md 2>/dev/null | wc -l)
echo "$DONE / $TOTAL"
```
```

**Cache Control Marker**:

```json
{
  "type": "text",
  "text": "[content of File System Discovery Scripts section]",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

---

## 5. Task Result XML Format

**Applies to**: builder, verifier, committer (3 agents)

**Description**: Common XML structure returned by agents for task result reporting.

**Content**:

```
## Task Result XML Format

All receiver agents (builder, verifier, committer) return results in the following structured XML format:

### Basic Structure
```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent_name}" status="{PASS|FAIL}">
  <summary>{1-2 line summary}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{description}</file>
  </files-changed>
  <verification>
    <check name="{check_type}" status="{PASS|FAIL|N/A}">{output or details}</check>
  </verification>
  <notes>{any relevant notes for next phase}</notes>
</task-result>
```

### Example from Builder
```xml
<task-result work="WORK-03" task="TASK-00" agent="builder" status="PASS">
  <summary>Created shared-prompt-sections.md and xml-schema.md with full documentation</summary>
  <files-changed>
    <file action="created" path="agents/shared-prompt-sections.md">Common reusable sections with cache_control markers</file>
    <file action="created" path="agents/xml-schema.md">XML communication schema for all agents</file>
  </files-changed>
  <verification>
    <check name="file_existence" status="PASS">Both files created successfully</check>
    <check name="cache_control_markers" status="PASS">5+ cache_control references found</check>
    <check name="xml_schema_completeness" status="PASS">dispatch, task-input, task-result all defined</check>
  </verification>
  <notes>Ready for verifier to validate schema consistency</notes>
</task-result>
```
```

**Cache Control Marker**:

```json
{
  "type": "text",
  "text": "[content of Task Result XML Format section]",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

---

## Version

- **Created**: 2026-03-10
- **Purpose**: WORK-03 — Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감
- **Referenced by**: scheduler.md, router.md, builder.md, verifier.md, committer.md, planner.md
- **Updated**: 2026-03-15 — Added § 7 PLAN.md Required Meta Fields, § 8 WORK-LIST.md Management Rules
