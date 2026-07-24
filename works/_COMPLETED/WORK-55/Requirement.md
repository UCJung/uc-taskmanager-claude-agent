# Requirement — WORK-55

- 복잡도: **Large**
- 예상 영향 범위: `develop/agents/{specifier,planner,builder,verifier,committer,orchestrator}.md`, 배포 사본 2벌(`plugin/agents/*.md`, `npm/agents/*.md`), 관련 레퍼런스(`develop/references/*.md` 및 `plugin/references`·`npm/references` 사본), `docs/`

---

## Original Request

> 이 저장소 자신의 파이프라인 에이전트 정의를 개선하는 메타 작업. 사용자 확정 방향 3건:
>
> **1. specifier/planner — 경계 명확화**
> specifier는 사용자 관점 요구사항 구체화(What), planner는 구현 설계·계획(How)으로 역할을 분리한다. 에이전트 정의 header의 "assumes Planner role"(플래너 역할을 겸한다) 문구를 삭제하고, 코드베이스 심층 탐색·TASK 분해는 planner 전담으로 문구를 정합화한다. **구조 변경은 없으며 문구 정합화에 한정한다.**
>
> **2. builder/verifier — 빌드·린트 재분배**
> builder self-check는 빌드만 수행한다(가장 빠른 실패 감지 유지). 린트는 verifier로 일원화한다. 단, verifier의 린트를 WARN→FAIL로 승격해 게이트를 유지한다(그렇지 않으면 린트 위반이 통과됨).
>
> **3. committer — orchestrator 인라인 흡수**
> verifier가 COMPLETED(PASS)한 직후 orchestrator가 직접 [result.md 작성 → WORK-LIST 갱신 → git commit]을 수행한다. TASK당 spawn을 3개(builder→verifier→committer)에서 2개(builder→verifier)로 줄인다. 전체 spawn 수가 3+3N → 3+2N으로 감소한다. 목적은 haiku 세션 N개 + ref-cache 조립 + 핸드오프 전달 비용 제거다. 검증 독립성(verifier가 read-only로 독립 재실행하는 성질)은 그대로 유지한다.

---

## 배경 및 목적

- **해결하려는 문제:** 파이프라인 에이전트 정의에 역할 경계 모호(specifier가 planner 역할 겸임 문구 잔존), 빌드·린트 검증이 builder·verifier에 중복 배치, TASK마다 committer를 별도 spawn하는 데서 오는 세션·조립·핸드오프 비용이 존재한다.
- **이해관계자:** 이 파이프라인을 사용하는 개발자(플러그인/npm 배포 사용자), 파이프라인을 유지보수하는 저장소 관리자.
- **기존 시스템/프로세스 관계:** orchestrator가 specifier→planner→builder→verifier→committer를 중첩 spawn하는 현행 파이프라인. 레퍼런스는 orchestrator가 1회 읽어 "섹션 소비 매트릭스"로 잘라 자식에게 배분하며(ref-cache), 자식별 섹션 목록은 `orchestrator.md`에 2곳 중복 기재된다.

---

## 범위

### In-Scope

- 파이프라인 에이전트 정의 문서(`develop/agents/*.md`)의 문구·역할·검증 배치·스폰 흐름 정합화
- 위 정의의 배포 사본 2벌(`plugin/agents/*.md`, `npm/agents/*.md`) 동기화
- 변경에 연동되는 레퍼런스 문서(`develop/references/*.md`) 및 그 배포 사본
- 관련 `docs/` 문서 정합화(해당 시)

### Out-of-Scope

- 애플리케이션 런타임 코드(파이프라인 파서·CLI 등) 변경
- 파이프라인 구조를 넘어서는 신규 에이전트/기능 추가
- 1번 항목에서의 구조적 변경(문구 정합화로 한정)

---

## Functional Requirements

