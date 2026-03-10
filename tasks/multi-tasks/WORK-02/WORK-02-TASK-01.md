# WORK-02-TASK-01: router.md WORK 번호 검증 로직 추가

## WORK
WORK-02: WORK Seq 인식 오류 개선

## Dependencies
- WORK-02-TASK-00 (required)

## Scope
router.md의 "WORK Assignment Process" 섹션에 WORK 번호 검증 로직을 추가한다.

핵심 변경:
1. **이중 소스 검증**: 파일시스템 스캔 결과와 WORK-LIST.md의 최대 WORK 번호를 비교
2. **최댓값+1 규칙**: 두 소스 중 더 큰 값에 +1을 하여 새 WORK ID로 사용
3. **검증 bash 코드**: router가 planner 호출 전 WORK ID를 사전 검증할 수 있는 스크립트 예시 추가
4. **불일치 경고**: 파일시스템과 WORK-LIST.md의 WORK 번호가 불일치할 경우 사용자에게 경고하는 규칙

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/router.md` | MODIFY | WORK Assignment Process 섹션에 검증 로직 추가 |

## Acceptance Criteria
- [ ] 파일시스템과 WORK-LIST.md를 모두 스캔하여 최댓값을 구하는 로직이 명시됨
- [ ] 최댓값+1을 새 WORK ID로 사용하는 규칙이 명시됨
- [ ] bash 검증 코드 예시가 포함됨
- [ ] 기존 WORK-LIST.md 관리 로직(Section 5)과 충돌 없음
- [ ] 불일치 시 경고 규칙이 포함됨

## Verify
```bash
# 최댓값 규칙 확인
grep -q "최댓값\|최대\|max" /c/rnd/agent/uc-taskmanager/agents/router.md && echo "PASS: max-value rule found" || echo "FAIL"

# 파일시스템 언급 확인
grep -q "파일시스템\|filesystem" /c/rnd/agent/uc-taskmanager/agents/router.md && echo "PASS: filesystem mention found" || echo "FAIL"

# bash 코드 예시 확인
grep -q "WORK_FS\|WORK_LIST\|sort -V" /c/rnd/agent/uc-taskmanager/agents/router.md && echo "PASS: bash example found" || echo "FAIL"
```
