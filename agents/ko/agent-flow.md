# Agent Flow — Main Claude 오케스트레이션 가이드

> **모든 에이전트 호출은 Main Claude가 수행한다.**
> 서브에이전트는 작업 완료 후 결과(dispatch XML 또는 task-result XML)만 반환한다.
> Main Claude가 반환값을 받아 다음 에이전트를 호출한다.

---

## 파이프라인 흐름

```
[] 태그 감지 → specifier 호출
    │
    specifier 반환값 확인
    │
    ├─ 겸임 (direct) → specifier가 Requirement.md + PLAN.md + TASK-00 생성
    │                   → builder dispatch XML 반환
    │                   → § direct 절차 실행
    │
    └─ 위임 (pipeline/full) → specifier가 Requirement.md만 생성
                               → planner dispatch XML 반환
                               → § planner-driven 절차 실행
```

---

## direct 모드 (Specifier 겸임)

```
1. specifier 호출 → Requirement.md + PLAN.md + TASK-00 생성 + builder dispatch XML 반환
2. ⛔ STOP — 산출물 요약을 사용자에게 제시하고 승인을 기다린다 (builder 호출 금지)
3. builder 호출 (dispatch XML을 prompt로) — self-check 포함
4. verifier+committer 호출 (builder 결과를 prompt로) — 단일 spawn에서 검증 후 커밋
```

> Verifier+Committer 통합: 단일 spawn에서 검증 수행 후 result.md 생성 + git commit.

---

## pipeline 모드 (Planner 별도 호출)

```
1. specifier+planner 호출 (단일 spawn) → Requirement.md + PLAN.md + TASK-NN 생성 + execution-mode 결정
2. ⛔ STOP — Requirement.md + PLAN.md + TASK 목록을 제시하고 승인을 기다린다
3. builder 호출 (TASK별 dispatch XML을 prompt로)
4. verifier+committer 호출 (builder 결과를 prompt로) — 단일 spawn에서 검증 후 커밋
```

> Specifier+Planner 통합: specifier.md 역할 (Requirement.md) 수행 후 planner.md 역할 (PLAN.md + TASKs) 순차 수행.

---

## full 모드 (Scheduler 포함)

```
1. specifier+planner 호출 (단일 spawn) → Requirement.md + PLAN.md + TASK 분해 + execution-mode: full
2. ⛔ STOP — Requirement.md + PLAN.md + TASK 목록을 제시하고 승인을 기다린다
3. scheduler 호출 → DAG 분석 + READY TASK + builder dispatch XML 반환
4. builder 호출 (dispatch XML을 prompt로) → 구현
5. verifier+committer 호출 (builder 결과를 prompt로) → 단일 spawn에서 검증 후 커밋
6. 미완료 TASK 있으면 3번으로 돌아감
```

병렬 실행: scheduler가 복수의 READY TASK를 반환하면 builder를 동시에 호출한다.

---

## 기존 WORK 재개

이미 PLAN.md + TASK가 존재하는 WORK의 파이프라인 재개:

```
1. scheduler 호출 → READY TASK 확인 + builder dispatch XML 반환
2. builder 호출 → 구현
3. verifier+committer 호출 → 단일 spawn에서 검증 후 커밋
4. 미완료 TASK 있으면 1번으로 돌아감
```

---

## 통합 에이전트 호출

### Specifier+Planner (단일 spawn)

pipeline/full 모드에서 specifier 호출 시 양쪽 에이전트 정의를 포함:

```
에이전트에 전달할 프롬프트:
  "두 가지 역할을 순서대로 수행하라.

   역할 1 — Specifier: specifier.md를 읽고 Requirement.md를 생성하라.
   역할 2 — Planner: planner.md를 읽고 PLAN.md + TASK 파일을 생성하라.

   역할 1을 먼저 수행한 후 역할 2를 수행하라. 통합 결과를 반환하라."
```

- specifier의 모델(opus)로 spawn
- REFERENCES_DIR에서 specifier.md와 planner.md 양쪽 참조
- 반환: Requirement.md + PLAN.md + TASK 파일 + execution-mode

### Verifier+Committer (단일 spawn)

builder 완료 후 검증 호출 시:

```
에이전트에 전달할 프롬프트:
  "두 가지 역할을 순서대로 수행하라.

   역할 1 — Verifier: verifier.md를 읽고 build/lint/test를 검증하라.
   역할 2 — Committer: committer.md를 읽고 result.md를 생성하고 git commit하라.

   역할 1을 먼저 수행하라. 검증 통과 시 역할 2를 수행하라.
   검증 실패 시 역할 2를 건너뛰고 FAIL 결과만 반환하라."
```

- verifier의 모델(haiku)로 spawn
- REFERENCES_DIR에서 verifier.md와 committer.md 양쪽 참조
- 통과 시: 검증 결과 + commit hash 반환
- 실패 시: 검증 실패만 반환 (커밋 없음)

---

## 에이전트 역할 요약

