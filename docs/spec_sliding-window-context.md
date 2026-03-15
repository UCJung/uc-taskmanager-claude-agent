# Sliding Window Context Transfer Spec

> uc-taskmanager — 슬라이딩 윈도우 컨텍스트 전달 설계 명세

---

## 1. 배경 및 문제 인식

### 멀티 에이전트 파이프라인의 구조적 비용

Claude Code의 서브에이전트는 매 호출마다 **빈 컨텍스트(empty context)로 시작**한다.
에이전트 격리(isolation)의 본질이 "컨텍스트가 비어있는 새 세션"이기 때문이다.

이로 인해 각 에이전트는 이전 작업을 이해하기 위해 파일을 처음부터 다시 읽어야 한다.

```
단일 세션:
  [컨텍스트 누적] → 재구성 없음 → 효율적

멀티 에이전트:
  [빈 컨텍스트] → 파일 재독 → [빈 컨텍스트] → 파일 재독 → ...
```

### 핵심 문제: reasoning 전달 부재

기존 result.md는 **"무엇을 했는가(what)"** 만 기록했다.
**"왜 그렇게 했는가(why)"** 가 없어서 다음 에이전트가 스스로 추론해야 했다.

```
builder가 auth.ts를 수정했다 → verifier가 auth.ts를 처음부터 읽고 의도를 추론
                                → 불필요한 토큰 낭비
```

---

## 2. 설계 원칙

### 원칙 1: 슬라이딩 윈도우

> 직전 에이전트의 정보는 상세하게, 오래된 정보는 압축하거나 버린다

| 단계 거리 | Detail Level | 전달 내용 |
|---------|-------------|---------|
| 직전 (1단계 전) | **FULL** | what + why + caution + incomplete 전체 |
| 2단계 전 | **SUMMARY** | what만 1~3줄 요약 |
| 3단계 이상 전 | **DROP** | 전달하지 않음 |

### 원칙 2: 필요한 컨텍스트만

> 각 에이전트는 자신이 이어받는 작업의 맥락만 알면 된다

- verifier는 builder가 **왜** 그렇게 구현했는지 알아야 한다
- verifier는 planner가 왜 그 TASK를 만들었는지 몰라도 된다

### 원칙 3: 역할 분리

> result.md 작성 책임을 builder에서 committer로 이전

- **builder**: 구현에만 집중. progress.md에 체크포인트 기록
- **committer**: builder + verifier의 context-handoff를 종합해 result.md 작성

builder가 result.md를 직접 쓰면 작업에 집중하다 빠뜨리는 문제가 발생한다.
저렴한 committer가 구조화된 문서 작성을 전담하는 것이 효율적이다.

---

## 3. context-handoff 구조

에이전트 간 reasoning을 전달하는 핵심 구조체다.

```xml
<context-handoff from="{agent}" detail-level="FULL|SUMMARY|DROP">
  <what>구체적으로 무엇을 변경/검증했는가</what>
  <why>왜 그런 방식을 선택했는가 (FULL only)</why>
  <caution>다음 에이전트가 주의할 점 (FULL only)</caution>
  <incomplete>완료하지 못한 사항 (FULL only)</incomplete>
</context-handoff>
```

### 작성 가이드

| 필드 | 길이 | 포함 내용 |
|------|------|---------|
| `what` | 2~5줄 (FULL), 1~2줄 (SUMMARY) | 파일명, 함수명, 변경 내용 요약 |
| `why` | 2~4줄 | 기술적 근거, 대안 검토, 제약사항 |
| `caution` | 1~3줄 | 연동 코드, side effect, 수동 확인 필요 항목 |
| `incomplete` | 1~2줄 | 못 끝낸 것, 다음 에이전트가 이어받을 것 |

### 예시 (builder FULL)

```xml
<context-handoff from="builder" detail-level="FULL">
  <what>auth.ts 수정 — JWT 만료 시 자동 갱신 로직 추가.
        refreshToken() 함수 신규 작성 (60줄).</what>
  <why>기존 코드는 만료 시 즉시 401 반환.
       UX 개선을 위해 silent refresh 패턴 적용.
       refresh token이 있을 경우에만 재시도.</why>
  <caution>session.ts의 setSession()과 연동됨.
           session.ts 수정 시 side effect 가능.</caution>
  <incomplete>unit test 미작성. verifier가 확인 요망.</incomplete>
</context-handoff>
```

