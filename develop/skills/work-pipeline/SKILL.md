---
name: work-pipeline
description: Triggers the WORK-PIPELINE. Use this skill when 
(1) user message starts with a bracketed tag like [anything], e.g. [WORK], [new-feature], [bugfix], [New game], [enhancement]
(2) user asks to resume/continue a WORK-NN (e.g., "WORK-01 계속실행", "resume WORK-01", "WORK-01 실행", "continue WORK-01").
---

# WORK-PIPELINE 트리거

## 트리거 감지

**새 WORK** — 메시지가 `[]` 태그로 시작하면 실행:
- `[new-feature]`, `[enhancement]`, `[bugfix]`, `[new-work]`, `[WORK start]`
- 또는 대괄호 안의 커스텀 태그

**WORK 재개** — 메시지에 기존 WORK-ID와 실행 의도가 있을 때:
- "WORK-XX 계속실행", "WORK-XX 실행", "resume WORK-XX", "continue WORK-XX"
- "파이프라인 재개", "WORK 계속"

두 경우 모두 아래 "오케스트레이션 흐름"을 따릅니다.

## References Directory (CRITICAL)

이 스킬이 트리거되면 Claude Code가 "Base directory for this skill"을 절대 경로로 제공합니다.
여기서 **REFERENCES_DIR**을 유도합니다:

```
REFERENCES_DIR = {Base directory}/../../references
```

`orchestrator` spawn 시 이 절대 경로를 반드시 전달해야 합니다. orchestrator가 레퍼런스 파일을 찾기 위해 이 경로가 필요합니다. 없으면 파일을 찾지 못하고 루프에 빠집니다.

## 운영 가이드 감지 (선택 — Operation Guide Overlay)

프로젝트 `CLAUDE.md`에 `## OperationGuide` 선언이 있으면 **운영 가이드 오버레이**를 활성화합니다.
가이드는 uctm의 파일 기반 파이프라인 위에 상태전이·외부기록·등록·테스트/릴리스 정책을 얹는
**프로젝트 저작 정책 문서**입니다. 상세 계약 → `../../references/operation-guide.md`.

1. 프로젝트 `CLAUDE.md`에서 `## OperationGuide` 라인을 읽습니다(한 줄 형식 `## OperationGuide: <경로>`도 허용).
   `## Language` 규약과 동일한 방식입니다.
2. 선언된 경로(프로젝트 루트 기준 상대경로)를 **절대경로**로 변환해 **OPERATION_GUIDE**로 둡니다.
3. `orchestrator` spawn 시(gated/auto 모두) 프롬프트 상단에 `OPERATION_GUIDE={절대경로}`를 `REFERENCES_DIR=`
   와 **동일한 방식**으로 포함합니다.
4. `## OperationGuide` 선언이 없으면 `OPERATION_GUIDE=`를 전달하지 않습니다 → 오버레이 비활성(현행 동작).

## Main Claude 운영 가이드 책무 (오버레이 활성 시)

오버레이가 활성이면 Main Claude는 **파이프라인 밖 경계**에서 가이드의 Main-Claude측 절차를 수행합니다
(orchestrator는 실행 이력 기록만 담당 → `operation-guide.md` § 2). 각 절차의 도구·상태값은 가이드가 정본입니다.

- **파이프라인 진입 전**: REQ 생성·스프린트 편성 등 상태전이(예: `ucpm_requirement_create`).
- **게이트 경계(GATE-1/2)**: 가이드가 요구하는 승인·상태 갱신을 게이트 처리와 함께 수행.
- **WORK 종료 후**: IA/TC 실제 등록(예: `ucpm_ia_node_*`, `ucpm_testcase_*`)과 REQ 상태전이(`REVIEW` 등).
- **테스트·릴리스**: 테스트 계획·실행·완료 전이(예: `ucpm_test_plan_*`, `ucpm_test_run_*`, `REVIEW→DONE`).

가이드가 지목한 도구가 미연결/미권한이면 **graceful-skip**하고 전제 복구 후 소급 백필합니다
(→ `operation-guide.md` § 3). 축퇴 모드(§ 아래)에서는 Main Claude가 orchestrator측 실행 이력 기록도 겸합니다.

## Auto 모드 감지

사용자의 메시지에 "auto" 또는 "자동으로"가 포함되면 **auto 모드**로 spawn합니다. 그 외에는 **gated 모드**(기본값)로 spawn합니다.

## 오케스트레이션 흐름

Main Claude는 `orchestrator` 에이전트 하나만 spawn합니다. specifier/planner/builder/verifier 4종은 orchestrator가 내부에서 중첩 spawn(TASK DAG 스케줄링 포함)하므로 Main Claude가 직접 호출하지 않습니다. 커밋과 result.md 작성은 orchestrator가 인라인으로 수행합니다.