| 에이전트 | 역할 | 모델 | 통합 대상 |
|---------|------|------|----------|
| specifier | 요구사항 분석 | opus | + planner (pipeline/full) |
| planner | PLAN + TASK 분해 | opus | specifier spawn에 통합 |
| scheduler | DAG 관리 + dispatch | haiku | 단독 |
| builder | 코드 구현 | sonnet | 단독 |
| verifier | build/lint/test 검증 | haiku | + committer |
| committer | 결과 보고 + git commit | haiku | verifier spawn에 통합 |

---

## 모드별 서브에이전트 Spawn 횟수

| 모드 | Spec+Plan | Scheduler | Builder | Veri+Commit | 합계 |
|------|:---------:|:---------:|:-------:|:-----------:|:----:|
| direct | 1 (겸임) | — | 1 | 1 | **3** |
| pipeline | 1 (통합) | — | 1 | 1 | **3** |
| full (N TASK) | 1 (통합) | 1 | N | N | **2 + 2N** |

**Before vs After (6 TASK 기준):**

| | Before | After | 감소율 |
|---|:---:|:---:|:---:|
| Spawn 횟수 | 2 + 3×6 = 20 | 2 + 2×6 = 14 | **-30%** |

---

## 승인 게이트 (CRITICAL)

> **반드시 STOP하고 사용자의 명시적 승인을 기다린 후 다음 에이전트를 호출하라.**
> 사용자가 "승인", "approve", "진행", "go ahead" 등으로 응답할 때까지 다음 단계로 넘어가지 마라.
> 유일한 예외는 auto 모드 — 사용자의 원래 메시지에 "auto" 또는 "자동으로"가 포함된 경우.

| 모드 | 승인 횟수 | 시점 | 사용자에게 보여줄 내용 |
|------|:---------:|------|----------------------|
| direct | 1회 | Specifier 완료 후 | Requirement.md + PLAN.md + TASK-00.md 요약 |
| pipeline/full | 1회 | Specifier+Planner 완료 후 | Requirement.md + PLAN.md + TASK 목록 |
| 자동 승인 | 0회 | — | 모든 승인 게이트 생략 |

> 참고: pipeline/full 승인이 **2회에서 1회**로 줄었다 (specifier+planner가 단일 spawn이므로).

**승인 요청 방법:**
1. specifier+planner가 생성한 산출물 요약을 제시 (파일, 범위, execution-mode)
2. "진행할까요?" 또는 동등한 질문
3. **사용자 응답을 기다린다** — 승인 전까지 builder를 호출하지 마라

---

## Bash CLI 실행 (서버 자동화)

대화 세션 없이 파이프라인을 독립 실행하는 방법. `claude -p`가 Main Claude 역할을 수행한다.

```bash
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p \
  "[WORK 시작] {작업 내용}" \
  --dangerously-skip-permissions \
  --output-format stream-json \
  --verbose \
  2>&1 | tee /tmp/pipeline.log
```

| 옵션 | 목적 |
|------|------|
| `env -u CLAUDECODE` | 중첩 실행 차단 우회 |
| `env -u ANTHROPIC_API_KEY` | API 키 대신 구독 인증(Max) 사용 |
| `--dangerously-skip-permissions` | 무인 실행 시 권한 프롬프트 스킵 |
| `--output-format stream-json --verbose` | 실시간 모니터링용 스트리밍 |

중단된 파이프라인 재개:
```bash
env -u CLAUDECODE -u ANTHROPIC_API_KEY claude -p \
  "WORK-XX 파이프라인을 이어서 실행하라." \
  --dangerously-skip-permissions
```

---

## 참조 디렉토리 전달 (REQUIRED)

Main Claude는 모든 서브에이전트 호출 시 참조 디렉토리 경로를 반드시 전달해야 한다.
이를 통해 서브에이전트가 설치 방식(npm 또는 plugin)에 관계없이 참조 파일을 찾을 수 있다.

**전달 방법:**
- 모든 Task tool 호출의 프롬프트 상단에 `REFERENCES_DIR={절대경로}`를 추가
- npm 설치: `.claude/agents` 사용 (기본값, 프로젝트 루트 기준)
- plugin 설치: skill의 "Base directory"에서 도출 (`{base_dir}/../sdd-pipeline/references`)

**예시:**
```
REFERENCES_DIR=C:/Users/me/.claude/plugins/cache/uc-taskmanager/abc123/skills/sdd-pipeline/references

<dispatch to="builder" ...>
  ...
</dispatch>
```

REFERENCES_DIR을 사용할 수 없는 경우 (예: plugin 없이 npm 설치), 서브에이전트는 `.claude/agents/`를 기본값으로 사용한다.

---

## 컨텍스트 전달 (슬라이딩 윈도우)

| 거리 | Level | 내용 |
|------|-------|------|
| 직전 | FULL | what + why + caution + incomplete |
| 2단계 전 | SUMMARY | what 1~2줄 |
| 3단계+ | DROP | 전달 안 함 |
