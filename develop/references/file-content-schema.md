# 파일 내용 스키마

파이프라인 산출물 파일 형식의 단일 정의 소스.

## 준수사항

| 생성 파일 | 참조 섹션 | 위반 시 결과 |
|-----------|----------|-------------|
| `Requirement.md` | § 0 |  |
| `PLAN.md` | § 1 | `parsePlanMd()` 파싱 실패, scheduler 작동 불가 |
| `TASK-XX.md` | § 2 | `parseTaskFilename()` DB 등록 누락 |
| `TASK-XX_result.md` | § 3 | context-handoff 누락 |
| `TASK-XX_result.md` (direct) | § 4 | result.md 인식 실패 |
| `DECISIONS.md` | § 5 | 재개(resume) 시 PENDING 결정 재제시 불가 |

---

## § 0. Requirement.md

경로: `works/{WORK_ID}/Requirement.md`

```markdown
# Requirement — WORK-NN

## Original Request
> 사용자의 정확한 입력

## Functional Requirements
- FR-01: ...
- FR-02: ...

## Non-Functional Requirements
- NFR-01: ...

## Acceptance Criteria
- [ ] 검증 가능한 기준
```

생성 주체: Specifier (모든 요청에 필수)

---

## § 1. PLAN.md

경로: `works/{WORK_ID}/PLAN.md`

> 요구사항 수준에 따라 ## 설계 이하 간략화 가능

```markdown
# WORK-01: {제목}

> Created: {YYYY-MM-DD}
> Requirement: {REQ-XXX | 사용자 요청 텍스트}
> Execution-Mode: {direct | pipeline | full}
> Project: {프로젝트 이름}
> Tech Stack: {스택}
> Language: {lang_code}
> Status: PLANNED

## 목표
{1-2문장}

## 설계

### 1. 아키텍처 방향

- **접근 방식**: 신규 구축 / 기존 수정 / 확장
- **구조**: (계층형, 이벤트 기반, 마이크로서비스 등)
- **데이터 흐름**: (입력 → 처리 → 출력 경로 요약)

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | 있음 / 없음 |
| 마이그레이션 필요 | 있음 / 없음 |
| 변경 내용 | |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| | REST / GraphQL / gRPC / 파일 | | |

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | | |
| NFR-02 | | |

## 작업 목록 

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | | 없음 | 1 | Must | FR-01 | S/M/L |
| TASK-02 | | TASK-01 | 2 | Must | FR-02, NFR-01 | S/M/L |
| TASK-03 | | 없음 | 1 | Should | FR-03 | S/M/L |
| | | | | | | |


## Task 의존성 그래프
{ASCII 다이어그램}

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | | 높/중/낮 | 높/중/낮 | 회피 / 완화 / 수용 | |
| R-02 | | | | | |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| | FR-01 | TASK-01 | AC-01 | 단위테스트 / 수동확인 / 자동화 |
| | FR-02 | TASK-02 | AC-02 | |
| | NFR-01 | TASK-02 | AC-03 | |

---

## 자체 검증 체크리스트

- [ ] 모든 FR이 최소 1개 Task에 매핑됨
- [ ] 모든 NFR이 설계 또는 Task에 반영됨
- [ ] Task 간 순환 의존 없음
- [ ] 제약조건 내 실현 가능
- [ ] 각 Task에 완료 조건이 있음
- [ ] 리스크가 식별되고 대응 전략이 있음
- [ ] 실행 순서가 의존관계와 일치함

---
```

제목 형식: `# WORK-NN: title` — `# PLAN WORK-NN:` 금지 (`parsePlanMd()` 오류)

---

## § 2. TASK-XX.md

경로: `works/{WORK_ID}/TASK-XX.md`

> `parseTaskFilename()` regex: `/^TASK-(\d+)\.md$/` — WORK 접두사 금지

```markdown
# TASK-XX: {제목}

## WORK
{WORK_ID}: {WORK 제목}

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | (이 Task가 완료되면 무엇이 달라지는가) |
| 매핑 요구사항 | FR-{NN}, NFR-{NN} |
| 우선순위 | Must / Should / Could |
| 예상 규모 | S / M / L |
| 의존관계 | 없음 / TASK-{NN} 완료 후 |
| Phase | Phase {N} |

## Scope
{설명}

## Files
| Path | Action | Description |
|------|--------|-------------|
| `src/file.ts` | CREATE | 설명 |

## Acceptance Criteria
- [ ] {기준}

## Verify
```bash
{검증 명령}
```

---

## § 3. TASK-XX_result.md (full / pipeline)

경로: `works/{WORK_ID}/TASK-XX_result.md`

```markdown
# TASK-XX Result

> WORK: {WORK_ID} — {제목}
> Completed: {YYYY-MM-DD HH:MM}
> Status: **DONE**

