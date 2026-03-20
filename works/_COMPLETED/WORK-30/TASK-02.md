# TASK-02: Plugin README 작성 및 Marketplace 제출 준비

## WORK
WORK-30: Claude Marketplace Plugin 형식 전환

## Dependencies
- TASK-01 (required)

## Scope
Marketplace 페이지에 표시될 Plugin README를 작성한다 (영문).
에이전트 목록, 사용법, 설치 가이드, Plugin과 npm CLI 양립 설명을 포함한다.
기존 README.md를 Plugin 호환 구조로 업데이트하거나, 필요 시 별도 구성한다.
Acceptance Criteria 전체를 최종 확인한다.

README 포함 내용:
- Plugin 설명 (Marketplace 검색/표시용)
- 에이전트 5개 역할 요약 (specifier, planner, scheduler, builder, verifier + committer 등)
- 사용법 ([] 태그 기반 파이프라인 시작)
- 설치 방법 (Marketplace Plugin vs npm CLI)
- 라이선스

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | Plugin 설명 통합, Marketplace 호환 구조 |

## Acceptance Criteria
- [ ] README.md에 Plugin 설명, 에이전트 목록, 사용법이 포함
- [ ] 영문으로 작성 (Marketplace 표준)
- [ ] Marketplace 등록에 필요한 정보가 모두 포함
- [ ] 전체 Requirement.md Acceptance Criteria 충족 최종 확인

## Verify
```bash
# 1. README 존재 및 내용 확인
test -f README.md && echo "PASS: README.md exists"
grep -q "plugin" README.md && echo "PASS: plugin mention found"
grep -q "agent" README.md && echo "PASS: agent mention found"

# 2. 전체 AC 체크 — 모든 필수 파일 존재
test -f .claude-plugin/plugin.json && echo "PASS: plugin.json"
ls agents/*.md | wc -l  # 12
```
