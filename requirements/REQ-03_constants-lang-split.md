# REQ-03: constants.mjs 언어별 분기

## 요구사항
- AGENTS_SRC 경로를 lang 파라미터에 따라 분기
  - ko → agents/ko/
  - en → agents/en/
- CLAUDE_MD_SECTION을 언어별 분리
  - CLAUDE_MD_SECTION_KO: 현재 한국어 버전
  - CLAUDE_MD_SECTION_EN: 영문 버전
- SUPPORTED_LANGS = ['ko', 'en']

## 영향 파일
- lib/constants.mjs
