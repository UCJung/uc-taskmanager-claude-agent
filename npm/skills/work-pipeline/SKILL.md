---
name: work-pipeline
description: Triggers the WORK-PIPELINE. Use this skill when (1) user request starts with a [] tag (e.g., [new-feature], [bugfix]), or (2) user asks to resume/continue a WORK (e.g., "WORK-01 계속실행", "resume WORK-01", "WORK-01 실행", "continue WORK-01").
---

# WORK-PIPELINE 트리거

`../../references/agent-flow.md`를 읽고 오케스트레이션 흐름을 따릅니다.

## 트리거 감지

**새 WORK** — 메시지가 `[...]` 태그로 시작:
- `[new-feature]`, `[enhancement]`, `[bugfix]`, `[new-work]`, `[WORK start]`
- 또는 대괄호 안의 커스텀 태그

**WORK 재개** — 메시지에 기존 WORK-ID와 실행 의도가 있을 때:
- "WORK-XX 계속실행", "WORK-XX 실행", "resume WORK-XX", "continue WORK-XX"
- "파이프라인 재개", "WORK 계속"
- → agent-flow.md § 기존 WORK 재개 따르기

## References Directory (CRITICAL)

이 스킬이 트리거되면 Claude Code가 "Base directory for this skill"을 절대 경로로 제공합니다.
여기서 **REFERENCES_DIR**을 유도합니다:

```
REFERENCES_DIR = {Base directory}/../../references
```

**모든 서브에이전트 호출**(specifier, planner, scheduler, builder, verifier, committer)에 이 절대 경로를 반드시 전달해야 합니다.
프롬프트 텍스트 상단에 포함:

```
REFERENCES_DIR={absolute_path}
```

서브에이전트가 레퍼런스 파일을 찾기 위해 이 경로가 필요합니다. 없으면 파일을 찾지 못하고 루프에 빠집니다.

## 콜백 정보 전달

사용자의 프롬프트에 `CALLBACK_URL=...`과 `CALLBACK_TOKEN=...`이 포함되어 있으면, 이 값을 추출하여 REFERENCES_DIR과 함께 **모든 서브에이전트 호출**에 전달:

```
CALLBACK_URL={url}
CALLBACK_TOKEN={token}
```

**Main Claude (이 스킬)는 절대 콜백을 직접 전송하지 말 것.** 서브에이전트만 콜백을 전송.

## 파이프라인 흐름

1. **specifier 에이전트 spawn** (Agent 도구 사용) — 요구사항 분석, `works/WORK-NN/Requirement.md` 생성, execution-mode 결정 (direct/pipeline/full)
2. **⛔ 정지 — specifier의 출력 요약을 사용자에게 제시하고 명시적 승인 대기.** 사용자가 승인할 때까지 다음 에이전트를 호출하지 말 것. 생성된 내용(Requirement.md, direct 모드면 PLAN.md, TASK 파일)을 보여주고 "진행할까요?" 질문
3. **specifier가 반환한 execution-mode에 따라 진행:**
   - `direct`: builder spawn → verifier spawn → committer spawn
   - `pipeline`: planner spawn → 각 TASK에 대해 → builder spawn → verifier spawn → committer spawn
   - `full`: planner spawn → **⛔ 2차 승인 정지** → scheduler spawn → 각 TASK에 대해 → builder spawn → verifier spawn → committer spawn

## ⚠️ CRITICAL: 에이전트 Spawn 규칙

- **모든 에이전트는 Agent 도구를 통해 spawn해야 합니다.** Main Claude가 직접 코드 구현, 파일 생성, git 명령 실행 또는 에이전트의 작업을 수행하면 안 됩니다.
- specifier가 builder dispatch XML을 반환하면 builder 에이전트에 전달할 것 — 직접 실행하지 말 것.

## Auto 모드

사용자의 메시지가 "auto" 또는 "자동으로"로 끝나면, 모든 승인 단계를 건너뛰고 전체 파이프라인을 자동 실행합니다. 승인 게이트를 건너뛸 수 있는 유일한 경우입니다.

Auto 모드 감지 시, 모든 서브에이전트 프롬프트에 "auto"를 포함합니다.

## Arguments

사용자 요구사항: $ARGUMENTS
