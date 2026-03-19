# Agent Pipeline Flow Refactoring — 설계 최종안

> 작성일: 2026-03-20
> 최종 수정: 2026-03-20
> 상태: 설계 확정 (구현 전)

---

## 1. 변경 배경

### 현재 문제점

| 문제 | 설명 |
|------|------|
| Router-Planner 역할 중복 | Router가 pipeline 모드에서 PLAN.md + TASK-00 생성 (경량 Planner 역할 겸임) |
| 요구사항 추적 부재 | 사용자 원본 요청 → 바로 계획/구현으로 진행, 명세 문서 없음 |
| Router 모드 판단 부정확 | 구체화되지 않은 모호한 요청으로 실행 모드를 추정하여 오판 가능 |
| Router pipeline fallback | Router § 3-5 지시가 빈약하여 direct 모드로 빠지는 버그 발생 (v1.2.0에서 경험) |

### 변경 목표

- 요구사항 명세 단계 신설 (추적성 확보)
- 승인 게이트 도입 (기획자 → 개발자 단계별 검토)
- Router 제거, 역할 재분배 (중복 제거)
- 실행 모드 판단을 사실 기반(TASK 수)으로 전환

---

## 2. 변경 전후 비교

### Before (현재)

```
[] 태그 → Router (모드 판단 + WORK 생성 + PLAN/TASK 생성)
              │
              ├─ direct   → Router가 직접 처리
              ├─ pipeline → Builder → Verifier → Committer
              └─ full     → Planner → Scheduler → Builder → Verifier → Committer
```

### After (최종안)

```
[] 태그 → Specifier → Requirement.md 작성 → 요구사항 규모 판단
                        │
                        ├─ 단순 (FR 1~2개) → Specifier가 Planner 겸임
                        │                    PLAN.md + TASK-00 생성 → [승인 1회] → direct 실행
                        │
                        └─ 복잡 (FR 3개+)  → [기획 승인] → Planner 별도 호출
                                             PLAN.md + TASK 분해 → [개발 승인] → pipeline/full 실행

실행 흐름:
  direct   → Builder(자체 테스트) → Committer
  pipeline → Builder → Verifier → Committer
  full     → Scheduler ─┬→ Builder → Verifier → Committer
                         └→ (TASK 소진까지 반복)
```

> Specifier와 Planner는 동일 모델(Opus)로 동작하며, 단순 요구사항에서 서브에이전트를
> 2회 호출하는 것은 불필요한 비용. Specifier가 요구사항 규모를 자체 판단하여 겸임 여부를 결정한다.

---

## 3. 승인 게이트 설계

### 업무적 흐름 매핑

| 단계 | 에이전트 | 산출물 | 승인자 | 검토 내용 |
|------|---------|--------|--------|----------|
| 요구사항 명세 | Specifier | Requirement.md | 기획자/PO | 요구사항 정확성, 범위 적절성 |
| 설계/분해 | Planner (또는 Specifier 겸임) | PLAN.md + TASK | 개발자/Tech Lead | 기술 설계, TASK 분해 적절성 |
| 구현 | Builder | 코드 | - | (자동) |
| 검증 | Verifier | 테스트 결과 | - | (자동) |
| 배포 | Committer | commit | - | (자동) |

### Specifier 겸임 판단 기준

Specifier는 Requirement.md 작성 후, **요구사항 자체의 복잡도**로 겸임 여부를 판단한다.
코드베이스 분석 없이, 자신이 방금 작성한 요구사항의 규모만으로 결정.

| 조건 | 판단 | 동작 |
|------|------|------|
| FR 1~2개 + 단순 Acceptance Criteria | 단순 → **겸임** | Specifier가 PLAN.md + TASK-00 생성, execution-mode: direct |
| FR 3개+ 또는 NFR 존재 또는 복잡한 기준 | 복잡 → **위임** | Planner 별도 호출 |

겸임 시: 승인 1회 (요구사항 + 설계 통합 검토)
위임 시: 승인 2회 (기획 승인 → 개발 승인)

### 승인 모드

| 모드 | 동작 | 사용 상황 |
|------|------|----------|
| **대화형** (기본) | 각 승인 게이트에서 사용자에게 검토/승인 요청 | 팀 작업, 중요 기능 |
| **자동 승인** | 승인 게이트 스킵, 연속 실행 | 개인 작업, CI/CD, `claude -p` |

자동 승인은 "자동으로 진행" 명시 시 또는 `--dangerously-skip-permissions` 사용 시 활성화.

---

## 4. 에이전트 역할 정의

| 주체 | 역할 | 실행 조건 | 입력 | 산출물 |
|------|------|----------|------|--------|
| **Specifier** | 요구사항 구체화 + WORK 생성 + (겸임 시) 설계/TASK 생성 | 항상 | 사용자 요청 | WORK-NN/, Requirement.md, (겸임 시) PLAN.md + TASK-00.md |
| **Planner** | 설계 + TASK 분해 + 실행모드 결정 | 복잡 요구사항만 | Requirement.md + 코드베이스 | PLAN.md, TASK-NN.md, execution-mode |
| **Scheduler** | TASK DAG 관리 + 실행 순서 제어 | full만 | PLAN.md | READY TASK dispatch XML |
| **Builder** | 코드 구현 + 자체 테스트(build/lint) | 항상 | TASK-NN.md | 코드 파일, task-result XML |
| **Verifier** | 빌드/테스트/체크리스트 검증 | pipeline/full | Builder 결과 | PASS/FAIL task-result XML |
| **Committer** | 결과 보고 + git commit | 항상 | Builder 또는 Verifier 결과 | result.md, git commit, WORK-LIST.md 상태 업데이트 |

---

## 5. 실행 모드 정의

