# TASK-02: committer.md 중복 제거

## WORK
WORK-25: 에이전트 md 파일 중복 제거 및 지침 참조 전환

## Dependencies
- (none)

## Scope
`agents/committer.md`에서 지침 파일과 중복된 내용을 제거하고 참조로 대체한다.

### 제거 대상

1. **§ 3-2 XML Input 파싱** (line 46~58): dispatch XML 예시
   → `xml-schema.md` § 1 참조로 대체

2. **§ 3-3 Gate Check** (line 75~80): gate 스크립트
   → `file-content-schema.md` § 3 참조로 대체. Gate 실패 시 XML(line 84~88)도 `xml-schema.md` § 2 참조 추가

3. **§ 3-9 결과 보고** (line 163~179): task-result XML
   → `xml-schema.md` § 2 참조로 대체. committer 고유 필드(`<commit>`, `<result-file>`, `<progress>`, `<next-tasks>`)만 유지

4. **§ 4 Output Language Rule** (line 202~205):
   → `shared-prompt-sections.md` § 1 참조로 대체. "섹션 헤더 → resolved language", "Git commit type → 항상 영어" 고유 규칙만 유지

※ **이미 참조 전환된 항목**:
- § 3-4 Result Report 생성 (line 94): 이미 `file-content-schema.md` § 4 참조
- § 3-9 마지막 줄 (line 182~183): 이미 `shared-prompt-sections.md` § 8 참조
- § 4 WORK-LIST.md 규칙 (line 199~200): 이미 참조 내용 반영됨

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/committer.md` | MODIFY | 중복 제거 및 참조 전환 |

## Acceptance Criteria
- [ ] dispatch XML 코드 블록이 제거되고 참조로 대체됨
- [ ] Gate 스크립트가 제거되고 참조로 대체됨
- [ ] task-result XML이 참조 + 고유 필드만 남음
- [ ] Output Language Rule이 참조 + 고유 규칙만 남음
- [ ] 기존 참조는 유지됨

## Verify
```bash
grep -c "참조" agents/committer.md
grep -c "xml-schema.md" agents/committer.md
```
