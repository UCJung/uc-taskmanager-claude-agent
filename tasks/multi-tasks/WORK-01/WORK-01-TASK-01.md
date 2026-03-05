# WORK-01-TASK-01: 하위 에이전트 Language fallback 처리

## WORK
WORK-01: 언어 감지 방식 변경 (시스템 로케일 → CLAUDE.md 기반 + 사용자 질문)

## Dependencies
- WORK-01-TASK-00 (required)

## Scope
scheduler, builder, verifier, committer의 Output Language Rule 섹션을 업데이트:

**Language 우선순위**: PLAN.md `> Language:` → CLAUDE.md `## Language` → `en` (기본값)

각 에이전트에서:
1. PLAN.md의 `> Language:` 필드를 먼저 확인
2. 없으면 CLAUDE.md의 Language 설정 확인
3. 둘 다 없으면 `en` 기본값 사용

## Files
| Path | Action | Description |
|------|--------|-------------|
| `.claude/agents/scheduler.md` | MODIFY | Output Language Rule 업데이트 |
| `.claude/agents/builder.md` | MODIFY | Output Language Rule 업데이트 |
| `.claude/agents/verifier.md` | MODIFY | Output Language Rule 업데이트 |
| `.claude/agents/committer.md` | MODIFY | Output Language Rule 업데이트 |
| `agents/scheduler.md` | MODIFY | 배포용 동기화 |
| `agents/builder.md` | MODIFY | 배포용 동기화 |
| `agents/verifier.md` | MODIFY | 배포용 동기화 |
| `agents/committer.md` | MODIFY | 배포용 동기화 |

## Acceptance Criteria
- [ ] 4개 에이전트 모두 Language 우선순위 명시 (PLAN.md > CLAUDE.md > en)
- [ ] `.claude/agents/`와 `agents/` 내용 동일 (4개 파일 모두)

## Verify
```bash
for f in scheduler builder verifier committer; do diff .claude/agents/${f}.md agents/${f}.md; done
grep -l "CLAUDE.md" .claude/agents/scheduler.md .claude/agents/builder.md .claude/agents/verifier.md .claude/agents/committer.md
```
