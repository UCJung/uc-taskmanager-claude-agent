# TASK-00: README 소개글 한국어 안내 추가

## WORK
WORK-26: README 소개글에 한국어 기술 문서 안내 추가

## Dependencies
- (none)

## Scope
README.md의 "Why This Project Exists" 섹션과 README_KO.md의 "이 프로젝트를 만든 이유" 섹션에 기술 문서와 에이전트 프롬프트가 한국어로 작성되어 있다는 안내를 자연스럽게 추가한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | 영어 소개글에 한국어 문서 안내 추가 |
| `README_KO.md` | MODIFY | 한국어 소개글에 동일 내용 추가 |

## Acceptance Criteria
- [ ] README.md에 한국어 기술 문서 안내가 자연스럽게 포함됨
- [ ] README_KO.md에 동일한 내용의 한국어 버전이 포함됨

## Verify
```bash
# 파일 존재 확인
test -f README.md && test -f README_KO.md && echo "PASS"
```
