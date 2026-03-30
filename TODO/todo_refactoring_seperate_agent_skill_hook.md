# Agent / Skill / Hook 분리 리펙토링 분석 보고서

> 작성일: 2026-03-30
> 현재 버전: v1.5.1 | 브랜치: dev (main과 동기화 완료)

---

## 0. 현재 프로젝트 상태

| 항목 | 상태 |
|------|------|
| 브랜치 | `dev` (origin/dev 동기화 완료) |
| main 동기화 | dev ↔ main 코드 차이 없음 (merge commit만 존재) |
| 미커밋 변경 | 본 보고서 파일 1건 (untracked) |
| npm 버전 | v1.5.1 |
| Agent 수 | 6개 (specifier, planner, scheduler, builder, verifier, committer) |
| Skill 수 | 4개 (init, work-pipeline, work-status, sdd-pipeline) |
| Hook 수 | **0개** |
| Reference 수 | 6개 (agent-flow, context-policy, file-content-schema, shared-prompt-sections, xml-schema, work-activity-log) |

### 배포 경로 3중 구조

| 위치 | 용도 | 동기화 방향 |
|------|------|-----------|
| ~~`agents/en/`, `agents/ko/`~~ → `develop/` | **소스 원본** (구조 개편 완료) | 원본 |
| `plugin/` | **플러그인 배포본** (Agent 6 + Skill 4 + Reference 6) | ← develop/ 에서 복사 |
| `npm/` | **npm 패키지 배포본** | ← develop/, plugin/ 에서 복사 |

### 소스 원본 구조 변경 (완료)

```
develop/                              ← agents/ 에서 이전 완료
├── .claude-plugin/plugin.json
├── agents/           ← agent 6개 (단일본, en 기반)
├── references/       ← reference 6개 (단일본, 다국어 매핑 내장)
└── skills/           ← skill 4개
    ├── init/SKILL.md
    ├── work-pipeline/SKILL.md
    ├── work-status/SKILL.md
    └── sdd-pipeline/SKILL.md        ← references/ 중복 제거, 상위 참조
```

- 기존 `agents/` 폴더 삭제 완료
- `sdd-pipeline/references/` 중복 제거 완료 → `../../references/` 참조로 변경
- **en/ko 통합 완료** — ko/ 삭제, en/ 평탄화하여 단일본으로 운영

---

## 1. 분류 기준

| 구분 | 정의 | 트리거 방식 | 예시 |
|------|------|------------|------|
| **Agent** | 서브에이전트로 spawn, 자율적으로 복합 작업 수행 | Main Claude가 Agent tool로 dispatch | 코드 구현, 설계 |
| **Skill** | 사용자 명령에 의해 실행되는 프롬프트 확장 | `/skill-name` 또는 `[]` 태그 등 패턴 감지 | /init, /work-status |
| **Hook** | 특정 이벤트 발생 시 자동 실행되는 셸 커맨드 | PreToolUse, PostToolUse 등 시스템 이벤트 | 린트 자동실행, 로그 기록 |
| **Reference** | 에이전트/스킬이 참조하는 정적 문서 | 직접 실행 안 됨, 읽기 전용 | xml-schema, context-policy |

---

## 2. 현재 구조 (plugin/agents/ 기준)

### 2.1 plugin/ 전체 구조

```
plugin/
├── .claude-plugin/
│   └── plugin.json              ← agents 6개만 등록
├── agents/                      ← 6개 전부 agent로 등록
│   ├── specifier.md             ← Agent + Skill 역할 겸임
│   ├── planner.md               ← Agent + Skill 역할 겸임
│   ├── scheduler.md             ← Agent + Skill 역할 겸임
│   ├── builder.md               ← 순수 Agent (내부에 Hook 후보 포함)
│   ├── verifier.md              ← 순수 Agent (내부에 Hook 후보 포함)
│   └── committer.md             ← 순수 Agent (내부에 Hook 후보 포함)
└── skills/
    ├── init/SKILL.md            ← Skill ✓
    ├── work-pipeline/SKILL.md   ← Skill ✓ (오케스트레이션)
    ├── work-status/SKILL.md     ← Skill ✓
    └── sdd-pipeline/
        ├── SKILL.md             ← ⚠️ Skill 아님 (Reference 인덱스)
        └── references/          ← Reference 6개
```

