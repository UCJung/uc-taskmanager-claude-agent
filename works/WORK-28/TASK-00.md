# TASK-00: 검토 리포트 발견사항 반영 및 v1.1 업데이트

## WORK
WORK-28: MCP Integration Design 설계 명세서 v1.1 업데이트

## Dependencies
- (none)

## Scope
WORK-27 검토 리포트의 CRITICAL 1건, HIGH 6건, MEDIUM 7건 발견사항을 반영하여 설계 명세서를 수정한다.

### CRITICAL
- C-1: `${workId}-TASK-XX.md` -> `TASK-XX.md` 파일명 수정 (4.2절)

### HIGH
- H-1: `tasks/` -> `works/` 경로 전역 수정
- H-2: `TASK-XX-result.md` -> `TASK-XX_result.md` 파일명 수정
- H-3: create_work에 Execution-Mode 판정 로직 추가
- H-4: 슬라이딩 윈도우 컨텍스트 전달 MCP 구현 전략 추가
- H-5: `BACKLOG.md` -> `works/WORK-LIST.md` 참조 수정
- H-6: push_work에 Push 절차 반영

### MEDIUM
- M-1: Router 프롬프트 MCP Prompts 추가
- M-2: MCP SDK API `registerTool()` -> `server.tool()` 수정
- M-3: approve_plan 모드별 동작 구분 추가
- M-4: retry_task 재시도 대상 구분 추가
- M-5: PLAN.md "APPROVED" 마킹 -> 현행 방식 반영
- M-6: config://agents 리소스 구체화
- M-7: Activity Log MCP 환경 유지 전략 추가

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/plan_MCP-Integration-Design.md` | MODIFY | v1.1 업데이트 |

## Acceptance Criteria
- [ ] CRITICAL 1건 수정 완료
- [ ] HIGH 6건 수정 완료
- [ ] MEDIUM 7건 수정 완료
- [ ] 문서 버전이 v1.1로 변경됨

## Verify
```bash
# 마크다운 문서이므로 빌드/린트 불필요. 내용 검증만 수행.
grep "v1.1" docs/plan_MCP-Integration-Design.md
grep -c "tasks/" docs/plan_MCP-Integration-Design.md  # 0이어야 함
grep -c "BACKLOG.md" docs/plan_MCP-Integration-Design.md  # 0이어야 함
```
