# TASK-00: Callback/Webhook 전략 섹션 추가 및 문서 v1.2 업데이트

## WORK
WORK-29: MCP Integration Design v1.2 - Callback/Webhook 전략 반영

## Dependencies
- (none)

## Scope
docs/plan_MCP-Integration-Design.md에 다음 결정사항을 반영:
1. 인증 헤더 통일 (X-Runner-Api-Key)
2. 콜백 실패 정책 (Level 1 + 배치 보정)
3. callback_status.json 스키마 정의
4. PipelineStageCallback 정식 정의
5. 콜백 사용 여부 MCP 설정
6. 2트랙 콜백 전략 구조
7. Webhook Relay 모듈 설계

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/plan_MCP-Integration-Design.md` | MODIFY | v1.1 -> v1.2 업데이트, 3.9절 신규 추가, 기존 섹션 보완 |

## Acceptance Criteria
- [ ] 문서 버전 v1.1 -> v1.2 업데이트
- [ ] 3.9 Callback/Webhook 전략 섹션 신규 추가
- [ ] 3.3.3 Monitor Tools에 sync_callbacks 추가
- [ ] 3.2 프로젝트 구조에 webhook-relay.ts, callback-status.ts 추가
- [ ] 4절에 webhook-relay 구현 예시 추가
- [ ] 6절 Phase 2에 Webhook Relay TASK 추가
- [ ] callback_status.json 스키마 정의
- [ ] MCP config에 콜백 설정 예시 추가

## Verify
```bash
# 문서 파일 존재 확인
test -f docs/plan_MCP-Integration-Design.md && echo "PASS" || echo "FAIL"
```