{## Summary | ## 요약 | ## サマリー}
{1-2줄}

{## Completed Checklist | ## 완료 체크리스트 | ## 完了チェックリスト}
- [x] {항목}

{## Verification Results | ## 검증 결과 | ## 検証結果}
- Build: ✅
- Lint: ✅
- Tests: ✅ (N passed)

{## Files Changed | ## 변경 파일 | ## 変更ファイル}
### Created
- `path` — {설명}

{## Issues Encountered | ## 발생 이슈 | ## 発生した問題}
None

{## Notes for Subsequent Tasks | ## 후속 TASK 참고사항 | ## 後続タスクへの注記}
None

{## Context Handoff | ## 컨텍스트 핸드오프 | ## コンテキスト引き継ぎ}

### Builder Context (SUMMARY)
{builder what 필드 1-3줄}

### Verifier Context (FULL)
{verifier context-handoff 4개 필드}
```

| 섹션 | en | ko | ja |
|------|----|----|-----|
| Summary | `## Summary` | `## 요약` | `## サマリー` |
| Completed Checklist | `## Completed Checklist` | `## 완료 체크리스트` | `## 完了チェックリスト` |
| Verification Results | `## Verification Results` | `## 검증 결과` | `## 検証結果` |
| Files Changed | `## Files Changed` | `## 변경 파일` | `## 変更ファイル` |
| Issues Encountered | `## Issues Encountered` | `## 발생 이슈` | `## 発生した問題` |
| Notes for Subsequent Tasks | `## Notes for Subsequent Tasks` | `## 후속 TASK 참고사항` | `## 後続タスクへの注記` |
| Context Handoff | `## Context Handoff` | `## 컨텍스트 핸드오프` | `## コンテキスト引き継ぎ` |

---

## § 4. TASK-XX_result.md (direct 모드)

```markdown
# TASK-00 Result

> WORK: WORK-NN — {제목}
> Completed: {YYYY-MM-DD HH:MM}
> Execution-Mode: direct
> Status: **DONE**

## 요약
{1줄}

## 변경 파일
- `{path}` — {설명}

## 검증
- Build: PASS (self-check)
- Lint: PASS (self-check)
```

---

## § 5. DECISIONS.md

경로: `works/{WORK_ID}/DECISIONS.md`

orchestrator가 `<gate type="decision">` 또는 자식 에이전트의 `<needs-decision>`(→ `xml-schema.md` § 5, § 6)을 수신할 때마다 항목을 추가하는 결정 로그. 게이트가 yield된 시점에는 항목을 **PENDING**으로 먼저 기록하고, 승인/자동결정으로 해소되면 같은 항목을 **RESOLVED**로 갱신한다.

```markdown
# DECISIONS — WORK-NN

## D-01
> 시각: {YYYY-MM-DDTHH:MM:SSZ}
> 단계: {specifier|planner|scheduler|builder|verifier|committer}
> 상태: {PENDING|RESOLVED}

### 배경
{결정이 필요한 이유}

### 선택지
1. {선택지 1}
2. {선택지 2}

### 권고안
{orchestrator/자식 에이전트가 제시한 권고}

### 확정값
{확정된 선택 — PENDING 상태에서는 공란 또는 "(대기 중)"}

### 결정주체
{user 승인 | auto}
```

| 필드 | PENDING (게이트 yield 시) | RESOLVED (해소 후) |
|------|---------------------------|---------------------|
| 확정값 | 공란 / `(대기 중)` | 채움 |
| 결정주체 | 공란 | `user 승인` 또는 `auto` |

- **재개(resume) 근거**: orchestrator가 중단 후 재개할 때 DECISIONS.md에서 `상태: PENDING` 항목을 찾아 동일한 배경·선택지·권고안으로 게이트를 다시 제시한다. 이 상태 필드가 없으면 재개 시 이미 물었던 결정인지 판단할 수 없어, 미승인 결정을 건너뛰거나 사용자에게 같은 질문을 중복 제시하는 오류가 발생한다.
- 활동 로그의 `DECISION_WAIT`/`DECISION` 이벤트와 1:1로 대응한다 → `work-activity-log.md` 참조.

생성 주체: orchestrator

---

## § 6. 파일 이름 규칙

| 유형 | 형식 | 생성 주체 |
|------|------|-----------|
| 요구사항 | `Requirement.md` | specifier |
| WORK 계획 | `PLAN.md` | planner / specifier |
| TASK 계획 | `TASK-NN.md` | planner / specifier |
| TASK 결과 | `TASK-NN_result.md` | committer |
| 결정 로그 | `DECISIONS.md` | orchestrator |
| 활동 로그 | `work_WORK-NN.log` | orchestrator (추가) |

`WORK-NN-TASK-NN.md` 형식 금지 → `parseTaskFilename()`이 인식할 수 없음.
