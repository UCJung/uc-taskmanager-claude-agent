# TASK-00: Pipeline Architecture 시각화 HTML 작성

## WORK
WORK-21: Pipeline Architecture 시각화 HTML 작성

## Dependencies
- (none)

## Scope
docs/spec_pipeline-architecture.md 스펙 문서를 읽고 분석하여 파이프라인 아키텍처 전체를 시각화하는 단일 HTML 파일을 작성한다.

시각화 포함 항목:
1. **에이전트 구성 다이어그램** — 6개 에이전트 (router, planner, scheduler, builder, verifier, committer) 역할과 관계
2. **Execution-Mode 3종 흐름도** — direct/pipeline/full 각각의 흐름을 시각적으로 표현
3. **Routing 기준표** — 어떤 조건에서 어떤 모드가 선택되는지 테이블/차트
4. **WORK/TASK 파일 구조** — 디렉토리 트리 시각화
5. **TASK 파이프라인 흐름** — Builder -> Verifier -> Committer 순차 흐름
6. **DAG 의존성 관리** — full 모드에서의 TASK 간 의존성 그래프
7. **비정상 종료 대응** — 크래시/미완료 감지 및 재시도 흐름
8. **에이전트 간 통신** — XML dispatch/result 포맷 시각화

기술 요구사항:
- 외부 라이브러리 의존 없이 순수 HTML + CSS + JavaScript
- 반응형 레이아웃
- 탭/섹션 기반 네비게이션으로 각 영역 구분
- 다크/라이트 모드 지원 (선택)
- 시각적으로 깔끔하고 전문적인 디자인

## Files
| Path | Action | Description |
|------|--------|-------------|
| `docs/pipeline-architecture-visual.html` | CREATE | 파이프라인 아키텍처 시각화 HTML |

## Acceptance Criteria
- [ ] HTML 파일이 브라우저에서 정상 렌더링됨
- [ ] 에이전트 6종의 역할과 관계가 시각적으로 표현됨
- [ ] execution-mode 3종 흐름이 각각 명확히 구분되어 표시됨
- [ ] TASK 파이프라인 흐름도가 포함됨
- [ ] DAG 의존성 관리 다이어그램이 포함됨
- [ ] 반응형 레이아웃으로 다양한 화면 크기에서 정상 표시됨
- [ ] 외부 CDN/라이브러리 의존 없이 단독 실행 가능

## Verify
```bash
# HTML 파일 존재 확인
test -f docs/pipeline-architecture-visual.html && echo "PASS" || echo "FAIL"
# 파일 크기가 의미 있는 수준인지 확인 (최소 5KB)
SIZE=$(wc -c < docs/pipeline-architecture-visual.html)
[ "$SIZE" -gt 5000 ] && echo "SIZE PASS ($SIZE bytes)" || echo "SIZE FAIL ($SIZE bytes)"
```
