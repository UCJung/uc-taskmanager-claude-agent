# WORK-04-TASK-01: 전역 반영 및 완료 처리

## 목적

TASK-00에서 수정된 `agents/builder.md`를 전역 위치에 복사하여 반영한다.

## 작업

### 1. 전역 반영

TASK-00 완료 후 수정된 파일을 전역 Claude agents 디렉토리에 복사:

```bash
cp C:/rnd/agent/uc-taskmanager/agents/builder.md C:/Users/ucjung/.claude/agents/builder.md
```

### 2. 복사 후 검증

두 파일이 동일한지 확인:
```bash
diff "C:/rnd/agent/uc-taskmanager/agents/builder.md" "C:/Users/ucjung/.claude/agents/builder.md"
```
차이 없으면 성공.

## 완료 기준

- `~/.claude/agents/builder.md`와 `uc-taskmanager/agents/builder.md`가 동일한 내용
- diff 결과 출력 없음
