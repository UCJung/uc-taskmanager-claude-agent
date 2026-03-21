# Requirement — WORK-38

## Original Request
> WORK-LIST 상태를 IN_PROGRESS → DONE → COMPLETED 3단계로 분리. 자동으로 진행.

## Functional Requirements
- FR-01: committer가 마지막 TASK 완료 시 WORK-LIST.md 상태를 `IN_PROGRESS` → `DONE`으로 변경 (현행: 행 제거 + _COMPLETED 이동)
- FR-02: shared-prompt-sections.md § 8에 `DONE` 상태 추가, 3단계 상태 전이 규칙 명시 (IN_PROGRESS → DONE → COMPLETED)
- FR-03: CLAUDE.md Push 절차에 DONE 상태 WORK 일괄 COMPLETED 처리 단계 추가 (행 제거 + _COMPLETED 이동)
- FR-04: specifier.md에서 IN_PROGRESS WORK 존재 시 안내 문구에 DONE 상태도 포함

## Non-Functional Requirements
- NFR-01: en/ko 양쪽 에이전트 파일 동기화 유지
- NFR-02: 기존 WORK-LIST.md 포맷 호환성 유지

## Acceptance Criteria
- [ ] committer.md (en/ko): 마지막 TASK 완료 시 IN_PROGRESS → DONE 변경, _COMPLETED 이동 제거
- [ ] shared-prompt-sections.md (en/ko) § 8: DONE 상태 행 추가, 3단계 전이 규칙 명시
- [ ] CLAUDE.md Push 절차: DONE → COMPLETED 일괄 처리 (행 제거 + _COMPLETED/ 이동) 단계 포함
- [ ] specifier.md (en/ko): IN_PROGRESS 또는 DONE WORK 존재 시 안내 문구 반영

## 상태 전이 규칙

| 상태 | 위치 | 전환 시점 | 주체 |
|------|------|-----------|------|
| IN_PROGRESS | works/WORK-NN/ + WORK-LIST | WORK 생성 시 | specifier |
| DONE | works/WORK-NN/ + WORK-LIST | 마지막 TASK 완료 시 | committer (자동) |
| COMPLETED | works/_COMPLETED/WORK-NN/ | push/merge 요청 시 | Main Claude (DONE 일괄 처리) |

## 수정 대상 파일
- agents/en/committer.md, agents/ko/committer.md
- agents/en/shared-prompt-sections.md, agents/ko/shared-prompt-sections.md
- agents/en/specifier.md, agents/ko/specifier.md
- CLAUDE.md
