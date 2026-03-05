<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

**Universal Claude Task Manager** — Claude Code CLI용 범용 작업 파이프라인 서브에이전트 시스템

어떤 프로젝트에서든, 어떤 언어에서든 동작하는 5개의 서브에이전트가 **작업 분해 → 의존성 관리 → 코드 구현 → 검증 → 커밋**을 자동으로 반복합니다.

**[English Documentation](README.md)**

```
"사용자 인증 기능을 만들거야. 계획 세워줘"
→ WORK-01 생성, TASK 5개 분해, 순서대로 실행
```

---

## 개념: WORK → TASK

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

## 파이프라인

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

| 에이전트 | 역할 | 모델 | 권한 |
|----------|------|------|------|
| **router** | 요청 분석 → WORK(다중 TASK) 또는 S-TASK(단일) 라우팅 | **sonnet** | read + dispatch |
| **planner** | WORK 생성 + TASK 분해 + 계획 파일 생성 | **opus** | read-only |
| **scheduler** | 특정 WORK의 DAG 관리 + 파이프라인 실행 | **haiku** | read + dispatch |
| **builder** | 코드 구현 + self-check | **sonnet** | full access |
| **verifier** | 빌드/린트/테스트 검증 (소스 수정 금지) | **haiku** | read + execute |
| **committer** | 결과 보고서 생성 → git commit → 다음 TASK 안내 | **haiku** | read + write + git |

---

## 설치

### 전역 설치 (모든 프로젝트에서 사용)

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git
cp uc-taskmanager-claude-agent/agents/*.md ~/.claude/agents/
```

### 프로젝트별 설치

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git /tmp/uc-tm
mkdir -p .claude/agents
cp /tmp/uc-tm/agents/*.md .claude/agents/
rm -rf /tmp/uc-tm
git add .claude/agents/ && git commit -m "chore: add uc-taskmanager agents"
```

### 설치 확인

```bash
claude
> /agents
# router, planner, scheduler, builder, verifier, committer → 6개 확인
```

---

## 사용법

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

## 예제 세션

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

## 왜 이 방식인가?

### 컨텍스트 격리

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

### 단일 세션 vs uc-taskmanager

| | 단일 세션 | uc-taskmanager |
|---|---|---|
| TASK당 컨텍스트 | 모든 코드 + 로그 누적 | 요약만 (~200 tokens) |
| 10개 TASK 후 | 50K~100K 토큰, 품질 저하 | ~3K 토큰, 품질 유지 |
| 실패 복구 | 처음부터 다시 | 마지막 result 파일부터 재개 |
| 추적 | 채팅 히스토리 스크롤 | 파일 기반 (PLAN.md, result.md) |
| 검증 | 수동 | 자동 (build/lint/test) |

### WORK 격리

WORK 단위로 분리되므로:
- WORK-01 실행 중 실패해도 WORK-02에 영향 없음
- 특정 WORK만 골라서 재실행 가능
- 여러 기능을 독립적으로 계획하고 원하는 순서로 실행

---

## 산출물 언어

산출물 언어는 **CLAUDE.md**에서 관리됩니다. 최초 설정 이후에는 별도 설정이 필요 없습니다.

```
1. CLAUDE.md에서 "Language: xx" 확인
   ├─ 있음 → 해당 언어 사용
   └─ 없음 ↓

2. 사용자에게 질문: "산출물 언어를 설정하시겠습니까? (예: ko, en, ja)"
   ├─ 사용자가 언어 지정 → CLAUDE.md에 기록 + 해당 언어 사용
   └─ 거부/스킵 ↓

3. 시스템 로케일 자동 감지
   - Windows: PowerShell → [CultureInfo]::CurrentCulture.TwoLetterISOLanguageName
   - Linux/Mac: locale → LANG=ko_KR.UTF-8 → ko
   → 감지된 언어를 CLAUDE.md에 기본값으로 기록
```

한 번 설정되면 CLAUDE.md에 저장되어 이후에는 다시 질문하지 않습니다:

```markdown
## Language
ko
```

모든 에이전트는 PLAN.md → CLAUDE.md → `en` 순서로 참조합니다:

```
우선순위: PLAN.md > Language: → CLAUDE.md ## Language → en (기본값)
```

| 항목 | 감지 언어 적용 | 항상 English |
|------|:-:|:-:|
| PLAN.md 제목/설명 | ✅ | |
| TASK 파일 제목/설명 | ✅ | |
| result 보고서 | ✅ | |
| 파일명, 경로, 명령어 | | ✅ |
| Git commit 메시지 | | ✅ |
| 코드 주석 | | ✅ (프로젝트 관례) |

---

## 커스터마이징

`.claude/agents/`에 동일 이름 파일을 두면 오버라이드됩니다.

| 항목 | 파일 | 섹션 |
|------|------|------|
| 승인 정책 | `scheduler.md` | Phase 1: User Approval |
| 커밋 메시지 형식 | `committer.md` | Step 3: Stage + Commit |
| 검증 단계 | `verifier.md` | Verification Pipeline |
| 작업 세분화 | `planner.md` | Task Decomposition Rules |
| 빌드/린트 명령어 | `builder.md` + `verifier.md` | Self-Check / Step 1-2 |
| 산출물 언어 | `planner.md` | Output Language Rule |

---

## 지원 스택

프로젝트 파일에서 자동 감지됩니다. 별도 설정이 필요 없습니다.

| 파일 | 스택 |
|------|------|
| `package.json` | Node.js / TypeScript / React / NestJS / Next.js |
| `pyproject.toml` / `setup.py` | Python / FastAPI / Django |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `build.gradle` / `pom.xml` | Java / Kotlin |
| `Gemfile` | Ruby |
| `Makefile` | Generic |

---

## 저장소 구조

```
uc-taskmanager/
├── README.md                ← English (기본)
├── README_KO.md             ← 한국어
├── LICENSE
├── agents/                  ← 배포용: 이 파일들을 복사하여 설치
│   ├── router.md            ← 요청 라우팅 (WORK vs S-TASK)
│   ├── planner.md           ← WORK 생성 + TASK 분해
│   ├── scheduler.md         ← WORK별 파이프라인 실행
│   ├── builder.md           ← 코드 구현
│   ├── verifier.md          ← 검증 (read-only)
│   └── committer.md         ← 결과 보고서 → git commit
├── .claude/
│   └── agents/              ← 활성 에이전트 (이 프로젝트에서 사용)
│       └── (위와 동일)
└── tasks/
    └── multi-tasks/         ← WORK 디렉토리 (자동 생성)
        ├── WORK-01/
        ├── WORK-02/
        └── ...
```

---

## 요구 사항

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git 초기화 (`git init`)
- 그 외 의존성 없음.

---

## 라이선스

MIT
