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

## Auto 모드 감지

사용자의 메시지에 "auto" 또는 "자동으로"가 포함되면 **auto 모드**로 spawn합니다. 그 외에는 **gated 모드**(기본값)로 spawn합니다.

## 오케스트레이션 흐름

Main Claude는 `orchestrator` 에이전트 하나만 spawn합니다. specifier/planner/builder/verifier/committer는 orchestrator가 내부에서 중첩 spawn(TASK DAG 스케줄링 포함)하므로 Main Claude가 직접 호출하지 않습니다.

### Gated 모드 (기본값 — "auto"/"자동으로" 없음)

1. **최초 spawn**: `orchestrator`를 `mode=gated`로 spawn. 프롬프트 상단에 `REFERENCES_DIR=...`와 `mode=gated`를 포함하고, 사용자 요청 원문(및 재개 시 `WORK_ID`)을 전달. 반환된 **agentId를 보관**한다(다음 재개에 사용).
2. **`<gate>` 수신 시 정지**: orchestrator가 `<gate type="stage">`(고정 게이트: specifier 완료 후 / planner 완료 후) 또는 `<gate type="decision">`(동적 의사결정)을 반환하면 orchestrator는 그 자리에서 yield(파킹)한 상태다.
   - `type="stage"`: `<summary>`를 사용자에게 제시하고 진행 승인을 요청.
   - `type="decision"`: `<context>`/`<options>`/`<recommended>`를 **AskUserQuestion**으로 제시해 사용자 선택을 받는다.
3. **재개**: 사용자의 승인 또는 결정을 **`SendMessage(agentId, 결정내용)`으로 orchestrator에 전달해 재개**한다(컨텍스트 유지). agentId가 유실되었거나 SendMessage가 실패하면(세션 종료, 크로스세션 등) 로그(`work_{WORK}.log`) 기반으로 orchestrator를 **re-spawn**하는 폴백을 사용한다 — 이 경우도 재개 지정은 name이 아니라 **agentId**(또는 재-spawn 결과의 새 agentId)로 한다.
4. **반복**: 2~3을 orchestrator가 최종 WORK 요약을 반환할 때까지 반복한다.
5. **종료**: orchestrator가 최종 요약(`## 자동 결정 사항` 포함)을 반환하면 사용자에게 제시하고, **`TaskStop(agentId)`으로 orchestrator를 종료**한다.

### Auto 모드 ("auto"/"자동으로" 포함)

1. `orchestrator`를 `mode=auto`로 **1회만 spawn**. 프롬프트 상단에 `REFERENCES_DIR=...`와 `mode=auto`를 포함.
2. 게이트/의사결정 정지 없이 orchestrator가 전체 파이프라인을 완주하고 최종 요약(`## 자동 결정 사항` 포함)을 반환한다.
3. 반환된 최종 요약을 사용자에게 제시한다. (파킹 상태가 아니므로 TaskStop 불필요.)

## ⚠️ CRITICAL: 에이전트 Spawn 규칙

- Main Claude가 spawn하는 에이전트는 **orchestrator 하나뿐**이다. Main Claude가 직접 코드 구현, 파일 생성, git 명령 실행 또는 orchestrator의 작업을 수행하면 안 된다.
- 게이트 재개는 항상 **agentId** 기준(SendMessage/TaskStop 모두)으로 한다 — name 재사용에 의한 오배달을 방지한다.

## Arguments

사용자 요구사항: $ARGUMENTS
