# Agent Communication XML Schema

에이전트 간 XML 통신 포맷 정의.

---

## § 1. Dispatch Format (Dispatcher → Receiver)

```xml
<dispatch to="{receiver}" work="{WORK_ID}" task="{TASK_ID}" execution-mode="{direct|pipeline|full}">
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
</dispatch>
```

| 속성 | 값 |
|------|----|
| `to` | builder, verifier, committer, planner, scheduler, router |
| `task` | `TASK-NN` — WORK prefix 포함 금지 |
| `execution-mode` | direct / pipeline / full (생략 시 full) |

---

## § 2. Task Result Format (Receiver → Dispatcher)

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2줄 요약}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{description}</file>
  </files-changed>
  <verification>
    <check name="{type}" status="{PASS|FAIL|N/A}">{output}</check>
  </verification>
  <notes>{참고사항}</notes>
</task-result>
```

---

## § 3. Execution-Mode별 에이전트 역할

| 에이전트 | direct | pipeline | full |
|---------|--------|----------|------|
| Router | 구현+self-check+result.md+commit | PLAN 생성 후 B→V→C dispatch | Planner에 dispatch |
| Planner | - | - | PLAN.md 생성 |
| Scheduler | - | - | DAG 관리 + [B→V→C]xN |
| Builder | - | 정상 실행 | 정상 실행 |
| Verifier | - | 정상 실행 | 정상 실행 |
| Committer | - | result.md+commit+콜백 | result.md+commit+콜백 |

Dispatcher → Receiver 매핑:

| Dispatcher | Receiver | mode |
|------------|----------|:----:|
| Router | Builder/Verifier/Committer | pipeline |
| Router | Planner/Scheduler | full |
| Scheduler | Builder/Verifier/Committer | full |

모드 무관 불변 항목:

| 항목 | direct | pipeline/full |
|------|:---:|:---:|
| `works/WORK-NN/` 디렉토리 | Router | Router/Planner |
| `PLAN.md` | Router | Router/Planner |
| `TASK-XX.md` | Router | Router/Planner |
| `TASK-XX_result.md` | Router | Committer |
| `WORK-LIST.md` IN_PROGRESS | Router | Router |

---

## § 4. Context-Handoff Element

```xml
<context-handoff from="{agent}" detail-level="{FULL|SUMMARY|DROP}">
  <what>{변경/검증 사항}</what>
  <why>{의사결정 근거}</why>       <!-- FULL only -->
  <caution>{주의사항}</caution>    <!-- FULL only -->
  <incomplete>{미완료 사항}</incomplete>  <!-- FULL only -->
</context-handoff>
```

| detail-level | 포함 필드 |
|:---:|---|
| `FULL` | what, why, caution, incomplete |
| `SUMMARY` | what만 (1-3줄) |
| `DROP` | 요소 생략 |
