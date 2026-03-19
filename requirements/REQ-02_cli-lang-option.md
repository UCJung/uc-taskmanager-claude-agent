# REQ-02: CLI --lang 옵션

## 요구사항
- uctm init --lang ko | --lang en
- uctm update --lang ko | --lang en
- --lang 미지정 시 대화형 선택:
  Select language:
    1. English
    2. 한국어
  >
- update 시 --lang 필수. 미지정이면 에러 메시지 + 사용법 안내

## 영향 파일
- bin/cli.mjs: --lang 옵션 파싱
- lib/init.mjs: init(isGlobal, lang) 시그니처 변경
- lib/update.mjs: update(isGlobal, lang) 시그니처 변경