### 2.2 소스 원본 구조 (변경 전 → 후)

**변경 전** (`agents/` — 삭제됨):
```
agents/
├── en/  (12 파일 — Agent와 Reference가 같은 레벨에 혼재)
│   ├── specifier.md ... committer.md    ← Agent 6개
│   ├── agent-flow.md ... xml-schema.md  ← Reference 6개
└── ko/  (동일 12파일, 설명문만 한국어 번역)
```

**변경 후** (`develop/` — 현재):
```
develop/
├── .claude-plugin/plugin.json
├── agents/       ← Agent 6개 (단일본)
├── references/   ← Reference 6개 (단일본, 다국어 매핑 내장)
└── skills/       ← Skill 4개
```

#### en/ko 통합 근거

| 분석 항목 | 결과 |
|----------|------|
| Agent 6개 diff | 로직·코드 블록·경로·XML 구조 100% 동일. 차이는 description, 섹션 제목, Duty 테이블 텍스트의 언어뿐 |
| Reference 6개 diff | 스키마·규칙·코드 동일. 설명문 번역만 상이 |
| `file-content-schema.md` § 4 | result.md 섹션 헤더에 `{## Summary \| ## 요약 \| ## サマリー}` 다국어 매핑 테이블 이미 내장 |
| `shared-prompt-sections.md` § 1 | 런타임 Language Rule로 출력 언어 결정 (PLAN.md > CLAUDE.md > en 기본값) |
| 결론 | **ko 별도 파일 불필요** — 단일본 + 런타임 언어 감지로 충분 |

### 2.3 plugin.json 등록 현황

```json
{
  "name": "uc-taskmanager",
  "version": "1.4.0",
  "agents": [
    "./agents/specifier.md",
    "./agents/planner.md",
    "./agents/scheduler.md",
    "./agents/builder.md",
    "./agents/verifier.md",
    "./agents/committer.md"
  ]
  // ← "skills" 필드 없음
  // ← "hooks" 필드 없음
}
```

- Skills는 `plugin/skills/` 디렉토리를 파일시스템 탐색으로 자동 발견
- Hooks는 정의 자체가 없음

### 2.4 Agent별 내부 지시사항 분석

각 agent의 내부 Duty를 **본연의 agent 역할 / skill 성격 / hook 후보**로 분류했다.

#### specifier.md

| Duty | 현재 위치 | 실제 성격 | 비고 |
|------|----------|----------|------|
| Requirement Specification | Agent | **Agent** ✓ | 핵심 역할 |
| WORK Creation (디렉토리, WORK-LIST) | Agent | **Agent** ✓ | 핵심 역할 |
| Role Decision (direct/pipeline/full) | Agent | **Agent** ✓ | 핵심 역할 |
| Planner Assumption (PLAN.md 직접 생성) | Agent | **Agent** ✓ | direct mode |
| `[]` 태그 감지 시 진입점 | Agent description | **Skill** | work-pipeline skill과 중복 |
| ref-cache 로딩 (§ 3-1) | Agent | **Hook 후보** | 모든 agent에 동일 반복 |
| Activity Log 기록 | Agent | **Hook 후보** | 모든 agent에 동일 반복 |
| Approval 요청 | Agent | Agent ✓ | 파이프라인 게이트 |

#### planner.md

| Duty | 현재 위치 | 실제 성격 | 비고 |
|------|----------|----------|------|
| Requirement.md 분석 | Agent | **Agent** ✓ | 핵심 역할 |
| Project Exploration | Agent | **Agent** ✓ | 핵심 역할 |
| TASK Decomposition | Agent | **Agent** ✓ | 핵심 역할 |
| Execution-Mode 결정 | Agent | **Agent** ✓ | 핵심 역할 |
| File Generation (PLAN, TASK) | Agent | **Agent** ✓ | 핵심 역할 |
| "계획 세워줘" 등 사용자 트리거 | Agent description | **Skill** | 사용자 대면 진입점 |
| ref-cache 로딩 (§ 3-1) | Agent | **Hook 후보** | 동일 보일러플레이트 |
| Activity Log 기록 | Agent | **Hook 후보** | 동일 보일러플레이트 |

#### scheduler.md

