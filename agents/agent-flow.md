# Agent Flow — Main Claude 오케스트레이션 가이드

> **모든 에이전트 호출은 Main Claude가 수행한다.**
> 서브에이전트는 작업 완료 후 결과(dispatch XML 또는 task-result XML)만 반환한다.
> Main Claude가 반환값을 받아 다음 에이전트를 호출한다.

---

## 실행 모드 결정

```
[] 태그 감지 → router 호출
    │
    router 반환값(execution-mode) 확인
    │
    ├─ direct   → router가 직접 처리 완료 (추가 호출 없음)
    ├─ pipeline → § pipeline 절차 실행
    └─ full     → § full 절차 실행
```

---

## direct 모드

router가 단독으로 처리 완료. Main Claude 추가 호출 없음.

---

## pipeline 모드

```
1. router 호출 → PLAN.md + TASK-00.md 생성 + builder dispatch XML 반환
2. builder 호출 (dispatch XML을 prompt로)
3. verifier 호출 (builder 결과를 prompt로)
4. committer 호출 (verifier 결과를 prompt로)
```

---

## full 모드

```
1. router 호출 → WORK 디렉토리 생성 + planner dispatch XML 반환
2. planner 호출 (dispatch XML을 prompt로) → PLAN.md + TASK 파일 생성
3. scheduler 호출 → DAG 분석 + READY TASK + builder dispatch XML 반환
4. builder 호출 (dispatch XML을 prompt로) → 구현
5. verifier 호출 (builder 결과를 prompt로) → 검증
6. committer 호출 (verifier 결과를 prompt로) → commit
7. 미완료 TASK 있으면 3번으로 돌아감
```

병렬 실행: scheduler가 복수의 READY TASK를 반환하면 builder를 동시에 호출한다.

---

## 에이전트 역할 요약

| 에이전트 | 반환값 | 호출 주체 |
|---------|-------|---------|
| router | execution-mode + dispatch XML | Main Claude |
| planner | PLAN.md/TASK 파일 생성 완료 보고 | Main Claude |
| scheduler | READY TASK + dispatch XML | Main Claude |
| builder | task-result XML (context-handoff 포함) | Main Claude |
| verifier | task-result XML | Main Claude |
| committer | task-result XML + commit hash | Main Claude |

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

검증 결과 (WORK-24): `claude -p` → Task tool 9회 호출 → router/planner/scheduler/builder/verifier/committer 전체 자동 완주 확인됨.

---

## 컨텍스트 전달 (슬라이딩 윈도우)

| 거리 | Level | 내용 |
|------|-------|------|
| 직전 | FULL | what + why + caution + incomplete |
| 2단계 전 | SUMMARY | what 1~2줄 |
| 3단계+ | DROP | 전달 안 함 |
