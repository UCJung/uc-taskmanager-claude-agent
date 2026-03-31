# Agent Flow — Main Claude 오케스트레이션 가이드

> **모든 에이전트 호출은 Main Claude가 수행합니다.**
> 서브에이전트는 작업 완료 후 결과(dispatch XML 또는 task-result XML)만 반환합니다.
> Main Claude가 반환값을 받아 다음 에이전트를 호출합니다.

---

## 파이프라인 흐름

```
[] 태그 감지 → specifier 호출
    │
    specifier 반환값 확인
    │
    ├─ 겸임 (direct) → specifier가 Requirement.md + PLAN.md + TASK-00 생성
    │                    → builder dispatch XML 반환
    │                    → § direct 절차 실행
    │
    └─ 위임 (pipeline/full) → specifier가 Requirement.md만 생성
                                → planner dispatch XML 반환
                                → § planner 주도 절차 실행
```

---

## Direct 모드 (Specifier가 Planner 겸임)

```
1. specifier 호출 → Requirement.md + PLAN.md + TASK-00 생성 + builder dispatch XML 반환
2. ⛔ 정지 — 요약을 사용자에게 제시하고 승인 대기 (builder를 호출하지 말 것)
3. builder 호출 (dispatch XML을 프롬프트로) — 셀프 체크 포함
4. verifier 호출 (builder 결과를 프롬프트로) — 빌드/린트/테스트 검증
5. committer 호출 (verifier 결과를 프롬프트로) — result.md 생성 + git commit
```

---

## Pipeline 모드

```
1. specifier 호출 → Requirement.md 생성
2. planner 호출 → PLAN.md + TASK-NN 생성 + execution-mode 결정
3. ⛔ 정지 — Requirement.md + PLAN.md + TASK 목록을 제시하고 승인 대기
4. 각 TASK에 대해 (오름차순):
   a. builder 호출 (TASK별 dispatch XML을 프롬프트로)
   b. verifier 호출 (builder 결과를 프롬프트로)
   c. committer 호출 (verifier 결과를 프롬프트로)
   d. 미완료 TASK가 남아있으면 다음 TASK로 계속
```

---

## Full 모드 (Scheduler 포함)

```
1. specifier 호출 → Requirement.md 생성
2. planner 호출 → PLAN.md + TASK들 + execution-mode: full 생성
3. ⛔ 정지 — Requirement.md + PLAN.md + TASK 목록을 제시하고 승인 대기
4. scheduler 호출 → DAG 분석 + READY TASK + builder dispatch XML 반환
5. builder 호출 (dispatch XML을 프롬프트로) → 구현
6. verifier 호출 (builder 결과를 프롬프트로) → 검증
7. committer 호출 (verifier 결과를 프롬프트로) → 커밋
8. 미완료 TASK가 남아있으면 4단계로 돌아감
```

병렬 실행: scheduler가 여러 READY TASK를 반환하면 builder를 동시에 호출.

---

## 기존 WORK 재개

PLAN.md + TASK가 이미 있는 WORK의 파이프라인 재개:

```
1. works/{WORK_ID}/work_{WORK_ID}.log의 마지막 줄을 읽어 현재 상태 판단
   핵심 규칙: *_START = 중단됨 (해당 단계 재수행), *_DONE = 완료됨 (다음으로 이동)

   - COMMITTER_DONE — TASK-NN  → TASK-NN 완료, 다음 TASK부터 재개
   - COMMITTER_START — TASK-NN → 중단됨, TASK-NN committer 재수행
   - VERIFIER_DONE — TASK-NN   → 검증됨, TASK-NN committer부터 재개
   - VERIFIER_START — TASK-NN  → 중단됨, TASK-NN verifier 재수행
   - BUILDER_DONE — TASK-NN    → 빌드됨, TASK-NN verifier부터 재개
   - BUILDER_START — TASK-NN   → 중단됨, TASK-NN builder 재수행
   - PLANNER_DONE              → 계획 완료, 첫 TASK 시작
   - PLANNER_START             → 중단됨, planner 재수행
   - SPECIFIER_DONE            → specifier 완료, planner 호출
   - SPECIFIER_START           → 중단됨, specifier 재수행
   - 로그 파일 없음            → 처음부터 시작

2. 남은 각 TASK에 대해:
   a. builder 호출 → 구현
   b. verifier 호출 → 검증
   c. committer 호출 → 커밋
```

