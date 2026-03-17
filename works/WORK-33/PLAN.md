# WORK-33: Phase 1.5 — CLAUDE.md MCP 프롬프트 전환

## 개요
설계문서 §3.10에 따라 `C:/rnd/MCP_test_project/CLAUDE.md`에 MCP 모드 + Fallback 이중 구조 Agent 호출 규칙을 적용한다.

## Execution-Mode
pipeline

## Task Dependency Graph
```
TASK-00 → TASK-01 → TASK-02
```

## Tasks

### TASK-00: CLAUDE.md MCP 모드 + Fallback 이중 구조 적용
- 대상: `C:/rnd/MCP_test_project/CLAUDE.md`
- §3.10.2 설계에 따라 Agent 호출 규칙 섹션 추가
- MCP 모드: `[WORK 시작]` → MCP prompt 경유 파이프라인
- Fallback 모드: MCP 미연결 시 agent-flow.md 방식

### TASK-01: MCP 프롬프트 경유 파이프라인 동작 검증
- `C:/rnd/MCP_test_project`에서 MCP 도구/프롬프트 호출 가능 여부 확인
- list_works, get_work_status 도구 동작 확인
- 사용자가 수동 테스트 진행

### TASK-02: 메인 프로젝트 CLAUDE.md 반영 + README 업데이트
- 검증 완료 후 `C:/rnd/agent/uc-taskmanager/CLAUDE.md`에도 동일 적용
- README.md에 Phase 1.5 전환 가이드 추가
