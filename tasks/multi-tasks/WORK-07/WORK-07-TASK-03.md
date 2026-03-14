# WORK-07-TASK-03: committer.md result.md 직접 작성 + gate 역할

## WORK
WORK-07: 슬라이딩 윈도우 컨텍스트 전달 — result.md 재설계 및 파이프라인 안정성 강화

## Dependencies
- WORK-07-TASK-00 (required): context-handoff 정책 및 4-필드 구조 정의 필요

## Scope

committer.md에 2가지 주요 변경을 수행한다.

### 1. result.md 직접 작성

기존에 builder가 작성하던 result.md를 committer가 직접 작성하도록 변경한다.

**result.md 구조 (context-handoff 기반):**
```markdown
# {WORK_ID}-TASK-XX Result

## Status
{SUCCESS|PARTIAL}

## What (변경 사항)
{builder와 verifier의 context-handoff를 종합하여 무엇이 변경되었는지 기술}

## Why (의사결정 근거)
{왜 이런 방식으로 구현했는지, 대안이 있었다면 왜 선택/기각했는지}

## Caution (주의사항)
{다음 TASK 또는 후속 작업에서 주의해야 할 점}

## Incomplete (미완료)
{완료하지 못한 항목, 보류 사항}

## Files Changed
{변경된 파일 목록}

## Commit
{커밋 해시 및 메시지}
```

**context-handoff 종합 규칙:**
- verifier의 context-handoff(FULL)에서 검증 결과를 반영
- builder의 context-handoff(SUMMARY)에서 구현 의도를 반영
- 두 소스를 종합하여 일관된 result.md를 작성

### 2. gate 역할 — progress.md 확인

committer는 result.md 생성 전에 gate 역할을 수행한다:

**Gate 확인 항목:**
1. `tasks/multi-tasks/{WORK_ID}/{WORK_ID}-TASK-XX-progress.md` 파일이 존재하는가
2. progress.md의 Status가 `COMPLETED`인가
3. progress.md의 Files changed 목록이 비어 있지 않은가

**Gate 실패 시:**
- result.md를 생성하지 않는다
- FAIL 상태를 반환한다
- 실패 사유를 XML 응답에 포함한다:
```xml
<task-result status="fail">
  <reason>progress.md not found / status not COMPLETED / no files changed</reason>
</task-result>
```

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/committer.md` | MODIFY | result.md 작성 로직 추가, gate 역할(progress.md 확인) 추가 |

## Acceptance Criteria
- [ ] committer.md에 result.md 작성 로직이 추가됨
- [ ] result.md 템플릿에 What/Why/Caution/Incomplete 섹션이 포함됨
- [ ] builder(SUMMARY) + verifier(FULL) context-handoff 종합 규칙이 명시됨
- [ ] gate 역할: progress.md 존재 확인 규칙이 명시됨
- [ ] gate 역할: progress.md Status=COMPLETED 확인 규칙이 명시됨
- [ ] gate 실패 시 FAIL 반환 및 사유 포함 규칙이 명시됨
- [ ] 기존 committer 기능(git commit, commit message 생성)이 보존됨

## Verify
```bash
# result.md 작성 로직 확인
grep -qi "result.md" agents/committer.md && echo "PASS: result.md in committer" || echo "FAIL"

# What/Why/Caution/Incomplete 섹션 확인
for field in What Why Caution Incomplete; do
  grep -qi "$field" agents/committer.md && echo "PASS: $field in committer" || echo "FAIL: $field missing"
done

# gate 역할 확인
grep -qi "gate\|게이트" agents/committer.md && echo "PASS: gate role defined" || echo "FAIL"
grep -qi "progress.md" agents/committer.md && echo "PASS: progress.md check in committer" || echo "FAIL"

# FAIL 반환 규칙 확인
grep -qi "fail\|FAIL" agents/committer.md && echo "PASS: FAIL return defined" || echo "FAIL"

# 기존 기능 보존 확인
grep -qi "git commit\|커밋" agents/committer.md && echo "PASS: git commit preserved" || echo "FAIL"
```