### Gated 모드 (기본값 — "auto"/"자동으로" 없음)

1. **최초 spawn**: `orchestrator`를 `mode=gated`로 spawn. 프롬프트 상단에 `REFERENCES_DIR=...`와 `mode=gated`(오버레이 활성 시 `OPERATION_GUIDE=...`도)를 포함하고, 사용자 요청 원문(및 재개 시 `WORK_ID`)을 전달. 반환된 **agentId를 보관**한다(다음 재개에 사용).
2. **`<gate>` 수신 시 정지**: orchestrator가 `<gate type="stage">`(고정 게이트: specifier 완료 후 / planner 완료 후) 또는 `<gate type="decision">`(동적 의사결정)을 반환하면 orchestrator는 그 자리에서 yield(파킹)한 상태다.
   - `type="stage"`: `<summary>`를 사용자에게 제시하고 진행 승인을 요청.
   - `type="decision"`: `<context>`/`<options>`/`<recommended>`를 **AskUserQuestion**으로 제시해 사용자 선택을 받는다.
3. **재개**: 사용자의 승인 또는 결정을 **`SendMessage(agentId, 결정내용)`으로 orchestrator에 전달해 재개**한다(컨텍스트 유지). agentId가 유실되었거나 SendMessage가 실패하면(세션 종료, 크로스세션 등) 로그(`work_{WORK}.log`) 기반으로 orchestrator를 **re-spawn**하는 폴백을 사용한다 — 이 경우도 재개 지정은 name이 아니라 **agentId**(또는 재-spawn 결과의 새 agentId)로 한다.
4. **반복**: 2~3을 orchestrator가 최종 WORK 요약을 반환할 때까지 반복한다.
5. **종료**: orchestrator가 최종 요약(`## 자동 결정 사항` 포함)을 반환하면 사용자에게 제시하고, **`TaskStop(agentId)`으로 orchestrator를 종료**한다.

### Auto 모드 ("auto"/"자동으로" 포함)

1. `orchestrator`를 `mode=auto`로 **1회만 spawn**. 프롬프트 상단에 `REFERENCES_DIR=...`와 `mode=auto`(오버레이 활성 시 `OPERATION_GUIDE=...`도)를 포함.
2. 게이트/의사결정 정지 없이 orchestrator가 전체 파이프라인을 완주하고 최종 요약(`## 자동 결정 사항` 포함)을 반환한다.
3. 반환된 최종 요약을 사용자에게 제시한다. (파킹 상태가 아니므로 TaskStop 불필요.)

## 축퇴 모드 (중첩 spawn 미지원 환경)

orchestrator가 `<capability-degraded reason="no-agent-tool">`을 반환하면, 그 환경은 서브에이전트에 `Agent` 도구를 주지 않아 중첩 spawn이 불가능한 상태입니다(CLI 버전에 따라 발생). orchestrator는 아무 산출물도 만들지 않고 즉시 반환하므로 디스크에는 아무것도 없습니다.

이때 Main Claude가 **orchestrator 역할을 넘겨받습니다**:

1. 사용자에게 1줄 알린다 — "중첩 spawn 미지원 환경 — Main Claude가 직접 오케스트레이션합니다". 승인을 기다리지 않고 진행.
2. `{REFERENCES_DIR}/orchestrator.md`와 레퍼런스 5종을 읽는다.
3. `orchestrator.md` 절차를 그대로 수행한다 — 자식 4종(specifier/planner/builder/verifier)을 **직접 spawn**(depth=1)하고, 커밋과 result.md 작성은 Main Claude가 인라인으로 수행하며, ref-cache 조립·활동 로그·TASK DAG·재시도 규칙을 동일하게 적용한다.
4. 활동 로그에 `ORCHESTRATOR_DEGRADED — reason=no-agent-tool`을 기록한다.
5. 게이트는 `<gate>` XML/`SendMessage` 없이 사용자에게 **직접** 질의한다.

→ 상세: `agent-flow.md` § 7

## ⚠️ CRITICAL: 에이전트 Spawn 규칙

- **정상 경로**에서 Main Claude가 spawn하는 에이전트는 **orchestrator 하나뿐**이다. Main Claude가 직접 코드 구현, 파일 생성, git 명령 실행 또는 orchestrator의 작업을 수행하면 안 된다.
- **축퇴 모드**에서는 Main Claude가 자식 4종을 직접 spawn한다. 단 이 경우에도 **자식 역할을 스스로 대행하지는 않는다** — 반드시 각 에이전트를 spawn해야 한다. 커밋은 자식 spawn 대상이 아니라 Main Claude가 인라인으로 수행한다.
- 게이트 재개는 항상 **agentId** 기준(SendMessage/TaskStop 모두)으로 한다 — name 재사용에 의한 오배달을 방지한다.

## Arguments

사용자 요구사항: $ARGUMENTS
