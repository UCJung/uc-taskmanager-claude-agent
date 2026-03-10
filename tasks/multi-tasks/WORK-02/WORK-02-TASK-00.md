# WORK-02-TASK-00: planner.md WORK ID Assignment 로직 개선

## WORK
WORK-02: WORK Seq 인식 오류 개선

## Dependencies
- (없음)

## Scope
planner.md의 "WORK ID Assignment" 섹션을 재작성한다.

핵심 변경:
1. **파일시스템 우선 규칙**: `ls -d tasks/multi-tasks/WORK-* 2>/dev/null | sort -V | tail -1` 결과를 유일한 WORK 번호 소스로 사용
2. **MEMORY.md 참조 금지**: WORK ID 결정 시 MEMORY.md의 WORK 번호를 참조하지 않도록 명시적 금지 규칙 추가
3. **중복 방지 안전장치**: 할당하려는 WORK-XX 디렉토리가 이미 존재하면 즉시 중단(abort)하고 사용자에게 보고하는 규칙 추가
4. **Interaction Protocol 섹션**: MEMORY.md 업데이트 관련 4번 항목 제거 또는 수정 (MEMORY.md에 WORK 번호를 기록하는 단계가 더 이상 필요 없음)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/planner.md` | MODIFY | WORK ID Assignment 섹션 재작성, Interaction Protocol 수정 |

## Acceptance Criteria
- [ ] "WORK ID Assignment" 섹션에 파일시스템만을 소스로 사용하는 규칙이 명시됨
- [ ] MEMORY.md의 WORK 번호를 참조하지 말라는 명시적 금지 규칙이 있음
- [ ] 할당 대상 디렉토리가 이미 존재할 경우 abort하는 안전장치가 있음
- [ ] Interaction Protocol에서 MEMORY.md WORK 번호 업데이트 단계가 제거됨
- [ ] 기존 Discovery Process의 파일시스템 스캔 명령은 그대로 유지됨

## Verify
```bash
# 파일시스템 우선 규칙 존재 확인
grep -q "파일시스템" /c/rnd/agent/uc-taskmanager/agents/planner.md && echo "PASS: filesystem-first rule found" || echo "FAIL"

# MEMORY.md 참조 금지 규칙 존재 확인
grep -q "MEMORY.md" /c/rnd/agent/uc-taskmanager/agents/planner.md && echo "PASS: MEMORY.md mention found" || echo "FAIL"

# abort 안전장치 존재 확인
grep -qi "abort\|중단" /c/rnd/agent/uc-taskmanager/agents/planner.md && echo "PASS: abort safeguard found" || echo "FAIL"
```
