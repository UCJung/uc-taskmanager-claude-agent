# Requirement — WORK-46

## Original Request
> 서브에이전트 정의에서 Bash 명령을 Claude 내부 툴(Read, Grep, Glob)로 전환하여
> 플랫폼 이식성, 프롬프트 간결성, 사용자 리뷰 가독성을 개선한다.

## Functional Requirements
- FR-01: `shared-prompt-sections.md` section 9 (Locale Detection) — `CLAUDE.md → check "Language: xx"` 표현을 Grep 도구 명시로 변경. powershell/locale Bash는 유지
- FR-02: `shared-prompt-sections.md` section 11 (Project Discovery) — `grep` → Grep, `head -N` → Read(limit), `find` → Glob으로 전환

## Non-Functional Requirements
- NFR-01: 플랫폼 이식성 — Bash 의존 제거로 Windows/Linux/Mac 동일 동작
- NFR-02: 프롬프트 간결성 — 코드블록 대신 도구 지시문으로 토큰 절약
- NFR-03: 사용자 리뷰 가독성 — Bash 스크립트 대신 자연어 지시문으로 의도 명확화

## Scope Clarification
사용자가 지정한 6개 파일 중 4개(builder, scheduler, planner, specifier)는 이미 전환 완료 상태.
실제 변경 대상은 `develop/references/shared-prompt-sections.md`의 section 9, section 11 두 곳.

## Post-Change
- develop/ → plugin/, npm/ 동기화 (CLAUDE.md Push 절차 1단계)
- 커밋

## Acceptance Criteria
- [ ] section 9: Grep 도구 지시문으로 변경, powershell/locale Bash 유지
- [ ] section 11: grep → Grep, head → Read(limit), find → Glob 전환
- [ ] 동기화: plugin/, npm/ 동일 내용 반영
- [ ] 커밋 완료
