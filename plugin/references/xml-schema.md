# 에이전트 통신 XML 스키마

uc-taskmanager 에이전트용 XML 통신 형식 정의.

---

## 섹션 소비 매트릭스

orchestrator가 자식 spawn 시 `<ref-cache>`에 담을 섹션을 결정하는 기준표 → § 4.

| § | 내용 | orch | spec | plan | build | verif |
|---|------|:----:|:----:|:----:|:-----:|:-----:|
| 1 | Dispatch 형식 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | Task Result 형식 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3 | Context-Handoff 요소 | ✅ | | | ✅ | ✅ |
| 4 | ref-cache 프로토콜 | ✅ | | | | |
| 5 | Gate 요소 | ✅ | | | | |
| 6 | needs-decision 요소 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7 | decision 요소 | ✅ | | | | |
| 8 | capability-degraded 요소 | ✅ | | | | |

> § 4·§ 5·§ 7·§ 8은 **orchestrator 전용**이다. ref-cache 생성(§ 4), 게이트 발행(§ 5), 결정 확정(§ 7)은 모두 orchestrator의 책임이며 자식 에이전트는 수행하지 않는다. 자식에게 필요한 ref-cache 소비 규칙은 각 에이전트 정의의 STARTUP 절에 인라인으로 기술되어 있다.

---

> **디스패처 라벨**: dispatch를 발신하고 task-result를 수신하는 디스패처 역할은 **orchestrator**가 수행한다. 아래 §1/§2의 "디스패처"는 모두 orchestrator를 가리킨다.

## § 1. Dispatch 형식 (orchestrator → 수신자)

```xml
<dispatch to="{receiver}" work="{WORK_ID}" task="{TASK_ID}">
  <ref-cache>                                        <!-- 필수 — § 4 참조 -->
    <ref key="shared-prompt-sections" sections="1,3,12">{해당 섹션 원문}</ref>
    <ref key="xml-schema" sections="1,2,6">{해당 섹션 원문}</ref>
    <!-- 수신자에게 필요한 섹션만 (§ 4 조립 절차 참조) -->
  </ref-cache>
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
</dispatch>
```

| 속성 | 값 |
|------|-----|
| `to` | builder, verifier, planner, specifier |
| `task` | `TASK-NN` — WORK 접두사 포함 금지 |

> `<ref-cache>`는 **필수**다. orchestrator는 이것 없이 자식을 spawn하지 않는다 — 자식이 레퍼런스를 디스크에서 다시 읽게 되어 ref-cache가 무력화된다.

---

## § 2. Task Result 형식 (수신자 → orchestrator)

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
</task-result>
```

> task-result에는 `<ref-cache>`를 **포함하지 않는다**. 캐시의 단일 소스는 orchestrator이며(§ 4), 자식이 전달받은 내용을 되돌려주는 것은 순수한 토큰 낭비다.

---

## § 3. Context-Handoff 요소

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

## § 4. ref-cache 프로토콜 (orchestrator 전용)

### 원칙

레퍼런스 파일을 읽는 주체는 **orchestrator 하나뿐**이다. orchestrator는 기동 시 1회 읽고, 자식을 중첩 spawn할 때마다 **그 자식에게 필요한 섹션만** 잘라 `<ref-cache>`로 전달한다. 자식은 디스크를 읽지 않는다.

| 주체 | 행위 |
|------|------|
| orchestrator | 레퍼런스 5종 읽기(1회) → 각 파일의 **섹션 소비 매트릭스** 파싱 → 자식별 `<ref-cache>` 조립 → dispatch에 필수 포함 |
| 자식 에이전트 | `<ref-cache>` 내용만 사용. `{REFERENCES_DIR}` 하위 파일에 대한 `Read`/`Glob`/`Grep` **금지** |

### 구조

```xml
<ref-cache>
  <ref key="{확장자 없는 파일명}" sections="{쉼표 구분 § 번호}">{해당 섹션 원문}</ref>
  ...
</ref-cache>
```

| 요소/속성 | 필수 | 설명 |
|-----------|:----:|------|
| `<ref-cache>` | ✅ | dispatch에 항상 포함. 생략 금지. |
| `<ref key="...">` | — | 레퍼런스 파일 1개당 1개. `key`는 확장자 없는 파일명. |
| `sections="..."` | ✅ | 이 `<ref>`에 담긴 § 번호 목록 (예: `"1,3,12"`). 자식의 자기검증용. |

- `<ref>` 본문에는 **`## § N.` 헤딩을 그대로 보존**한 원문을 넣는다 — 문서 내 "→ `xml-schema.md` § 6 참조" 같은 상호참조가 그대로 해소되어야 한다.
- § 번호가 없는 도입부 표(예: `file-content-schema.md`의 "준수사항")는 해당 파일 전달 시 항상 함께 싣고 `sections`에는 표기하지 않는다.

### 인식되는 키

| 키 | 대응 파일 | 섹션 범위 |
|-----|-----------|----------|
| `shared-prompt-sections` | `{REFERENCES_DIR}/shared-prompt-sections.md` | § 1~9, § 12 |
| `file-content-schema` | `{REFERENCES_DIR}/file-content-schema.md` | 준수사항, § 0~5 |
| `xml-schema` | `{REFERENCES_DIR}/xml-schema.md` | § 1~7 |
| `context-policy` | `{REFERENCES_DIR}/context-policy.md` | § 1~6 |
| `work-activity-log` | `{REFERENCES_DIR}/work-activity-log.md` | § 1~3 |