| Duty | 현재 위치 | 실제 성격 | 비고 |
|------|----------|----------|------|
| DAG Resolution | Agent | **Agent** ✓ | 핵심 역할 |
| Builder/Verifier/Committer Dispatch | Agent | **Agent** ✓ | 핵심 역할 |
| Retry Handling | Agent | **Agent** ✓ | 핵심 역할 |
| Progress Report (PROGRESS.md) | Agent | **Agent** ✓ | 핵심 역할 |
| "WORK-XX 실행" 등 사용자 트리거 | Agent description | **Skill** | 사용자 대면 진입점 |
| Pipeline Stage Callbacks (curl) | Agent § 3-6 | **Hook 후보** | 기계적 HTTP 호출 |
| ref-cache 로딩 (§ 3-1) | Agent | **Hook 후보** | 동일 보일러플레이트 |
| Activity Log 기록 | Agent | **Hook 후보** | 동일 보일러플레이트 |

#### builder.md

| Duty | 현재 위치 | 실제 성격 | 비고 |
|------|----------|----------|------|
| TASK Analysis + Implementation | Agent | **Agent** ✓ | 핵심 역할 |
| Code Exploration (Serena) | Agent | **Agent** ✓ | 핵심 역할 |
| Self-Check (build + lint) | Agent § 3-5 | **Hook 후보** | PostToolUse(Write,Edit) 자동화 가능 |
| Progress Checkpoint Recording | Agent § 3-6 | **Hook 후보** | 파일 변경 시 자동 기록 가능 |
| ProgressCallback (curl) | Agent § 3-7 | **Hook 후보** | 기계적 HTTP 호출 |
| ref-cache 로딩 (§ 3-1) | Agent | **Hook 후보** | 동일 보일러플레이트 |
| Activity Log 기록 | Agent | **Hook 후보** | 동일 보일러플레이트 |

#### verifier.md

| Duty | 현재 위치 | 실제 성격 | 비고 |
|------|----------|----------|------|
| Build/Lint/Test 실행 + 판정 | Agent | **Agent** ✓ | 핵심 역할 |
| TASK-Specific Verification | Agent | **Agent** ✓ | 핵심 역할 |
| File Existence Check | Agent | **Agent** ✓ | 핵심 역할 |
| Convention Compliance Check | Agent | **Agent** ✓ | 핵심 역할 |
| Progress File Gate Check | Agent § 3-3 | **Hook 후보** | PreToolUse 게이트로 전환 가능 |
| ref-cache 로딩 (§ 3-1) | Agent | **Hook 후보** | 동일 보일러플레이트 |
| Activity Log 기록 | Agent | **Hook 후보** | 동일 보일러플레이트 |

#### committer.md

| Duty | 현재 위치 | 실제 성격 | 비고 |
|------|----------|----------|------|
| Result Report 생성 (result.md) | Agent | **Agent** ✓ | 핵심 역할 |
| PROGRESS.md 업데이트 | Agent | **Agent** ✓ | 핵심 역할 |
| WORK-LIST.md 상태 변경 (마지막 TASK) | Agent § 3-5-1 | **Agent** ✓ | 핵심 역할 |
| Git Add + Commit | Agent § 3-7 | **Hook 후보** | 기계적 git 명령 시퀀스 |
| Gate Check (progress.md 검증) | Agent § 3-3 | **Hook 후보** | verifier와 동일 패턴 |
| TaskCallback (curl) | Agent § 3-8 | **Hook 후보** | 기계적 HTTP 호출 |
| ref-cache 로딩 (§ 3-1) | Agent | **Hook 후보** | 동일 보일러플레이트 |
| Activity Log 기록 | Agent | **Hook 후보** | 동일 보일러플레이트 |

---

## 3. 문제점 종합

### 3.1 Agent ↔ Skill 경계 혼재

#### Agent description에 포함된 Skill 트리거 조건 (실제 문구)

| Agent | description 내 트리거 조건 (원문) |
|-------|-------------------------------|
| specifier | `"Must be used when "[]" tags are detected"` |
| planner | `"Must be used for requests like "plan this", "decompose TASKs", "build XXX", "add XXX feature""` |
| scheduler | `"Must be used for requests like "run WORK-XX", "execute pipeline", "next task""` |
| builder | `"Automatically invoked by the scheduler"` ← 적절 (Skill 아님) |
| verifier | `"Automatically invoked by the scheduler"` ← 적절 |
| committer | `"Automatically invoked by the scheduler"` ← 적절 |

