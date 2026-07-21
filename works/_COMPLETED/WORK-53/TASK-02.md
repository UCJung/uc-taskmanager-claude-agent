# TASK-02: npm/README.md 동기화 (README.md 사본)

## WORK
WORK-53: WORK-52 반영 README 3종 현행화

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | npmjs.com 패키지 페이지에 노출되는 `npm/README.md`가 확정된 영문 `README.md`와 완전히 동일해져, 삭제된 `scheduler` 에이전트 안내(현재 19건)가 사라진다 |
| 매핑 요구사항 | FR-05, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | TASK-01 완료 후 |
| Phase | Phase 2 |

## Scope

프로젝트 `CLAUDE.md`의 Push 절차 4단계("`README.md` → `npm/README.md` 복사 — 영문 README만, 한국어 제외")를 그대로 수행한다.

- **파일 복사로만 수행한다.** 내용을 다시 작성하거나 부분 편집하지 말 것 — 개행 코드(CRLF/LF) 차이로 `diff`가 깨지는 것을 방지한다(R-04).
- 복사 원본은 TASK-01에서 확정된 `README.md`다. TASK-01 완료 전에는 실행하지 않는다.
- `README_KO.md`의 한국어 내용을 `npm/README.md`에 합치지 않는다(CON-02). `README.md` 본문에 원래 포함된 한국어 문자열(`[한국어 문서 (Korean)](README_KO.md)` 링크, `한국어 에이전트` 주석, `## 자동 결정 사항` 표기 등)은 원본 그대로 유지된다 — 별도 제거 대상이 아니다.
- `README.md`를 수정하지 않는다. 사본 쪽만 갱신한다.

> 참고: 이 TASK는 TASK-03(`README_KO.md`)과 서로 다른 파일만 다루므로 병렬 실행 가능하다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `npm/README.md` | MODIFY | `README.md`(TASK-01 확정본)를 그대로 덮어쓰기 |

## Acceptance Criteria

- [x] `diff README.md npm/README.md` 출력이 비어 있다 (FR-05 / AC-02)
- [x] `npm/README.md`의 `scheduler` 언급이 0건이다 (AC-01)
- [x] `npm/README.md`의 줄 수가 `README.md`와 동일하다
- [x] `README.md` 자체는 이 TASK에서 변경되지 않았다
- [x] `npm/README.md`에 `orchestrator`가 포함되고 6개 에이전트 목록이 기재되어 있다 (AC-06)

## Verify

```bash
# 동기화 실행 (builder)
cp README.md npm/README.md

# FR-05 / AC-02 — 차이 없음 (출력이 비어 있어야 함)
diff README.md npm/README.md

# AC-01 — scheduler 0건
grep -c "scheduler" npm/README.md

# 줄 수 동일 확인
wc -l README.md
wc -l npm/README.md

# AC-06 — 6개 에이전트 기재
grep -n "orchestrator, specifier, planner, builder, verifier, committer" npm/README.md

# README.md 무변경 확인 (README.md 관련 출력이 없어야 함)
git status --short README.md
```
