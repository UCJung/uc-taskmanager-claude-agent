# Agent Communication XML Schema

This document defines the XML format used for structured communication between uc-taskmanager agents. All agent-to-agent dispatches and result reports use this schema.

## Overview

**Purpose**: Replace ambiguous natural language prompts with explicit XML structures to:
- Reduce output token generation (agents don't need to ask clarifying questions)
- Enable prompt caching for repeated sections (90% token savings)
- Ensure consistent data flow across dispatcher → receiver chains

**Applies to**: router, scheduler, builder, verifier, committer agents

---

## 1. Dispatch Format (Dispatcher → Receiver)

### Generic Dispatch Element

All agent-to-agent calls use this structure:

```xml
<dispatch to="{receiver_agent}" work="{WORK_ID}" task="{TASK_ID}">
  <context>
    <project>{project name}</project>
    <language>{language code, e.g., en, ko}</language>
    <plan-file>tasks/multi-tasks/{WORK_ID}/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>{path to TASK definition file}</file>
    <title>{task title}</title>
    <action>{implement|verify|commit|plan|route}</action>
    <description>{optional task description}</description>
  </task-spec>
  <previous-results>
    <result task="{PREVIOUS_TASK_ID}" status="{PASS|FAIL|SKIP}">{summary}</result>
  </previous-results>
  <cache-hint sections="{section1},{section2},..."/>
</dispatch>
```

### Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `to` | builder, verifier, committer, planner, scheduler, router | Target receiver agent |
| `work` | WORK-NN | WORK identifier (empty for S-TASK direct pipeline) |
| `task` | WORK-NN-TASK-NN or S-TASK-NNNNN | Task identifier |

### Child Elements

| Element | Description |
|---------|-------------|
| `<context>` | Execution context: project name, target language, plan file path |
| `<task-spec>` | Task specification: file path, title, action type, optional description |
| `<previous-results>` | Results from preceding tasks (for verification/commit phases) |
| `<cache-hint>` | Comma-separated list of common section names to cache |

---

## 2. Task Result Format (Receiver → Dispatcher)

### Generic Task Result Element

All agents return results in this structure:

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent_name}" status="{PASS|FAIL}">
  <summary>{1-2 line executive summary}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{relative path}">{description}</file>
    <file action="created" path="agents/shared-prompt-sections.md">Common reusable sections</file>
    <file action="modified" path="agents/scheduler.md">Added XML dispatch format</file>
  </files-changed>
  <verification>
    <check name="{check_type}" status="{PASS|FAIL|N/A}">{output details}</check>
    <check name="file_existence" status="PASS">Both files created</check>
    <check name="schema_valid" status="PASS">XML structure validates</check>
  </verification>
  <notes>{any notes, warnings, or follow-up actions}</notes>
</task-result>
```

### Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `work` | WORK-NN | Source WORK identifier |
| `task` | WORK-NN-TASK-NN | Source TASK identifier |
| `agent` | builder, verifier, committer, planner, scheduler, router | Sender agent name |
| `status` | PASS, FAIL | Overall task completion status |

### Child Elements

| Element | Description |
|---------|-------------|
| `<summary>` | Brief 1-2 line summary of what was accomplished or failed |
| `<files-changed>` | List of files created, modified, or deleted with action and path |
| `<verification>` | Results of verification checks (build, lint, test, custom checks) |
| `<notes>` | Any relevant notes for downstream tasks or human review |

---

## 3. Dispatcher-Receiver Mapping

### Scheduler → Builder/Verifier/Committer

**Dispatcher**: `agents/scheduler.md`
**Receivers**: `agents/builder.md`, `agents/verifier.md`, `agents/committer.md`

**Flow**:
1. Scheduler sends `<dispatch to="builder" work="{WORK_ID}" task="{TASK_ID}">` with `<action>implement</action>`
2. Builder receives `<task-input>` (parsed from dispatch)
3. Builder executes implementation and returns `<task-result status="PASS/FAIL">`
4. Scheduler sends `<dispatch to="verifier">` including builder's `<task-result>`
5. Verifier executes verification and returns `<task-result status="PASS/FAIL">`
6. Scheduler sends `<dispatch to="committer">` including builder and verifier results
7. Committer executes git commit and returns `<task-result>`

### Router → Planner/Scheduler (WORK Flow)

**Dispatcher**: `agents/router.md`
**Receivers**: `agents/planner.md`, `agents/scheduler.md`

**Flow**:
1. Router sends `<dispatch to="planner" mode="new-work">` with user's original request
2. Planner analyzes request and creates WORK, returns `<task-result>` with WORK ID
3. Router sends `<dispatch to="scheduler" work="{WORK_ID}">`
4. Scheduler executes the pipeline and returns final status

### Router → Builder/Verifier/Committer (S-TASK Direct)

**Dispatcher**: `agents/router.md`
**Receivers**: `agents/builder.md`, `agents/verifier.md`, `agents/committer.md`

**Flow**:
1. Router sends `<dispatch to="builder" stask="{S-TASK_ID}">` with task details
2. Builder returns `<task-result>`
3. Router sends to verifier and committer similarly

---

## 4. Detailed Element Specifications

### 4.1 Context Element

```xml
<context>
  <project>{detected project name, e.g., "uc-taskmanager"}</project>
  <language>{language code: en, ko, ja, etc.}</language>
  <plan-file>tasks/multi-tasks/{WORK_ID}/PLAN.md</plan-file>
  <next-work-id>{next WORK ID for routing decisions}</next-work-id>  <!-- optional -->
