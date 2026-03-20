# TASK-00: agents/ 디렉토리 재구조화

## WORK
WORK-31: 프로젝트 폴더 구조 재구조화 (agents / npm / plugin 분리)

## Dependencies
- (none)

## Scope
agents/ 루트에 있는 en 에이전트 파일 12개를 agents/en/ 하위 디렉토리로 이동한다. agents/en/ 디렉토리를 생성하고, 루트 레벨의 .md 파일을 모두 agents/en/으로 이동한 뒤 원본을 삭제한다.

대상 파일 목록 (12개):
- agent-flow.md
- builder.md
- committer.md
- context-policy.md
- file-content-schema.md
- planner.md
- scheduler.md
- shared-prompt-sections.md
- specifier.md
- verifier.md
- work-activity-log.md
- xml-schema.md

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/en/` | CREATE | en 에이전트 디렉토리 생성 |
| `agents/en/agent-flow.md` | CREATE | 이동 |
| `agents/en/builder.md` | CREATE | 이동 |
| `agents/en/committer.md` | CREATE | 이동 |
| `agents/en/context-policy.md` | CREATE | 이동 |
| `agents/en/file-content-schema.md` | CREATE | 이동 |
| `agents/en/planner.md` | CREATE | 이동 |
| `agents/en/scheduler.md` | CREATE | 이동 |
| `agents/en/shared-prompt-sections.md` | CREATE | 이동 |
| `agents/en/specifier.md` | CREATE | 이동 |
| `agents/en/verifier.md` | CREATE | 이동 |
| `agents/en/work-activity-log.md` | CREATE | 이동 |
| `agents/en/xml-schema.md` | CREATE | 이동 |
| `agents/agent-flow.md` | DELETE | 루트에서 제거 |
| `agents/builder.md` | DELETE | 루트에서 제거 |
| `agents/committer.md` | DELETE | 루트에서 제거 |
| `agents/context-policy.md` | DELETE | 루트에서 제거 |
| `agents/file-content-schema.md` | DELETE | 루트에서 제거 |
| `agents/planner.md` | DELETE | 루트에서 제거 |
| `agents/scheduler.md` | DELETE | 루트에서 제거 |
| `agents/shared-prompt-sections.md` | DELETE | 루트에서 제거 |
| `agents/specifier.md` | DELETE | 루트에서 제거 |
| `agents/verifier.md` | DELETE | 루트에서 제거 |
| `agents/work-activity-log.md` | DELETE | 루트에서 제거 |
| `agents/xml-schema.md` | DELETE | 루트에서 제거 |

## Acceptance Criteria
- [ ] agents/en/ 디렉토리에 12개 .md 파일이 존재
- [ ] agents/ 루트에 .md 파일이 없음 (ko/ 디렉토리만 존재)
- [ ] agents/ko/ 기존 파일 영향 없음

## Verify
```bash
# en 디렉토리 파일 수 확인
ls agents/en/*.md | wc -l  # 12

# 루트에 .md 파일 없음 확인
ls agents/*.md 2>/dev/null | wc -l  # 0

# ko 디렉토리 무결성 확인
ls agents/ko/*.md | wc -l  # 12
```
