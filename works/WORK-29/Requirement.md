# Requirement — WORK-29

## Original Request
> readme 수정 Why This Project Exists 이 부분을 처음 바이브 코딩을 했을때는 신세계였지만 프로젝트 규모가 커질수록 다양한 문제가 발생했다.
> 1. 하나의 세션에서 계속 대화형으로 개발할때 코드 품질 문제
> 2. 대화형으로 하다보니 요구사항과 설계, 구현의 변경내용 같은 부분이 남아있지 않는 문제
> 3. 프로젝트 덩치가 커질수록 추적성이 사라지는 문제
> 이런 인터넷에서 이야기하는 바이브 코딩의 문제점과.. 그래서 이 WORK-PIPELINE Sub agent를 만들었고 이런게 해결된다. 이런 식으로

## Functional Requirements (기능 요구사항)
- FR-01: README.md "Why This Project Exists" 섹션을 바이브 코딩의 구체적 문제점 3가지 중심으로 재작성
- FR-02: README_KO.md "이 프로젝트를 만든 이유" 섹션도 동일한 구조로 재작성

## Non-Functional Requirements (비기능 요구사항)
- NFR-01: 기존 SDD 철학 및 uc-taskmanager 해결책 내용 유지
- NFR-02: 영문/한국어 README 모두 동일 구조 반영

## Acceptance Criteria
- [ ] 바이브 코딩 3가지 문제점(코드 품질, 추적성 부재, 변경이력 소실)이 명시됨
- [ ] 문제점 → 해결책(WORK-PIPELINE) 연결 구조가 자연스러움
- [ ] 영문/한국어 README 모두 동일 구조 반영
