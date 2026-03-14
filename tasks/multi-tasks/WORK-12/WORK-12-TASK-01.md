# WORK-12-TASK-01

> WORK: WORK-12
> Title: README_KO.md 섹션 재배치 + router_rule_config.json 설명 추가
> Status: TODO
> BlockedBy: WORK-12-TASK-00

## 목표

`README_KO.md` (한국어)에 대해 TASK-00과 동일한 두 가지 변경을 수행한다:
1. 사용법 섹션을 개념(실행 모드) 섹션 앞으로 이동
2. `.agent/router_rule_config.json` 설명 섹션 신규 추가 (한국어)

TASK-00의 README.md 결과를 참조하여 동일한 구조로 README_KO.md를 수정한다.

## 변경 상세

### 1. 섹션 순서 재배치

**현재 순서:**
```
Introduction
## 개념: 세 가지 실행 모드 (execution-mode)
### WORK (다중 작업, full 모드)
### pipeline 모드 (단일 작업, 위임)
### direct 모드 (초단순)
## 파이프라인
### WORK 파이프라인 (복잡한 작업)
### pipeline 모드 (단순 → 위임)
### direct 모드 (초단순)
### 에이전트
## `[]` 태그 시스템
## 파일 구조
### WORK-LIST.md
## 설치
## 사용법
## 팁
## 예제 세션
## 왜 이 방식인가?
## 산출물 언어
## 커스터마이징
## 지원 스택
## 저장소 구조
## 요구 사항
## 선택 사항: MCP 설정
## 라이선스
```

**변경 후 순서:**
```
Introduction
## 사용법                              ← 앞으로 이동
## `[]` 태그 시스템                    ← 유지 (사용법 바로 뒤)
## 설치                                ← 유지
## 개념: 세 가지 실행 모드              ← 뒤로 이동
### WORK (다중 작업, full 모드)
### pipeline 모드 (단일 작업, 위임)
### direct 모드 (초단순)
## 파이프라인
### WORK 파이프라인 (복잡한 작업)
### pipeline 모드 (단순 → 위임)
### direct 모드 (초단순)
### 에이전트
## 파일 구조
### WORK-LIST.md
## 팁
## 예제 세션
## 왜 이 방식인가?
### WORK ID 할당 전략
### 컨텍스트 격리
### 단일 세션 vs uc-taskmanager
### Router 판정 기준 config (`.agent/router_rule_config.json`)  ← 신규 추가
### 세 가지 실행 모드
### 구조화된 에이전트 통신
### 슬라이딩 윈도우 컨텍스트 전달
### 외부 시스템 콜백 (선택 사항)
## 산출물 언어
## 커스터마이징
## 지원 스택
## 저장소 구조
## 요구 사항
## 선택 사항: MCP 설정
## 라이선스
```

### 2. router_rule_config.json 섹션 추가 (한국어)

`## 왜 이 방식인가?` 내부, `### 세 가지 실행 모드` 바로 위에 아래 내용을 삽입한다:

````markdown
### Router 판정 기준 config (`.agent/router_rule_config.json`)

router는 프로젝트 루트의 `.agent/router_rule_config.json`을 읽어 라우팅 판정 기준을 결정합니다. 파일이 없으면 router의 내장 기본값을 사용합니다.

**파일 위치:**
```
{프로젝트-루트}/.agent/router_rule_config.json
```

**JSON 구조:**
```json
{
  "$schema": "http://uc-taskmanager.local/schemas/router-rules/v1.0.json",
  "version": "1.1.0",
  "description": "Router execution-mode 판정 기준 설정. 프로젝트별로 커스터마이즈.",
  "decision_flow": [
    "1. build_test_required 여부 판단 → false이면 direct",
    "2. single_domain + sequential DAG → pipeline",
    "3. full_conditions 중 하나라도 해당 → full"
  ],
  "rules": {
    "direct": {
      "criteria": {
        "build_test_required": false,
        "note": "파일 수·줄 수 무관. 검증 없이 끝나는 작업이면 direct (텍스트 편집, 설정 변경, 단순 치환 등)"
      }
    },
    "pipeline": {
      "criteria": {
        "build_test_required": true,
        "single_domain_only": true,
        "max_tasks": 5,
        "dag_complexity": "sequential"
      }
    },
    "full": {
      "criteria": {
        "any_of": [
          "task_count > 5",
          "dag_complexity == complex (TASK 간 의존성이 2레벨 이상)",
          "multi_domain == true (BE + FE 동시 변경)",
          "new_module == true (신규 모듈/기능 — 설계→구현→검증 다단계)",
          "partial_rollback_needed == true (TASK 실패 시 부분 롤백 필요)"
        ]
      }
    }
  },
  "customization_guide": {
    "문서 중심 프로젝트 (md 편집)": "direct 범위를 넓게. build_test_required=false인 경우 대부분 direct",
    "코드 개발 중심 프로젝트": "pipeline/full 중심. 단순 버그 수정은 pipeline, 멀티도메인은 full",
    "max_tasks 조정": "팀 규모나 컨텍스트 한계에 따라 3~7 사이로 조정 가능"
  }
}
```

**주요 필드 설명:**
| 필드 | 설명 |
|------|------|
| `rules.direct.criteria.build_test_required` | `false` → 서브에이전트 없이 router가 직접 처리 |
| `rules.pipeline.criteria.max_tasks` | pipeline에서 full로 에스컬레이션하는 최대 TASK 수 (기본: 5) |
| `rules.pipeline.criteria.dag_complexity` | `sequential`만 허용; complex DAG → full로 에스컬레이션 |
| `rules.full.criteria.any_of` | 조건 목록 — 하나라도 해당하면 full 모드 트리거 |

**Fallback 동작:** `.agent/router_rule_config.json`이 없거나 파싱 오류 시 router의 내장 기본값으로 폴백합니다 (위 구조와 동일).

**프로젝트별 커스터마이즈 예시:**

문서 편집 중심 프로젝트 (대부분 텍스트 수정):
```json
{
  "rules": {
    "direct": {
      "criteria": { "build_test_required": false }
    },
    "pipeline": {
      "criteria": { "max_tasks": 3, "single_domain_only": true, "dag_complexity": "sequential" }
    }
  }
}
```

엄격한 빌드 검증이 필요한 모노레포:
```json
{
  "rules": {
    "pipeline": {
      "criteria": { "max_tasks": 7 }
    },
    "full": {
      "criteria": {
        "any_of": ["task_count > 7", "multi_domain == true"]
      }
    }
  }
}
```
````

## 완료 조건

- [ ] 사용법 섹션이 개념(실행 모드) 섹션보다 앞에 위치
- [ ] `[]` 태그 시스템, 설치 섹션이 사용법 바로 뒤에 위치
- [ ] router_rule_config.json 섹션이 `## 왜 이 방식인가?` 내부에 추가됨
- [ ] README.md와 구조 일관성 유지
- [ ] 섹션 이동 시 내용 누락 없음
- [ ] 마크다운 헤더 계층 구조 정상
