# TASK-00 — Pipeline Architecture v1.1 시각화

> WORK: WORK-36
> Status: PENDING
> Depends: —

## 목적

`docs/spec_pipeline-architecture_v1.1.md`를 읽고 해당 내용을 인터랙티브 HTML 시각화 파일로 생성한다.

## 구현 범위

- `docs/pipeline-architecture-v1.1-visual.html` 생성 (standalone, 외부 CDN 없음)
- Dark theme, CSS variables 사용
- 기존 `docs/pipeline-architecture-visual.html` 스타일 수준 참고

## 시각화 대상

1. 에이전트 구성 (6개 에이전트, 모델, 역할)
2. execution-mode 3종 체계 (direct / pipeline / full 흐름도)
3. TASK 파이프라인 흐름 (builder → verifier → committer)
4. 슬라이딩 윈도우 컨텍스트 정책
5. DAG 의존성 관리
6. Progress 체크포인트 시스템
7. 외부 콜백 통합
8. WORK/TASK 파일 구조

## Files

- `docs/pipeline-architecture-v1.1-visual.html` (신규 생성)

## Verify

- 파일이 브라우저에서 외부 의존성 없이 정상 렌더링됨
- 탭 전환이 동작함
- 다크/라이트 테마 전환이 동작함