</context>
```

**Rules**:
- `<language>` must be resolved according to "Output Language Rule" from `agents/shared-prompt-sections.md`
- `<plan-file>` should be absolute or relative path to PLAN.md
- `<next-work-id>` only present in planner dispatch from router

### 4.2 Task-Spec Element

```xml
<task-spec>
  <file>tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX.md</file>
  <title>{exact title from PLAN.md or user request}</title>
  <action>{implement|verify|commit|plan}</action>
  <description>{optional longer description of what needs to be done}</description>
  <files-hint>
    <file path="{estimated file}" action="{create|modify}">{reason}</file>
  </files-hint>  <!-- optional, used in router dispatches to builder -->
</task-spec>
```

**Action Types**:
- `implement`: Build/create implementation (builder action)
- `verify`: Verify implementation against acceptance criteria (verifier action)
- `commit`: Generate git commit and result.md (committer action)
- `plan`: Create WORK plan and task decomposition (planner action)
- `route`: Route incoming request to appropriate agent (router action)

### 4.3 Previous-Results Element

```xml
<previous-results>
  <result task="{TASK_ID}" status="{PASS|FAIL|SKIP}" agent="{agent_name}">{summary}</result>
  <result task="WORK-03-TASK-00" status="PASS" agent="builder">Created XML schema files</result>
  <result task="WORK-03-TASK-01" status="FAIL" agent="verifier">Schema validation failed, see notes</result>
</previous-results>
```

**Rules**:
- Include results from all preceding TASK dependencies in the DAG
- Status values: PASS (completed successfully), FAIL (failed, can retry), SKIP (intentionally skipped)
- Only include if there are preceding tasks

### 4.4 Cache-Hint Element

```xml
<cache-hint sections="output-language-rule,build-commands,file-path-patterns"/>
```

**Valid Section Names** (from `agents/shared-prompt-sections.md`):
- `output-language-rule` — Output Language Rule section
- `build-commands` — Build and Lint Commands section
- `file-path-patterns` — WORK and TASK File Path Patterns section
- `file-system-scripts` — File System Discovery Scripts section
- `task-result-format` — Task Result XML Format section

**Rules**:
- List sections as comma-separated values (no spaces)
- Only include sections that are directly relevant to the receiver
- Enables prompt caching for repeated sections across multiple invocations

### 4.5 Files-Changed Element

```xml
<files-changed>
  <file action="created" path="agents/shared-prompt-sections.md">Common reusable prompt sections with cache_control markers</file>
  <file action="modified" path="agents/scheduler.md">Added XML dispatch format in Phase 2-4 sections</file>
  <file action="deleted" path="agents/old-unused.md">Removed obsolete file</file>