| ID | 요구사항 | 우선순위 | 인수 기준 |
|----|---------|---------|----------|
| FR-01 | specifier 정의는 planner 역할 겸임을 나타내는 문구("assumes Planner role" 및 동등 표현)를 포함하지 않아야 하며, 코드베이스 심층 탐색·TASK 분해는 planner 전담임을 명확히 기술해야 한다. | M | - [ ] specifier 정의(및 배포 사본)에서 "assumes Planner role"/"플래너 역할을 겸한다" 문구가 제거됨<br>- [ ] specifier=What, planner=How 경계가 정의 문구로 명시됨<br>- [ ] **구조 변경 없음** — 이 항목으로 인한 스폰 흐름·역할 배치·파일 산출 규칙 변경이 없음이 확인됨 |
| FR-02 | builder self-check는 빌드만 수행해야 한다(가장 빠른 실패 감지 유지). | M | - [ ] builder 정의의 self-check 항목이 빌드 단일 체크로 기술됨<br>- [ ] builder self-check XML 예시에서 lint 체크가 제거됨<br>- [ ] 빌드 스크립트 없음 시 N/A 처리 규칙은 유지됨 |
| FR-03 | 린트 검증은 verifier로 일원화되어야 하며, verifier의 린트 결과는 WARN이 아니라 FAIL로 게이트되어야 한다. | M | - [ ] verifier 정의에서 린트 실패가 FAIL(게이트)로 승격됨(기존 "WARN, CRITICAL 아님" 표현 제거)<br>- [ ] 린트 명령 부재 시 N/A 처리 규칙은 유지됨<br>- [ ] builder에는 더 이상 린트 self-check가 존재하지 않음(FR-02와 정합) |
| FR-04 | committer가 수행하던 [result.md 작성 → WORK-LIST 갱신 → git commit] 절차는 verifier PASS 직후 orchestrator가 인라인으로 수행하도록 정의되어야 한다. | M | - [ ] orchestrator 정의의 TASK 실행 흐름에 result.md 작성·WORK-LIST 갱신·git commit 절차가 인라인으로 기술됨<br>- [ ] committer를 자식으로 spawn하는 지시가 orchestrator 정의에서 제거됨<br>- [ ] result.md(§ 3)·WORK-LIST(§ 8)·commit 규칙의 생성 주체가 orchestrator로 일관되게 반영됨 |
| FR-05 | TASK당 자식 spawn은 builder→verifier 2개로 축소되어, 전체 스폰 수가 3+2N이 되도록 정의되어야 한다. 검증 독립성(verifier의 read-only 독립 재실행)은 유지되어야 한다. | M | - [ ] orchestrator 정의의 TASK 루프가 builder→verifier 2단계로 기술됨(committer 단계 제거)<br>- [ ] 전체 스폰 수 표기가 3+3N → 3+2N으로 갱신됨<br>- [ ] 재시도 규칙(verifier FAIL 시 builder 재디스패치)이 committer 제거 후에도 정합하게 유지됨<br>- [ ] verifier가 read-only 독립 재검증한다는 성질이 문구상 유지됨 |
| FR-06 | 위 변경은 정의 원본(`develop/agents/*.md`)뿐 아니라 배포 사본(`plugin/`, `npm/`)·연동 레퍼런스·docs 전반에 일관되게 반영되어야 한다. | M | - [ ] 변경된 에이전트 정의가 `develop`·`plugin`·`npm` 3곳에서 동일함<br>- [ ] committer 인라인화로 인해 참조가 깨진 레퍼런스/문서가 갱신됨<br>- [ ] "assumes Planner role"·린트 WARN·committer spawn 등 옛 서술이 저장소 전반에 잔존하지 않음 |

---

## Non-Functional Requirements

| ID | 구분 | 요구사항 | 인수 기준 |
|----|------|---------|----------|
| NFR-01 | 일관성(문서 정합성) | 파이프라인 구조를 바꾸는 FR-04/FR-05는 여러 문서에 걸쳐 광범위한 정합화가 필요하다. orchestrator 정의에 committer 관련 서술이 남거나, 자식별 섹션 목록이 불일치하면 안 된다. | - [ ] `orchestrator.md`의 자식별 조립 요약 표 및 STEP A/B/C 스폰 지시에서 committer 항목이 제거·정합됨<br>- [ ] specifier/planner/builder/verifier/committer 간 상호 참조가 변경 후에도 모순 없음 |
| NFR-02 | 절차 준수(레퍼런스 수정 규칙) | 레퍼런스 문서를 수정하는 경우 저장소의 "레퍼런스 수정 절차"를 준수해야 한다. | - [ ] 기존 § 번호 재번호·재사용 금지 준수<br>- [ ] 섹션 삭제 시 결번 처리<br>- [ ] 섹션 소비 매트릭스 갱신<br>- [ ] `orchestrator.md`의 2곳 중복 기재(STEP 1-1 요약 표 + STEP A/B/C 스폰 라인) 동기화<br>- [ ] CLAUDE.md의 검증 절차(매트릭스 섹션 실재·상호참조·전이적 배분) 통과 |
| NFR-03 | 배포 동기화 | `develop/` 원본과 `plugin/`·`npm/` 배포 사본이 이 변경에 대해 완전히 일치해야 한다. | - [ ] 세 위치의 대응 파일 내용이 동일(diff 없음) |

