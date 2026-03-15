# TASK-00: agents/ 파일 분석 및 v1.0 스펙과의 차이점 식별

## WORK
WORK-24: agents 파일 분석 기반 Pipeline Architecture 스펙 문서 갱신

## Dependencies
- (none)

## Scope

agents/ 디렉토리의 12개 에이전트 정의 파일을 전수 분석하여 현행 파이프라인 시스템의 구조를 파악하고, 기존 스펙 문서(v1.0, v1.1)와의 차이점을 식별한다.

### 분석 대상 파일 (12개)

| # | 파일 | 분석 관점 |
|---|------|----------|
| 1 | `agents/agent-flow.md` | 실행 모드별 에이전트 호출 흐름, 오케스트레이션 구조 |
| 2 | `agents/builder.md` | Builder 역할, 입출력, 제약사항 |
| 3 | `agents/committer.md` | Committer 역할, 커밋 규칙, gate 조건 |
| 4 | `agents/context-policy.md` | 컨텍스트 전달 정책, 핸드오프 규칙 |
| 5 | `agents/file-content-schema.md` | 산출물 파일 포맷 (PLAN, TASK, progress, result) |
| 6 | `agents/planner.md` | Planner 역할, WORK/TASK 분해 규칙 |
| 7 | `agents/router.md` | Router 역할, execution-mode 판정 기준 |
| 8 | `agents/scheduler.md` | Scheduler 역할, DAG 관리, 진행 추적 |
| 9 | `agents/shared-prompt-sections.md` | 공통 규칙 (언어, 빌드, 파일 경로 패턴) |
| 10 | `agents/verifier.md` | Verifier 역할, 검증 항목 |
| 11 | `agents/work-activity-log.md` | Activity Log 기록 규칙 |
| 12 | `agents/xml-schema.md` | 에이전트 간 XML 통신 스키마 |

### 비교 대상 스펙 문서

| 파일 | 버전 |
|------|------|
| `docs/spec_pipeline-architecture.md` | v1.0 |
| `docs/spec_pipeline-architecture_v1.1.md` | v1.1 |

### 분석 항목

1. 에이전트 목록 및 역할 비교 (스펙 vs 실제)
2. 실행 모드(direct/pipeline/full) 정의 비교
3. 에이전트 간 호출 흐름 비교
4. 산출물 파일 포맷/구조 비교
5. 컨텍스트 전달 정책 비교
6. 누락/추가/변경된 항목 목록 작성

## Files

| Path | Action | Description |
|------|--------|-------------|
| `agents/agent-flow.md` | READ | 에이전트 실행 흐름 분석 |
| `agents/builder.md` | READ | Builder 에이전트 분석 |
| `agents/committer.md` | READ | Committer 에이전트 분석 |
| `agents/context-policy.md` | READ | 컨텍스트 정책 분석 |
| `agents/file-content-schema.md` | READ | 파일 포맷 스키마 분석 |
| `agents/planner.md` | READ | Planner 에이전트 분석 |
| `agents/router.md` | READ | Router 에이전트 분석 |
| `agents/scheduler.md` | READ | Scheduler 에이전트 분석 |
| `agents/shared-prompt-sections.md` | READ | 공통 규칙 분석 |
| `agents/verifier.md` | READ | Verifier 에이전트 분석 |
| `agents/work-activity-log.md` | READ | Activity Log 규칙 분석 |
| `agents/xml-schema.md` | READ | XML 스키마 분석 |
| `docs/spec_pipeline-architecture.md` | READ | v1.0 스펙 비교 |
| `docs/spec_pipeline-architecture_v1.1.md` | READ | v1.1 스펙 비교 |

## Acceptance Criteria
- [ ] agents/ 디렉토리 12개 파일 전수 분석 완료
- [ ] v1.0 스펙과의 차이점 목록 작성 완료
- [ ] v1.1 스펙과의 차이점 목록 작성 완료
- [ ] 누락/추가/변경 항목이 명확히 분류됨

## Verify
```bash
# 분석 결과가 TASK-00_progress.md에 기록되었는지 확인
test -f works/WORK-24/TASK-00_progress.md && grep -c "Status: COMPLETED" works/WORK-24/TASK-00_progress.md
```
