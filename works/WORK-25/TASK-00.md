# TASK-00: builder.md 중복 제거

## WORK
WORK-25: 에이전트 md 파일 중복 제거 및 지침 참조 전환

## Dependencies
- (none)

## Scope
`agents/builder.md`에서 지침 파일과 중복된 내용을 제거하고 참조로 대체한다.

### 제거 대상

1. **§ 3-2 XML Input 파싱** (line 46~61): dispatch XML 예시
   → `xml-schema.md` § 1 참조로 대체. 하단의 builder 고유 파싱 지침 4줄(line 64~67)은 유지

2. **§ 3-5 Self-Check** (line 101~118): Build+Lint 스크립트
   → `shared-prompt-sections.md` § 2 참조로 대체. "빌드/린트 실패 시 보고 전에 반드시 수정" 문구는 유지

3. **§ 3-8 Context-Handoff Output** (line 164~182): task-result XML
   → `xml-schema.md` § 2 (기본 구조) + § 4 (context-handoff 요소) 참조 추가. builder 고유 필드(`<self-check>`, `<notes>`) 설명만 유지

4. **§ 4 Output Language Rule** (line 203~207):
   → `shared-prompt-sections.md` § 1 참조로 대체. builder 고유 규칙(코드 주석 언어, CommentLanguage override)만 유지

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/builder.md` | MODIFY | 중복 제거 및 참조 전환 |

## Acceptance Criteria
- [ ] dispatch XML 코드 블록이 제거되고 참조로 대체됨
- [ ] Build/Lint 스크립트가 제거되고 참조로 대체됨
- [ ] task-result XML이 참조 + 고유 필드 설명으로 간소화됨
- [ ] Output Language Rule이 참조 + 고유 규칙만 남음
- [ ] builder 고유 내용(Serena 우선순위, Progress Checkpoint, ProgressCallback, Retry Protocol 등)은 변경 없음

## Verify
```bash
grep -c "참조" agents/builder.md
grep -c "xml-schema.md" agents/builder.md
grep -c "shared-prompt-sections.md" agents/builder.md
```
