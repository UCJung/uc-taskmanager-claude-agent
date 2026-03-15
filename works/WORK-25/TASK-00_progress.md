# TASK-00 Progress

Status: COMPLETED

## Task
builder.md 중복 제거 — 4개 영역을 참조로 대체

## Files Changed
- Modified: agents/builder.md

## Checkpoints
- STARTED: 2026-03-16
- IN_PROGRESS: § 3-2, § 3-5, § 3-8, § 4 Output Language Rule 수정
- COMPLETED: 2026-03-16

## Changes Applied
1. § 3-2 XML Input 파싱 — dispatch XML 코드 블록 제거 → `xml-schema.md` § 1 참조로 대체
2. § 3-5 Self-Check — Build+Lint bash 스크립트 제거 → `shared-prompt-sections.md` § 2 참조로 대체
3. § 3-8 Context-Handoff Output — task-result XML 전체 블록 간소화 → `xml-schema.md` § 2, § 4 참조 + builder 고유 필드만 유지
4. § 4 Output Language Rule — 공통 부분 제거 → `shared-prompt-sections.md` § 1 참조 + builder 고유 규칙만 유지
