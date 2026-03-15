# TASK-00: agents 파일 분석 및 spec_pipeline-architecture_v1.1.md 생성

## WORK
WORK-23: agents 파일 분석 기반 Pipeline Architecture 스펙 문서 v1.1 생성

## Dependencies
- (none)

## Scope
agents/ 디렉토리의 12개 에이전트 정의 파일을 모두 읽고 분석하여, 파이프라인 아키텍처의 전체 구조를 기술하는 스펙 문서 docs/spec_pipeline-architecture_v1.1.md를 생성한다.

분석 대상 파일 (12개):
- `agents/router.md` -- 최상위 오케스트레이터, execution-mode 판정, 3가지 실행 경로
- `agents/planner.md` -- WORK 계획 수립, TASK 분해, DAG 설계
- `agents/scheduler.md` -- DAG 기반 TASK 실행 순서 관리, Builder/Verifier/Committer 파이프라인 오케스트레이션
- `agents/builder.md` -- TASK 단위 코드 구현
- `agents/verifier.md` -- 빌드/린트/테스트 검증
- `agents/committer.md` -- result.md 생성, git commit, 콜백
- `agents/agent-flow.md` -- 에이전트 간 흐름 정의
- `agents/context-policy.md` -- 컨텍스트 전달 정책 (슬라이딩 윈도우)
- `agents/xml-schema.md` -- 에이전트 간 XML 통신 포맷
- `agents/file-content-schema.md` -- 산출물 파일 포맷 스키마
- `agents/shared-prompt-sections.md` -- 공통 재사용 섹션
- `agents/work-activity-log.md` -- Activity Log 규칙

문서 구성 (예상):
1. 개요 및 버전 정보
2. 아키텍처 개요 (에이전트 목록, 역할)
3. Execution-Mode 3가지 경로 (direct / pipeline / full)
4. 에이전트 간 통신 구조 (XML dispatch / task-result)
5. 데이터 흐름 (WORK -> TASK 계층, 파일 산출물)
6. 컨텍스트 전달 정책 (슬라이딩 윈도우)
7. 파일 스키마 요약
8. Activity Log 체계

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_pipeline-architecture_v1.1.md` | CREATE | 파이프라인 아키텍처 스펙 문서 v1.1 |

## Acceptance Criteria
- [ ] agents/ 12개 파일 모두 분석 반영
- [ ] 6개 에이전트(router, planner, scheduler, builder, verifier, committer) 역할과 관계 기술
- [ ] 3가지 execution-mode(direct, pipeline, full) 흐름 기술
- [ ] XML 통신 포맷, 파일 스키마, 컨텍스트 정책 요약 포함
- [ ] docs/spec_pipeline-architecture_v1.1.md 파일 정상 생성

## Verify
```bash
test -f docs/spec_pipeline-architecture_v1.1.md && echo "PASS" || echo "FAIL"
```
