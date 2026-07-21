# 작업 활동 로그

`works/{WORK_ID}/work_{WORK_ID}.log`에 실행 이벤트를 기록.

## 규칙

1. **기록 주체**: **orchestrator로 일원화**. 개별 자식 에이전트(specifier/planner/builder/verifier/committer)는 활동 로그에 직접 기록하지 않는다 — orchestrator가 자식의 spawn/완료를 `STAGE_START`/`STAGE_DONE`으로 대신 기록한다.
2. **타임스탬프**: Bash로 `date -u +"%Y-%m-%dT%H:%M:%SZ"` 실행하여 실제 UTC 시간 획득. 더미 값 사용 금지.
3. **기록 방법**: Bash `echo` 로 추가.
4. **execution-mode 헤더**: 로그 파일 최초 기록 시 실행 모드를 1회 남긴다 (형식은 §「실행 헤더」참조).
5. **`STAGE_DONE`은 게이트 통과 후에 기록한다.** 해당 단계에 게이트(`<gate type="stage">` 또는 `<gate type="decision">`)가 있는 경우, Main Claude/사용자의 승인·결정으로 게이트가 해소(RESOLVED)된 시점에만 `STAGE_DONE`을 남긴다. 게이트 대기 중에는 `GATE_WAIT`/`DECISION_WAIT`만 기록되고, `STAGE_DONE`은 아직 기록되지 않은 상태로 남는다.
   - **근거(재개 판정)**: 파이프라인이 중단 후 재개(resume)될 때 orchestrator는 로그의 마지막 이벤트로 재개 지점을 판정한다. 특정 단계에 `STAGE_START`만 있고 `STAGE_DONE`이 없다면 "그 단계의 게이트가 아직 승인/결정되지 않았다"는 뜻이므로, orchestrator는 다음 단계로 건너뛰지 않고 동일 게이트를 다시 제시해야 한다. `STAGE_DONE`을 게이트 통과 이전에 기록하면 재개 시 미승인 게이트를 건너뛰는 사고로 이어진다.

## 실행 헤더

로그 파일 최상단에 1회 기록:

```
[YYYY-MM-DDTHH:MM:SSZ] EXECUTION-MODE — direct|pipeline|full
```

## 형식

```
[YYYY-MM-DDTHH:MM:SSZ] EVENT — description
```

## 이벤트 체계 (orchestrator 기록)

| 이벤트 | 기록 시점 | 예시 |
|--------|----------|------|
| `ORCHESTRATOR_START` | orchestrator 실행 시작 | `ORCHESTRATOR_START — WORK-NN orchestrator started` |
| `STAGE_START` | 자식 에이전트(specifier/planner/builder/verifier/committer) spawn 직전 | `STAGE_START — stage=specifier` |
| `GATE_WAIT` | `<gate type="stage">`에서 정지, Main Claude 승인 대기 | `GATE_WAIT — stage=specifier` |
| `DECISION_WAIT` | `<gate type="decision">` 또는 자식의 `<needs-decision>` 수신 후 결정 대기 | `DECISION_WAIT — stage=planner` |
| `DECISION` | 결정 확정 — 주체는 `user`(사용자 승인) 또는 `auto`(orchestrator 자동결정) | `DECISION — stage=planner by=user` / `DECISION — task=TASK-03 by=auto` |
| `STAGE_DONE` | 게이트 해소(RESOLVED) 후, 또는 게이트가 없는 단계는 완료 즉시 | `STAGE_DONE — stage=specifier` |
| `ORCHESTRATOR_DONE` | orchestrator 실행 종료 (WORK 완료) | `ORCHESTRATOR_DONE — WORK-NN orchestrator completed` |

- `stage` 값: `specifier`/`planner`/`builder`/`verifier`/`committer`.
- `by` 값: `user`/`auto`. `<decision>`(§ 7, `xml-schema.md`)의 `by` 속성과 동일한 값 체계를 사용.
- 확정된 결정의 상세 내용(배경/선택지/권고안/확정값)은 로그가 아니라 `works/{WORK_ID}/DECISIONS.md`에 기록한다 → `file-content-schema.md` § 5 참조. 로그의 `DECISION` 이벤트는 "언제·누가 결정했는지"만 남긴다.
