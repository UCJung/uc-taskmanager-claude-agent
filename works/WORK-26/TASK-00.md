# TASK-00: 참조문서 5개 핵심 축소

## WORK
WORK-26: agents 참조문서 5개 핵심 축소

## Dependencies
- (none)

## Scope
5개 참조문서에서 불필요한 중복, 장황한 설명, 예시 과다를 제거하여 핵심만 남긴다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/file-content-schema.md` | MODIFY | 다국어 매핑 테이블 삭제, § 4/§ 5 통합, COMPLIANCE 간결화 |
| `agents/shared-prompt-sections.md` | MODIFY | § 7 중복 제거("§ 1 참조"로 대체), § 4 간결화 |
| `agents/xml-schema.md` | MODIFY | § 3/§ 5 통합하여 중복 제거 |
| `agents/context-policy.md` | MODIFY | XML 예시 3개->1개 축소, 재시도 규칙 1줄 요약 |
| `agents/work-activity-log.md` | MODIFY | 장황한 설명 테이블화, 오타 수정 |

## Acceptance Criteria
- [ ] 각 에이전트 프롬프트의 섹션 참조(§ N)가 깨지지 않음
- [ ] 필수 스키마/포맷 정보가 유지됨
- [ ] 총 줄 수 약 35% 이상 축소

## Verify
```bash
# 파일 존재 확인
ls agents/file-content-schema.md agents/shared-prompt-sections.md agents/xml-schema.md agents/context-policy.md agents/work-activity-log.md
```
