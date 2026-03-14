# WORK-11-TASK-02: `.claude/agents/router.md` 동일 변경 적용

> WORK: WORK-11 — Router execution-mode 판정 기준 외부 config 파일 분리
> Task: WORK-11-TASK-02
> Depends on: WORK-11-TASK-01
> Status: PENDING

## 목적

TASK-01에서 `agents/router.md`에 적용한 변경 내용을 설치 경로인 `.claude/agents/router.md`에도 동일하게 적용한다.
두 파일은 항상 동기화 상태를 유지해야 한다.

## 작업 내용

### 1. 변경 내용 동기화

`agents/router.md`에서 TASK-01이 변경한 섹션을 확인하고, 동일한 내용을 `.claude/agents/router.md`에 적용한다:

1. §2 앞에 삽입된 "Config 읽기 절차" 서브섹션
2. Routing Criteria 테이블 위에 추가된 config 우선 안내 문구

### 2. 동기화 검증

변경 후 두 파일의 §2 섹션을 비교하여 내용이 일치하는지 확인한다.

```bash
# §2 섹션 비교
diff <(grep -A 50 "## 2\." agents/router.md) \
     <(grep -A 50 "## 2\." .claude/agents/router.md)
```

의도된 차이(frontmatter의 `name:`, `description:`, `tools:` 등)를 제외하고 §2 내용이 동일해야 한다.

## 완료 기준

- [ ] `.claude/agents/router.md`의 §2에 "Config 읽기 절차" 서브섹션 삽입
- [ ] `.claude/agents/router.md`의 Routing Criteria 테이블 위에 config 우선 안내 추가
- [ ] `agents/router.md`와 §2 내용이 동일함 (diff 검증)
- [ ] `.claude/agents/router.md`의 나머지 섹션 미변경
