# TASK-04: router.md 중복 제거

## WORK
WORK-25: 에이전트 md 파일 중복 제거 및 지침 참조 전환

## Dependencies
- (none)

## Scope
`agents/router.md`에서 지침 파일과 중복된 내용을 제거하고 참조로 대체한다.

### 제거 대상

1. **§ 3-5 pipeline 디스패치 XML** (line 109~122): dispatch XML 예시
   → `xml-schema.md` § 1 참조로 대체. "builder 디스패치 subagent 실행 후 메시지 디스패치" 문구는 유지

2. **§ 3-6 full 디스패치 XML** (line 136~162): planner/scheduler dispatch XML 예시
   → `xml-schema.md` § 1 참조로 대체. 절차 설명(1~4단계)과 "호출은 Main Claude가 수행" 문구는 유지

3. **§ 4 Output Language Rule** (line 181~183):
   → `shared-prompt-sections.md` § 1 참조로 대체. "dispatch <context><language> 필드로 전달" 고유 규칙만 유지

※ **이미 참조 전환된 항목**:
- § 4 WORK-LIST.md 규칙 (line 173): 이미 `shared-prompt-sections.md` § 8 참조

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/router.md` | MODIFY | 중복 제거 및 참조 전환 |

## Acceptance Criteria
- [ ] pipeline dispatch XML이 참조로 대체됨
- [ ] full dispatch XML이 참조로 대체됨
- [ ] Output Language Rule이 참조 + 고유 규칙만 남음
- [ ] router 고유 로직(execution-mode 결정, WORK ID 결정, direct 모드 실행)은 변경 없음

## Verify
```bash
grep -c "참조" agents/router.md
grep -c "xml-schema.md" agents/router.md
```
