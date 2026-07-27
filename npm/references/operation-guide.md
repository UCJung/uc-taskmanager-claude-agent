# Operation Guide Overlay — 프로젝트 운영 가이드 오버레이

> uctm의 파일 기반 WORK-PIPELINE은 **기계적 substrate**입니다(불변).
> 프로젝트가 자기 저장소에 보관한 **운영 가이드**(예: `docs/[GUIDE]_RND_OPERATION.md`)를
> **정책 오버레이**로 읽어, 가이드가 상태전이·외부기록·등록·테스트/릴리스를 지시하는 지점에서 그대로 따릅니다.
>
> uctm에는 특정 프로젝트의 절차를 하드코딩하지 않습니다. 이 문서는 "가이드를 **발견·로드·준수**하는
> 계약"만 정의합니다. 실제 절차·도구명·상태값은 각 프로젝트의 가이드가 정본입니다.
>
> 오버레이가 없는 프로젝트(가이드 미선언)에서는 이 문서의 어떤 것도 발동하지 않으며,
> 파이프라인은 순수 파일 기반으로 현행과 동일하게 동작합니다.

---

## 1. 발견 (Discovery)

운영 가이드는 프로젝트 `CLAUDE.md`에 경로로 선언합니다 — 기존 `## Language` 규약과 동일한 방식입니다.

```
## OperationGuide
docs/[GUIDE]_RND_OPERATION.md
```

한 줄 형식(`## OperationGuide: docs/[GUIDE]_RND_OPERATION.md`)도 허용합니다.

**해석 주체·전달 경로** (→ `work-pipeline` 스킬):
1. Main Claude(work-pipeline 스킬)가 프로젝트 `CLAUDE.md`에서 `## OperationGuide` 라인을 읽는다.
2. 프로젝트 루트 기준 상대경로를 **절대경로**로 변환한다.
3. orchestrator spawn 프롬프트 상단에 `OPERATION_GUIDE={절대경로}`를 포함해 전달한다
   (`REFERENCES_DIR=`와 **동일한 전달 패턴**).
4. `## OperationGuide`가 없으면 `OPERATION_GUIDE=`를 전달하지 않는다 → 오버레이 비활성(현행 동작).

**읽는 주체**: `OPERATION_GUIDE=`를 받은 orchestrator가 STARTUP에서 가이드를 1회 읽는다. Main Claude는
경계 처리(§2)를 위해 필요한 범위에서 같은 가이드를 참조한다. 가이드는 `<ref-cache>` 슬라이스 대상이
아니다 — 자식(specifier/planner/builder/verifier)에게는 전달되지 않는다(`agent-flow.md`의 References
로딩 원칙과 동일).

---

## 2. 바인딩 지점 + 주체 분담

오버레이 활성 시, 가이드가 지시하는 외부 연동을 파이프라인 이벤트에 **바인딩**한다. **구체 도구명·인자는
가이드에서 읽어 사용**하며 uctm은 도구명을 하드코딩하지 않는다. 지원 백엔드는 `ucpm-mcp`
(`mcp__ucpm-mcp__*`)다.

### orchestrator — 실행 이력 기록(실시간)

파이프라인 진행 중 orchestrator가 각 지점에서 가이드가 지정한 기록 도구를 호출한다.

| 파이프라인 이벤트 | 오버레이 동작(가이드가 지정한 도구로) |
|---|---|
| `ORCHESTRATOR_START` | 실행 run 생성 — 예: `ucpm_pipeline_run_start(workId, reqCode, mode, branch)` |
| 각 `STAGE_DONE`(specifier/planner/builder/verifier/commit) | 단계 기록 + 해당 단계 산출물 원문 저장 — 예: `ucpm_pipeline_step_record`, `ucpm_pipeline_artifact_put` |
| `ORCHESTRATOR_DONE` | run 종료 — 예: `ucpm_pipeline_run_finish(status)` |

- "commit 단계"는 uctm의 orchestrator 인라인 커밋 시점(`STAGE_DONE — stage=commit`)에 매핑한다
  (가이드의 5-에이전트 서술상 committer에 해당).
