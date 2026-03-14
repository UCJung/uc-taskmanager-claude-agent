# WORK-08-TASK-01: Email 검증 함수 생성

## WORK
WORK-08: 슬라이딩 윈도우 컨텍스트 전달 시스템 동작 검증 테스트

## Dependencies
- WORK-08-TASK-00 (User 클래스가 먼저 존재해야 import 가능)

## Scope

`tmp/user-validator.js` 파일을 생성하여 user.js의 User 클래스를 import하고 email 형식을 검증하는 함수를 구현한다.

- `./user.js`에서 User 클래스를 require한다
- `validateEmail(user)` 함수: User 인스턴스의 email이 올바른 형식인지 정규식으로 검증한다
- 검증 결과를 `{ valid: boolean, message: string }` 형태로 반환한다

## Files

| Path | Action | Description |
|------|--------|-------------|
| `tmp/user-validator.js` | CREATE | User 클래스를 import하여 email 형식 검증 함수 구현 |

## Acceptance Criteria
- [ ] `tmp/user-validator.js` 파일이 생성됨
- [ ] `./user`에서 User 클래스를 require로 import
- [ ] `validateEmail(user)` 함수가 정의되어 email 정규식 검증 수행
- [ ] 검증 함수가 `module.exports`로 내보내짐

## Verify
```bash
test -f tmp/user-validator.js && echo "PASS: tmp/user-validator.js exists" || echo "FAIL"
grep -q "require.*user" tmp/user-validator.js && echo "PASS: imports User" || echo "FAIL"
grep -q "validateEmail" tmp/user-validator.js && echo "PASS: validateEmail defined" || echo "FAIL"
grep -q "module.exports" tmp/user-validator.js && echo "PASS: module.exports exists" || echo "FAIL"
node -e "const User = require('./tmp/user'); const { validateEmail } = require('./tmp/user-validator'); const u = new User('test', 'test@example.com'); console.log(validateEmail(u))" && echo "PASS: validation works" || echo "FAIL"
```