→ specifier/planner/scheduler는 **Agent인 동시에 사용자 대면 진입점(Skill)** 역할을 겸임하고 있다.

| # | 문제 | 상세 |
|---|------|------|
| 1 | **specifier/planner/scheduler description에 Skill 트리거 조건 명시** | 사용자 대면 진입 조건이 agent description에 포함되어 역할 경계 모호 |
| 2 | **work-pipeline skill과 specifier 트리거 중복** | `[]` 태그 감지가 skill(work-pipeline)에서도, agent(specifier description)에서도 명시 |
| 3 | **sdd-pipeline은 skill이 아닌 reference 인덱스** | 사용자가 호출할 수 없는 내부 참조용 문서가 skill로 등록되어 skill 목록 오염 |

### 3.2 Agent 내부에 Hook 후보 내장

| # | 패턴 | 해당 Agent | 현재 구현 |
|---|------|-----------|----------|
| 4 | **ref-cache 로딩** (§ 3-1) | 전체 6개 | 각 agent가 동일한 13줄 보일러플레이트 반복 |
| 5 | **Activity Log 기록** | 전체 6개 | 각 agent가 `log_work` 호출을 개별 구현 |
| 6 | **Callback 전송** (curl) | scheduler, builder, committer | 기계적 HTTP POST, agent 핵심 로직과 무관 |
| 7 | **Gate Check** (progress.md 검증) | verifier, committer | 동일 검증 로직이 2개 agent에 중복 |
| 8 | **Self-Check** (build + lint) | builder | 구현 후 자동 검증 — 이벤트 기반 자동화 가능 |
| 9 | **Git Commit 시퀀스** | committer | git add → git commit 기계적 명령 나열 |

### 3.3 ref-cache 보일러플레이트 반복 (실제 코드)

6개 agent 모두 § 3-1에 아래와 **동일한 13줄** 구조를 반복한다:

```markdown
#### Reference Loading (ref-cache)

1. Check if `<ref-cache>` exists in the received dispatch XML
2. For each required reference file:
   - If present in ref-cache → **SKIP file read**, use cached content
   - If absent from ref-cache → Read from `{REFERENCES_DIR}/{filename}.md` and add to ref-cache
3. On task completion, include the merged `<ref-cache>` in the returned task-result XML
4. **Backward compatibility**: If dispatch contains no `<ref-cache>`, read all reference files normally
```

차이점은 참조하는 파일 목록뿐:

| Agent | 참조 Reference 파일 수 |
|-------|---------------------|
| specifier | 4개 (file-content-schema, shared-prompt-sections, xml-schema, work-activity-log) |
| planner | 3개 (file-content-schema, shared-prompt-sections, work-activity-log) |
| scheduler | 5개 (전체) |
| builder | 5개 (전체) |
| verifier | 4개 (shared-prompt-sections, xml-schema, context-policy, work-activity-log) |
| committer | 5개 (전체) |

### 3.4 REFERENCES_DIR 경로 전달 메커니즘

#### 전체 흐름

```
[1] 사용자 입력: [new-feature] xxx
        ↓
[2] Claude Code가 work-pipeline skill 트리거
    → "Base directory for this skill" 제공 (절대경로)
        ↓
[3] SKILL.md 지시에 따라 REFERENCES_DIR 계산
    REFERENCES_DIR = {Base directory}/../sdd-pipeline/references
    예: C:/Users/me/.claude/plugins/cache/uc-taskmanager/abc123/skills/sdd-pipeline/references
        ↓
[4] Main Claude가 각 agent spawn 시 프롬프트에 포함
    "REFERENCES_DIR={절대경로}"
        ↓
[5] Agent § 3-1에서 REFERENCES_DIR 파싱 후 reference 파일 로드
    → 있으면: {REFERENCES_DIR}/{filename}.md 에서 읽기
    → 없으면: fallback → .claude/agents/ 에서 읽기
```

#### 설치 방식별 경로

| 설치 방식 | REFERENCES_DIR 값 | 누가 설정 | 비고 |
|-----------|------------------|----------|------|
| **Plugin** | `.../skills/sdd-pipeline/references` | work-pipeline Skill이 Base directory에서 도출 | Skill → Main Claude → Agent 순으로 전달 |
| **npm** (`uctm init`) | `.claude/agents/` | Agent 자체 fallback | REFERENCES_DIR 미전달 시 발동 |