---

## 에이전트 역할 요약

| 에이전트 | 역할 | 모델 |
|----------|------|------|
| specifier | 요구사항 분석 | opus |
| planner | PLAN + TASK 분해 | opus |
| scheduler | DAG 관리 + 디스패치 | haiku |
| builder | 코드 구현 | sonnet |
| verifier | 빌드/린트/테스트 검증 | haiku |
| committer | 결과 보고서 + git commit | haiku |

---

## 모드별 서브에이전트 Spawn 수

| 모드 | Specifier | Planner | Scheduler | Builder | Verifier | Committer | 합계 |
|------|:---------:|:-------:|:---------:|:-------:|:--------:|:---------:|:----:|
| direct | 1 (겸임) | — | — | 1 | 1 | 1 | **4** |
| pipeline (N TASK) | 1 | 1 | — | N | N | N | **2 + 3N** |
| full (N TASK) | 1 | 1 | 1 | N | N | N | **3 + 3N** |

---

## 승인 게이트 (CRITICAL)

> **반드시 정지하고 명시적 사용자 승인을 기다려야 합니다.**
> "approve", "승인", "proceed", "진행" 등의 응답이 올 때까지 다음 에이전트를 호출하지 말 것.
> 유일한 예외는 auto 모드 — 사용자의 원본 메시지에 "auto" 또는 "자동으로"가 포함된 경우.

| 모드 | 승인 횟수 | 시점 | 사용자에게 보여줄 내용 |
|------|:---------:|------|------------------------|
| direct | 1 | Specifier 완료 후 | Requirement.md + PLAN.md + TASK-00.md 요약 |
| pipeline/full | 1 | Planner 완료 후 | Requirement.md + PLAN.md + TASK 목록 |
| auto-approve | 0 | — | 모든 승인 게이트 생략 |

**승인 요청 방법:**
1. 생성된 내용 요약 제시 (파일, 범위, execution-mode)
2. "진행할까요?" 또는 동등한 질문
3. **사용자 응답 대기** — 승인 전까지 builder를 호출하지 말 것

---

## References Directory 전달 (필수)

Main Claude는 모든 서브에이전트 호출 시 references 디렉토리 경로를 전달해야 합니다.
설치 방법(npm 또는 plugin)에 관계없이 서브에이전트가 레퍼런스 파일을 찾을 수 있도록 합니다.

**전달 방법:**
- 모든 Task tool 호출의 프롬프트 상단에 `REFERENCES_DIR={absolute_path}` 추가
- npm 설치: `.claude/references` 사용 (프로젝트 루트 기준 기본값)
- plugin 설치: 스킬의 "Base directory"에서 유도 (`{base_dir}/../../references`)

**예시:**
```
REFERENCES_DIR=C:/Users/me/.claude/plugins/cache/uc-taskmanager/abc123/references

<dispatch to="builder" ...>
  ...
</dispatch>
```

REFERENCES_DIR를 사용할 수 없는 경우 (예: plugin 없는 npm 설치), 서브에이전트는 `.claude/references/`를 폴백으로 사용.

---

## Context Handoff (슬라이딩 윈도우)

| 거리 | 레벨 | 내용 |
|------|------|------|
| 직전 | FULL | what + why + caution + incomplete |
| 2단계 전 | SUMMARY | what 1-2줄 |
| 3단계+ | DROP | 전달하지 않음 |

---

## 레퍼런스 로딩

각 서브에이전트는 시작 시 `{REFERENCES_DIR}/`에서 자체 레퍼런스 파일을 읽습니다. Main Claude는 레퍼런스 파일을 읽지 않으며 — `agent-flow.md`만 읽습니다.