- 기록은 파이프라인 **substrate 이벤트에 얹는 것**이며, 자식 산출물의 내용·형식을 바꾸지 않는다.

### Main Claude — 생명주기·등록·테스트(경계에서)

파이프라인 밖 경계에서 Main Claude(work-pipeline 스킬)가 가이드의 Main-Claude측 절차를 수행한다.

| 경계 | 오버레이 동작(가이드가 지정한 절차·도구로) |
|---|---|
| 파이프라인 진입 전 | REQ 생성·스프린트 편성 등 상태전이(예: `ucpm_requirement_create`, 스프린트 편성) |
| 게이트 경계(GATE-1/2 등) | 가이드가 요구하는 승인·상태 갱신 |
| WORK 종료 후 | IA/TC 실제 등록(예: `ucpm_ia_node_*`, `ucpm_testcase_*`), REQ 상태전이(`REVIEW` 등) |
| 테스트·릴리스 | 테스트 계획·실행·완료 전이(예: `ucpm_test_plan_*`, `ucpm_test_run_*`, `REVIEW→DONE`) |

- IA/TC 등록 주체는 Main Claude다 — builder는 ucpm 권한이 없다(§4). builder가 위임 명세를 산출하도록
  하는 것은 자식 프롬프트 변경이 필요하므로 이 오버레이 범위 밖이다(§4).

### 축퇴 모드

`agent-flow.md` §7 축퇴 모드에서는 orchestrator 역할이 Main Claude로 넘어오므로, 위 orchestrator측
기록도 Main Claude가 겸해 수행한다. 바인딩 지점·graceful-skip 규칙은 동일하다.

---

## 3. graceful-skip + 백필

가이드가 지목한 도구가 **미연결/미권한/scope 부족**이면(예: mcp 서버 미재빌드, 키 scope 미소급):

1. 해당 외부 호출을 **건너뛴다**(파이프라인을 중단하지 않는다).
2. 활동 로그(`work_{WORK}.log`)를 임시 fallback으로 남긴다 — 파이프라인 진행 자체는 파일 기반으로 계속된다.
3. orchestrator 최종 보고 `## 자동 결정 사항`에 skip 사실·사유·백필 대상 지점을 **1줄** 남긴다.
4. 전제 복구 후(서버 재빌드·재연결, 키 재발급), Main Claude가 로그를 근거로 `run_start`·`step_record`·
   `artifact_put`·`run_finish`(또는 가이드가 지정한 대응 도구)로 **소급 백필**한다.

> 즉, 외부 연동은 항상 **best-effort**다 — 도구가 없어도 파일 기반 파이프라인은 결정적으로 완주한다.

---

## 4. 비목표 / 한계

- **자식 에이전트(specifier/planner/builder/verifier)는 변경하지 않는다.** 오버레이는 orchestrator +
  Main Claude 경계에서만 동작한다.
- 따라서 **자식 산출물 내부를 외부 시스템 형태로 shaping하는 것은 범위 밖**이다. 예:
  - `Requirement.md`에 IA 변경 계획을 ucpm 스키마로 구조화
  - `TASK-*_result.md`에 `@TC-####` placeholder·IA/TC 위임 명세를 산출
  - 이는 ref-cache처럼 **가이드 슬라이스를 자식 프롬프트에 주입**하는 후속 작업이 필요하다.
- 현 오버레이는 자식이 이미 내는 **표준 산출물**(`Requirement.md`/`PLAN.md`/`TASK-*.md`/`*_result.md`)을
  그대로 두고, 그 원문을 `artifact_put`으로 저장하고 상태/등록을 경계에서 매핑하는 데 한정한다.
- 프로젝트 키·인증키 등 환경값은 `.mcp.json`에서 읽으며 uctm·문서·커밋에 하드코딩하지 않는다.
- 가이드 자체가 정한 제약(예: 산출물 원문을 REQ 본문에 복사 금지)은 가이드가 정본이며 오버레이는 이를 침해하지 않는다.
