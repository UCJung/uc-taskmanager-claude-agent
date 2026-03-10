<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

**Universal Claude Task Manager** — Claude Code CLI용 범용 작업 파이프라인 서브에이전트 시스템

어떤 프로젝트에서든, 어떤 언어에서든 동작하는 6개의 서브에이전트가 **요청 라우팅 → 작업 분해 → 의존성 관리 → 코드 구현 → 검증 → 커밋**을 자동으로 처리합니다.

**[English Documentation](README.md)**

```
"[추가기능] 사용자 인증 기능을 만들어줘"
→ router가 WORK 판단, planner가 WORK-01 + TASK 5개 생성, 파이프라인 실행
```

---

## 개념: 세 가지 실행 경로

**router**가 모든 `[]` 태그 요청을 분석하여 세 가지 경로 중 하나로 라우팅합니다:

```
사용자 요청
     │
     ▼
  ┌────────┐
  │ router │ ── [] 태그 없음 ──▶ 직접 처리 (파이프라인 없음)
  └───┬────┘
      │ [] 태그 감지
      ▼
  복잡도 판단
      │
      ├─ 초단순 (1 파일, ≤10줄 변경)
      │   ▼
      │  S-TASK Direct ── router가 직접 처리
      │                   (가장 빠름, 서브에이전트 오버헤드 없음)
      │
      ├─ 단순 (2~3 파일, 또는 >10줄)
      │   ▼
      │  S-TASK Pipeline ── builder → verifier → committer
      │                     (컨텍스트 격리, WORK과 동일한 품질)
      │
      └─ 복잡 (4+ 파일, 3+ 단계, 의존성 존재)
          ▼
         WORK ── planner → scheduler → [builder → verifier → committer] × N
                 (전체 계획 + 다중 작업 파이프라인)
```

### WORK (다중 작업)

복잡한 기능을 위한 2단계 계층 구조:

```
WORK (일)                 하나의 목표. 사용자가 요청한 단위.
└── TASK (작업)           WORK를 달성하기 위한 개별 실행 단위.
    └── result            완료 증빙. 검증 통과 후 자동 생성.
```

### S-TASK Pipeline (단일 작업, 위임)

중간 규모 단일 작업을 서브에이전트에 위임. router 컨텍스트를 깨끗하게 유지합니다.

```
router → builder(sonnet) → verifier(haiku) → committer(haiku)
```

### S-TASK Direct (초단순)

router가 자체 컨텍스트에서 모든 것을 처리. 1파일, ≤10줄 변경에만 사용합니다.

```
router: 분석 → 구현 → 자체 검증 → 커밋
```

---

## 파이프라인

### WORK 파이프라인 (복잡한 작업)

```
  router           planner          scheduler         builder          verifier         committer
 ┌────────┐      ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │요청     │────▶│WORK 생성 │────▶│의존성 DAG │────▶│코드 구현  │────▶│빌드/테스트│────▶│결과보고서 │
 │분석     │     │TASK 분해 │     │실행 순서  │     │파일 생성  │     │검증 실행  │     │→ git커밋 │
 └────────┘     └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                                                       │                │                │
                                                       └── 실패 시 재시도 ┘                │
                                                          (최대 3회)                      │
                                                                          다음 TASK로 반복 ◀┘
```

### S-TASK Pipeline (단순 → 위임)

```
  router            builder          verifier         committer
 ┌────────┐       ┌──────────┐     ┌──────────┐     ┌──────────┐
 │요청     │─────▶│코드 구현  │────▶│빌드/테스트│────▶│결과보고서 │
 │분석     │      │파일 생성  │     │검증 실행  │     │→ git커밋 │
 └────────┘      └──────────┘     └──────────┘     └──────────┘
  (컨텍스트 유지)   (sonnet)         (haiku)           (haiku)
```

### S-TASK Direct (초단순)

```
  router
 ┌──────────────────────────────────────┐
 │ 분석 → 구현 → 검증 → 커밋             │
 └──────────────────────────────────────┘
  (1 파일, ≤10줄 — 서브에이전트 오버헤드 없음)
```

### 에이전트

| 에이전트 | 역할 | 모델 | 권한 |
|----------|------|------|------|
| **router** | `[]` 태그 감지, 3경로 라우팅 (Direct/Pipeline/WORK), WORK-LIST.md 관리 | **sonnet** | read + dispatch |
| **planner** | WORK 생성 + TASK 분해 + 계획 파일 생성 | **opus** | read-only |
| **scheduler** | 특정 WORK의 DAG 관리 + 파이프라인 실행 | **haiku** | read + dispatch |
| **builder** | 코드 구현 + self-check (빌드/린트) | **sonnet** | full access |
| **verifier** | 빌드/린트/테스트 검증 (읽기 전용, 소스 수정 금지) | **haiku** | read + execute |
| **committer** | 결과 보고서 생성 → git commit → 다음 TASK 안내 | **haiku** | read + write + git |

