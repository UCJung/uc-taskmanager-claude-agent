<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

**Universal Claude Task Manager** — Claude Code CLI용 범용 작업 파이프라인 서브에이전트 시스템

어떤 프로젝트에서든, 어떤 언어에서든 동작하는 5개의 서브에이전트가 **작업 분해 → 의존성 관리 → 코드 구현 → 검증 → 커밋**을 자동으로 반복합니다.

```
"이 프로젝트 분석해서 작업 계획 세우고 순서대로 실행해줘"
```

이 한 마디면 planner가 프로젝트를 분석하고, scheduler가 의존성 순서를 잡고, builder가 코드를 짜고, verifier가 검증하고, committer가 커밋합니다. 사용자는 승인만 누르면 됩니다.

---

## Why?

Claude Code로 큰 작업을 할 때 흔히 겪는 문제가 있습니다.

**컨텍스트 포화**: 단일 세션에서 파일을 많이 생성하면 중후반부에 품질이 급격히 저하됩니다. 서브에이전트는 각각 독립 컨텍스트에서 실행되고 결과 요약만 반환하므로, 10개 TASK를 실행해도 메인 세션은 깨끗합니다.

**구조 없는 작업**: "이것도 해줘, 저것도 해줘" 하다 보면 뭘 했고 뭘 안 했는지 추적이 안 됩니다. PLAN.md → TASK-XX.md → TASK-XX-result.md 구조가 자동으로 생성되어 작업 이력이 파일로 남습니다.

**검증 없는 커밋**: 코드를 생성하고 바로 커밋하면 빌드가 깨진 채로 이력에 남습니다. verifier가 빌드/린트/테스트를 통과해야만 committer가 동작합니다.

### 단일 세션 vs uc-taskmanager

```
❌ 단일 세션: TASK 5개 후 컨텍스트 50,000~100,000 토큰 → 품질 저하
✅ 파이프라인: TASK 5개 후 메인 컨텍스트 ~3,000 토큰 → 일정한 품질
```

| | 단일 세션 | uc-taskmanager |
|---|---|---|
| TASK당 컨텍스트 소비 | 코드+로그 전부 누적 | 결과 요약만 반환 (~200 토큰) |
| TASK 10개 완주 | 중반 이후 품질 저하 | 끝까지 일정 |
| 작업 추적 | 대화 스크롤 | 파일 기반 (PLAN.md, result.md) |
| 실패 복구 | 처음부터 다시 | result.md 기반 이어서 재개 |
| 검증 | 수동 | 자동 (빌드/린트/테스트) |

---

## Pipeline

```
  planner          scheduler         builder          verifier         committer
 ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │프로젝트  │────▶│의존성 DAG │────▶│코드 구현  │────▶│빌드/테스트│────▶│결과보고서 │
 │분석+분해 │     │실행 순서  │     │파일 생성  │     │검증 실행  │     │→ git커밋 │
 └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                                       │                │                │
                                       └── 실패 시 재시도 ┘                │
                                          (최대 3회)                      │
                                                          다음 TASK로 반복 ◀┘
```

| Agent | Role | Model | Permission |
|-------|------|-------|------------|
| **planner** | 프로젝트 분석, TASK 분해, 계획 파일 생성 | sonnet | read-only |
| **scheduler** | 의존성 DAG 관리, 실행 순서 결정, 에이전트 디스패치 | sonnet | read + dispatch |
| **builder** | 코드 구현, 파일 생성/수정, self-check | sonnet | full access |
| **verifier** | 빌드/린트/테스트 검증 (**소스 수정 금지**) | sonnet | read + execute |
| **committer** | 결과 보고서 생성 → git commit → 다음 TASK 안내 | haiku | read + write + git |

---

## Installation

### Global (모든 프로젝트에서 사용)

```bash
git clone https://github.com/your-username/uc-taskmanager.git
cp uc-taskmanager/agents/*.md ~/.claude/agents/
```

### Per-Project (특정 프로젝트에서만 사용)

```bash
git clone https://github.com/your-username/uc-taskmanager.git
mkdir -p .claude/agents
cp uc-taskmanager/agents/*.md .claude/agents/

# 팀 공유를 위해 커밋
git add .claude/agents/
git commit -m "chore: add uc-taskmanager pipeline agents"
```

### Verify

```bash
claude
> /agents
# planner, scheduler, builder, verifier, committer → 5개 확인
```

---

## Usage

### Full Pipeline

```
> 이 프로젝트를 분석해서 작업 계획을 세우고 순서대로 실행해줘
```

### Plan Only

```
> planner로 작업 계획을 세워줘
```

Review the plan, then:

```
> 계획 승인. scheduler로 실행 시작해줘
```

### Auto Mode (연속 실행)

```
> 전체 파이프라인을 자동 모드로 실행해줘
```

Runs all tasks without approval prompts. Halts only on verification failure.

### Resume After Interruption

```
> 파이프라인 재개해줘
```

Reads `tasks/PROGRESS.md` and continues from the last incomplete task.

### Single Task

```
> TASK-03만 실행해줘
```

---

## Generated Files

The pipeline automatically creates and maintains these files:

```
tasks/
├── PLAN.md              ← planner: 전체 계획 + 의존성 그래프
├── PROGRESS.md          ← scheduler: 실시간 진행 상황
├── TASK-00.md           ← planner: 개별 작업 상세
├── TASK-00-result.md    ← committer: 완료 보고서 (완료 판단 기준)
├── TASK-01.md
├── TASK-01-result.md
└── ...
```

