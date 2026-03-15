# TASK-00: README.md / README_KO.md 에이전트 문서 구조 섹션 갱신

## WORK
WORK-16: README에 에이전트 문서 구조(4섹션) 설명 반영

## Dependencies
- (none)

## Scope
README.md와 README_KO.md의 "Agent File Design" / "에이전트 파일 설계" 섹션에서 4섹션 구조 설명을 현행 agents/*.md 파일 형식과 일치하도록 수정한다.

현행 agents/*.md 파일의 실제 구조:
1. 역할 (Role)
2. 수행업무 (Responsibilities)
3. 업무수행단계 및 내용 (Execution Steps)
4. 제약사항 및 금지사항 (Constraints and Prohibitions)

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | Agent File Design 섹션의 4섹션 구조 설명 갱신 |
| `README_KO.md` | MODIFY | 에이전트 파일 설계 섹션의 4섹션 구조 설명 갱신 |

## Acceptance Criteria
- [ ] README.md의 4섹션 구조 설명이 실제 agents/*.md 파일의 섹션명과 일치함
- [ ] README_KO.md의 4섹션 구조 설명이 실제 agents/*.md 파일의 섹션명과 일치함
- [ ] 기존 문서 맥락(전후 내용)이 유지됨

## Verify
```bash
# 확인: README.md에 4섹션 명칭이 존재하는지
grep -n "수행업무\|업무수행단계\|제약사항 및 금지사항" /c/rnd/agent/uc-taskmanager/README.md
grep -n "수행업무\|업무수행단계\|제약사항 및 금지사항" /c/rnd/agent/uc-taskmanager/README_KO.md
```