---

## `[]` 태그 시스템

요청에 `[]` 태그를 붙이면 파이프라인이 트리거됩니다:

| 태그 | 의미 |
|------|------|
| `[추가기능]` | 새 기능 추가 |
| `[기능개선]` | 기존 기능 개선 |
| `[오류수정]` / `[버그수정]` | 버그 수정 |
| `[WORK 시작]` | 항상 새 WORK 생성 (복잡도 판단 생략) |

`[]` 태그 없음 = 파이프라인 없이 직접 처리.

---

## 파일 구조

```
tasks/
├── multi-tasks/
│   ├── WORK-LIST.md                    ← 전체 WORK 마스터 목록 (router가 관리)
│   ├── WORK-01/                        ← "사용자 인증 기능"
│   │   ├── PLAN.md                     ← 계획 + 의존성 그래프
│   │   ├── PROGRESS.md                 ← 진행 상황 (자동 업데이트)
│   │   ├── WORK-01-TASK-00.md          ← 작업 명세
│   │   ├── WORK-01-TASK-00-result.md   ← 완료 보고서 (= 완료 증거)
│   │   ├── WORK-01-TASK-01.md
│   │   └── ...
│   └── WORK-02/
│       └── ...
│
└── simple-tasks/
    ├── S-TASK-00001-result.md          ← 단일 작업 결과
    └── ...
```

### WORK-LIST.md

router가 `tasks/multi-tasks/WORK-LIST.md`를 마스터 인덱스로 관리합니다:

| WORK ID | Title | Status | Created |
|---------|-------|--------|---------|
| WORK-01 | 사용자 인증 기능 | COMPLETED | 2026-03-01 |
| WORK-02 | 결제 기능 추가 | IN_PROGRESS | 2026-03-05 |

- **IN_PROGRESS**: 새 WORK 생성 전 router가 확인
- **COMPLETED**: git push 후 업데이트

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

### 초단순 수정 (S-TASK Direct)

```
> [버그수정] 로그인 에러 메시지 오타 수정
```

router가 1줄 수정으로 판단 → 직접 처리. 서브에이전트 오버헤드 없음.

### 간단한 작업 (S-TASK Pipeline)

```
> [버그수정] 모바일에서 로그인 버튼이 반응하지 않는 문제 수정
```

router가 중간 규모 수정으로 판단 (여러 줄, 2개 파일) → builder → verifier → committer에 위임. router 컨텍스트는 깨끗하게 유지.

### 복잡한 기능 (WORK)

#### 1. WORK 생성 (계획)

```
> [추가기능] 사용자 인증 기능을 만들거야. 계획 세워줘.
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

#### 2. WORK 실행

```
> WORK-01 파이프라인 실행해줘
```

scheduler가 의존성 순서대로 TASK를 실행합니다.

#### 3. 기존 WORK에 추가

WORK-01이 IN_PROGRESS이면 router가 질문합니다:
> "WORK-01 (사용자 인증 기능)이 진행 중입니다. 추가 TASK로 진행할까요, 새 WORK를 생성할까요?"

#### 4. 전체 현황 확인

```
> WORK 목록
```

```
WORK 현황
   WORK-01: 사용자 인증 기능    ✅ 5/5 완료
   WORK-02: 결제 기능 추가      🔄 2/4 진행 중
   WORK-03: 관리자 대시보드     ⬜ 0/6 대기
