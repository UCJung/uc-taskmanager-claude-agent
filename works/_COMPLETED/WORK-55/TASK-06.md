# TASK-06: 레퍼런스 정합화 ② file-content-schema + shared-prompt-sections + xml-schema

## WORK
WORK-55: 파이프라인 에이전트 정의 개선 — 역할 경계·검증 재분배·committer 인라인 흡수

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 나머지 3개 레퍼런스의 섹션 소비 매트릭스에서 commit 열을 제거하고, committer가 수행하던 생성 주체(result.md·WORK-LIST)를 orchestrator로 이관하며, dispatch/게이트 stage 열거를 정합화한다. |
| 매핑 요구사항 | FR-04, FR-06, NFR-02, ASM-03(D-03) |
| 우선순위 | Must |
| 예상 규모 | L |
| 의존관계 | TASK-03 완료 후(vocabulary), TASK-02 완료 후(shared-prompt-sections.md 동일 파일 순차화) |
| Phase | Phase 2 |

## Scope

`develop/references/file-content-schema.md` + `develop/references/shared-prompt-sections.md` + `develop/references/xml-schema.md`만 편집(정본). plugin/npm 미러는 TASK-09.

> **레퍼런스 수정 절차 준수(NFR-02/CON-03)**: § 번호 재번호·재사용 금지, 섹션 추가·삭제 없음, 매트릭스는 committer **열 제거** + orchestrator 인라인 수행분 **orch 열 ✅ 이관**(전이적 배분 정합, D-03).

### file-content-schema.md
1. **섹션 소비 매트릭스 (line 11~19)** — `commit` 열 제거. **orch 열 이관**: committer가 수행하던 § 3(TASK-XX_result.md)을 orchestrator가 인라인 작성하므로 **§ 3 행의 orch를 ✅로** 설정(기존 commit ✅ 대체). § 5(파일 이름 규칙)는 orch 이미 ✅. 준수사항 행은 전 열 공통이므로 commit 열만 제거.
2. **§ 3 TASK-XX_result.md (line 200~249)** — line 234~238 "### Builder Context (SUMMARY)"·"### Verifier Context (FULL)" 구조는 유지. 하단 "생성 주체"가 committer로 명시된 곳이 있으면 **orchestrator**로 변경. (§ 3 본문 형식·언어 헤더 표는 유지 — CON-04.)
3. **§ 5 파일 이름 규칙 표 (line 296~305)** — `TASK 결과 | TASK-NN_result.md | committer` 행의 생성 주체를 **orchestrator**로 변경. 다른 행 유지.

### shared-prompt-sections.md
4. **섹션 소비 매트릭스 (line 11~22)** — `commit` 열 제거. **orch 열 이관**: § 8(WORK-LIST.md 업데이트)을 orchestrator가 인라인 수행하므로 **§ 8 행 orch를 ✅로**. § 5(Task Result XML)의 commit ✅는 제거(orchestrator는 result를 수신·생성하나 전체 파일을 읽으므로 필수 이관 아님 — 단 § 5는 builder/verifier ✅ 유지). § 1·§ 3·§ 12의 commit ✅ 제거.
5. **§ 8 WORK-LIST.md 업데이트 규칙 (line 163~187)** — line 180 상태표 트리거 "committer가 마지막 TASK 완료" → "orchestrator가 마지막 TASK 인라인 커밋 시". line 186 규칙 "**committer**: 마지막 TASK 완료 시 IN_PROGRESS → DONE" → "**orchestrator**(인라인 커밋): …". § 번호 8 유지.
6. **§ 2 (TASK-02가 이미 편집)** — 이 TASK에서는 § 2 본문을 건드리지 않는다(매트릭스 commit 열 제거만). TASK-02와의 충돌 방지를 위해 § 2 line 39~69 본문은 수정 대상 아님.
7. line 24 "§ 10·§ 11은 존재하지 않는다…" 결번 주석 유지(재번호 금지 근거).

### xml-schema.md
8. **섹션 소비 매트릭스 (line 11~22)** — `commit` 열 제거. line 22 각주(§ 4·5·7·8 orchestrator 전용)는 유지. § 1·§ 2·§ 3·§ 6의 commit ✅ 제거.
9. **§ 1 Dispatch 형식 (line 54~57)** — `to` 속성 값 목록 `builder, verifier, committer, planner, specifier`에서 **committer 제거**.
10. **§ 5 Gate 요소 (line 196~201)** — `stage` 속성 "현재 정지된 단계: specifier/planner/builder/verifier/committer"에서 committer 제거(committer는 게이트를 발생시키지 않음). commit은 게이트 없는 인라인 액션이므로 stage 열거에 추가하지 않음.
11. **§ 7 decision 요소** — stage/task 속성 설명에 committer 고유 표현 있으면 정합(대개 무변경).
12. **§ 6 needs-decision** — 자식 에이전트 열거에 committer 있으면 제거(committer는 더 이상 자식 아님).

> vocabulary·생성주체 표기를 orchestrator.md(TASK-03)와 일치시킨다.

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/references/file-content-schema.md` | MODIFY | 매트릭스 commit 열 제거·§3 orch 이관, § 3/§ 5 생성주체 committer→orchestrator |
| `develop/references/shared-prompt-sections.md` | MODIFY | 매트릭스 commit 열 제거·§8 orch 이관, § 8 트리거/규칙 committer→orchestrator (§ 2 본문 불변) |
| `develop/references/xml-schema.md` | MODIFY | 매트릭스 commit 열 제거, § 1 `to` 목록·§ 5 stage 열거·§ 6 자식 열거에서 committer 제거 |

## Acceptance Criteria
- [x] 세 파일의 섹션 소비 매트릭스에 `commit` 열이 없다
- [x] file-content-schema § 3(result.md)·shared § 8(WORK-LIST)의 orch 열이 ✅로 이관되었다(전이적 배분 정합)
- [x] file-content-schema § 5 파일 이름 규칙에서 `TASK-NN_result.md` 생성 주체가 orchestrator이다
- [x] shared § 8 WORK-LIST 트리거·규칙의 주체가 orchestrator(인라인 커밋)로 변경되었다
- [x] xml-schema § 1 `to` 목록·§ 5 stage 열거·§ 6 자식 열거에서 committer가 제거되었다
- [x] shared-prompt-sections.md § 2 본문(빌드/린트 스니펫)은 이 TASK에서 변경되지 않았다(TASK-02 소관)
- [x] § 재번호·섹션 추가/삭제가 없다(§ 10·§ 11 결번 주석 유지)

## Verify
```bash
grep -n "committer" develop/references/xml-schema.md
```
```bash
grep -n "committer\|orchestrator" develop/references/file-content-schema.md
```
```bash
grep -rn "| commit\|commit |" develop/references/shared-prompt-sections.md
```
```bash
grep -n "^## §" develop/references/shared-prompt-sections.md
```
> xml-schema에 committer 열거(to/stage/자식)가 남지 않아야 한다. file-content-schema의 result.md 생성주체가 orchestrator여야 한다. 매트릭스 grep으로 commit 열 제거를 확인하고, `^## §` grep으로 § 번호 실재·결번 유지를 확인한다.