</files-changed>
```

**Action Types**:
- `created` — File was newly created
- `modified` — File was edited (existing content changed)
- `deleted` — File was removed

**Path Format**: Relative paths from project root (e.g., `agents/scheduler.md`, `tasks/multi-tasks/WORK-03/PROGRESS.md`)

### 4.5.1 Context-Handoff Element (within task-result)

Context handoff is a structured way to pass task execution context and decision rationale to dependent tasks and agents through the pipeline.

```xml
<context-handoff from="{agent_name}" detail-level="{FULL|SUMMARY|DROP}">
  <what>{변경 사항 요약 — 구체적으로 무엇이 생성/수정/삭제되었는가}</what>
  <why>{의사결정 근거 — 왜 이런 방식으로 구현/검증했는가}</why>
  <caution>{다음 에이전트가 주의할 점 — 조건부 완료, 수동 검증 필요 부분}</caution>
  <incomplete>{미완료/보류 사항 — 완료하지 못한 항목이 있다면}</incomplete>
</context-handoff>
```

**Attributes**:

| Attribute | Values | Description |
|-----------|--------|-------------|
| `from` | builder, verifier, committer | Source agent that generated this handoff |
| `detail-level` | FULL, SUMMARY, DROP | Sliding window level for context compression (see context-policy.md) |

**Child Elements**:

| Element | Required | Description |
|---------|----------|-------------|
| `<what>` | YES | Concrete summary of changes: files created/modified/deleted, features added, verification results passed/failed |
| `<why>` | FULL only | Decision rationale, technical reasoning, alternative analysis (omitted in SUMMARY) |
| `<caution>` | FULL only | Edge cases, conditional completeness, manual verification required, environment constraints (omitted in SUMMARY) |
| `<incomplete>` | FULL only | Unfinished items, postponed work, future improvements (omitted in SUMMARY) |

**Detail Level Rules**:

- **FULL**: All 4 fields included (what, why, caution, incomplete)
- **SUMMARY**: Only `what` field included, 1-3 lines
- **DROP**: Element completely omitted from XML

**Example (Builder returns FULL context-handoff)**:
```xml
<task-result status="PASS">
  <context-handoff from="builder" detail-level="FULL">
    <what>Created agents/context-policy.md with 4-field structure (what/why/caution/incomplete), sliding window rules (FULL/SUMMARY/DROP), and pipeline matrix. Modified agents/xml-schema.md to add context-handoff element definition with detail-level attribute.</what>
    <why>Context handoff enables downstream agents to understand not just what changed, but why and what to watch for. Sliding window compression reduces token waste by dropping distant dependencies while preserving direct lineage.</why>
    <caution>context-policy.md must be read by all dependent TASK implementations to maintain consistent detail-level application. xml-schema.md modifications should preserve backward compatibility.</caution>
    <incomplete>None — both files fully implemented per WORK-07-TASK-00 acceptance criteria.</incomplete>
  </context-handoff>
</task-result>
```

**Example (Committer receives SUMMARY from builder)**:
```xml
<dispatch to="committer">
  <context-handoff from="builder" detail-level="SUMMARY">
    <what>Created agents/context-policy.md and modified agents/xml-schema.md with context-handoff element and detail-level definitions.</what>
  </context-handoff>
</dispatch>
```

### 4.6 Verification Element

```xml
<verification>
  <check name="file_existence" status="PASS">shared-prompt-sections.md exists</check>
  <check name="schema_valid" status="PASS">XML schema validates against DTD</check>
  <check name="cache_references" status="FAIL">Missing cache_control in 2 places: lines 45, 89</check>
  <check name="dependencies" status="N/A">No build dependencies for this task</check>
</verification>
```

**Standard Check Names** (use existing ones where possible):
- `file_existence` — Do expected files exist?
- `build` — Does code compile/build successfully?
- `lint` — Does code pass linting?
- `tests` — Do tests pass?
- `schema_valid` — Does output match schema?
- `task_specific` — Task-specific acceptance criteria?
- `conventions` — Do files follow project conventions?
- `dependencies` — Are dependent tasks complete?

**Status Values**:
- `PASS` — Check passed
- `FAIL` — Check failed
- `N/A` — Not applicable for this task

---

## 5. Full Example Workflows

### Example 1: WORK-03-TASK-00 (Builder creates files)

**Scheduler dispatches to Builder**:
```xml
<dispatch to="builder" work="WORK-03" task="WORK-03-TASK-00">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
    <plan-file>tasks/multi-tasks/WORK-03/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>tasks/multi-tasks/WORK-03/WORK-03-TASK-00.md</file>
    <title>공통 시스템 프롬프트 섹션 식별 및 캐싱 마킹 + XML 스키마 설계</title>
    <action>implement</action>
  </task-spec>
  <previous-results/>
  <cache-hint sections="output-language-rule,file-path-patterns"/>
