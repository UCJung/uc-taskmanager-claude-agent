<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

**Universal Claude Task Manager** — Claude Code CLI용 범용 작업 파이프라인 서브에이전트 시스템

어떤 프로젝트에서든, 어떤 언어에서든 동작하는 5개의 서브에이전트가 **작업 분해 → 의존성 관리 → 코드 구현 → 검증 → 커밋**을 자동으로 반복합니다.

```
"사용자 인증 기능을 만들거야. 계획 세워줘"
→ WORK-01 생성, TASK 5개 분해, 순서대로 실행
```

---

## Concept: WORK → TASK

uc-taskmanager는 **2단계 계층 구조**로 작업을 관리합니다.

```
WORK (일)                 하나의 목표. 사용자가 요청한 단위.
└── TASK (작업)           WORK를 달성하기 위한 개별 실행 단위.
    └── result            완료 증빙. 검증 통과 후 자동 생성.
```

```
tasks/multi-tasks/
├── WORK-01/                        ← "사용자 인증 기능"
│   ├── PLAN.md                     ← 계획 + 의존성 그래프
│   ├── PROGRESS.md                 ← 진행 상황 (자동 업데이트)
│   ├── WORK-01-TASK-00.md          ← 프로젝트 초기화
│   ├── WORK-01-TASK-00-result.md   ← 완료 보고서 (= 완료 증거)
│   ├── WORK-01-TASK-01.md          ← DB 스키마
│   ├── WORK-01-TASK-01-result.md
│   └── ...
│
├── WORK-02/                        ← "결제 기능 추가"
│   ├── PLAN.md
│   ├── WORK-02-TASK-00.md
│   └── ...
│
└── WORK-03/                        ← "관리자 대시보드"
    └── ...
```

각 WORK는 독립적입니다. WORK 간 의존성은 없으며, 원하는 WORK만 골라서 실행할 수 있습니다.

---

## Pipeline

```
  planner          scheduler         builder          verifier         committer
 ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │WORK 생성 │────▶│의존성 DAG │────▶│코드 구현  │────▶│빌드/테스트│────▶│결과보고서 │
 │TASK 분해 │     │실행 순서  │     │파일 생성  │     │검증 실행  │     │→ git커밋 │
 └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                                       │                │                │
                                       └── 실패 시 재시도 ┘                │
                                          (최대 3회)                      │
                                                          다음 TASK로 반복 ◀┘
```

| Agent | Role | Model | Permission |
|-------|------|-------|------------|
| **planner** | WORK 생성 + TASK 분해 + 계획 파일 생성 | opus | read-only |
| **scheduler** | 특정 WORK의 DAG 관리 + 파이프라인 실행 | haiku | read + dispatch |
| **builder** | 코드 구현 + self-check | sonnet | full access |
| **verifier** | 빌드/린트/테스트 검증 (소스 수정 금지) | haiku | read + execute |
| **committer** | 결과 보고서 생성 → git commit → 다음 TASK 안내 | haiku | read + write + git |

---

## Installation

