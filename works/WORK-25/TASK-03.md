# TASK-03: scheduler.md 중복 제거

## WORK
WORK-25: 에이전트 md 파일 중복 제거 및 지침 참조 전환

## Dependencies
- (none)

## Scope
`agents/scheduler.md`에서 지침 파일과 중복된 내용을 제거하고 참조로 대체한다.

### 제거 대상

1. **§ 3-2 WORK 식별** (line 49~56): FS discovery 스크립트
   → `shared-prompt-sections.md` § 4 참조로 대체. 하단의 초기 상태 로드(line 62~65)는 scheduler 고유이므로 유지

2. **§ 3-5 Builder Dispatch XML** (line 98~111): dispatch XML
   → `xml-schema.md` § 1 참조로 대체. "호출은 Main Claude가 수행" 문구는 유지

3. **§ 3-7 Verifier Dispatch XML** (line 138~158): dispatch XML + 슬라이딩 윈도우
   → `xml-schema.md` § 1 + `context-policy.md` Scheduler 디스패치 섹션 참조로 대체. "FAIL → builder 재시도" 고유 로직은 유지

4. **§ 3-8 Committer Dispatch XML** (line 165~210): dispatch XML + 슬라이딩 윈도우 + TASK 간 의존성
   → `xml-schema.md` § 1 + `context-policy.md` 참조로 대체. Committer FAIL 재시도 로직(line 206~210)은 유지

5. **§ 3-9 Multi-WORK 현황** (line 232~238): multi-WORK 스크립트
   → `shared-prompt-sections.md` § 4 참조로 대체

6. **§ 4 Output Language Rule** (line 255~257):
   → `shared-prompt-sections.md` § 1 참조로 대체. "모든 상태 메시지, PROGRESS.md를 resolved language로 작성" 고유 규칙만 유지

## Files
| Path | Action | Description |
|------|--------|-------------|
| `agents/scheduler.md` | MODIFY | 중복 제거 및 참조 전환 |

## Acceptance Criteria
- [ ] FS discovery 스크립트가 참조로 대체됨
- [ ] 3개 dispatch XML 코드 블록이 참조로 대체됨
- [ ] 슬라이딩 윈도우 예시가 참조로 대체됨
- [ ] Multi-WORK 스크립트가 참조로 대체됨
- [ ] Output Language Rule이 참조 + 고유 규칙만 남음
- [ ] scheduler 고유 로직(DAG, 재시도, 진행 보고)은 변경 없음

## Verify
```bash
grep -c "참조" agents/scheduler.md
grep -c "xml-schema.md" agents/scheduler.md
grep -c "context-policy.md" agents/scheduler.md
```
