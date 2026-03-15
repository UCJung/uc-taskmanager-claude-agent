# TASK-01: spec_pipeline-architecture.md 전면 갱신 (v1.0 → v1.2)

## WORK
WORK-24: agents 파일 분석 기반 Pipeline Architecture 스펙 문서 갱신

## Dependencies
- TASK-00 (required)

## Scope

TASK-00의 분석 결과를 기반으로 `docs/spec_pipeline-architecture.md`를 v1.2로 전면 갱신한다.

### 갱신 방침

1. **v1.0 원본 파일을 직접 갱신** — 별도 파일 생성 아닌 in-place 업데이트
2. **agents/ 파일 내용이 정본(source of truth)** — 스펙은 이를 정확히 반영
3. **v1.1 변경분 통합** — v1.1에서 추가/수정된 내용을 v1.2에 포함
4. **버전 표기**: 문서 상단에 `Version: 1.2` 명시

### 예상 갱신 섹션

- 에이전트 목록 및 역할 정의
- 실행 모드(direct/pipeline/full) 판정 기준
- 에이전트 호출 흐름 (Main Claude 오케스트레이터 구조)
- 산출물 파일 포맷 및 경로 규칙
- 컨텍스트 전달 정책
- XML 통신 스키마
- Activity Log 규칙
- WORK-LIST.md 갱신 규칙

## Files

| Path | Action | Description |
|------|--------|-------------|
| `docs/spec_pipeline-architecture.md` | MODIFY | v1.0 → v1.2 전면 갱신 |

## Acceptance Criteria
- [ ] spec_pipeline-architecture.md가 v1.2로 갱신됨
- [ ] 문서 상단에 Version: 1.2 명시
- [ ] agents/ 12개 파일의 현행 내용이 정확히 반영됨
- [ ] v1.1 변경분이 v1.2에 통합됨
- [ ] 목차 및 섹션 구조가 일관성 있게 정리됨

## Verify
```bash
# v1.2 버전 표기 확인
grep -i "version.*1\.2" docs/spec_pipeline-architecture.md
# 주요 섹션 존재 확인
grep -c "##" docs/spec_pipeline-architecture.md
```
