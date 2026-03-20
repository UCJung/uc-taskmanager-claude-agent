# WORK-13-TASK-03: README.md / README_KO.md / docs/spec_*.md 경로 반영

## WORK
WORK-13: 파일경로 현행화 — tasks/multi-tasks/ → works/, TASK 파일명 중복 프리픽스 제거

## Dependencies
- WORK-13-TASK-00 (required)
- WORK-13-TASK-01 (required)

## Scope

사용자 문서 및 스펙 문서에서 경로 참조를 새 규칙으로 업데이트한다.

### 치환 규칙

| Before | After |
|--------|-------|
| `tasks/multi-tasks/` | `works/` |
| `WORK-NN-TASK-XX.md` (파일명 예시) | `TASK-XX.md` |
| `WORK-NN-TASK-XX-progress.md` | `TASK-XX_progress.md` |
| `WORK-NN-TASK-XX-result.md` | `TASK-XX_result.md` |

### 주의사항

- README의 Repository Structure 섹션에서 디렉토리 트리를 `works/` 기반으로 업데이트한다.
- docs/spec 파일들은 경로 예시가 포함된 부분만 수정한다. 아키텍처 설명 텍스트는 보존한다.
- TASK ID 식별자 자체(`WORK-13-TASK-00` 등)는 변경하지 않는다. 파일명만 변경.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `README.md` | MODIFY | Repository Structure 섹션, 경로 예시 업데이트 |
| `README_KO.md` | MODIFY | 동일 |
| `docs/spec_pipeline-architecture.md` | MODIFY | 경로 참조 업데이트 |
| `docs/spec_sliding-window-context.md` | MODIFY | 경로 참조 업데이트 |
| `docs/spec_callback-integration.md` | MODIFY | 경로 참조 업데이트 |

## Acceptance Criteria

- [ ] `README.md`에서 `tasks/multi-tasks/` 참조가 `works/`로 변경됨
- [ ] `README_KO.md`에서 `tasks/multi-tasks/` 참조가 `works/`로 변경됨
- [ ] `docs/spec_*.md` 3개 파일에서 `tasks/multi-tasks/` 참조가 `works/`로 변경됨
- [ ] README의 Repository Structure가 `works/` 디렉토리 구조를 반영함

## Verify

```bash
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/README.md && echo "FAIL: README" || echo "PASS: README"
grep -n "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/README_KO.md && echo "FAIL: README_KO" || echo "PASS: README_KO"
grep -rn "tasks/multi-tasks" /c/rnd/agent/uc-taskmanager/docs/ && echo "FAIL: docs" || echo "PASS: docs"
```