#### fallback `.claude/agents/`의 의미

npm 설치 방식(`uctm init`)에서는 agent 파일과 reference 파일이 모두 `.claude/agents/`에 **flat하게** 복사된다.
이 경우 work-pipeline Skill이 없으므로 REFERENCES_DIR가 전달되지 않고, agent는 fallback 경로에서 reference를 찾는다.

#### 구조 변경으로 인한 수정 필요 사항

| 수정 대상 | 현재 값 | 변경 필요 값 | 이유 |
|-----------|--------|------------|------|
| work-pipeline SKILL.md | `{Base dir}/../sdd-pipeline/references` | `{Base dir}/../../references` | references가 독립 디렉토리로 이동 |
| Agent fallback (6개 모두) | `.claude/agents` | npm 설치 시 새 경로에 맞게 | npm init이 reference를 분리 배치하면 변경 필요 |
| agent-flow.md | plugin 경로 예시 | 새 구조에 맞게 업데이트 | 문서 정확성 |

### 3.5 구조적 문제

| # | 문제 | 영향 |
|---|------|------|
| 10 | agents/ 소스 폴더에 Agent 6 + Reference 6 혼재 | 역할 식별 어려움 |
| 11 | plugin.json에 agents만 등록 (skills 미등록) | 명시적 관리 불가 |
| 12 | Hook 메커니즘 전혀 미활용 | 횡단 관심사(로깅, 콜백, 게이트)가 agent에 내장 |
| 13 | 3중 복사 동기화 복잡 | agents/ → plugin/ → npm/ 복사 절차가 CLAUDE.md Push 절차에 7단계로 기술 |
| 14 | Agent와 Reference 구분 없이 같은 경로로 복사 | Push 절차에서 "에이전트 6개"와 "참조 문서 6개"를 별도 규칙으로 복사해야 함 |

---

## 4. 개선 방안

### 4.1 Agent 순수화 — 핵심 역할만 남기기

Agent에서 제거해야 할 내용:

| 제거 대상 | 이동 목적지 | 이유 |
|----------|-----------|------|
| Skill 트리거 조건 (description) | Skill SKILL.md | 사용자 진입점은 Skill 영역 |
| ref-cache 보일러플레이트 (§ 3-1) | 공통 Reference 또는 Hook | 6개 agent에 동일 반복 |
| Activity Log 기록 | Hook (PostToolUse) | 횡단 관심사, 이벤트 기반 자동화 적합 |
| Callback 전송 (curl) | Hook (PostToolUse) | 기계적 HTTP 호출, agent 로직과 무관 |
| Gate Check | Hook (PreToolUse) 또는 공통 Reference | 동일 검증이 2개 agent에 중복 |

Agent에 남겨야 할 내용:

| Agent | 핵심 역할 (유지) |
|-------|----------------|
| specifier | 요구사항 분석, WORK 생성, Role 결정, Requirement.md 작성 |
| planner | 프로젝트 탐색, TASK 분해, PLAN.md/TASK.md 생성 |
| scheduler | DAG 해석, READY 판정, 파이프라인 순서 제어, 재시도 |
| builder | 코드 탐색, 구현, Self-Check, Progress 기록 |
| verifier | 빌드/린트/테스트 검증, 수용 기준 판정 (READ-ONLY) |
| committer | result.md 생성, PROGRESS.md 갱신, WORK-LIST 상태 변경, Git Commit |

### 4.2 Skill 정비

| 현재 | 변경 | 이유 |
|------|------|------|
| work-pipeline SKILL.md | 유지 + specifier description에서 트리거 조건 제거 | Skill이 유일한 진입점 |
| work-status SKILL.md | 유지 | 정상 |
| init SKILL.md | 유지 | 정상 |
| sdd-pipeline SKILL.md | **Skill에서 제거** → references/ 독립 디렉토리로 이동 | Skill이 아님 |
| (신규) work-run | **Skill 신설 검토** | "WORK-XX 실행" 트리거를 scheduler description에서 분리 |
| (신규) work-plan | **Skill 신설 검토** | "계획 세워줘" 트리거를 planner description에서 분리 |

### 4.3 Hook 도입

Claude Code hooks는 `settings.json`의 `hooks` 필드에 정의하며, 셸 커맨드를 이벤트에 바인딩한다.

#### ✅ 구현 완료 + 테스트 검증

