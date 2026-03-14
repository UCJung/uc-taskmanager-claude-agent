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

**Description**: Standard self-check and verification commands used across the codebase.

**Content**:

```
## Build and Lint Commands

The agents use the following standard commands for validation:

### Build Command
```bash
cd /c/rnd/agent/uc-taskmanager
npm run build 2>&1 || true
```

### Lint Command
```bash
cd /c/rnd/agent/uc-taskmanager
npm run lint 2>&1 || true
```

### Test Command (if applicable)
```bash
cd /c/rnd/agent/uc-taskmanager
npm test 2>&1 || true
```

These commands must be executed by the agent to validate implementation quality before advancing to the next phase.
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
  ├─ {WORK_ID}-TASK-00.md            # Task 00 specification
  ├─ {WORK_ID}-TASK-00-result.md     # Task 00 result (after completion)
  ├─ {WORK_ID}-TASK-01.md
  ├─ {WORK_ID}-TASK-01-result.md
  └─ ... (more tasks)
```

### File Naming Rules
- WORK ID format: `WORK-{2-digit number}` (e.g., `WORK-03`)
- TASK ID format: `TASK-{2-digit number}` (e.g., `TASK-00`)
- Result file: `TASK-{2-digit number}-result.md`

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

## Implementation Guide for Agent Authors

When incorporating these shared sections into an agent definition (e.g., `agents/scheduler.md`):

### Approach 1: Direct Inclusion with Cache Marking
Include the full section content inline, with a comment marking it as cacheable:

```markdown
## Output Language Rule
<!-- CACHE_CONTROL_START: ephemeral -->
[full Output Language Rule content]
<!-- CACHE_CONTROL_END -->
```

### Approach 2: Reference Link
Reference this document and describe how to apply cache_control in API calls:

```markdown
## Output Language Rule

See `agents/shared-prompt-sections.md` → Section 1 for the full Output Language Rule.

When dispatching to this agent via API, wrap this section with:
```json
{
  "type": "text",
  "text": "[Output Language Rule content from shared-prompt-sections.md]",
  "cache_control": {"type": "ephemeral"}
}
```
```

---

## Token Savings Summary

By marking common sections with `cache_control`, agents achieve:

- **Prompt Cache Hit**: First request caches ~2-4KB of common text at full rate
- **Subsequent Requests**: Same sections cost 90% less via cache (effective rate: ~0.01 tokens per cache hit vs 0.03 for normal tokens)
- **Estimated Savings**: ~200-500 tokens per WORK execution with 5+ TASKs
- **Over 100 WORK executions**: ~20,000-50,000 tokens saved monthly

---

---

## 6. Task Callbacks (External System Integration)

**Applies to**: builder, committer (2 agents)

**Description**: Optional HTTP callback mechanism for external system integration. Allows the uc-taskmanager pipeline to notify external systems (e.g., uc-teamspace) about task progress and completion.

**Content**:

```
## Task Callbacks

The agents support optional HTTP callbacks to external systems for real-time progress and result reporting. This feature is **opt-in** — if callback URLs are not configured, the agents operate in standalone mode without any external notifications.

### Configuration (CLAUDE.md)

Add these optional fields to your project's CLAUDE.md:

```markdown
## Task Callbacks

TaskCallback: http://your-system.com/api/v1/task-result
ProgressCallback: http://your-system.com/api/v1/task-progress
CallbackToken: <bearer-token>
```

**Fields**:
- `TaskCallback`: Endpoint URL for final task result (invoked by committer after git commit)
- `ProgressCallback`: Endpoint URL for progress updates (invoked by builder at checkpoints)
- `CallbackToken`: Bearer token for Authorization header in curl requests

If any field is missing, callbacks are disabled for that type.

### Reading Callback Configuration

Use these bash commands to extract callback URLs and token from CLAUDE.md:

```bash
# Read TaskCallback URL
TASK_CALLBACK=$(grep "^TaskCallback:" CLAUDE.md | sed 's/^TaskCallback: //' | tr -d '\r')

# Read ProgressCallback URL
PROGRESS_CALLBACK=$(grep "^ProgressCallback:" CLAUDE.md | sed 's/^ProgressCallback: //' | tr -d '\r')

# Read Callback Token
CALLBACK_TOKEN=$(grep "^CallbackToken:" CLAUDE.md | sed 's/^CallbackToken: //' | tr -d '\r')
```

### Conditional Execution Pattern

Always check if the URL is set before attempting a curl call:

```bash
# Only call TaskCallback if URL is configured
if [ -n "$TASK_CALLBACK" ] && [ "$TASK_CALLBACK" != "TaskCallback:" ]; then
  # curl call here
fi

# Only call ProgressCallback if URL is configured
if [ -n "$PROGRESS_CALLBACK" ] && [ "$PROGRESS_CALLBACK" != "ProgressCallback:" ]; then
  # curl call here
fi
```

### TaskCallback Payload Format (Committer)

Invoked by committer after result.md is created and git commit is completed:

```bash
curl -s -X POST "$TASK_CALLBACK" \
  -H "Authorization: Bearer $CALLBACK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workId": "{WORK_ID}",
    "taskId": "{TASK_ID}",
    "status": "completed",
    "commitHash": "{git-commit-hash}",
    "resultFile": "works/{WORK_ID}/TASK-XX-result.md",
    "timestamp": "{ISO-8601-timestamp}"
  }' 2>/dev/null || echo "WARNING: TaskCallback request failed, continuing..."
```

### ProgressCallback Payload Format (Builder)

Invoked by builder at key checkpoints (e.g., after files are created, before verification):

```bash
curl -s -X POST "$PROGRESS_CALLBACK" \
  -H "Authorization: Bearer $CALLBACK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workId": "{WORK_ID}",
    "taskId": "{TASK_ID}",
    "stage": "implementation",
    "checkpoint": "files_created",
    "details": "{brief description of what completed}",
    "timestamp": "{ISO-8601-timestamp}"
  }' 2>/dev/null || echo "WARNING: ProgressCallback request failed, continuing..."
```

### Error Handling Principles

1. **Never block on callback failure**: If curl fails, print a warning and continue with the main task
2. **Network transience tolerance**: Assume temporary network issues are normal; don't retry
3. **Log all attempts**: Always print a message (warning or success) so external monitoring can audit callback activity
4. **Graceful degradation**: The pipeline should complete successfully even if all callbacks fail

### Common Use Cases

- **Status Dashboard**: ProgressCallback updates a real-time dashboard as tasks execute
- **Notification Service**: TaskCallback triggers email/Slack notifications on task completion
- **Result Archival**: TaskCallback stores committed results in an external database
- **Audit Trail**: Both callbacks enable audit logging of all pipeline activity
```

**Cache Control Marker**:

```json
{
  "type": "text",
  "text": "[content of Task Callbacks section]",
  "cache_control": {
    "type": "ephemeral"
  }
}
```

---

## Version

- **Created**: 2026-03-10
- **Purpose**: WORK-03 — Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감
- **Referenced by**: scheduler.md, router.md, builder.md, verifier.md, committer.md
- **Updated**: 2026-03-12 (TASK-00) — Added Section 6: Task Callbacks for external system integration