### 예시 (SUMMARY로 압축)

```xml
<context-handoff from="builder" detail-level="SUMMARY">
  <what>auth.ts 수정 — JWT 만료 시 자동 갱신 로직 추가.</what>
</context-handoff>
```

---

## 4. execution-mode별 컨텍스트 전달 방식

슬라이딩 윈도우는 pipeline / full 모드에서 동작한다. direct 모드는 Router가 단일 세션에서 처리하므로 컨텍스트 전달 문제 자체가 없다.

### direct 모드

Router 단일 세션 내 처리 — 서브에이전트 간 handoff 없음.

```
Router 세션:
  [분석] → [코드 수정] → [self-check] → [result.md] → [commit] → [콜백]
  ↑ 모두 동일 세션, 컨텍스트 누적됨
```

### pipeline 모드 — Builder → Verifier → Committer

```
builder 완료
  └─ verifier 수신: builder context-handoff (FULL)
                    → builder가 왜 그렇게 짰는지 알고 타겟 검증 가능

verifier 완료
  └─ committer 수신: verifier context-handoff (FULL)
                     builder context-handoff (SUMMARY)
                     → result.md 작성에 필요한 정보만 보유
```

```
committer가 받는 컨텍스트:
  verifier.what + why + caution + incomplete  ← FULL
  builder.what (1~2줄 요약)                   ← SUMMARY
  planner/scheduler 내용                      ← DROP (pipeline 모드엔 없음)
```

### full 모드 — TASK 간 의존성 전달

TASK-1 완료 후 TASK-2가 시작될 때, TASK-2의 builder는 새 세션으로 시작한다.
scheduler가 슬라이딩 윈도우 규칙에 따라 선행 TASK result context-handoff를 자동으로 포함한다.

```
TASK-00 → TASK-01 → TASK-02 → TASK-03

TASK-03 builder가 받는 컨텍스트:
  TASK-02 result context-handoff  ← FULL  (직전)
  TASK-01 result context-handoff  ← SUMMARY (2단계 전)
  TASK-00 result context-handoff  ← DROP (3단계 전)
```

의존성 깊이에 따라 **scheduler가 자동으로 detail-level을 결정**해서 전달한다.

### scheduler dispatch 예시 (full 모드)

```xml
<dispatch to="builder" work="WORK-NN" task="WORK-NN-TASK-03"
          execution-mode="full">
  <task-spec>...</task-spec>

  <!-- 직전 TASK: FULL -->
  <context-handoff from="prev-task" task="WORK-NN-TASK-02" detail-level="FULL">
    <what>user-validator.js 생성. validateEmail() 함수 구현.</what>
    <why>TASK-02의 User 클래스를 기반으로 검증 레이어 추가.</why>
    <caution>User 클래스의 email 필드명 변경 시 함께 수정 필요.</caution>
    <incomplete>없음</incomplete>
  </context-handoff>

  <!-- 2단계 전 TASK: SUMMARY -->
  <context-handoff from="prev-prev-task" task="WORK-NN-TASK-01" detail-level="SUMMARY">
    <what>user.js 생성. User 클래스 (name, email, getInfo()).</what>
  </context-handoff>

  <!-- TASK-00: DROP — 전달 안 함 -->
</dispatch>
```

---

## 5. progress.md — 체크포인트 시스템

### 목적

비정상 종료(세션 크래시, 타임아웃)에 대비해 builder(또는 direct 모드의 router)가 작업 중간 상태를 파일로 기록한다.

### 구조

상세 포맷은 `agents/file-content-schema.md` § 3 참조.

```markdown
# TASK-XX Progress

- Status: {PENDING | STARTED | IN_PROGRESS | COMPLETED}
- Started: {ISO 8601}
- Updated: {ISO 8601}
- Files changed:
  - `path/to/file.ts` — {CREATE | MODIFY | DELETE}
```

| 시점 | Status |
|------|--------|
| planner 템플릿 | `PENDING` |
| builder 착수 | `STARTED` |
| 파일 변경 중 | `IN_PROGRESS` |
| 완료 | `COMPLETED` |

### 재시작 시 활용

builder가 재dispatch되면 progress.md를 읽고 **마지막 완료된 체크포인트부터 이어서 작업**한다.

### progress.md 선생성 규칙