| Hook 이름 | 이벤트 | 동작 | 상태 |
|-----------|--------|------|------|
| **work-status-sync** | PostToolUse(Bash:git commit) | 전체 TASK result 개수 == TASK 개수이면 WORK-LIST.md → DONE 전환 | ✅ 구현 + 테스트 완료 |

파일: `develop/hooks/work-status-sync.sh`

설정 (settings.local.json):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/work-status-sync.sh"
          }
        ]
      }
    ]
  }
}
```

테스트 결과 (test-03):
- test-02에서 발생한 WORK-LIST `IN_PROGRESS` 잔류 이슈를 해결
- 마지막 TASK 커밋 후 hook이 자동으로 IN_PROGRESS → DONE 전환 확인
- **주의**: jq 미설치 환경 대응 필요 (grep/sed로 JSON 파싱), grep -P → -oE (Windows 호환)

#### 추가 도입 후보

**높은 우선순위 (횡단 관심사)**

| Hook 이름 | 이벤트 | 동작 | 대상 Agent |
|-----------|--------|------|-----------|
| activity-log | PostToolUse(Write, Edit) | works/ 하위 파일 변경 시 `work_{WORK_ID}.log`에 자동 기록 | 전체 6개 |
| callback-relay | PostToolUse(Write:*_progress.md, *_result.md) | progress/result 파일 생성 시 CALLBACK_URL로 자동 POST | scheduler, builder, committer |

**중간 우선순위 (중복 제거)**

| Hook 이름 | 이벤트 | 동작 | 대상 Agent |
|-----------|--------|------|-----------|
| progress-gate | PreToolUse(Bash:git commit) | commit 전 progress.md 존재 + Status=COMPLETED 검증 | verifier, committer |
| auto-lint | PostToolUse(Write, Edit) | 소스 파일 변경 시 린터 자동 실행 | builder |

**낮은 우선순위 (점진적 도입)**

| Hook 이름 | 이벤트 | 동작 | 대상 Agent |
|-----------|--------|------|-----------|
| progress-sync | PostToolUse(Write, Edit) | 소스 파일 변경 시 TASK_progress.md Files changed 자동 갱신 | builder |

### 4.4 소스 디렉토리 구조 개편 — ✅ 완료

`agents/` → `develop/`로 이전 + en/ko 통합 완료.

```
develop/                                ← 소스 원본 (agents/ 대체)
├── .claude-plugin/plugin.json
├── agents/                             ← Agent 6개 (단일본)
├── references/                         ← Reference 6개 (단일본, 다국어 매핑 내장)
├── skills/                             ← Skill 4개
│   ├── init/SKILL.md
│   ├── work-pipeline/SKILL.md
│   ├── work-status/SKILL.md
│   └── sdd-pipeline/SKILL.md           ← references/ 중복 제거, 상위 참조
└── hooks/                              ← Hook 스크립트
    └── work-status-sync.sh             ← ✅ 구현 완료
```

### 4.5 plugin/ 배포 구조 개편

```
plugin/
├── .claude-plugin/
│   └── plugin.json              ← agents + skills 명시 등록
├── agents/                      ← 순수 Agent 6개
├── skills/                      ← 사용자 호출 Skill만
│   ├── init/SKILL.md
│   ├── work-pipeline/SKILL.md
│   ├── work-status/SKILL.md
│   ├── work-run/SKILL.md       ← 신규 (scheduler 트리거 분리)
│   └── work-plan/SKILL.md      ← 신규 (planner 트리거 분리)
├── references/                  ← sdd-pipeline에서 독립
│   ├── agent-flow.md
│   ├── context-policy.md
│   ├── file-content-schema.md
│   ├── shared-prompt-sections.md
│   ├── xml-schema.md
│   └── work-activity-log.md
└── hooks/                       ← 신규 Hook 정의
    ├── activity-log.sh
    ├── callback-relay.sh
    └── progress-gate.sh