### 조립 절차 (orchestrator)

```
1. 대상 자식(specifier/planner/builder/verifier)을 확정한다.
2. 읽어둔 레퍼런스 5종 각각의 "섹션 소비 매트릭스" 표에서 해당 자식 열이 ✅인 행을 모은다.
   표를 끝까지 훑어 ✅ 행을 하나도 빠뜨리지 않는다.
3. ✅ 행이 하나도 없는 파일은 <ref> 자체를 생성하지 않는다.
4. ✅ 행이 있는 파일마다 <ref>를 정확히 1개씩만 만든다.
   같은 key로 두 번 넣지 않으며, sections에 ✅ 번호를 빠짐없이 나열한다.
   본문은 해당 § 원문을 헤딩째 발췌한다.
5. 조립된 <ref-cache>를 dispatch XML 최상단에 넣어 자식 spawn 프롬프트에 포함한다.
6. spawn 직전 자체 점검: key 중복이 없고, key 구성·sections 값이 매트릭스와 일치하는지 대조한다.
```

### 조립 불변식

| 규칙 | 위반 시 |
|------|---------|
| 파일 1개당 `<ref>` 1개 | 같은 내용이 두 번 실려 토큰 낭비 |
| `sections`에 매트릭스 ✅ 를 빠짐없이 | 자식이 필요한 내용을 받지 못함 |
| `sections` 값 = 실제 담긴 § 목록 | 자식의 자기검증이 무의미해짐 |

### 내용 부족 시 처리 (엄격 모드)

- 자식은 어떤 경우에도 레퍼런스 파일을 디스크에서 읽지 않는다. **폴백 경로는 없다.**
- 작업에 필요한 내용이 `<ref-cache>`에 없으면 `<needs-decision>`(§ 6)으로 부족한 `key`·내용을 명시해 orchestrator에 상향하고 종료한다.
- orchestrator는 누락분을 보충한 `<ref-cache>`로 해당 자식을 재spawn한다. 이는 매트릭스 배분이 실제 필요와 어긋났다는 신호이므로, 반복되면 해당 파일의 섹션 소비 매트릭스를 수정한다.

---

## § 5. Gate 요소 (orchestrator → Main Claude)

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
| `stage` | 현재 정지된 단계: `specifier`/`planner`/`builder`/`verifier` |

- `type="decision"`은 `<context>`(배경 — 왜 결정이 필요한가), `<options>`(선택지 목록), `<recommended>`(권고안)을 하위 요소로 반드시 포함한다.
- Main Claude는 `<gate>` 수신 시 사용자에게 승인/선택을 구하고, 결과를 `<decision>`(§ 7)으로 orchestrator에 재전달하여 재개시킨다.
- 게이트 정지는 활동 로그의 `GATE_WAIT`(stage 게이트) 또는 `DECISION_WAIT`(decision 게이트) 이벤트와 짝을 이룬다 → `work-activity-log.md` 참조.

---

## § 6. needs-decision 요소 (자식 에이전트 → orchestrator)

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
- 어느 경로든 결정 내용은 **orchestrator가** `works/{WORK_ID}/DECISIONS.md`에 기록한다. 자식 에이전트는 DECISIONS.md를 직접 쓰지 않으므로 그 포맷을 알 필요가 없다.

---

## § 7. decision 요소 (확정 결정 기록)

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

---

## § 8. capability-degraded 요소 (orchestrator → Main Claude)

`<capability-degraded>`는 orchestrator가 **자신의 실행 환경이 파이프라인을 수행할 수 없음**을 감지했을 때, 아무 작업도 하지 않고 즉시 반환하는 신호입니다.

```xml
<capability-degraded reason="no-agent-tool">
  <detail>서브에이전트에 Agent 도구가 주입되지 않아 중첩 spawn 불가</detail>
</capability-degraded>
```

| 속성/요소 | 값 |
|-----------|-----|
| `reason` | `no-agent-tool` — 중첩 spawn용 `Agent` 도구 부재 |
| `<detail>` | 사람이 읽을 수 있는 사유 1줄 |

### 발생 조건

일부 CLI 버전·환경에서 서브에이전트에 `Agent` 도구가 주입되지 않아 자식 중첩 spawn이 불가능한 경우. orchestrator는 기동 직후(STEP 0, 레퍼런스를 읽기 전) 이를 판정한다.

### 불변식

- orchestrator는 이 신호를 반환하기 전에 **어떤 산출물도 만들지 않는다** — WORK 폴더, Requirement.md, 활동 로그 모두 생성 금지.
- orchestrator는 자식 역할을 **인라인으로 대행하지 않는다.** 대행하면 WORK가 완료된 것처럼 보이지만 역할 분리와 검증 독립성이 사라진 채로 끝나며, 오류가 나지 않아 발견되지 않는다.

### Main Claude의 처리

Main Claude는 이 신호를 받으면 축퇴 모드로 전환해 **자신이 orchestrator 역할을 수행**한다. 절차의 정본은 `orchestrator.md` 그대로이며, 자식이 depth=1로 뜨는 것만 다르다 → `agent-flow.md` 축퇴 모드 절 참조.
