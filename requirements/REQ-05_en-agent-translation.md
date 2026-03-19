# REQ-05: 영문 에이전트 파일 작성

## 요구사항
- agents/ko/의 12개 파일을 영문으로 번역하여 agents/en/에 배치
- 번역 원칙:
  1. YAML frontmatter description → 영문
  2. 섹션 헤더 (## / ###) → 영문
  3. 테이블 헤더/내용 → 영문
  4. 지시문/설명 → 영문
  5. XML 태그명, 속성명 → 변경 없음 (이미 영문)
  6. 코드 블록 내 주석 → 영문
  7. 트리거 태그 → [new-feature] 등 영문 통일
- 용어 통일 (glossary):
  에이전트 → Agent, 슬라이딩 윈도우 → Sliding Window,
  컨텍스트 핸드오프 → Context Handoff, 의존성 → Dependency,
  수행업무 → Duties, 업무수행단계 → Execution Steps,
  제약사항 → Constraints, 금지사항 → Prohibitions

## 제약
- 구조(섹션 수, 번호 체계)는 ko 버전과 완전히 동일 유지
- XML 스키마 동일 유지 (언어 무관)
