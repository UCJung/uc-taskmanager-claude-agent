# Requirement -- WORK-35

## Original Request
> "완료된 WORK를 works/_COMPLETED/로 이동하고 WORK-LIST에서 제거하는 구조 변경"

## Functional Requirements
- FR-01: WORK-LIST.md 포맷 변경 -- 첫 행에 `LAST_WORK_ID: WORK-XX` 메타 정보 추가
- FR-02: committer 동작 변경 -- 마지막 TASK 완료 시 WORK 폴더를 `works/_COMPLETED/`로 이동하고, WORK-LIST.md에서 해당 WORK 행을 제거 (기존: IN_PROGRESS -> COMPLETED 변경)
- FR-03: specifier WORK ID 판정 로직 변경 -- 폴더 스캔 방식 대신 WORK-LIST.md의 `LAST_WORK_ID` 값을 읽어 다음 ID 산출
- FR-04: shared-prompt-sections.md section 8 재정의 -- COMPLETED 상태 제거, IN_PROGRESS만 존재하도록 규칙 변경
- FR-05: scheduler.md 금지 규칙 문구 수정 -- WORK-LIST 관련 문구를 새 구조에 맞게 변경
- FR-06: xml-schema.md 산출물 표 문구 수정 -- WORK-LIST.md 관련 설명을 새 구조에 맞게 변경

## Non-Functional Requirements
- NFR-01: en/ko 양쪽 에이전트 파일 동시 수정 (5개 파일 x 2 = 10파일)
- NFR-02: 기존 works/WORK-LIST.md의 COMPLETED 행들을 제거하고 LAST_WORK_ID 헤더를 추가하는 마이그레이션 수행
- NFR-03: works/_COMPLETED/ 디렉토리 생성 및 기존 완료 WORK 폴더들 이동

## Acceptance Criteria
- [ ] WORK-LIST.md 첫 행에 `LAST_WORK_ID: WORK-34` 형태의 메타 정보가 존재한다
- [ ] WORK-LIST.md에 COMPLETED 상태 행이 존재하지 않는다 (IN_PROGRESS 행만 존재 가능)
- [ ] works/_COMPLETED/ 디렉토리에 기존 완료된 WORK 폴더들이 이동되어 있다
- [ ] committer.md(en/ko)에서 마지막 TASK 완료 시 WORK 폴더 이동 + WORK-LIST 행 제거 로직이 명시되어 있다
- [ ] specifier.md(en/ko)에서 LAST_WORK_ID 기반 WORK ID 판정 로직이 명시되어 있다
- [ ] shared-prompt-sections.md(en/ko) section 8에 COMPLETED 상태가 없고 이동 규칙이 명시되어 있다
- [ ] scheduler.md(en/ko) 금지 규칙 문구가 새 구조에 부합한다
- [ ] xml-schema.md(en/ko) 산출물 표가 새 구조에 부합한다
- [ ] LAST_WORK_ID 업데이트 시점이 명확히 정의되어 있다 (committer가 WORK 완료 시 갱신)
