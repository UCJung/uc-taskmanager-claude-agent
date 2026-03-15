# TASK-05: planner.md 중복 제거

## WORK
WORK-25: 에이전트 md 파일 중복 제거 및 지침 참조 전환

## Dependencies
- (none)

## Scope
`agents/planner.md`에서 지침 파일과 중복된 내용을 제거하고 참조로 대체한다.

### 제거 대상

1. **§ 3-8 Output Language Rule** (line 128~138):
   - 공통 부분 (우선순위 규칙) → `shared-prompt-sections.md` § 1 참조로 대체
   - planner 고유 로직 (로케일 감지 스크립트, PLAN.md Language 필드 기록)은 유지

※ planner는 다른 에이전트에 비해 중복이 적음:
- § 3-2 프로젝트 탐색: planner 고유 Discovery (기술 스택 감지 등) → 유지
- § 3-3 WORK ID 결정: planner 고유 버전 (router와 다름) → 유지
- § 3-7 MCP Tool 활용: planner 고유 → 유지

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/planner.md` | MODIFY | 중복 제거 및 참조 전환 |

## Acceptance Criteria
- [ ] Output Language Rule 공통 부분이 참조로 대체됨
- [ ] planner 고유 로케일 감지 로직은 유지됨
- [ ] 나머지 섹션은 변경 없음

## Verify
```bash
grep -c "참조" agents/planner.md
grep -c "shared-prompt-sections.md" agents/planner.md
```