```

---

## 5. 영향 범위

### 5.1 완료된 변경

| 변경 내용 | 상태 |
|----------|------|
| `agents/` → `develop/` 디렉토리 이전 | ✅ 완료 |
| Agent / Reference / Skill 디렉토리 분리 | ✅ 완료 |
| `sdd-pipeline/references/` 중복 제거 → `../../references/` 참조 | ✅ 완료 |
| 기존 `agents/` 폴더 삭제 | ✅ 완료 |
| en/ko 통합 → 단일본 (ko 삭제, en 평탄화) | ✅ 완료 |
| develop/ 단일본 구조 파이프라인 동작 테스트 | ✅ 완료 |
| work-status-sync hook 구현 (develop/hooks/) | ✅ 완료 |
| hook 동작 테스트 (test-03: DONE 자동 전환 확인) | ✅ 완료 |

### 5.1.1 파이프라인 테스트 결과 (2026-03-30)

**테스트 환경**: `/tmp/agent_test_01/`
**명령**: `env -u ANTHROPIC_API_KEY claude -p "[new-feature] ... 블럭깨기 게임 ... auto" --dangerously-skip-permissions`

| 단계 | 상태 | 결과 |
|------|:----:|------|
| Specifier (direct mode) | ✅ | Requirement.md + PLAN.md + TASK-00.md 생성 |
| Builder | ✅ | index.html(457줄) 생성, Self-Check 8항목 PASS |
| Committer | ✅ | TASK-00_result.md 생성, `799285e feat: 블럭깨기 게임 구현` 커밋 |
| WORK-LIST.md | ✅ | IN_PROGRESS → DONE 자동 전환 |
| 한국어 출력 | ✅ | en 단일본 agent에서 한국어 제목/내용 정상 출력 |

**결론**: develop/ 단일본 구조 + `.claude/agents/` flat 배포 방식에서 파이프라인 정상 완주 확인.

### 5.1.2 Pipeline 모드 테스트 (test-02, test-03)

| 테스트 | TASK 수 | Hook | WORK-LIST DONE 전환 | 결과 |
|--------|---------|------|:-------------------:|------|
| test-02 | 4 | 미적용 | ❌ IN_PROGRESS 잔류 | 파이프라인 완주, 상태 전환 누락 |
| test-03 | 2 | ✅ 적용 | ✅ DONE 자동 전환 | hook으로 이슈 해결 |

### 5.1.3 Full 모드 테스트 (test-04)

**테스트 환경**: `/tmp/agent_test_04/`
**PLAN**: 6개 TASK, DAG 병렬 분기 (TASK-02/03 병렬)

| 항목 | 기대 | 실제 | 판정 |
|------|------|------|:----:|
| Execution-Mode | full | full | ✅ |
| TASK 분해 | 6개 + DAG | 6개 + DAG | ✅ |
| Scheduler 경유 | builder→verifier→committer × 6 | **Main Claude 직접 구현** | ⚠️ |
| 커밋 수 | 6개 | **1개** | ⚠️ |
| result.md | 6개 | **0개** | ⚠️ |
| WORK-LIST | DONE | **IN_PROGRESS** | ⚠️ |

**원인**: `claude -p` 비대화형 모드에서 Main Claude가 scheduler를 spawn하지 않고 직접 구현.
복잡한 오케스트레이션이 컨텍스트 한계로 단순화된 것으로 추정.

**대응 필요**: agent-flow.md의 full 모드 오케스트레이션 지시 강화, 또는 scheduler 직접 호출 패턴 필요.

### 5.1.4 Full 모드 재테스트 (test-05, `--output-format json`)

**테스트 환경**: `/tmp/agent_test_05/`

| 항목 | 결과 |
|------|------|
| Execution-Mode | full |
| TASK 수 | 6개 (DAG 병렬 분기) |
| result.md | ✅ 6/6 |
| git commit | ✅ 6개 (TASK별 개별: `chore(TASK-00)`, `feat(TASK-01)` ... `feat(TASK-04)`) |
| WORK-LIST | ✅ DONE (hook 자동 전환) |
| modelUsage | opus $2.51 + sonnet $3.00 + haiku $1.32 = **$6.83** |
| 모델 3개 사용 확인 | ✅ 파이프라인 정상 동작 (specifier/planner → builder → scheduler/verifier/committer) |

**test-04 vs test-05 비교**: 동일 프롬프트인데 test-04는 파이프라인 우회, test-05는 정상 완주.
test-04는 text 로그만 있어 원인 특정 불가. **비결정적 동작**으로, 재현 시 `--output-format json`으로 modelUsage 확인 필요.

**로그 기록 방식 결론**:
- `--output-format stream-json >> .jsonl` (append) 방식으로 통일
- stream-json은 전체 이벤트(tool call, agent spawn) 실시간 기록 + 최종 result에 modelUsage 포함
- Agent tool call 순서로 병렬 spawn 여부 확인 가능 (builder가 Main Claude에 의해 호출되므로)
- `>` (덮어쓰기) 대신 `>>` (추가) 사용 — 스트리밍 중 버퍼 flush로 데이터 유실 방지

**테스트 가이드**: [docs/guide_agent-testing.md](../docs/guide_agent-testing.md)

### 5.2 남은 변경 대상

#### REFERENCES_DIR 경로 관련

| 파일 | 현재 | 변경 필요 | 비고 |
|------|------|----------|------|
| `work-pipeline SKILL.md` (develop, plugin) | `{Base dir}/../sdd-pipeline/references` | `{Base dir}/../../references` | references 독립 이동 반영 |
| 6개 Agent fallback (develop, plugin) | `.claude/agents` | npm 구조 확정 후 결정 | npm init 시 reference 배치 위치에 의존 |
| `agent-flow.md` (develop, plugin) | plugin 경로 예시 | 새 구조에 맞게 업데이트 | 문서 정확성 |
| `lib/constants.mjs` | `agents/en`, `agents/ko` | `develop/` (단일) | Push 동기화 경로 + lang 분기 제거 |
| `init.mjs` | agents 복사 로직 (lang별 분기) | develop 단일 구조 반영 + lang 분기 제거 + hook 설정 추가 | npm 설치 로직 |

#### Agent 내용 정비

| 파일 | 변경 내용 |
|------|----------|
| `specifier.md` description | `[]` 태그 트리거 조건 제거 (Skill로 이관) |
| `planner.md` description | "계획 세워줘" 트리거 조건 제거 |
| `scheduler.md` description | "WORK-XX 실행" 트리거 조건 제거 |
| 전체 6개 agent § 3-1 | ref-cache 보일러플레이트 간소화 검토 |
| 전체 6개 agent | Activity Log, Callback 로직 → Hook 이관 검토 |

#### Plugin / npm 배포

| 파일 | 변경 내용 |
|------|----------|
| `plugin.json` | skills 필드 추가, 경로 업데이트 |
| `plugin/` 구조 | develop/ 구조와 동기화 (references 독립, sdd-pipeline 정비) |
| `npm/` 구조 | develop/ 구조와 동기화 |
| `CLAUDE.md` Push 절차 | `agents/` → `develop/` 경로 반영 |

### 5.3 제약 사항

- Claude Code plugin.json이 `skills`, `hooks` 필드를 공식 지원하는지 확인 필요
- Hook은 셸 커맨드 기반이므로 플랫폼(Windows/Mac/Linux) 호환성 검증 필요
- 기존 설치 프로젝트는 `uctm update` 또는 재설치 필요
- **REFERENCES_DIR fallback 변경 시 하위 호환성**: npm으로 이미 설치된 프로젝트에서 `.claude/agents/` fallback이 동작하지 않을 수 있음

---

## 6. 요약

### Before → After

| 항목 | Before | After |
|------|--------|-------|
| 소스 구조 | `agents/en/` + `agents/ko/` (24파일 중복) | `develop/` 단일본 (16파일) |
| 다국어 | en/ko 파일 분리 (설명문만 번역) | 단일본 + 런타임 Language Rule + 다국어 매핑 테이블 |
| Agent 역할 | 핵심 로직 + Skill 트리거 + 횡단 관심사 혼재 | **핵심 로직만** |
| Skill 구성 | 3개 정상 + 1개 오분류(sdd-pipeline) | 3~5개 정상 Skill (진입점 명확) |
| Hook 활용 | 없음 | 3~5개 Hook (로깅, 콜백, 게이트) |
| Reference 위치 | skills/sdd-pipeline/ 하위 | 독립 references/ 디렉토리 |
| Agent 보일러플레이트 | 6개 agent × 동일 코드 반복 | Hook/공통 Reference로 제거 |
| 역할 식별 | 파일 내용을 읽어야 판별 | 디렉토리 구조로 즉시 구분 |

### 핵심 원칙

> **Agent = 자율 판단이 필요한 복합 작업**
> **Skill = 사용자 진입점 (트리거 + 오케스트레이션)**
> **Hook = 이벤트 기반 자동화 (횡단 관심사)**
> **Reference = 정적 참조 문서**
