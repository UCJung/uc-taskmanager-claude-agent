# WORK-11-TASK-00 Result

> WORK: WORK-11 — Router execution-mode 판정 기준 외부 config 파일 분리
> Completed: 2026-03-14
> Execution-Mode: pipeline
> Status: **DONE**
> Commit: (pending)

## 요약

Router 에이전트의 execution-mode 판정 기준을 `.agent/router_rule_config.json`의 JSON 설정 파일로 외부화했다.

## 변경 파일

- `.agent/router_rule_config.json` (신규) — 3종 모드(direct/pipeline/full) 판정 기준 외부 config

## 구성 상세

### 메타 정보
- `$schema`: 스키마 버전 식별
- `version`: "1.0.0" (semver)
- `description`: config 목적 설명

### Rules 구조
- `direct`: 복잡도 낮음, 서브에이전트 불필요
  - max_files=1, max_lines_changed=10, max_tasks=2
- `pipeline`: 단일 모듈, Builder → Verifier → Committer 실행
  - max_files=3, max_tasks=5, dag_complexity="sequential"
- `full`: 복잡 프로젝트, Planner → Scheduler 파이프라인
  - task_count_exceeds=5, dag_complexity="complex"

## 검증

- JSON 문법: PASS (Node.js JSON.parse)
- 스키마 메타 필드: 완료 ($schema, version, description)
- 3종 모드 판정 기준: 완료 (direct, pipeline, full)

## 다음 TASK

WORK-11-TASK-01: agents/router.md config 읽기 절차 추가 및 판정 로직 교체
- Config 읽기 절차 섹션 삽입
- 기존 하드코딩 테이블을 config 참조로 교체
- 내장 기본값(fallback) 명시

## Context Handoff

### Builder Context (SUMMARY)

생성된 `.agent/router_rule_config.json`:
- direct/pipeline/full 3종 모드 판정 기준을 JSON으로 외부화
- $schema, version, description 메타 필드 포함
- JSON 검증 통과

### Verifier Context (FULL)

다음 TASK를 위한 상세 정보:
- 파일 경로: `.agent/router_rule_config.json`
- 구조: rules 키 아래 3개 모드 객체 (direct, pipeline, full)
- 각 모드별 criteria 필드로 판정 기준 표현
- 내장 기본값으로 사용될 예정 (config 미존재 시)
