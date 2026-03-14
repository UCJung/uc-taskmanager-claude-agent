# WORK-11-TASK-00: `.agent/router_rule_config.json` 기본 config 파일 생성

> WORK: WORK-11 — Router execution-mode 판정 기준 외부 config 파일 분리
> Task: WORK-11-TASK-00
> Depends on: (none)
> Status: PENDING

## 목적

현재 `agents/router.md`의 §2 Routing Criteria 테이블에 하드코딩된 판정 기준을 JSON 파일로 추출한다.
이 파일은 프로젝트별로 커스터마이즈 가능한 외부 config이다.

## 작업 내용

### 1. 파일 경로
`.agent/router_rule_config.json`

### 2. JSON 스키마 구성

다음 필드를 포함한다:

**메타 정보:**
- `$schema`: 스키마 버전 식별 문자열
- `version`: config 버전 (semver)
- `description`: config 목적 설명

**판정 기준 (`rules`):**
각 mode별 조건 객체:

#### direct 모드 조건
- `build_test_required`: false (빌드/테스트 검증 불필요)
- `max_tasks`: 2 (TASK 1~2개)
- `dependencies_allowed`: false (의존성 없음)
- `max_files`: 1
- `max_lines_changed`: 10

#### pipeline 모드 조건
- `build_test_required`: true (빌드/테스트 필요)
- `single_domain_only`: true (단일 도메인)
- `max_tasks`: 5 (TASK 5개 이하)
- `dag_complexity`: "sequential" (단순 순차)
- `max_files`: 3

#### full 모드 조건 (다음 중 하나라도 해당)
- `task_count_exceeds`: 5 (TASK 5개 초과)
- `dag_complexity`: "complex" (복잡 DAG)
- `multi_domain`: true (멀티 도메인 — BE+FE 동시)
- `new_module`: true (신규 모듈)

## 완료 기준

- [ ] `.agent/router_rule_config.json` 파일 생성
- [ ] 3종 모드(direct/pipeline/full) 판정 기준 모두 포함
- [ ] 메타 필드(`$schema`, `version`, `description`) 포함
- [ ] 유효한 JSON (파싱 오류 없음)
