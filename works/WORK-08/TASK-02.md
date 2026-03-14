# WORK-08-TASK-02: README 문서 생성

## WORK
WORK-08: 슬라이딩 윈도우 컨텍스트 전달 시스템 동작 검증 테스트

## Dependencies
- WORK-08-TASK-01 (user.js와 user-validator.js가 먼저 존재해야 정확한 사용법 문서화 가능)

## Scope

`tmp/README.md` 파일을 생성하여 user.js와 user-validator.js의 사용법을 설명한다.

- 프로젝트 개요 (테스트 목적 설명)
- user.js의 User 클래스 API 설명 + 코드 예제
- user-validator.js의 validateEmail 함수 API 설명 + 코드 예제
- 전체 흐름 예제 (User 생성 -> 검증)

## Files

| Path | Action | Description |
|------|--------|-------------|
| `tmp/README.md` | CREATE | user.js, user-validator.js 사용법 설명 문서 |

## Acceptance Criteria
- [ ] `tmp/README.md` 파일이 생성됨
- [ ] User 클래스 사용법 설명 포함
- [ ] validateEmail 함수 사용법 설명 포함
- [ ] JavaScript 코드 예제가 1개 이상 포함됨

## Verify
```bash
test -f tmp/README.md && echo "PASS: tmp/README.md exists" || echo "FAIL"
grep -qi "user" tmp/README.md && echo "PASS: User class documented" || echo "FAIL"
grep -qi "validator\|validateEmail" tmp/README.md && echo "PASS: validator documented" || echo "FAIL"
grep -c '```' tmp/README.md | xargs -I{} test {} -ge 2 && echo "PASS: code examples included" || echo "FAIL"
```
