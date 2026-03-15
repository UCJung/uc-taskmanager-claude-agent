# TASK-00: planner.md router.md 형식으로 재편

## WORK
WORK-18: 나머지 에이전트 파일 5개 router.md 형식으로 재편

## Dependencies
- (none)

## Scope

agents/planner.md를 agents/router.md의 4섹션 구조와 동일한 형식으로 재편한다.

목표 구조:
1. 역할
2. 수행업무 (표 형식)
3. 업무수행단계 및 내용 (3-1. STARTUP, 3-2. ..., 3-N. ...)
4. 제약사항 및 금지사항

기존 내용(What You Do, MCP Tool Usage, Discovery Process, WORK ID 결정, Task Decomposition Rules, Output Structure, Interaction Protocol 등)은 유지하면서 위 4섹션 구조에 맞게 재배치한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/planner.md` | MODIFY | router.md 4섹션 구조로 재편 |

## Acceptance Criteria
- [ ] 파일 첫 부분에 `## 1. 역할` 섹션 존재
- [ ] `## 2. 수행업무` 섹션에 표 형식 업무 목록 존재
- [ ] `## 3. 업무수행단계 및 내용` 하위에 3-N 번호 붙은 단계별 섹션 존재
- [ ] `## 4. 제약사항 및 금지사항` 섹션 존재
- [ ] 기존 기능 내용(WORK ID 결정, Task Decomposition Rules 등) 누락 없음
- [ ] YAML 프론트매터(name, description, tools, model) 유지

## Verify
```bash
grep -n "## 1\. 역할\|## 2\. 수행업무\|## 3\. 업무수행단계\|## 4\. 제약사항" agents/planner.md
```