```

#### 5. 자동 모드 / 재개

```
> WORK-02 자동으로 실행해줘
> WORK-02 재개해줘
```

#### 6. 특정 TASK만 실행

WORK 내 특정 TASK를 지정하여 실행 (실패 후 재시도 등):

```
> WORK-02-TASK-02 실행해줘
```

scheduler가 TASK 파일을 직접 읽어 builder → verifier → committer를 디스패치합니다.

#### 7. WORK 강제 생성 (복잡도 검사 스킵)

`[WORK 시작]` 태그를 사용하면 복잡도 판단 없이 항상 새 WORK를 생성합니다:

```
> [WORK 시작] 인증 모듈 리팩토링
```

#### 8. 실패 처리 / 재시도

파이프라인 도중 TASK가 실패하면 scheduler가 최대 3회 자동 재시도합니다.
그래도 실패하면 result 파일을 확인한 후 수동으로 재시도할 수 있습니다:

```
> WORK-02-TASK-01 실패했어. 다시 실행해줘.
```

또는 문제를 수정한 후 재실행:

```
> src/auth.ts 문제 수정하고, WORK-02-TASK-01 다시 실행해줘
```

#### 9. 진행 중인 WORK에 TASK 추가

```
> [기능개선] 인증 API에 rate limiting 추가해줘
```

WORK-02가 `IN_PROGRESS`이면 router가 질문합니다:
> "WORK-02 (인증 모듈)이 진행 중입니다. 추가 TASK로 진행할까요, 새 WORK를 생성할까요?"

#### 10. 개별 TASK 상태 확인

```
> WORK-02 진행 현황 보여줘
> WORK-03-TASK-02 상태가 어떻게 돼?
```

scheduler가 `PROGRESS.md`와 `result.md` 파일을 읽어 현재 상태를 보고합니다.

---

## 팁

### CLAUDE.md를 최신 상태로 유지

언어 설정과 프로젝트 컨텍스트는 `CLAUDE.md`에 저장됩니다. 에이전트가 매 실행 시 이 파일을 읽으므로 최신 상태를 유지하면 불필요한 질문이 줄어듭니다.

### `[]` 태그 일관되게 사용

`[]` 태그 없는 요청은 라우팅 없이 Claude가 직접 처리합니다. 파이프라인을 보장하려면 항상 태그를 붙이세요.

### 병렬 TASK

planner는 의존성 그래프를 기반으로 TASK를 생성합니다. 동일한 선행 조건을 가진 독립 TASK는 scheduler가 동시에 실행할 수 있습니다 — 승인 시 명시하세요:

```
> 승인. 독립 TASK는 병렬로 실행해줘.
```

### 컨텍스트 초기화 후 재개

파이프라인 도중 Claude가 컨텍스트를 잃어도 언제든 재개할 수 있습니다:

```
> WORK-02 멈춘 곳부터 재개해줘
```

scheduler가 `PROGRESS.md`를 읽어 마지막으로 완료된 TASK를 파악하고 이어서 실행합니다.

---

## 예제 세션

```
User: [추가기능] 블로그 시스템의 댓글 기능을 만들거야.

Claude: [router → WORK 경로]
  복잡도: 4+ 파일, DB 스키마 변경, 다중 모듈
  → 새 WORK 생성

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

User: 승인. 자동으로 진행해줘.

Claude: [scheduler → 자동 모드]
  WORK-03-TASK-00 → builder → verifier ✅ → committer [a1b2c3d]
  WORK-03-TASK-01 → builder → verifier ✅ → committer [d4e5f6g]
  WORK-03-TASK-02 → builder → verifier ✅ → committer [h7i8j9k]
  WORK-03-TASK-03 → builder → verifier ✅ → committer [l0m1n2o]
  WORK-03-TASK-04 → builder → verifier ✅ → committer [p3q4r5s]

  🎉 WORK-03 완료! 5 tasks, 5 commits
```

---

## 왜 이 방식인가?

### WORK ID 할당 전략

WORK ID는 **파일시스템 우선 원칙**을 따릅니다:

1. **파일시스템 소스**: planner가 `tasks/multi-tasks/` 디렉토리를 스캔하여 기존 WORK 디렉토리를 찾고, 가장 최신 디렉토리를 기반으로 다음 WORK ID를 결정합니다.
2. **MEMORY.md 미참조**: 프로젝트 메모리(MEMORY.md)는 WORK 번호 결정에 절대 참조되지 않습니다. 오직 파일시스템만이 유일한 정보원입니다.
3. **일관성 검증**: router는 planner 전에 파일시스템과 WORK-LIST.md를 모두 확인하여 WORK ID 일관성을 검증합니다.

이를 통해:
- MEMORY.md가 오래되거나 손상되어도 WORK ID 중복 할당 방지
- 세션 간 신뢰성 있는 재개 보장
- 명확한 추적성: WORK-NN은 직접 `tasks/multi-tasks/WORK-NN/` 폴더에 대응

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

### 세 경로 라우팅

router가 복잡도에 맞는 최적의 경로를 선택합니다:
- **S-TASK Direct**: 1줄 오타 수정 — 서브에이전트 오버헤드 없이 즉시 처리
- **S-TASK Pipeline**: 중간 규모 수정 — 서브에이전트에 위임, router 컨텍스트 깨끗 유지
- **WORK**: 복잡한 기능 — 전체 계획, 분해, 추적

연속 S-TASK Pipeline 처리 시 router는 처리 건수와 무관하게 ~1,000 tokens만 사용합니다. 직접 처리하면 ~15K+ tokens이 누적됩니다.

### 구조화된 에이전트 통신

모호한 자연어 프롬프트 대신 구조화된 XML 포맷으로 에이전트 간 통신합니다:

**디스패치 포맷** (호출자 → 수신자):
```xml
<dispatch to="builder" work="WORK-03" task="WORK-03-TASK-00">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
  </context>
  <task-spec>
    <file>tasks/multi-tasks/WORK-03/WORK-03-TASK-00.md</file>
    <title>공통 시스템 프롬프트 섹션 식별 및 XML 스키마 설계</title>
    <action>implement</action>
  </task-spec>
  <cache-hint sections="output-language-rule,build-commands"/>
