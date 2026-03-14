# WORK-12-TASK-00

> WORK: WORK-12
> Title: README.md 섹션 재배치 + router_rule_config.json 설명 추가
> Status: TODO
> BlockedBy: 없음

## 목표

`README.md` (영문)에 대해 두 가지 변경을 수행한다:
1. 사용법(Usage) 섹션을 개념(실행 모드) 섹션 앞으로 이동
2. `.agent/router_rule_config.json` 설명 섹션 신규 추가

## 변경 상세

### 1. 섹션 순서 재배치

**현재 순서:**
```
Introduction
## Concept: Three Execution Modes
### WORK (Multi-Task, full mode)
### pipeline mode (Single Task, Delegated)
### direct mode (Trivial)
## Pipeline
### WORK Pipeline (Complex)
### pipeline mode (Simple → Delegated)
### direct mode (Trivial)
### Agents
## The `[]` Tag System
## File Structure
### WORK-LIST.md
## Installation
## Usage
## Tips
## Example Session
## Why This Approach?
## Output Language
## Customization
## Supported Stacks
## Repository Structure
## Requirements
## Optional: MCP Configuration
## License
```

**변경 후 순서:**
```
Introduction
## Usage                          ← 앞으로 이동
## The `[]` Tag System            ← 유지 (Usage 바로 뒤)
## Installation                   ← 유지
## Concept: Three Execution Modes ← 뒤로 이동
### WORK (Multi-Task, full mode)
### pipeline mode (Single Task, Delegated)
### direct mode (Trivial)
## Pipeline
### WORK Pipeline (Complex)
### pipeline mode (Simple → Delegated)
### direct mode (Trivial)
### Agents
## File Structure
### WORK-LIST.md
## Tips
## Example Session
## Why This Approach?
### WORK ID Assignment Strategy
### Context Isolation
### Single Session vs uc-taskmanager
### Router Rule Config (`.agent/router_rule_config.json`)  ← 신규 추가
### Three Execution Modes
### Structured Agent Communication
### Sliding Window Context Transfer
### External System Callback (Optional)
## Output Language
## Customization
## Supported Stacks
## Repository Structure
## Requirements
## Optional: MCP Configuration
## License
```

### 2. router_rule_config.json 섹션 추가

`## Why This Approach?` 내부, `### Three Execution Modes` 바로 위에 아래 내용을 삽입한다:

````markdown
### Router Rule Config (`.agent/router_rule_config.json`)

The router reads `.agent/router_rule_config.json` from the project root to determine routing criteria. If the file is absent, the router uses its built-in defaults.

**File location:**
```
{project-root}/.agent/router_rule_config.json
```

**JSON structure:**
```json
{
  "$schema": "http://uc-taskmanager.local/schemas/router-rules/v1.0.json",
  "version": "1.1.0",
  "description": "Router execution-mode decision criteria. Customize per project.",
  "decision_flow": [
    "1. build_test_required? → false → direct",
    "2. single_domain + sequential DAG → pipeline",
    "3. any full_conditions met → full"
  ],
  "rules": {
    "direct": {
      "criteria": {
        "build_test_required": false,
        "note": "File/line count irrelevant. If no build/test needed → direct (text edits, config changes, simple substitutions)"
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
          "dag_complexity == complex (2+ dependency levels)",
          "multi_domain == true (BE + FE simultaneously)",
          "new_module == true (design → implement → verify multi-phase)",
          "partial_rollback_needed == true"
        ]
      }
    }
  },
  "customization_guide": {
    "doc-heavy projects (md edits)": "Widen direct scope. Most build_test_required=false cases → direct",
    "code-heavy projects": "Center on pipeline/full. Simple bug fixes → pipeline, multi-domain → full",
    "max_tasks tuning": "Adjust pipeline max_tasks between 3–7 based on team size or context limits"
  }
}
```

**Key fields:**
| Field | Description |
|-------|-------------|
| `rules.direct.criteria.build_test_required` | `false` → router handles entirely without spawning subagents |
| `rules.pipeline.criteria.max_tasks` | Max task count before escalating to full (default: 5) |
| `rules.pipeline.criteria.dag_complexity` | `sequential` only; complex DAG → escalates to full |
| `rules.full.criteria.any_of` | List of conditions — any match triggers full mode |

**Fallback behavior:** If `.agent/router_rule_config.json` is absent or malformed, the router falls back to its built-in defaults (equivalent to the structure above).

**Per-project customization example:**

For a documentation-heavy project where most changes are text edits:
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

For a monorepo with strict build requirements:
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

- [ ] Usage 섹션이 Concept 섹션보다 앞에 위치
- [ ] `[]` Tag System, Installation 섹션이 Usage 바로 뒤에 위치
- [ ] router_rule_config.json 섹션이 `## Why This Approach?` 내부에 추가됨
- [ ] 섹션 이동 시 내용 누락 없음
- [ ] 마크다운 헤더 계층 구조 정상
- [ ] 파일 내 앵커 링크 있으면 갱신