### 모드 판단 기준 (Planner가 결정)

| 모드 | 조건 | 예시 |
|------|------|------|
| **direct** | TASK 1개 + 단순 변경 | 버그 1줄 수정, 설정 변경, 파일명 변경 |
| **pipeline** | TASK 1개 + 구현 규모 있음 | 단일 기능 추가, 게임 만들기 |
| **full** | TASK 여러 개 or 의존성 존재 | 인증 시스템, 대규모 리팩토링 |

### 모드별 실행 흐름

| | Specifier | Planner | Scheduler | Builder | Verifier | Committer | 서브에이전트 호출 수 |
|---|---|---|---|---|---|---|---|
| **direct** | O (겸임) | **X** (Specifier가 겸임) | X | O | **X** | O | **3회** |
| **pipeline** | O | O | X | O | O | O | **5회** |
| **full** | O | O | O | O | O | O | **6회** |

> **direct 모드 최적화**: Specifier가 Planner를 겸임하고 Verifier를 생략하여 서브에이전트 호출을 5회 → 3회로 절감.
> Specifier-Planner 겸임 근거: 동일 모델(Opus)로 동작하므로 컨텍스트 부족 없음. 단순 요구사항에서 2회 호출은 불필요한 비용.
> Verifier 생략 근거: Builder가 이미 self-check(build/lint)를 수행하며, 단일 TASK 단순 변경에 별도 검증은 중복.

---

## 6. 산출물 구조

### WORK 디렉토리

```
works/WORK-NN/
  ├── Requirement.md       ← Specifier 생성 (신규)
  ├── PLAN.md              ← Planner 생성
  ├── TASK-00.md           ← Planner 생성
  ├── TASK-00_progress.md  ← Builder 생성
  ├── TASK-00_result.md    ← Committer 생성
  └── PROGRESS.md          ← Committer 생성
```

### Requirement.md 구조

```markdown
# Requirement — WORK-NN

## Original Request
> 사용자가 입력한 그대로

## Functional Requirements (기능 요구사항)
- FR-01: ...
- FR-02: ...

## Non-Functional Requirements (비기능 요구사항)
- NFR-01: ...
- NFR-02: ...

## Acceptance Criteria
- [ ] 검증 가능한 기준들
```

---

## 7. 제거 대상

| 항목 | 사유 |
|------|------|
| **Router 에이전트** | Specifier + Planner로 역할 분산, 별도 라우터 불필요 |
| **Router 프롬프트** (agents/ko/router.md, agents/en/router.md) | 삭제 대상 |
| **agent-flow.md 내 Router 참조** | Specifier/Planner로 대체 |

---

## 8. 신규 생성 대상

| 항목 | 설명 |
|------|------|
| **Specifier 에이전트 프롬프트** (agents/ko/specifier.md, agents/en/specifier.md) | 요구사항 구체화 전담 |
| **Requirement.md 템플릿** (file-content-schema.md에 추가) | Specifier가 사용할 문서 구조 |
| **agent-flow.md 전면 개정** | 새 파이프라인 흐름 + 승인 게이트 반영 |

---

## 9. 수정 대상

| 파일 | 변경 내용 |
|------|----------|
| **CLAUDE.md** | Router 참조 제거, Specifier 기반 새 흐름 반영 |
| **agent-flow.md** | 전면 재작성 (Specifier → Planner → 모드별 실행 + 승인 게이트) |
| **planner.md** | 실행모드 결정 로직 추가, Requirement.md 입력으로 받기 |
| **builder.md** | direct 모드 시 self-check로 Verifier 역할 겸임 명시 |
| **committer.md** | direct 모드 시 Builder 결과 직접 수신 (Verifier 없이) |
| **file-content-schema.md** | Requirement.md 스키마 추가 |
| **shared-prompt-sections.md** | Specifier 관련 공통 규칙, WORK-LIST 관리 주체 변경 |
| **xml-schema.md** | Specifier dispatch XML 추가 |
| **constants.mjs** | AGENT_FILES에 specifier.md 추가, router.md 제거 |
| **WORK-LIST.md 관리 주체** | Router → Specifier로 이관 |

---

## 10. direct 모드 — 실행 절차

```
Specifier가 요구사항 단순 판정 → Planner 겸임:

1. Specifier 서브에이전트 호출 (1회)
   - Requirement.md 작성
   - 요구사항 규모 판단 → 단순 (FR 1~2개)
   - PLAN.md + TASK-00.md 생성 (Planner 겸임)
   - execution-mode: direct 반환
   - [승인 1회] 요청
2. Builder 서브에이전트 호출
   - TASK-00.md 읽고 코드 구현
   - self-check (build && lint) 수행
   - task-result XML 반환
3. Committer 서브에이전트 호출 (Verifier 생략)
   - TASK-00_result.md 작성
   - git commit
   - WORK-LIST.md → COMPLETED
```

---

## 11. 기대 효과

| 항목 | 효과 |
|------|------|
| 추적성 | 모든 요청에 Requirement.md 생성 → 원본 요구사항 보존 |
| 품질 게이트 | 기획 승인 → 개발 승인 → 구현, 실제 업무 흐름과 일치 |
| 정확성 | TASK 수 기반 모드 판단 → 추정 오판 제거 |
| 단순성 | 에이전트 7개 → 6개 (Router 제거, Specifier 추가), 역할 중복 제거 |
| 효율성 | direct 모드: Specifier 겸임 + Verifier 생략 → 서브에이전트 5회 → 3회 절감 |
| 일관성 | Specifier 항상 실행 → 모든 WORK에 Requirement.md 생성, 동일한 문서 구조 |
| 팀 협업 | 승인 게이트를 통해 기획자/개발자 역할 분리 가능 |
