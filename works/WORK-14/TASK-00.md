# TASK-00: README.md / README_KO.md 현행화

## WORK
WORK-14: README 및 doc 파일 현행화 — agent 리팩토링 반영

## Dependencies
- (none)

## Scope
README.md와 README_KO.md를 현행 agent 파일 내용과 동기화한다.

주요 변경 사항:
1. README_KO.md 파일 구조 섹션: `tasks/multi-tasks/` → `works/` 경로 갱신
2. README_KO.md 저장소 구조 섹션: 누락된 파일 추가 (context-policy.md, xml-schema.md, shared-prompt-sections.md, file-content-schema.md)
3. README_KO.md 에이전트 파일 목록 완성
4. README.md 파일 구조 섹션의 파일명 규칙 테이블 현행화
5. PROGRESS.md의 Log 섹션(Work Activity Log) 설명 반영

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | 파일 구조, 저장소 구조 현행화 |
| `README_KO.md` | MODIFY | 파일 구조, 저장소 구조 현행화 |

## Acceptance Criteria
- [ ] README_KO.md 파일 구조 섹션이 works/ 경로를 사용
- [ ] README_KO.md 저장소 구조에 context-policy.md, xml-schema.md, shared-prompt-sections.md, file-content-schema.md 포함
- [ ] README.md와 README_KO.md 내용이 현행 agent 파일과 일치

## Verify
```bash
grep "tasks/multi-tasks" README_KO.md && echo "FAIL: old path found" || echo "PASS"
grep "context-policy.md" README_KO.md && echo "PASS" || echo "FAIL: missing"
```
