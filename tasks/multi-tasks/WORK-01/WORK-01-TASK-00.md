# WORK-01-TASK-00: planner.md 언어 감지 로직 변경

## WORK
WORK-01: 언어 감지 방식 변경 (시스템 로케일 → CLAUDE.md 기반 + 사용자 질문)

## Dependencies
- (none)

## Scope
planner.md의 Discovery Process에서 시스템 로케일 자동 감지(PowerShell/locale) 코드를 제거하고, 다음 흐름으로 변경:

1. CLAUDE.md에서 `## Language` 또는 `Language:` 설정 확인
2. 설정이 있으면 → 해당 언어 사용
3. 설정이 없으면 → 사용자에게 "산출물 언어를 설정하시겠습니까? (예: ko, en, ja)" 질문
4. 사용자가 언어 지정 → CLAUDE.md에 `## Language\nko` 형태로 추가
5. 사용자가 거부/스킵 → 시스템 로케일 자동 감지 → 감지된 언어를 CLAUDE.md에 기본값으로 기록

Output Language Rule 섹션도 새 방식을 반영하도록 업데이트.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `.claude/agents/planner.md` | MODIFY | Discovery Process + Output Language Rule 변경 |
| `agents/planner.md` | MODIFY | 배포용 동기화 (동일 내용) |

## Acceptance Criteria
- [ ] Discovery Process에서 CLAUDE.md Language 확인 로직 존재
- [ ] 사용자 질문 프로토콜 존재
- [ ] 거부 시 시스템 로케일 감지 + CLAUDE.md 기록 로직 존재
- [ ] Output Language Rule 섹션이 새 방식 반영
- [ ] `.claude/agents/planner.md`와 `agents/planner.md` 내용 동일

## Verify
```bash
diff .claude/agents/planner.md agents/planner.md
grep -c "CLAUDE.md" .claude/agents/planner.md
```