</dispatch>
```

**결과 포맷** (수신자 → 호출자):
```xml
<task-result work="WORK-03" task="WORK-03-TASK-00" agent="builder" status="PASS">
  <summary>shared-prompt-sections.md와 xml-schema.md 생성</summary>
  <files-changed>
    <file action="created" path="agents/shared-prompt-sections.md">cache_control이 포함된 공통 섹션</file>
  </files-changed>
  <verification>
    <check name="file_existence" status="PASS">두 파일 모두 생성됨</check>
  </verification>
</task-result>
```

**장점**:
- **명확성**: 명시적인 XML 구조가 모호한 자연어를 제거합니다 ("컨텍스트를 전달해줘" ← 혼동 vs `<context>` ← 명확)
- **출력 토큰 감소**: 에이전트가 명확화 질문을 생성하지 않음, 수신자가 XML을 직접 파싱합니다
- **Prompt Caching**: Output Language Rule, Build Commands 같은 공통 섹션을 Anthropic API의 `cache_control`로 마킹하여 **90% 이상 토큰 절감**
- **확장성**: 캐시 히트율이 WORK 개수에 따라 향상 (5 TASK 시 ~0.03 tokens/token vs 캐시 없이 2K+ tokens)

전체 포맷은 `agents/xml-schema.md`를, 캐시 가능한 섹션은 `agents/shared-prompt-sections.md`를 참고하세요.

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

3. 시스템 로케일 자동 감지 → CLAUDE.md에 기본값으로 기록
```

한 번 설정되면 CLAUDE.md에 저장되어 다시 질문하지 않습니다. 우선순위: `PLAN.md > CLAUDE.md > en`

기본적으로 git commit 메시지와 코드 주석을 포함한 **모든 산출물**이 설정된 언어로 작성됩니다:

| 항목 | 기본값 | 오버라이드 |
|------|--------|-----------|
| PLAN.md / TASK 설명 | Language | — |
| result 보고서 | Language | — |
| Git commit 메시지 (제목/본문) | Language | `CommitLanguage: en` |
| 코드 주석 | Language | `CommentLanguage: en` |
| 커밋 타입 접두사 (`feat`, `fix`...) | 항상 English | — |
| 파일명, 경로, 명령어 | 항상 English | — |

### 카테고리별 언어 오버라이드

CLAUDE.md에 추가하여 특정 카테고리만 언어를 변경할 수 있습니다:

```markdown
## Language
ko
CommitLanguage: en
CommentLanguage: en
```

이렇게 하면 계획/보고서는 `ko`로, 커밋과 코드 주석은 `en`으로 작성됩니다 — 오픈소스 프로젝트나 글로벌 팀에 유용합니다.

---

## 커스터마이징

`.claude/agents/`에 동일 이름 파일을 두면 오버라이드됩니다.

| 항목 | 파일 | 섹션 |
|------|------|------|
| 라우팅 기준 | `router.md` | Three-Path Routing |
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
└── tasks/
    ├── multi-tasks/         ← WORK 디렉토리 (자동 생성)
    │   ├── WORK-LIST.md     ← 마스터 인덱스
    │   ├── WORK-01/
    │   └── ...
    └── simple-tasks/        ← S-TASK 결과 (자동 생성)
```

---

## 요구 사항

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git 초기화 (`git init`)
- 그 외 의존성 없음.

---

## 선택 사항: MCP 설정

### Serena MCP — 브라우저 자동 실행 비활성화

[Serena MCP](https://github.com/oraios/serena)를 사용 중이라면, 매 시작 시 웹 대시보드가 브라우저에서 열립니다. 이를 비활성화하려면 `~/.claude.json`에 `--open-web-dashboard False`를 추가하세요:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--context", "ide-assistant",
        "--project", ".",
        "--open-web-dashboard", "False"
      ]
    }
  }
}
```

대시보드는 `http://localhost:PORT`에서 계속 사용 가능합니다 — 시작 시 자동으로 열리지 않을 뿐입니다.

---

## 라이선스

MIT