### Global (모든 프로젝트에서 사용)

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git
cp uc-taskmanager-claude-agent/agents/*.md ~/.claude/agents/
```

### Per-Project

```bash
mkdir -p .claude/agents
cp uc-taskmanager-claude-agent/agents/*.md .claude/agents/
git add .claude/agents/ && git commit -m "chore: add uc-taskmanager agents"
```

### Verify

```bash
claude
> /agents
# planner, scheduler, builder, verifier, committer → 5개 확인
```

---

## Usage

### 1. WORK 생성 (계획)

```
> 사용자 인증 기능을 만들거야. 계획 세워줘.
```

planner가 프로젝트를 분석하고 WORK-01을 생성합니다:

```
WORK-01: 사용자 인증 기능

  WORK-01-TASK-00: 프로젝트 초기화           ← 선행 없음
  WORK-01-TASK-01: DB 스키마 설계            ← TASK-00
  WORK-01-TASK-02: JWT 인증 API             ← TASK-01
  WORK-01-TASK-03: 사용자 CRUD              ← TASK-02
  WORK-01-TASK-04: 테스트 + 문서화           ← TASK-03

  이 계획을 승인하시겠습니까?
```

### 2. WORK 실행

```
> WORK-01 파이프라인 실행해줘
```

scheduler가 WORK-01의 TASK만 순서대로 실행합니다.

### 3. 다른 WORK 추가

```
> 결제 기능을 추가할거야. 계획 세워줘.
```

planner가 WORK-02를 생성합니다. WORK-01과 완전히 독립적입니다.

### 4. 특정 WORK만 실행

```
> WORK-02 파이프라인 실행해줘
```

WORK-01은 건드리지 않고 WORK-02만 실행합니다.

### 5. 전체 현황 확인

```
> WORK 목록
```

```
WORK 현황
   WORK-01: 사용자 인증 기능    ✅ 5/5 완료
   WORK-02: 결제 기능 추가      🔄 2/4 진행 중
   WORK-03: 관리자 대시보드     ⬜ 0/6 대기
```

### 6. 자동 모드

```
> WORK-02 자동으로 실행해줘
```

### 7. 중단 후 재개

```
> WORK-02 재개해줘
```

---

## Example Session

```
User: 블로그 시스템의 댓글 기능을 만들거야. 계획 세워줘.

Claude: [planner]
  프로젝트 분석
     Tech Stack: Next.js + Prisma + PostgreSQL
     기존 코드: 게시글 CRUD 완료, 인증 완료

  WORK-03: 댓글 기능

  WORK-03-TASK-00: Comment 모델 + 마이그레이션        ← 선행 없음
  WORK-03-TASK-01: 댓글 CRUD API                     ← TASK-00
  WORK-03-TASK-02: 대댓글 (self-relation)             ← TASK-01
  WORK-03-TASK-03: 프론트엔드 댓글 컴포넌트            ← TASK-00 (병렬 가능)
  WORK-03-TASK-04: 통합 + 알림                        ← TASK-02, TASK-03

  승인하시겠습니까?

User: 승인

Claude: [planner → 파일 생성 완료]
  ✅ tasks/multi-tasks/WORK-03/ 생성 완료
  "WORK-03 파이프라인 실행해줘" 로 시작하세요.

User: WORK-03 파이프라인 실행해줘

Claude: [scheduler]
  WORK-03: 댓글 기능 (0/5)
     다음: WORK-03-TASK-00 — Comment 모델 + 마이그레이션
     "승인" 을 입력하면 시작합니다.

User: 승인

Claude: [builder → verifier → committer]
  builder: Comment 모델 생성, 마이그레이션 실행
  verifier: Build ✅ Lint ✅ Tests ✅
  committer: feat(WORK-03-TASK-00): Comment 모델 + 마이그레이션 [a1b2c3d]

  WORK-03 진행률: 1/5
     ██░░░░░░░░ 20%

  다음:
     - WORK-03-TASK-01: 댓글 CRUD API
     - WORK-03-TASK-03: 프론트엔드 댓글 컴포넌트 (병렬 가능)

User: 계속

  ...반복...

  WORK-03 완료! 5 tasks, 5 commits
```

---

## Why This Approach?

### Context Isolation

각 서브에이전트는 독립 컨텍스트에서 실행됩니다. builder가 50개 파일을 생성하며 20,000 토큰을 썼어도, scheduler에게 돌아오는 건 3줄 요약뿐입니다.

```
scheduler's context after 5 TASKs:

  PLAN.md (loaded once)                              ~500 tokens
  WORK-01-TASK-00 result: "20 files, PASS"           ~200 tokens
  WORK-01-TASK-01 result: "15 files, PASS"           ~200 tokens
  WORK-01-TASK-02 result: "8 files, PASS"            ~200 tokens
  WORK-01-TASK-03 result: "12 files, PASS"           ~200 tokens
  WORK-01-TASK-04 result: "5 files, PASS"            ~200 tokens
  ────────────────────────────────────────
  Total: ~1,500 tokens (stays flat)
```

### Single Session vs uc-taskmanager

| | Single Session | uc-taskmanager |
|---|---|---|
| Context per TASK | All code + logs stacked | Summary only (~200 tokens) |
| After 10 TASKs | 50K~100K tokens, quality degrades | ~3K tokens, quality stable |
| Failure recovery | Start over | Resume from last result file |
| Tracking | Scroll chat history | File-based (PLAN.md, result.md) |
| Verification | Manual | Automated (build/lint/test) |

### WORK Isolation

WORK 단위로 분리되므로:
- WORK-01 실행 중 실패해도 WORK-02에 영향 없음
- 특정 WORK만 골라서 재실행 가능
- 여러 기능을 독립적으로 계획하고 원하는 순서로 실행

---

## Customization

`.claude/agents/`에 동일 이름 파일을 두면 오버라이드됩니다.

| What | File | Section |
|------|------|---------|
| Approval policy | `scheduler.md` | Phase 1: User Approval |
| Commit message format | `committer.md` | Step 3: Stage + Commit |
| Verification steps | `verifier.md` | Verification Pipeline |
| Task granularity | `planner.md` | Task Decomposition Rules |
| Build/lint commands | `builder.md` + `verifier.md` | Self-Check / Step 1-2 |

---

## Supported Stacks

Auto-detected from project files. No configuration needed.

| File | Stack |
|------|-------|
| `package.json` | Node.js / TypeScript / React / NestJS / Next.js |
| `pyproject.toml` / `setup.py` | Python / FastAPI / Django |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `build.gradle` / `pom.xml` | Java / Kotlin |
| `Gemfile` | Ruby |
| `Makefile` | Generic |

---

## Repository Structure

```
uc-taskmanager/
├── README.md
├── .claude/
│   └── agents/
│       ├── planner.md        ← WORK 생성 + TASK 분해
│       ├── scheduler.md      ← WORK별 파이프라인 실행
│       ├── builder.md        ← 코드 구현
│       ├── verifier.md       ← 검증 (read-only)
│       └── committer.md      ← 결과 보고서 → git commit
├── tasks/
│   └── multi-tasks/          ← WORK 디렉토리 (자동 생성)
│       ├── WORK-01/
│       ├── WORK-02/
│       └── ...
└── uc-taskmanager-claude-agent/  ← 원본 에이전트 소스 (submodule)
```

---

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git initialized (`git init`)
- No other dependencies.

---

## License

MIT
