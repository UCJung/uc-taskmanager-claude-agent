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
| `to` | builder, verifier, committer, planner, scheduler, router |
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
| Router | (자기 자신) | `direct` | 서브에이전트 없음. Router가 직접 구현+commit+콜백 |
| Router | Planner | `full` | 복잡 WORK 계획 |
| Router | Scheduler | `full` | 계획된 WORK 실행 |
| Router | Builder | `pipeline` | TASK 1개 구현 |
| Router | Verifier | `pipeline` | TASK 1개 검증 |
| Router | Committer | `pipeline` | TASK 1개 커밋 |
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
| Router | 구현+self-check+result.md+commit+콜백 직접 | PLAN 생성 후 B→V→C dispatch | Planner에 dispatch |
| Planner | 호출 안 됨 | 호출 안 됨 | PLAN.md 생성 |
| Scheduler | 호출 안 됨 | 호출 안 됨 | DAG 관리 + [B→V→C]×N |
| Builder | 호출 안 됨 | 정상 실행 | 정상 실행 |
| Verifier | 호출 안 됨 | 정상 실행 | 정상 실행 |
| Committer | 호출 안 됨 | result.md+commit+콜백 | result.md+commit+콜백 |

불변 항목 (모드 무관):

| 항목 | direct | pipeline/full |
|------|:---:|:---:|
| `works/WORK-NN/` 디렉토리 | Router | Router/Planner |
| `PLAN.md` | Router | Router/Planner |
| `TASK-XX.md` | Router | Router/Planner |
| `TASK-XX_result.md` | Router | Committer |
| COMMITTER DONE 콜백 | Router | Committer |
| `WORK-LIST.md` IN_PROGRESS | Router | Router |
