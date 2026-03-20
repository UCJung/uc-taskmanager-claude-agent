# Agent Communication XML Schema

uc-taskmanager 에이전트 간 XML 통신 포맷 정의.

---

## 1. Dispatch Format (Dispatcher → Receiver)

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
  <cache-hint sections="{section1},{section2}"/>
</dispatch>
```

| 속성 | 값 |
|------|----|
| `to` | builder, verifier, committer, planner, scheduler, specifier |
| `task` | `TASK-NN` — WORK prefix 포함 금지 |
| `execution-mode` | direct / pipeline / full (생략 시 full로 간주) |

---

## 2. Task Result Format (Receiver → Dispatcher)

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

## 3. Dispatcher-Receiver 매핑

| Dispatcher | Receiver | execution-mode | 설명 |
|------------|----------|:--------------:|------|
| Specifier | Builder | `direct` | 겸임: TASK 1개 구현 (Verifier 생략) |
| Specifier | Planner | `pipeline/full` | 위임: 복잡 WORK 계획 |
| Planner | Builder | `pipeline` | TASK 구현 |
| Planner | Scheduler | `full` | DAG 관리 + 실행 |
| Scheduler | Builder | `full` | TASK N개 구현 |
| Scheduler | Verifier | `full` | TASK N개 검증 |
| Scheduler | Committer | `full` | TASK N개 커밋 |

---

## 4. Context-Handoff Element

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

---

## 5. execution-mode별 에이전트 행동

| 에이전트 | direct | pipeline | full |
|---------|--------|----------|------|
| Specifier | Requirement.md + PLAN.md + TASK (겸임) | Requirement.md만 → Planner 위임 | Requirement.md만 → Planner 위임 |
| Planner | 호출 안 됨 (Specifier 겸임) | PLAN.md + TASK + execution-mode | PLAN.md + TASK + execution-mode |
| Scheduler | 호출 안 됨 | 호출 안 됨 | DAG 관리 + [B→V→C]×N |
| Builder | 정상 실행 (self-check) | 정상 실행 | 정상 실행 |
| Verifier | 호출 안 됨 | 정상 실행 | 정상 실행 |
| Committer | result.md+commit+콜백 | result.md+commit+콜백 | result.md+commit+콜백 |

불변 항목 (모드 무관):

| 항목 | direct | pipeline/full |
|------|:---:|:---:|
| `works/WORK-NN/` 디렉토리 | Specifier | Specifier |
| `Requirement.md` | Specifier | Specifier |
| `PLAN.md` | Specifier (겸임) | Planner |
| `TASK-XX.md` | Specifier (겸임) | Planner |
| `TASK-XX_result.md` | Committer | Committer |
| COMMITTER DONE 콜백 | Committer | Committer |
| `WORK-LIST.md` IN_PROGRESS | Specifier | Specifier |