### Completion Detection

`TASK-XX-result.md` 파일의 존재가 해당 TASK의 완료 증거입니다.

| result file | dependencies | status |
|:-----------:|:------------:|:------:|
| exists | — | ✅ DONE |
| missing | all DONE | 🟢 READY |
| missing | some incomplete | ⏳ BLOCKED |

---

## Example

### New Project

```
User: NestJS로 사용자 인증 API를 만들건데, 계획부터 세워줘

Claude: [planner]
  📋 Tech Stack: NestJS + TypeScript (detected)

  TASK-00: 프로젝트 초기화              ← no deps
  TASK-01: DB 스키마 설계               ← TASK-00
  TASK-02: 인증 모듈 (JWT)             ← TASK-01
  TASK-03: 사용자 CRUD API             ← TASK-02
  TASK-04: 테스트 + API 문서화          ← TASK-03

  승인하시겠습니까?

User: 승인

Claude: [scheduler → builder → verifier → committer]

  ✅ TASK-00 committed: a1b2c3d — chore(TASK-00): 프로젝트 초기화
  ✅ TASK-01 committed: d4e5f6g — feat(TASK-01): DB 스키마 설계
  ...
  🎉 Pipeline complete! 5/5 tasks, 5 commits
```

### Existing Project

```
User: 이 프로젝트에 결제 기능을 추가하고 싶어

Claude: [planner]
  📋 Detected: React + Express + PostgreSQL

  TASK-00: 결제 DB 스키마 추가
  TASK-01: 결제 API (Stripe 연동)      ← TASK-00
  TASK-02: 프론트엔드 결제 화면          ← TASK-00  ← 병렬 가능!
  TASK-03: 통합 테스트                  ← TASK-01, TASK-02

  💡 TASK-01과 TASK-02는 병렬 실행 가능합니다.
```

### Auto Mode with Failure Recovery

```
User: 자동으로 돌려줘

Claude:
  🤖 Auto mode started

  ── TASK-00 ─────────────
  🔨 builder → 🔍 verifier ✅ → 📝 committer ✅  [a1b2c3d]

  ── TASK-01 ─────────────
  🔨 builder → 🔍 verifier ❌ (2 tests failed)
  🔨 builder retry (1/3) → 🔍 verifier ✅ → 📝 committer ✅  [e8f9g0h]

  ── TASK-02 ─────────────
  ...

  🎉 Done! 4/4 tasks, 4 commits
```

---

## Customization

### Override per project

Place a file with the same name in `.claude/agents/` to override the global version.

```bash
# Example: customize verifier for a Python project
cp ~/.claude/agents/verifier.md .claude/agents/verifier.md
# Edit to add: pytest --cov --cov-report=term
```

### Common Customizations

| What | File | Section |
|------|------|---------|
| Approval policy (auto/manual) | `scheduler.md` | Phase 1: User Approval |
| Commit message format | `committer.md` | Step 4: Create Commit Message |
| Additional verification steps | `verifier.md` | Verification Pipeline |
| Task granularity rules | `planner.md` | Task Decomposition Rules |
| Build/lint commands | `builder.md` + `verifier.md` | Self-Check / Step 1-2 |

---

## How Context Stays Clean

Each subagent runs in an **isolated context window**. When it finishes, the full context (code, logs, trial-and-error) is discarded. Only a brief summary returns to the scheduler.

```
scheduler's context after 5 TASKs:

  PLAN.md (loaded once)                          ~500 tokens
  TASK-00 result: "20 files created, PASS"       ~200 tokens
  TASK-01 result: "15 files created, PASS"       ~200 tokens
  TASK-02 result: "8 files created, PASS"        ~200 tokens
  TASK-03 result: "12 files created, PASS"       ~200 tokens
  TASK-04 result: "5 files created, PASS"        ~200 tokens
  ─────────────────────────────────────
  Total: ~1,500 tokens                           ← stays flat
```

Meanwhile, each builder operated with ~20,000 tokens of context for its own task, then disappeared. The quality of TASK-10 is identical to TASK-00.

---

## Supported Stacks

The agents auto-detect your tech stack from project files:

| File | Detected Stack |
|------|---------------|
| `package.json` | Node.js / TypeScript / React / NestJS / etc. |
| `pyproject.toml` / `setup.py` | Python / FastAPI / Django / etc. |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `build.gradle` / `pom.xml` | Java / Kotlin |
| `Gemfile` | Ruby |
| `Makefile` | Generic (uses make commands) |

No configuration needed. builder and verifier automatically use the correct build/test/lint commands for your stack.

---

## Requirements

- [Claude Code CLI](https://docs.claude.com/en/docs/claude-code) installed and authenticated
- Git initialized in your project (`git init`)
- That's it. No dependencies, no config files, no API keys.

---

## Repository Structure

```
uc-taskmanager/
├── README.md
├── LICENSE
└── agents/
    ├── planner.md        ← 프로젝트 분석 + TASK 분해
    ├── scheduler.md      ← 의존성 DAG + 파이프라인 제어
    ├── builder.md        ← 코드 구현
    ├── verifier.md       ← 빌드/린트/테스트 검증
    └── committer.md      ← 결과 보고서 → git commit
```

---

## License

MIT

---

<p align="center">
  Built for developers who want Claude Code to <strong>plan, build, verify, and commit</strong> — not just chat.
</p>
