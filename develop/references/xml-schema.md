# 에이전트 통신 XML 스키마

uc-taskmanager 에이전트용 XML 통신 형식 정의.

---

> **디스패처 라벨**: dispatch를 발신하고 task-result를 수신하는 디스패처 역할은 **orchestrator**가 수행한다(과거 Main Claude가 서브에이전트를 직접 호출하던 방식에서 변경). 아래 §1/§2의 "디스패처"는 모두 orchestrator를 가리킨다.

## 1. Dispatch 형식 (orchestrator → 수신자)

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

## 2. Task Result 형식 (수신자 → orchestrator)

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

---

## 5. Gate 요소 (orchestrator → Main Claude)

`<gate>`는 orchestrator가 자율 실행을 일시 정지하고 Main Claude(및 사용자)의 승인 또는 결정을 요청할 때 반환하는 정지 신호입니다. orchestrator는 `<gate>`를 반환한 뒤 Main Claude의 응답(승인 또는 `<decision>`)이 돌아올 때까지 재개하지 않습니다.

### type="stage" — 단계 완료 승인 게이트

```xml
<gate type="stage" work="WORK-12" stage="specifier">
  <summary>Requirement.md 작성 완료. FR 6건, NFR 2건 도출.</summary>
  <next-stage>planner</next-stage>
</gate>
```

### type="decision" — 결정 필요 게이트

```xml
<gate type="decision" work="WORK-12" stage="planner">
  <context>인증 방식으로 세션 기반과 JWT 중 선택이 필요합니다. 기존 코드베이스는 세션 기반이나 신규 마이크로서비스 확장 계획이 있습니다.</context>
  <options>
    <option id="1">세션 기반 유지 (기존 컨벤션 일치)</option>
    <option id="2">JWT 전환 (확장성 우선)</option>
  </options>
  <recommended>option 1 — 현재 스코프에서는 확장 계획이 확정되지 않아 리스크가 낮은 세션 기반 유지를 권고</recommended>
</gate>
```

| 속성 | 값 |
|------|-----|
| `type` | `stage`(단계 완료 승인 요청) / `decision`(선택 필요) |
| `work` | `WORK_ID` |
| `stage` | 현재 정지된 단계: `specifier`/`planner`/`scheduler`/`builder`/`verifier`/`committer` |

- `type="decision"`은 `<context>`(배경 — 왜 결정이 필요한가), `<options>`(선택지 목록), `<recommended>`(권고안)을 하위 요소로 반드시 포함한다.
- Main Claude는 `<gate>` 수신 시 사용자에게 승인/선택을 구하고, 결과를 `<decision>`(§ 7)으로 orchestrator에 재전달하여 재개시킨다.
- 게이트 정지는 활동 로그의 `GATE_WAIT`(stage 게이트) 또는 `DECISION_WAIT`(decision 게이트) 이벤트와 짝을 이룬다 → `work-activity-log.md` 참조.

---

## 6. needs-decision 요소 (자식 에이전트 → orchestrator)

`<needs-decision>`은 자식 에이전트(builder/verifier 등)가 구현 중 스스로 결정할 수 없는 사항을 발견했을 때, task-result와 함께(또는 대신) orchestrator에 상향 보고하는 신호입니다. Main Claude로 직접 올라가지 않고 먼저 orchestrator가 받는다는 점에서 `<gate type="decision">`과 구분됩니다.

```xml
<needs-decision work="WORK-12" task="TASK-03" agent="builder">
  <context>TASK 스펙에 명시되지 않은 에러 응답 포맷이 필요합니다. 기존 엔드포인트는 두 가지 포맷이 혼재합니다.</context>
  <options>
    <option id="1">엔드포인트 A 방식(`{error: string}`)에 통일</option>
    <option id="2">엔드포인트 B 방식(`{code, message}`)에 통일</option>
  </options>
  <recommended>option 2 — 신규 API 표준에 부합</recommended>
</needs-decision>
```

| 속성 | 값 |
|------|-----|
| `work` | `WORK_ID` |
| `task` | `TASK_ID` |
| `agent` | 신호를 발생시킨 자식 에이전트 |

- orchestrator는 `<needs-decision>` 수신 시 자동 결정 가능 여부를 판단한다.
  - 자동 결정 가능 → `<decision by="auto">`(§ 7)로 확정하고 자식 작업을 재개시킴.
  - 자동 결정 불가 → `<gate type="decision">`(§ 5)으로 승격하여 Main Claude에 전달.
- 어느 경로든 결정 내용은 `works/{WORK_ID}/DECISIONS.md`에 기록된다 → `file-content-schema.md` § 5 참조.

---

## 7. decision 요소 (확정 결정 기록)

`<decision>`은 게이트(§ 5) 또는 needs-decision(§ 6)에 대해 내려진 확정 결정을 기록하는 요소입니다. 사용자 승인분(`by="user"`)과 orchestrator 자동결정분(`by="auto"`)이 동일한 형식을 공유합니다.

```xml
<decision work="WORK-12" stage="planner" by="user">
  <context>인증 방식으로 세션 기반과 JWT 중 선택이 필요했음.</context>
  <chosen>세션 기반 유지</chosen>
  <rationale>기존 컨벤션과의 일치를 우선함</rationale>
</decision>
```

```xml
<decision work="WORK-12" task="TASK-03" by="auto">
  <context>에러 응답 포맷 불일치 — builder의 needs-decision.</context>
  <chosen>엔드포인트 B 방식(`{code, message}`)에 통일</chosen>
  <rationale>신규 API 표준과 일치, 리스크 낮음</rationale>
</decision>
```

| 속성 | 값 |
|------|-----|
| `work` | `WORK_ID` |
| `stage` / `task` | 결정이 발생한 단계 또는 TASK (해당하는 것 사용) |
| `by` | `user`(사용자 승인) / `auto`(orchestrator 자동결정) |

- orchestrator는 `<decision>` 확정 즉시 `works/{WORK_ID}/DECISIONS.md`의 해당 항목을 `PENDING → RESOLVED`로 갱신하고, 활동 로그에 `DECISION` 이벤트를 기록한다 → `work-activity-log.md` 참조.
