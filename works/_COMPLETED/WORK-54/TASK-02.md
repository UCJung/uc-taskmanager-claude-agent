# TASK-02: constants.mjs obsolete 주석 버전 표기 정정

## WORK
WORK-54: uctm update 갱신 범위 누락 수정

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | `OBSOLETE_PATHS` 의 `references/ref-cache-protocol.md` 항목 주석이 실제 제거 버전(2.0.1)을 정확히 기술하게 된다. |
| 매핑 요구사항 | FR-04 |
| 우선순위 | Should |
| 예상 규모 | S |
| 의존관계 | TASK-00 완료 후 (동일 파일 `constants.mjs` 편집 직렬화) |
| Phase | Phase 2 |

## Scope

`npm/lib/constants.mjs` 의 주석 **한 줄만** 수정한다.

변경 전:

```js
'references/ref-cache-protocol.md',// removed in 2.1.0 — protocol folded into xml-schema.md § 4
```

변경 후:

```js
'references/ref-cache-protocol.md',// removed in 2.0.1 — protocol folded into xml-schema.md § 4
```

### 금지 사항

- `OBSOLETE_PATHS` 배열의 **원소 값(문자열) 자체를 변경/추가/삭제하지 않는다.**
- 다른 항목의 주석(`2.0.0`, `1.5.0`)은 건드리지 않는다.
- 주석의 나머지 문구(` — protocol folded into xml-schema.md § 4`)와 공백/정렬을 그대로 유지한다.
- 이 TASK에서 `init.mjs` / `update.mjs` 는 수정하지 않는다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `npm/lib/constants.mjs` | MODIFY | `OBSOLETE_PATHS` 주석의 `removed in 2.1.0` → `removed in 2.0.1` |

## Acceptance Criteria

- [x] `constants.mjs` 에 `removed in 2.0.1 — protocol folded into xml-schema.md § 4` 주석이 존재
- [x] `constants.mjs` 에 `2.1.0` 문자열이 남아 있지 않음
- [x] `OBSOLETE_PATHS` 배열의 원소 값 4개가 변경 전과 동일
- [x] `node --check` 통과, `uctm --version` 정상 동작
- [x] git diff 가 1행 변경(주석)만 포함

## Verify

```bash
grep -n "removed in 2.0.1" npm/lib/constants.mjs
```

아래는 **매치가 없어야** 통과:

```bash
grep -n "2.1.0" npm/lib/constants.mjs
```

```bash
node --check npm/lib/constants.mjs
```

`OBSOLETE_PATHS` 원소 값 불변 확인 (4개 경로 출력):

```bash
node -e "const p=require('node:path'),u=require('node:url');import(u.pathToFileURL(p.resolve('npm/lib/constants.mjs')).href).then(m=>console.log(JSON.stringify(m.OBSOLETE_PATHS)));"
```

```bash
node npm/bin/cli.mjs --version
```
