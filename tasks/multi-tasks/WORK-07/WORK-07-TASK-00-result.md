# WORK-07-TASK-00 Result

## Status
SUCCESS

## What

신규 생성 파일:
- `agents/context-policy.md` — 슬라이딩 윈도우 컨텍스트 전달의 완전한 정책 문서
  - 슬라이딩 윈도우 원칙 (FULL/SUMMARY/DROP)
  - Context-handoff 4-필드 구조 (what/why/caution/incomplete)
  - 파이프라인 단계별 입/출력 매트릭스 (Builder/Verifier/Committer)
  - TASK 간 의존성 전달 규칙 (직전/2단계전/3단계이상)
  - Scheduler 슬라이딩 윈도우 디스패치 로직 설명
  - Committer 재시도 로직 설명

수정 파일:
- `agents/xml-schema.md` — Section 4.5.1 추가
  - context-handoff 요소 정의 (from, detail-level 속성)
  - 4개 자식 요소 (what/why/caution/incomplete) 정의
  - Detail-level 규칙 (FULL/SUMMARY/DROP)
  - FULL과 SUMMARY 수준별 예시 워크플로우
  - context-policy.md 참조

## Why

에이전트 파이프라인에서 의존성이 많을수록 불필요한 컨텍스트 정보가 누적되어 토큰 낭비가 심하다. 슬라이딩 윈도우 정책을 통해:
- 직전 단계: 모든 정보 전달 (의사결정에 필요)
- 2단계 전: 요약만 (전체 흐름 이해)
- 3단계 이상: 제거 (충분히 거리가 있음)

이러한 구조화된 context-handoff는 scheduler, builder, verifier, committer가 일관되게 구현해야 하므로, 정책 문서(context-policy.md)와 스키마(xml-schema.md)를 먼저 확립하는 것이 WORK-07의 첫 번째 과제이다.

## Caution

1. context-policy.md는 모든 인접 TASK-01~05가 준수해야 하는 규범 문서임
2. xml-schema.md의 detail-level 속성은 scheduler.md 구현(TASK-01)에서 실제 dispatch 생성 시 반드시 적용되어야 함
3. 4-필드 구조(what/why/caution/incomplete)에서 각 필드의 역할을 명확히 이해해야 downstream 에이전트들이 효율적으로 활용 가능

## Incomplete

없음 — WORK-07-TASK-00의 모든 acceptance criteria 충족

## Files Changed

| Path | Action |
|------|--------|
| `agents/context-policy.md` | created |
| `agents/xml-schema.md` | modified |
| `tasks/multi-tasks/WORK-07/WORK-07-TASK-00-progress.md` | created |

## Context Handoff

### Builder Context (SUMMARY)
Created agents/context-policy.md with 4-field context-handoff structure and sliding window rules; modified agents/xml-schema.md to add context-handoff element definition.

### Verifier Context (FULL)
Verified that agents/context-policy.md contains complete 4-field structure (what/why/caution/incomplete), sliding window rules (FULL/SUMMARY/DROP), and pipeline I/O matrix. Confirmed agents/xml-schema.md adds context-handoff element with detail-level attribute and examples.

## Commit

```
docs(WORK-07-TASK-00): context-handoff 정책 문서 + xml-schema.md context-handoff 요소 추가

- NEW: agents/context-policy.md — 슬라이딩 윈도우 컨텍스트 전달 정책
  - FULL/SUMMARY/DROP 슬라이딩 윈도우 원칙
  - context-handoff 4-필드 구조 (what/why/caution/incomplete)
  - 파이프라인 단계별 입/출력 매트릭스
  - TASK 간 의존성 전달 규칙 (직전/2단계전/3단계이상)
  - Scheduler 디스패치 로직 및 Committer 재시도 로직 설명

- MODIFY: agents/xml-schema.md
  - Section 4.5.1 추가: <context-handoff> 요소 정의
  - detail-level 속성 (FULL|SUMMARY|DROP)
  - 4개 자식 요소 (what/why/caution/incomplete)
  - FULL/SUMMARY 수준별 예시 워크플로우
  - context-policy.md 참조 추가

이는 슬라이딩 윈도우 기반 에이전트 간 컨텍스트 전달 시스템의 기초를 확립한다.
모든 downstream tasks (TASK-01~05)가 이 정책과 스키마를 준수해야 한다.

Acceptance Criteria:
- [x] context-policy.md 파일이 존재한다
- [x] 슬라이딩 윈도우 원칙(FULL/SUMMARY/DROP)이 정의되어 있다
- [x] context-handoff 4-필드(what/why/caution/incomplete)가 정의되어 있다
- [x] 파이프라인 단계별 입/출력 매트릭스가 정리되어 있다
- [x] TASK 간 의존성 전달 규칙이 명시되어 있다
- [x] xml-schema.md에 context-handoff 요소가 추가되어 있다
- [x] xml-schema.md에 detail-level 속성(FULL/SUMMARY/DROP)이 정의되어 있다
```
