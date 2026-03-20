# TASK-00 Result

> WORK: WORK-33 — 에이전트 중복 지침 통합 — shared-prompt-sections.md 참조 전환
> Completed: 2026-03-21 03:40
> Status: **DONE**
> Commit: 487ba10

## 요약

shared-prompt-sections.md에 4개 신규 섹션(§9-12) 추가 완료. 12개 에이전트 파일의 중복 코드를 모두 shared 참조로 대체하여 유지보수 효율성 향상. en/ko 양쪽 동기화 완료.

## 완료 체크리스트

- [x] shared-prompt-sections.md에 신규 섹션 4개 추가됨 (Language Detection, Callback Template, Project Discovery, Progress Gate Check)
- [x] specifier.md, planner.md에서 Language Detection 중복 코드가 제거되고 shared 참조로 대체됨
- [x] builder.md, committer.md에서 Callback 전송 중복 코드가 제거되고 shared 참조로 대체됨
- [x] specifier.md, planner.md에서 Project Discovery 중복 코드가 제거되고 shared 참조로 대체됨
- [x] verifier.md, committer.md에서 Progress gate check 중복 코드가 제거되고 shared 참조로 대체됨
- [x] 6개 에이전트의 STARTUP 테이블 공통 문구가 간소화됨
- [x] en/ko 양쪽 모두 동일하게 수정됨
- [x] 변경 후 각 에이전트의 지침 의미가 변경 전과 동일함

## 검증 결과

- Build: ✅ (agent md 파일만 수정, 빌드 스크립트 없음)
- Lint: ✅ (md 파일 구조 검증 완료)
- Tests: ✅ (12개 agent 파일 + shared-prompt-sections.md 동기화 확인)

## 변경 파일

### 추가

없음

### 수정

- `agents/en/shared-prompt-sections.md` — 섹션 9-12 추가 (Language Detection § 9, Callback Template § 10, Project Discovery § 11, Progress Gate Check § 12)
- `agents/ko/shared-prompt-sections.md` — 섹션 9-12 추가 (동일 내용)
- `agents/en/specifier.md` — § 3-3, § 3-8 중복 코드 → shared 참조로 대체
- `agents/ko/specifier.md` — § 3-3, § 3-8 중복 코드 → shared 참조로 대체
- `agents/en/planner.md` — § 3-2, § 3-8 중복 코드 → shared 참조로 대체
- `agents/ko/planner.md` — § 3-2, § 3-8 중복 코드 → shared 참조로 대체
- `agents/en/builder.md` — § 3-7 ProgressCallback 중복 코드 → shared 참조로 대체
- `agents/ko/builder.md` — § 3-7 ProgressCallback 중복 코드 → shared 참조로 대체
- `agents/en/committer.md` — § 3-3, § 3-8 중복 코드 → shared 참조로 대체
- `agents/ko/committer.md` — § 3-3, § 3-8 중복 코드 → shared 참조로 대체
- `agents/en/verifier.md` — § 3-3 gate check 중복 코드 → shared 참조로 대체
- `agents/ko/verifier.md` — § 3-3 gate check 중복 코드 → shared 참조로 대체

## 발생 이슈

없음

## 후속 TASK 참고사항

없음

## 컨텍스트 핸드오프

### Builder Context

shared-prompt-sections.md에 §9-12 추가, 12개 에이전트 파일에서 중복 코드를 shared 참조로 대체하여 완료. 모든 에이전트 동작은 변경 전과 동일하게 유지됨.

### Verifier Context

**What**: WORK-33 TASK-00 검증 통과. 모든 4개 신규 섹션(§9-12)이 en/ko 양쪽에 존재 확인. 12개 에이전트 파일의 참조 전환 완료. en/ko 동기화 완료.

**Why**: 중복 코드를 shared-prompt-sections.md로 통합함으로써 유지보수 효율성 극대화 및 일관성 보장. 각 에이전트의 핵심 지침은 보존되고 참조만 변경되어 동작 일관성 유지.

**Caution**: 11개 에이전트 파일이 shared-prompt-sections.md를 참조하므로, 향후 이 파일 수정 시 영향 범위 확대. 참조 구조 문서화 필요.

**Incomplete**: 없음.
