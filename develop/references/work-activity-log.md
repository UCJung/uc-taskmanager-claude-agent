# 작업 활동 로그

`works/{WORK_ID}/work_{WORK_ID}.log`에 에이전트 시작/종료 이벤트를 기록.

## 규칙

1. **타임스탬프**: Bash로 `date -u +"%Y-%m-%dT%H:%M:%SZ"` 실행하여 실제 UTC 시간 획득. 더미 값 사용 금지.
2. **기록 방법**: Bash `echo` 로 추가. 
3. **항목**: 에이전트 역할별 START와 DONE만. 중간 단계 없음.

## 형식

```
[YYYY-MM-DDTHH:MM:SSZ] AGENT_EVENT — description
```

## 필수 항목

| 에이전트 | START | DONE |
|----------|-------|------|
| specifier | `SPECIFIER_START — WORK-NN specifier started` | `SPECIFIER_DONE — WORK-NN specifier completed` |
| planner | `PLANNER_START — WORK-NN planner started` | `PLANNER_DONE — WORK-NN planner completed` |
| scheduler | `SCHEDULER_START — WORK-NN scheduler started` | `SCHEDULER_DONE — WORK-NN scheduler completed` |
| builder | `BUILDER_START — TASK-NN implement` | `BUILDER_DONE — TASK-NN complete` |
| verifier | `VERIFIER_START — TASK-NN verification` | `VERIFIER_DONE — TASK-NN verified` |
| committer | `COMMITTER_START — TASK-NN commit` | `COMMITTER_DONE — TASK-NN committed` |