- **full 모드**: planner가 TASK 파일 생성 시 progress 템플릿을 함께 미리 생성 (`Status: PENDING`)
- **pipeline / direct 모드**: Router가 TASK 파일 생성 시 함께 생성

---

## 6. committer Gate 역할

committer(pipeline / full 모드)는 작업 시작 전 반드시 다음을 확인한다:

```
[Gate 검사]
  1. progress.md 파일이 존재하는가?       → 없으면 FAIL
  2. Status = COMPLETED인가?             → 아니면 FAIL
  3. Files Changed 목록이 비어있지 않은가? → 비어있으면 FAIL

[Gate 통과 시]
  → result.md 작성 (what/why/caution/incomplete)
  → git commit
  → COMMITTER DONE 콜백 전송

[Gate 실패 시]
  → dispatcher(Router 또는 Scheduler)에 FAIL 반환
  → dispatcher가 builder 재dispatch (최대 2회 재시도)
```

direct 모드에서는 Router가 self-check로 동등한 검증을 수행한다.

---

## 7. result.md 구조 (committer 작성)

committer가 builder + verifier의 context-handoff를 종합해 작성한다.

상세 포맷은 `agents/file-content-schema.md` § 4 (full/pipeline) 및 § 5 (direct) 참조.

```markdown
# TASK-XX Result

> WORK: {WORK_ID} — {title}
> Completed: {YYYY-MM-DD HH:MM}
> Status: **DONE**

## 요약
{1-2줄}

## 완료 체크리스트
- [x] {item}

## 검증 결과
- Build: ✅
- Lint: ✅

## 변경 파일
### Created
- `path` — {description}

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)
{builder what 필드 1-3줄}

### Verifier Context (FULL)
{verifier context-handoff 4개 필드}
```

섹션 헤더는 PLAN.md의 `Language:` 설정에 따라 다국어로 작성된다 (en/ko/ja).
direct 모드에서는 Router가 최소 포맷의 result.md를 직접 작성한다 (`Execution-Mode: direct` 필드 포함).

---

## 8. 토큰 절감 효과

TASK 3개 의존성 체인 기준 (TASK-00 → TASK-01 → TASK-02):

| 항목 | 기존 방식 | 슬라이딩 윈도우 | 절감 |
|------|---------|--------------|------|
| TASK-1 소계 | ~10,980 토큰 | ~6,300 토큰 | 43% |
| TASK-2 소계 | ~13,280 토큰 | ~6,600 토큰 | 50% |
| TASK-3 소계 | ~13,280 토큰 | ~6,600 토큰 | 50% |
| **합계** | **~37,540 토큰** | **~19,500 토큰** | **~48%** |

TASK 수가 늘어날수록 기존 방식은 result가 누적되어 컨텍스트가 계속 커지지만,
슬라이딩 윈도우는 **항상 일정 크기를 유지**하므로 절감 효과가 증가한다.

direct 모드의 경우 서브에이전트 세션 초기화 비용(~12,500 토큰) 자체가 0이 되어 추가 절감된다.

---

## 9. 구현 파일 목록

| 파일 | 역할 |
|------|------|
| `agents/file-content-schema.md` | 파이프라인 산출물 포맷 단일 정의 (PLAN.md / TASK / progress.md / result.md) |
| `agents/context-policy.md` | 슬라이딩 윈도우 정책 상세 규칙 |
| `agents/xml-schema.md` | context-handoff XML 요소 스키마 + execution-mode 속성 |
| `agents/router.md` | direct/pipeline/full 모드 판정 + 직접 실행 로직 |
| `agents/scheduler.md` | 슬라이딩 윈도우 dispatch 로직 (full 모드) |
| `agents/builder.md` | progress.md 체크포인트 기록 규칙 |
| `agents/verifier.md` | context-handoff 기반 타겟 검증 |
| `agents/committer.md` | Gate 역할 + result.md 작성 + COMMITTER DONE 콜백 |

---

*최초 작성: 2026-03-12 | WORK-07 구현 기반 | WORK-08 테스트 검증 완료*
*갱신: 2026-03-14 | WORK-10 — SDD v1.3 execution-mode 3종 체계 반영 (direct/pipeline/full)*
*갱신: 2026-03-15 | WORK-19 — progress.md / result.md 구조를 file-content-schema.md와 일치, file-content-schema.md 참조 추가*
