# Agent Communication XML Schema

XML communication format definition for uc-taskmanager agents.

---

## 1. Dispatch Format (Dispatcher → Receiver)

```xml
<dispatch to="{receiver}" work="{WORK_ID}" task="{TASK_ID}" execution-mode="{direct|pipeline|full}">
  <references-dir>{absolute path to references directory}</references-dir>
  <context>
    <project>{project name}</project>
    <language>{lang_code}</language>
    <plan-file>works/{WORK_ID}/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/{WORK_ID}/TASK-XX.md</file>
    <title>{title}</title>
    <action>{implement|verify|commit|plan|route}</action>
    <description>{optional}</description>
  </task-spec>
  <previous-results>
    <result task="{TASK_ID}" status="{PASS|FAIL|SKIP}">{summary}</result>
  </previous-results>
  <cache-hint sections="{section1},{section2}"/>
</dispatch>
```

| Attribute | Value |
|-----------|-------|
| `to` | builder, verifier, committer, planner, scheduler, specifier |
| `task` | `TASK-NN` — WORK prefix must NOT be included |
| `execution-mode` | direct / pipeline / full (defaults to full if omitted) |

---

## 2. Task Result Format (Receiver → Dispatcher)

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2 line summary}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{description}</file>
  </files-changed>
  <verification>
    <check name="{type}" status="{PASS|FAIL|N/A}">{output}</check>
  </verification>
  <notes>{notes}</notes>
</task-result>
```

---

## 3. Dispatcher-Receiver Mapping

| Dispatcher | Receiver | execution-mode | Description |
|------------|----------|:--------------:|-------------|
| Specifier | Builder | `direct` | Assumed: single TASK implementation (Verifier skipped) |
| Specifier | Planner | `pipeline/full` | Delegated: complex WORK planning |
| Planner | Builder | `pipeline` | TASK implementation |
| Planner | Scheduler | `full` | DAG management + execution |
| Scheduler | Builder | `full` | N TASK implementation |
| Scheduler | Verifier | `full` | N TASK verification |
| Scheduler | Committer | `full` | N TASK commit |

---

## 4. Context-Handoff Element

```xml
<context-handoff from="{agent}" detail-level="{FULL|SUMMARY|DROP}">
  <what>{changes/verification details}</what>
  <why>{decision rationale}</why>       <!-- FULL only -->
  <caution>{caveats}</caution>          <!-- FULL only -->
  <incomplete>{incomplete items}</incomplete>  <!-- FULL only -->
</context-handoff>
```

| detail-level | Included Fields |
|:---:|---|
| `FULL` | what, why, caution, incomplete |
| `SUMMARY` | what only (1-3 lines) |
| `DROP` | Element omitted |

---

## 5. Agent Behavior by execution-mode

| Agent | direct | pipeline | full |
|-------|--------|----------|------|
| Specifier | Requirement.md + PLAN.md + TASK (assumed) | Requirement.md only → delegate to Planner | Requirement.md only → delegate to Planner |
| Planner | Not invoked (Specifier assumed) | PLAN.md + TASK + execution-mode | PLAN.md + TASK + execution-mode |
| Scheduler | Not invoked | Not invoked | DAG management + [B→V→C]×N |
| Builder | Normal execution (self-check) | Normal execution | Normal execution |
| Verifier | Not invoked | Normal execution | Normal execution |
| Committer | result.md+commit+callback | result.md+commit+callback | result.md+commit+callback |

Invariants (regardless of mode):

| Item | direct | pipeline/full |
|------|:---:|:---:|
| `works/WORK-NN/` directory | Specifier | Specifier |
| `Requirement.md` | Specifier | Specifier |
| `PLAN.md` | Specifier (assumed) | Planner |
| `TASK-XX.md` | Specifier (assumed) | Planner |
| `TASK-XX_result.md` | Committer | Committer |
| COMMITTER DONE callback | Committer | Committer |
| `WORK-LIST.md` IN_PROGRESS | Specifier | Specifier |
