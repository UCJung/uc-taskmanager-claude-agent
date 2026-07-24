# TASK-02: builder=빌드 self-check / verifier=린트 FAIL 게이트 재분배

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | builder self-check를 빌드 단독으로 축소(가장 빠른 실패 감지 유지)하고, 린트를 verifier로 일원화하되 verifier의 린트 결과를 WARN이 아니라 FAIL(게이트)로 승격한다. |
| 매핑 요구사항 | FR-02, FR-03 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

`develop/` 원본만 편집(정본). plugin/npm 사본은 TASK-09에서 미러.

### FR-02 — builder self-check = 빌드 단독 (`develop/agents/builder.md`)
1. **§ 1 역할** line 13 "빌드/린트 통과 후 task-result XML 반환" → "빌드 통과 후 task-result XML 반환".
2. **§ 2 수행업무** "셀프 체크 | 빌드 + 린트 통과 확인; 실패 시 수정 후 재실행" → "셀프 체크 | 빌드 통과 확인; 실패 시 수정 후 재실행".
3. **STEP 4 셀프 체크** — "빌드/린트 명령"·"빌드/린트 스크립트가 없으면"·"빌드/린트 실패 시" 표현을 모두 **빌드 단독**으로 수정. 빌드 스크립트 없음 시 N/A 처리 규칙은 유지. 린트는 verifier가 담당함을 1줄 명시(예: "린트는 verifier가 일원화 수행 — builder는 린트를 실행하지 않는다").
4. **§ 3-5 self-check XML 예시** — `<check name="lint" status="PASS" />` 행을 제거하고 `<check name="build" status="PASS" />`만 남긴다.

### FR-03 — 린트 verifier 일원화 + FAIL 게이트 (`develop/agents/verifier.md`)
5. **STEP 3 린트** line 54 "실패 시: WARN (CRITICAL 아님). 명령이 없으면: N/A." → "실패 시: **FAIL (게이트)**. 명령이 없으면: N/A." — WARN/CRITICAL 아님 표현을 제거하고 FAIL로 승격.
6. **§ 3-4 출력 규칙 / verification XML** — `<check name="lint" status="{PASS|FAIL|N/A}"/>`는 이미 FAIL 값을 지원하므로 유지. 린트 FAIL이 전체 판정을 FAIL로 만든다는 취지가 STEP 3 문구로 드러나면 충분. "명령이 없으면: N/A (FAIL이 아님)" 규칙은 유지.

### FR-03 지원 — 린트 exit code 보존 (`develop/references/shared-prompt-sections.md` § 2)
7. **§ 2 린트 자동 감지 스니펫** — 현재 `npm run lint 2>&1 || bun run lint 2>&1 || true` 및 `ruff ... || python -m flake8 . 2>&1 || true`의 말미 `|| true`가 린트 실패 exit code를 삼켜 verifier가 FAIL을 판정할 수 없게 한다. 각 린트 분기의 최종 `|| true`를 제거(또는 exit code가 보존되도록 조정)해 verifier가 린트 실패를 감지·게이트할 수 있게 한다. 빌드 분기는 변경하지 않는다. 빌드/린트 스크립트 부재 시 생략(N/A) 규칙은 유지.
   - 주의(NFR-02): § 2는 **내용 변경**이며 § 번호 재번호·섹션 추가/삭제가 아니다. 매트릭스는 이 TASK에서 건드리지 않는다(committer 열 제거는 TASK-06 소관). 이 파일의 매트릭스/§ 8 편집과 충돌하지 않도록 **§ 2 본문만** 수정한다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/agents/builder.md` | MODIFY | self-check 빌드 단독화, self-check XML lint 체크 제거 |
| `develop/agents/verifier.md` | MODIFY | STEP 3 린트 WARN→FAIL(게이트) 승격 |
| `develop/references/shared-prompt-sections.md` | MODIFY | § 2 린트 분기 `\|\| true` 제거(exit code 보존) — §2 본문만 |

- [x] builder.md self-check 서술이 빌드 단독이며 린트 self-check가 존재하지 않는다
- [x] builder.md self-check XML 예시에 `<check name="lint">`가 없다
- [x] 빌드 스크립트 없음 시 N/A 처리 규칙이 builder.md·verifier.md에 유지된다
- [x] verifier.md STEP 3에서 린트 실패가 FAIL(게이트)로 기술되고 "WARN"·"CRITICAL 아님" 표현이 없다
- [x] verifier.md 린트 명령 부재 시 N/A 규칙이 유지된다
- [x] shared-prompt-sections.md § 2 린트 분기의 말미 `|| true`가 제거되어 exit code가 보존된다(빌드 분기 불변)
- [x] § 2 외 다른 섹션·매트릭스는 이 TASK에서 변경되지 않았다

## Verify
```bash
grep -n "린트\|lint" develop/agents/builder.md
```
```bash
grep -n "WARN" develop/agents/verifier.md
```
```bash
grep -n "|| true" develop/references/shared-prompt-sections.md
```
> builder.md의 self-check 영역에 lint가 없어야 한다. verifier.md의 "WARN" 결과는 0건이어야 한다. shared § 2의 lint 분기 `|| true`가 제거되었는지 확인(빌드 분기에는 원래 `|| true`가 없다).
