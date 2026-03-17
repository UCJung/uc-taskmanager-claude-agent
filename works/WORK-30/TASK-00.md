# TASK-00: TASK 간 의존성 context-handoff 전달 로직 설계문서 반영

## WORK
WORK-30: TASK 간 의존성 context-handoff 전달 로직 설계문서 반영

## Dependencies
(none)

## Scope
1. 3.7절에 TASK 간 의존성 context-handoff 하위 섹션 추가 (applyTaskDependencyWindow, result.md에서 context-handoff 추출, DAG shortest path)
2. 3.3.2절 execute_task의 previous_context 생성 로직 보강
3. 7.3절에 TASK 간 전달 다이어그램 추가
4. 문서 버전 v1.2 -> v1.3
5. 부록 C 체크리스트에 v1.3 반영 항목 추가

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/plan_MCP-Integration-Design.md` | MODIFY | 5개 영역 수정 |

## Acceptance Criteria
- [ ] 3.7절에 applyTaskDependencyWindow() 함수 설계 포함
- [ ] 3.3.2절에 previous_context 자동 주입 로직 설명 포함
- [ ] 7.3절에 TASK-00 -> TASK-01 -> TASK-02 체인 다이어그램 포함
- [ ] 버전 v1.3 업데이트
- [ ] 부록 C에 v1.3 체크리스트 추가

## Verify
```bash
# 문서 편집만이므로 빌드/린트 검증 불필요
echo "PASS"
```
