# TASK-01: verifier.md 중복 제거

## WORK
WORK-25: 에이전트 md 파일 중복 제거 및 지침 참조 전환

## Dependencies
- (none)

## Scope
`agents/verifier.md`에서 지침 파일과 중복된 내용을 제거하고 참조로 대체한다.

### 제거 대상

1. **§ 3-2 XML 입력 파싱** (line 45~57): dispatch XML 예시
   → `xml-schema.md` § 1 참조로 대체

2. **§ 3-3 Progress File Gate** (line 62~67): gate 스크립트
   → `file-content-schema.md` § 3 + `context-policy.md` Committer 섹션 참조로 대체. "CRITICAL 실패 시 즉시 중단" 문구는 유지

3. **§ 3-4 Build** (line 73~85): build 스크립트
   → `shared-prompt-sections.md` § 2 참조로 대체. "Exit ≠ 0 → CRITICAL FAIL" 문구는 유지

4. **§ 3-5 Lint** (line 91~98): lint 스크립트
   → `shared-prompt-sections.md` § 2 참조로 대체. "실패 시 WARN" 문구는 유지

5. **§ 3-6 Tests** (line 105~114): test 스크립트
   → 테스트는 verifier 고유이므로 유지할 수도 있으나, `shared-prompt-sections.md`에 없으므로 유지

6. **§ 3-10 결과 XML 출력** (line 133~158): task-result XML
   → `xml-schema.md` § 2 + § 4 참조로 대체. verifier 고유 필드(`<verification>` 상세 체크 목록, `<failure-details>`)만 유지

7. **§ 4 Output Language Rule** (line 174~176):
   → `shared-prompt-sections.md` § 1 참조로 대체. "명령 출력은 원문 유지" 고유 규칙만 유지

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/verifier.md` | MODIFY | 중복 제거 및 참조 전환 |

## Acceptance Criteria
- [ ] dispatch XML 코드 블록이 제거되고 참조로 대체됨
- [ ] Gate 스크립트가 제거되고 참조로 대체됨
- [ ] Build/Lint 스크립트가 제거되고 참조로 대체됨
- [ ] Tests 스크립트는 유지됨 (verifier 고유)
- [ ] task-result XML이 참조 + 고유 필드만 남음
- [ ] Output Language Rule이 참조 + 고유 규칙만 남음

## Verify
```bash
grep -c "참조" agents/verifier.md
grep -c "xml-schema.md" agents/verifier.md
grep -c "shared-prompt-sections.md" agents/verifier.md
```
