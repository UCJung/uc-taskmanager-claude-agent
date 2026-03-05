# WORK-01-TASK-02: README 문서 업데이트

## WORK
WORK-01: 언어 감지 방식 변경 (시스템 로케일 → CLAUDE.md 기반 + 사용자 질문)

## Dependencies
- WORK-01-TASK-01 (required)

## Scope
README.md(영문)와 README_KO.md(한글)의 "Output Language" 섹션을 새 방식으로 업데이트.

변경 내용:
1. 시스템 로케일 자동 감지 → CLAUDE.md 기반 설명으로 변경
2. 흐름도 추가: CLAUDE.md 확인 → 사용자 질문 → 거부 시 로케일 감지 + CLAUDE.md 기록
3. 기존 테이블(감지 언어 적용 / 항상 English) 유지

## Files
| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | Output Language (Auto-Detect) 섹션 업데이트 |
| `README_KO.md` | MODIFY | 산출물 언어 (자동 감지) 섹션 업데이트 |

## Acceptance Criteria
- [ ] CLAUDE.md 기반 언어 설정 흐름 설명 존재
- [ ] 거부 시 시스템 로케일 감지 + CLAUDE.md 기록 설명 존재
- [ ] 영문/한글 내용이 동일한 의미

## Verify
```bash
grep -c "CLAUDE.md" README.md
grep -c "CLAUDE.md" README_KO.md
```
