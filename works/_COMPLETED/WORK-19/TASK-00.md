# TASK-00: docs/ 3개 참조 문서 최신화

## WORK
WORK-19: docs/ 참조 문서 최신화 — 에이전트 리팩토링 반영

## Dependencies
- (none)

## Scope

docs/ 폴더의 3개 참조 문서를 최근 변경사항에 맞게 갱신한다.

### spec_pipeline-architecture.md 갱신 항목
- § 4 파일 구조: `WORK-NN-TASK-XX-progress.md` → `TASK-XX_progress.md`, `WORK-NN-TASK-XX-result.md` → `TASK-XX_result.md`
- 불변 보장 테이블: 파일명 형식 갱신
- § 10 관련 문서: `file-content-schema.md` 추가
- 갱신 이력 추가

### spec_sliding-window-context.md 갱신 항목
- § 5 progress.md 구조: file-content-schema.md § 3과 일치하도록 갱신 (Status 값: PENDING/STARTED/IN_PROGRESS/COMPLETED, 타임스탬프 필드)
- § 7 result.md 구조: file-content-schema.md § 4와 일치하도록 갱신 (다국어 섹션 헤더)
- § 9 구현 파일 목록: `file-content-schema.md` 추가
- 갱신 이력 추가

### spec_callback-integration.md 갱신 항목
- Related Documents 섹션: 파일 경로 및 참조 내용 확인/갱신
- Version & History: 갱신 이력 추가

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_pipeline-architecture.md` | MODIFY | 파일명 규칙, file-content-schema.md 참조 추가 |
| `docs/spec_sliding-window-context.md` | MODIFY | progress.md/result.md 구조 현행화 |
| `docs/spec_callback-integration.md` | MODIFY | 참조 문서 갱신 |

## Acceptance Criteria
- [ ] spec_pipeline-architecture.md의 파일명이 `TASK-XX_progress.md`, `TASK-XX_result.md` 형식으로 갱신됨
- [ ] spec_pipeline-architecture.md에 file-content-schema.md 참조가 추가됨
- [ ] spec_sliding-window-context.md의 progress.md 구조가 file-content-schema.md § 3과 일치함
- [ ] spec_sliding-window-context.md의 result.md 구조가 file-content-schema.md § 4와 일치함
- [ ] spec_sliding-window-context.md § 9에 file-content-schema.md가 추가됨
- [ ] 세 파일 모두 갱신 이력이 추가됨

## Verify
```bash
grep -n "TASK-XX_progress" docs/spec_pipeline-architecture.md
grep -n "file-content-schema" docs/spec_pipeline-architecture.md
grep -n "PENDING\|STARTED" docs/spec_sliding-window-context.md
grep -n "file-content-schema" docs/spec_sliding-window-context.md
```