</dispatch>
```

**Builder returns task-result**:
```xml
<task-result work="WORK-03" task="WORK-03-TASK-00" agent="builder" status="PASS">
  <summary>Created shared-prompt-sections.md and xml-schema.md with comprehensive documentation</summary>
  <files-changed>
    <file action="created" path="agents/shared-prompt-sections.md">5 common sections identified and documented</file>
    <file action="created" path="agents/xml-schema.md">Complete XML schema for dispatcher-receiver communication</file>
  </files-changed>
  <verification>
    <check name="file_existence" status="PASS">Both files created successfully</check>
    <check name="cache_control_markers" status="PASS">5 cache_control sections marked</check>
    <check name="xml_schema_completeness" status="PASS">dispatch, task-input, task-result defined</check>
  </verification>
  <notes>Ready for verification. All acceptance criteria met.</notes>
</task-result>
```

### Example 2: WORK-03-TASK-01 (Verifier checks builder output)

**Scheduler dispatches to Verifier** (includes builder result):
```xml
<dispatch to="verifier" work="WORK-03" task="WORK-03-TASK-01">
  <context>
    <language>ko</language>
    <plan-file>tasks/multi-tasks/WORK-03/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>tasks/multi-tasks/WORK-03/WORK-03-TASK-01.md</file>
    <title>scheduler.md 구조화 XML 디스패치 포맷 적용</title>
    <action>verify</action>
  </task-spec>
  <builder-result>
    [builder's task-result XML from previous step]
  </builder-result>
  <cache-hint sections="output-language-rule,build-commands"/>
</dispatch>
```

---

## 6. Migration Guide

### For Existing Agents

To adopt this XML schema:

1. **Read `agents/shared-prompt-sections.md`** to identify cacheable sections
2. **In your agent definition**, add a section:
   ```markdown
   ## Agent Input/Output Format

   See `agents/xml-schema.md` for the complete XML dispatch and result format.

   This agent expects input in the `<dispatch>` format with:
   - `<context>` containing project, language, and plan-file
   - `<task-spec>` containing file, title, and action
   - `<previous-results>` from preceding tasks (if any)

   This agent returns results in `<task-result>` format with:
   - `status="PASS"` or `status="FAIL"`
   - `<files-changed>` listing all modifications
   - `<verification>` with check results
   - `<notes>` for downstream tasks
   ```

3. **Mark cacheable sections** with comments:
   ```markdown
   ## Output Language Rule
   <!-- CACHE_CONTROL: shared-prompt-sections.md Section 1 -->
   [section content...]
   ```

4. **In result generation**, use the XML structure defined in Section 2

---

## 7. Validation Checklist

When implementing this schema:

- [ ] All dispatcher agents (`router.md`, `scheduler.md`) generate valid `<dispatch>` elements
- [ ] All receiver agents (`builder.md`, `verifier.md`, `committer.md`, `planner.md`) parse `<dispatch>` and return `<task-result>`
- [ ] `<context><language>` matches the "Output Language Rule" from `shared-prompt-sections.md`
- [ ] `<cache-hint>` only references valid section names from `shared-prompt-sections.md`
- [ ] `<files-changed>` paths are relative to project root
- [ ] `<verification>` uses standard check names or clearly documents custom checks
- [ ] All XML elements nest correctly and are well-formed

---

## Version & History

- **Created**: 2026-03-10
- **Purpose**: WORK-03 — Agent간 프롬프트 전달 시 데이터 구조화로 토큰 절감
- **Referenced by**: scheduler.md, router.md, builder.md, verifier.md, committer.md, planner.md
- **Last Updated**: 2026-03-12
- **Updates** (2026-03-12, WORK-07-TASK-00):
  - Added Section 4.5.1: `<context-handoff>` element with 4-field structure (what/why/caution/incomplete)
  - Added `detail-level` attribute: FULL (all fields), SUMMARY (what only), DROP (element omitted)
  - Added reference to `agents/context-policy.md` for sliding window rules
  - Added example workflows for FULL and SUMMARY detail levels
