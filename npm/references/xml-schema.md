# 에이전트 통신 XML 스키마

uc-taskmanager 에이전트용 XML 통신 형식 정의.

---

## 1. Dispatch 형식 (디스패처 → 수신자)

```xml
<dispatch to="{receiver}" work="{WORK_ID}" task="{TASK_ID}" execution-mode="{direct|pipeline|full}">
  <ref-cache>                                        <!-- 선택사항 -->
    <ref key="shared-prompt-sections">{파일 내용}</ref>
    <ref key="file-content-schema">{파일 내용}</ref>
    <ref key="xml-schema">{파일 내용}</ref>
    <ref key="context-policy">{파일 내용}</ref>
    <ref key="work-activity-log">{파일 내용}</ref>
  </ref-cache>
  <references-dir>{references 디렉토리 절대 경로}</references-dir>
  <context>
    <project>{프로젝트 이름}</project>
    <language>{lang_code}</language>
    <plan-file>works/{WORK_ID}/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/{WORK_ID}/TASK-XX.md</file>
    <title>{제목}</title>
    <action>{implement|verify|commit|plan|route}</action>
    <description>{선택사항}</description>
  </task-spec>
  <previous-results>
    <result task="{TASK_ID}" status="{PASS|FAIL|SKIP}">{요약}</result>
  </previous-results>
  <cache-hint sections="{section1},{section2}"/>
</dispatch>
```

| 속성 | 값 |
|------|-----|
| `to` | builder, verifier, committer, planner, scheduler, specifier |
| `task` | `TASK-NN` — WORK 접두사 포함 금지 |
| `execution-mode` | direct / pipeline / full (생략 시 full 기본값) |

---

## 2. Task Result 형식 (수신자 → 디스패처)

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2줄 요약}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{설명}</file>
  </files-changed>
  <verification>
    <check name="{type}" status="{PASS|FAIL|N/A}">{출력}</check>
  </verification>
  <notes>{메모}</notes>
  <ref-cache>                                        <!-- 선택사항 -->
    <ref key="shared-prompt-sections">{파일 내용}</ref>
    <ref key="file-content-schema">{파일 내용}</ref>
    <ref key="xml-schema">{파일 내용}</ref>
    <ref key="context-policy">{파일 내용}</ref>
    <ref key="work-activity-log">{파일 내용}</ref>
  </ref-cache>
</task-result>
```

---

## 3. Context-Handoff 요소

```xml
<context-handoff from="{agent}" detail-level="{FULL|SUMMARY|DROP}">
  <what>{변경/검증 상세}</what>
  <why>{결정 근거}</why>       <!-- FULL만 -->
  <caution>{주의사항}</caution>          <!-- FULL만 -->
  <incomplete>{미완료 항목}</incomplete>  <!-- FULL만 -->
</context-handoff>
```

| detail-level | 포함 필드 |
|:---:|---|
| `FULL` | what, why, caution, incomplete |
| `SUMMARY` | what만 (1-3줄) |
| `DROP` | 요소 생략 |

---

## 4. ref-cache 요소 정의

`<ref-cache>`는 dispatch 및 task-result XML 내에서 미리 로딩된 레퍼런스 파일 내용을 전달하는 선택적 컨테이너 요소입니다. 존재할 경우, 수신 에이전트는 디스크에서 파일을 읽는 대신 반드시 이 내용을 사용해야 합니다.

### 구조

```xml
<ref-cache>
  <ref key="{확장자 없는 파일명}">{전체 파일 내용}</ref>
  ...
</ref-cache>
```

| 요소 | 필수 | 설명 |
|------|------|------|
| `<ref-cache>` | 선택 | 캐시된 레퍼런스 파일 컨테이너. 캐시가 없으면 전체 생략. |
| `<ref key="...">` | — | 개별 레퍼런스 파일. `key`는 확장자 없는 파일명 (예: `shared-prompt-sections`). |

### 인식되는 키

| 키 | 대응 파일 |
|-----|-----------|
| `shared-prompt-sections` | `{REFERENCES_DIR}/shared-prompt-sections.md` |
| `file-content-schema` | `{REFERENCES_DIR}/file-content-schema.md` |
| `xml-schema` | `{REFERENCES_DIR}/xml-schema.md` |
| `context-policy` | `{REFERENCES_DIR}/context-policy.md` |
| `work-activity-log` | `{REFERENCES_DIR}/work-activity-log.md` |

### 하위 호환성

- `<ref-cache>` 없는 dispatch 또는 task-result XML은 완전히 유효 — 에이전트는 `REFERENCES_DIR`에서 파일을 읽는 것으로 폴백.
- ref-cache를 아직 지원하지 않는 에이전트는 해당 요소를 무시하고 정상적으로 파일을 읽음.
- 부분적 ref-cache (일부 키만 존재)도 허용 — 없는 키는 디스크에서 읽음.
