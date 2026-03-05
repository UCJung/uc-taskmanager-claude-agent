# WORK-01: 언어 감지 방식 변경 (시스템 로케일 → CLAUDE.md 기반 + 사용자 질문)

> Created: 2026-03-05
> Project: uc-taskmanager
> Tech Stack: Claude Code Subagent System (Markdown-based)
> Language: ko
> Status: PLANNED

## Goal
에이전트의 산출물 언어 설정을 시스템 로케일 자동 감지 방식에서 CLAUDE.md 기반으로 변경한다.
CLAUDE.md에 Language 설정이 없으면 사용자에게 질문하고, 거부 시 시스템 로케일을 감지하여 CLAUDE.md에 기본값으로 기록한다.

## Flow
```
planner 시작
  ├─ CLAUDE.md에 Language: 설정 있음? ──YES──▶ 해당 언어 사용
  │
  NO
  ├─ 사용자에게 "언어를 설정하시겠습니까?" 질문
  │   ├─ 사용자가 언어 지정 (예: ko) ──▶ CLAUDE.md에 기록 + 해당 언어 사용
  │   └─ 거부/스킵 ──▶ 시스템 로케일 자동 감지 ──▶ CLAUDE.md에 기본값 기록
  │
  ▼
  PLAN.md > Language: {결정된 언어}
```

## Task Dependency Graph

```
WORK-01-TASK-00  ──▶  WORK-01-TASK-01  ──▶  WORK-01-TASK-02
(planner.md)         (하위 에이전트 4개)      (README x2)
```

## Tasks

### WORK-01-TASK-00: planner.md 언어 감지 로직 변경
- **Depends on**: (none)
- **Scope**: planner.md의 Discovery Process에서 시스템 로케일 자동 감지를 제거하고, CLAUDE.md 확인 → 사용자 질문 → 거부 시 로케일 감지+CLAUDE.md 기록 방식으로 변경. Output Language Rule 섹션도 업데이트.
- **Files**:
  - `.claude/agents/planner.md` — 언어 감지 로직 변경
  - `agents/planner.md` — 배포용 동기화
- **Acceptance Criteria**:
  - [ ] Discovery Process에서 CLAUDE.md Language 확인 로직 존재
  - [ ] 사용자 질문 프로토콜 존재
  - [ ] 거부 시 시스템 로케일 감지 + CLAUDE.md 기록 로직 존재
  - [ ] Output Language Rule 섹션이 새 방식 반영
  - [ ] `.claude/agents/planner.md`와 `agents/planner.md` 내용 동일
- **Verify**:
  ```bash
  diff .claude/agents/planner.md agents/planner.md
  grep -c "CLAUDE.md" .claude/agents/planner.md
  ```

### WORK-01-TASK-01: 하위 에이전트 Language fallback 처리
- **Depends on**: WORK-01-TASK-00
- **Scope**: scheduler, builder, verifier, committer의 Output Language Rule에서 CLAUDE.md fallback 참조 추가. Language 필드가 PLAN.md에 없을 경우 CLAUDE.md를 확인하고, 그것도 없으면 en 기본값.
- **Files**:
  - `.claude/agents/scheduler.md` — Output Language Rule 업데이트
  - `.claude/agents/builder.md` — Output Language Rule 업데이트
  - `.claude/agents/verifier.md` — Output Language Rule 업데이트
  - `.claude/agents/committer.md` — Output Language Rule 업데이트
  - `agents/scheduler.md` — 배포용 동기화
  - `agents/builder.md` — 배포용 동기화
  - `agents/verifier.md` — 배포용 동기화
  - `agents/committer.md` — 배포용 동기화
- **Acceptance Criteria**:
  - [ ] 4개 에이전트 모두 CLAUDE.md fallback 참조 존재
  - [ ] Language 우선순위: PLAN.md > CLAUDE.md > en
  - [ ] `.claude/agents/`와 `agents/` 내용 동일 (4개 파일 모두)
- **Verify**:
  ```bash
  for f in scheduler builder verifier committer; do diff .claude/agents/${f}.md agents/${f}.md; done
  grep -l "CLAUDE.md" .claude/agents/scheduler.md .claude/agents/builder.md .claude/agents/verifier.md .claude/agents/committer.md
  ```

### WORK-01-TASK-02: README 문서 업데이트
- **Depends on**: WORK-01-TASK-01
- **Scope**: README.md(영문)와 README_KO.md(한글)의 "Output Language" 섹션을 새 방식(CLAUDE.md 기반 + 사용자 질문 + 거부 시 로케일 감지)으로 업데이트.
- **Files**:
  - `README.md` — Output Language 섹션 업데이트
  - `README_KO.md` — 산출물 언어 섹션 업데이트
- **Acceptance Criteria**:
  - [ ] CLAUDE.md 기반 언어 설정 흐름 설명 존재
  - [ ] 거부 시 시스템 로케일 감지 + CLAUDE.md 기록 설명 존재
  - [ ] 영문/한글 내용이 동일한 의미
- **Verify**:
  ```bash
  grep -c "CLAUDE.md" README.md
  grep -c "CLAUDE.md" README_KO.md
  ```
