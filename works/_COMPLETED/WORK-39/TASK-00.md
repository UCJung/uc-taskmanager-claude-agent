# TASK-00: committer.md (ko/en) git staging 로직 변경

## WORK
WORK-39: 커미터 git staging 버그 수정 — works/ 파일 누락 방지

## Dependencies
- (none)

## Scope
양쪽 committer.md에서 다음 3곳을 수정:

1. **2번 업무 테이블** — Git Commit 설명에서 `git add -A` 참조 제거
2. **3-2 실행 순서** — `git add -A && git commit` 참조를 명시적 스테이징으로 변경
3. **3-6 Git Commit 섹션** — `git add -A`를 다음으로 변경:

```bash
# Stage WORK management files (Requirement, PLAN, TASK, progress, result)
git add "works/${WORK_ID}/"

# Stage builder-changed files from progress.md
# (parse Files changed section and add each file)
git add <builder-changed-files>
```

핵심: `git add -A`라는 포괄적 명령 대신, 커미터가 인식할 수 있는 구체적 경로 2종류를 명시하여 Claude Code 안전 규칙과 충돌하지 않도록 한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/ko/committer.md` | MODIFY | 3곳 수정 (2번 테이블, 3-2, 3-6) |
| `agents/en/committer.md` | MODIFY | 3곳 수정 (2번 테이블, 3-2, 3-6) |

## Acceptance Criteria
- [ ] `git add -A` 문구가 committer.md (ko/en) 어디에도 남아있지 않음
- [ ] 3-6 섹션이 works/{WORK_ID}/ 디렉토리 + progress.md 기반 builder 변경 파일을 명시적으로 스테이징
- [ ] 2번 테이블과 3-2 순서가 3-6과 일관됨

## Verify
```bash
# git add -A가 committer.md에 남아있지 않는지 확인
grep -c "git add -A" agents/ko/committer.md agents/en/committer.md
# 예상: 둘 다 0
```
