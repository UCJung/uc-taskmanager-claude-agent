# TASK-02 Result

> WORK: WORK-54 — uctm update 갱신 범위 누락 수정
> Completed: 2026-07-22 00:00
> Status: **DONE**

## 요약

`npm/lib/constants.mjs`의 OBSOLETE_PATHS 배열에서 `references/ref-cache-protocol.md` 항목 주석의 제거 버전을 `2.1.0`에서 `2.0.1`로 정정했다. 배열 원소 값과 다른 주석은 변경되지 않았으며, 모든 검증 기준을 통과했다.

## 완료 체크리스트

- [x] `npm/lib/constants.mjs` 46행에 `removed in 2.0.1 — protocol folded into xml-schema.md § 4` 주석 존재
- [x] `npm/lib/constants.mjs`에 `2.1.0` 문자열이 남아있지 않음
- [x] OBSOLETE_PATHS 배열의 원소 값 4개가 변경 전과 동일
- [x] 다른 항목의 주석(`2.0.0`, `1.5.0`) 미변경
- [x] `node --check` 통과
- [x] `uctm --version` 정상 동작 (2.0.1)
- [x] git diff 에 1행 변경(주석)만 포함

## 검증 결과

- Build: N/A
- Lint: N/A
- Tests: ✅ (node --check, version check passed)

## 변경 파일

### Modified
- `npm/lib/constants.mjs` — OBSOLETE_PATHS 배열의 `references/ref-cache-protocol.md` 항목 주석 정정 (2.1.0 → 2.0.1)

## 발생 이슈

None

## 후속 TASK 참고사항

None

## 컨텍스트 핸드오프

### Builder Context (SUMMARY)

npm/lib/constants.mjs의 OBSOLETE_PATHS 배열에서 `references/ref-cache-protocol.md` 항목 주석을 `removed in 2.1.0`에서 `removed in 2.0.1`로 정정했다. 배열 원소 값과 다른 주석은 손대지 않았다.

### Verifier Context (FULL)

**What:**
TASK-02의 모든 인수 기준을 검증해 통과했다. npm/lib/constants.mjs 46행에 `removed in 2.0.1 — protocol folded into xml-schema.md § 4` 주석이 존재하고, 파일 전체에 `2.1.0` 문자열이 남아 있지 않다. OBSOLETE_PATHS 배열 원소 4개(agents/scheduler.md, references/callback-protocol.md, references/ref-cache-protocol.md, skills/sdd-pipeline/references)는 값이 그대로다. 다른 항목의 주석(2.0.0 2건, 1.5.0 1건)도 미변경이다. node --check 통과, `uctm --version`이 2.0.1 정상 출력. git diff --stat 결과 1 insertion(+), 1 deletion(-)으로 정확히 1줄만 변경됐고 init.mjs는 무변경이다.

**Why:**
references/ref-cache-protocol.md가 실제로 2.0.1에서 제거됐으므로 2.1.0은 오기였고, 이를 바로잡는 것이 이 TASK의 목적이다. builder가 Serena replace_content(literal)로 해당 줄만 정확히 치환해 부수 변경이 발생하지 않았다.

**Caution:**
병행 TASK-01이 npm/lib/update.mjs를 수정했고 이미 커밋 5ace047로 반영됐다. constants.mjs에 있는 copyDirRecursive/copyPluginResources 함수는 TASK-00 산출물로 커밋 fcb9312에 포함돼 있어 이번 diff에는 나타나지 않는다.

**Incomplete:**
None
