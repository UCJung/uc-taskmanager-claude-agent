# WORK-11: Router execution-mode 판정 기준 외부 config 파일 분리

> Created: 2026-03-14
> 요구사항: N/A
> Execution-Mode: full
> Project: uc-taskmanager
> Tech Stack: Markdown, JSON
> Language: ko
> Status: PLANNED

## Goal

Router 에이전트의 execution-mode 판정 기준(direct/pipeline/full)을 하드코딩된 테이블에서 분리하여
`{project_root}/.agent/router_rule_config.json` 파일로 외부화한다.
에이전트 모듈은 config를 읽어 판정하도록 수정하고, config가 없으면 내장 기본값으로 동작(하위 호환)한다.

## Tasks

### WORK-11-TASK-00: `.agent/router_rule_config.json` 기본 config 파일 생성
- **Depends on**: (none)
- **Scope**: 현재 router.md의 Routing Criteria 테이블 기준을 JSON 스키마로 변환하여 신규 파일 생성
- **Files**:
  - `.agent/router_rule_config.json` (신규)
- **Acceptance Criteria**:
  - JSON 파일이 `.agent/router_rule_config.json` 경로에 생성됨
  - direct / pipeline / full 3종 모드 판정 기준이 필드로 표현됨
  - 스키마에 `$schema`, `version`, `description` 메타 필드 포함
  - JSON lint 통과

### WORK-11-TASK-01: `agents/router.md` config 읽기 절차 추가 및 판정 로직 교체
- **Depends on**: WORK-11-TASK-00
- **Scope**: router.md의 §2 Routing Criteria 하드코딩 테이블을 config 참조 방식으로 교체하고, config 읽기 절차 섹션 추가
- **Files**:
  - `agents/router.md`
- **Acceptance Criteria**:
  - §2 앞에 "Config 읽기 절차" 섹션 삽입: `.agent/router_rule_config.json` 읽기 → 없으면 내장 기본값 사용
  - 기존 Routing Criteria 테이블이 config 참조 설명으로 교체됨
  - 내장 기본값(fallback)이 명시됨
  - 파일 전체 구조 유지 (다른 섹션 미변경)

### WORK-11-TASK-02: `.claude/agents/router.md` 동일 변경 적용
- **Depends on**: WORK-11-TASK-01
- **Scope**: TASK-01에서 변경한 내용을 설치 경로의 router.md에도 동일하게 적용
- **Files**:
  - `.claude/agents/router.md`
- **Acceptance Criteria**:
  - `agents/router.md`와 §2 섹션이 동일한 내용으로 동기화됨
  - 나머지 섹션은 기존 `.claude/agents/router.md` 내용 유지
  - 두 파일의 diff가 의도된 차이(frontmatter 등)만 존재함