---

## 제약조건

- CON-01: 애플리케이션 런타임 코드는 변경하지 않는다(문서/정의 정합화에 한정).
- CON-02: FR-01은 구조 변경 없이 문구 정합화로만 수행한다.
- CON-03: 레퍼런스 수정 시 CLAUDE.md "레퍼런스 수정 절차"와 파일 상단 섹션 소비 매트릭스 규칙을 반드시 따른다.
- CON-04: 파일 산출·명명 규칙(§ 5), result.md/WORK-LIST 형식 규칙은 committer→orchestrator 주체 변경에도 형식 자체는 유지한다.

## 가정사항

- ASM-01: FR-04 인라인화 이후 `committer.md` 정의 파일의 처리(잔존/삭제/축소) 방식은 후속 설계(planner)에서 결정한다. [확인 필요]
- ASM-02: docs 하위에 committer 스폰/린트 WARN/planner 겸임을 서술한 가이드가 있으면 함께 정합화 대상에 포함된다. [확인 필요]
- ASM-03: 스폰 흐름 변경으로 orchestrator가 committer용 ref-cache를 조립하던 배분(§ 목록)은 제거 또는 orchestrator 인라인 절차로 흡수된다. [확인 필요]

## 용어 정의

| 용어 | 정의 |
|------|------|
| ref-cache | orchestrator가 레퍼런스를 1회 읽고 섹션 소비 매트릭스로 잘라 자식에게 배분하는 조립 결과 |
| self-check | builder가 보고 전 스스로 수행하는 사전 검증(현행: 빌드+린트 → 개선: 빌드) |
| 검증 독립성 | verifier가 builder 산출물을 read-only로 독립 재실행·재검증하는 성질 |
| 3+2N | 초기 3스폰(specifier/planner/orchestrator 계열) + TASK당 2스폰(builder/verifier) |

## 추적성 매트릭스

| 원본 요청 항목 | 관련 FR/NFR | 인수 기준 |
|--------------|------------|----------|
| 1. specifier/planner 경계 명확화 | FR-01, CON-02 | FR-01 AC |
| 2. builder/verifier 빌드·린트 재분배 | FR-02, FR-03 | FR-02·FR-03 AC |
| 3. committer orchestrator 인라인 흡수 | FR-04, FR-05, NFR-01 | FR-04·FR-05 AC |
| Scope: 배포 사본·레퍼런스·docs 정합화 | FR-06, NFR-02, NFR-03 | FR-06·NFR-02·NFR-03 AC |

## 질의응답 기록

| # | 질문 | 답변 | 일시 |
|---|------|------|------|
| — | (mode=auto — 자체 확정, 미해결 질의 없음) | — | 2026-07-23 |

---

## Acceptance Criteria (요약)

- [ ] specifier 정의에서 planner 겸임 문구가 제거되고 What/How 경계가 명시되며, 구조 변경이 없음
- [ ] builder self-check가 빌드 단독으로 축소됨
- [ ] 린트가 verifier로 일원화되고 FAIL로 게이트됨
- [ ] committer 절차가 verifier PASS 직후 orchestrator 인라인으로 수행되고, TASK당 스폰이 2개(3+2N)로 감소하며 검증 독립성이 유지됨
- [ ] 변경이 `develop`·`plugin`·`npm`·레퍼런스·docs 전반에 일관 반영되고, 레퍼런스 수정 절차·매트릭스·orchestrator 2곳 동기화가 준수됨
