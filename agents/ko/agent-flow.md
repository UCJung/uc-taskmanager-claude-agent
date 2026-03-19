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
2. [승인 1회] 사용자 검토 (요구사항 + 설계 통합)
3. builder 호출 (dispatch XML을 prompt로) — self-check 포함
4. committer 호출 (builder 결과를 prompt로)
```

> Verifier 생략: Builder가 self-check(build/lint)를 수행하므로 단일 TASK에서 별도 검증 불필요.

---

## pipeline 모드 (Planner 별도 호출)

```
1. specifier 호출 → Requirement.md 생성 + planner dispatch XML 반환
2. [기획 승인] 사용자 검토 (Requirement.md)
3. planner 호출 (dispatch XML을 prompt로) → PLAN.md + TASK-NN 생성 + execution-mode 결정
4. [개발 승인] 사용자 검토 (PLAN.md + TASK 목록)
5. builder 호출 (TASK별 dispatch XML을 prompt로)
6. verifier 호출 (builder 결과를 prompt로)
7. committer 호출 (verifier 결과를 prompt로)
```

---

## full 모드 (Scheduler 포함)

```
1. specifier 호출 → Requirement.md 생성 + planner dispatch XML 반환
2. [기획 승인] 사용자 검토 (Requirement.md)
3. planner 호출 → PLAN.md + TASK 분해 + execution-mode: full 결정
4. [개발 승인] 사용자 검토 (PLAN.md + TASK 목록)
5. scheduler 호출 → DAG 분석 + READY TASK + builder dispatch XML 반환
6. builder 호출 (dispatch XML을 prompt로) → 구현
7. verifier 호출 (builder 결과를 prompt로) → 검증
8. committer 호출 (verifier 결과를 prompt로) → commit
9. 미완료 TASK 있으면 5번으로 돌아감
```

병렬 실행: scheduler가 복수의 READY TASK를 반환하면 builder를 동시에 호출한다.

---

## 기존 WORK 재개

이미 PLAN.md + TASK가 존재하는 WORK의 파이프라인 재개:

```
1. scheduler 호출 → READY TASK 확인 + builder dispatch XML 반환
2. builder → verifier → committer 순서대로 실행
3. 미완료 TASK 있으면 1번으로 돌아감
```

---

## 에이전트 역할 요약

| 에이전트 | 반환값 | 호출 주체 |
|---------|-------|---------|
| specifier | Requirement.md + (겸임 시) PLAN.md/TASK + dispatch XML | Main Claude |
| planner | PLAN.md/TASK 파일 생성 완료 + execution-mode | Main Claude |
| scheduler | READY TASK + dispatch XML | Main Claude |
| builder | task-result XML (context-handoff 포함) | Main Claude |
| verifier | task-result XML | Main Claude |
| committer | task-result XML + commit hash | Main Claude |

---

## 모드별 서브에이전트 호출 횟수

| 모드 | Specifier | Planner | Scheduler | Builder | Verifier | Committer | 합계 |
|------|:---------:|:-------:|:---------:|:-------:|:--------:|:---------:|:----:|
| direct | O (겸임) | X | X | O | X | O | **3회** |
| pipeline | O | O | X | O | O | O | **5회** |
| full | O | O | O | O | O | O | **6회** |

---

## 승인 게이트

| 모드 | 승인 횟수 | 시점 |
|------|:---------:|------|
| direct | 1회 | Specifier 완료 후 (요구사항 + 설계 통합) |
| pipeline/full | 2회 | 기획 승인 (Requirement.md) → 개발 승인 (PLAN.md) |
| 자동 승인 | 0회 | "자동으로 진행" 명시 시 |

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

## 컨텍스트 전달 (슬라이딩 윈도우)

| 거리 | Level | 내용 |
|------|-------|------|
| 직전 | FULL | what + why + caution + incomplete |
| 2단계 전 | SUMMARY | what 1~2줄 |
| 3단계+ | DROP | 전달 안 함 |
