# WORK-08-TASK-00: User 클래스 생성

## WORK
WORK-08: 슬라이딩 윈도우 컨텍스트 전달 시스템 동작 검증 테스트

## Dependencies
- (없음)

## Scope

`tmp/user.js` 파일을 생성하여 간단한 User 클래스를 구현한다.

- `name`, `email` 필드를 생성자에서 받는다
- `getInfo()` 메서드는 `"name <email>"` 형식의 문자열을 반환한다
- `module.exports`로 User 클래스를 내보낸다

## Files

| Path | Action | Description |
|------|--------|-------------|
| `tmp/user.js` | CREATE | name, email 필드 + getInfo() 메서드를 가진 User 클래스 |

## Acceptance Criteria
- [ ] `tmp/user.js` 파일이 생성됨
- [ ] User 클래스에 `name`, `email` 필드가 생성자를 통해 설정됨
- [ ] `getInfo()` 메서드가 정의되어 사용자 정보 문자열을 반환함
- [ ] `module.exports = User`로 클래스가 내보내짐

## Verify
```bash
test -f tmp/user.js && echo "PASS: tmp/user.js exists" || echo "FAIL"
grep -q "class User" tmp/user.js && echo "PASS: User class defined" || echo "FAIL"
grep -q "getInfo" tmp/user.js && echo "PASS: getInfo method exists" || echo "FAIL"
grep -q "module.exports" tmp/user.js && echo "PASS: module.exports exists" || echo "FAIL"
node -e "const User = require('./tmp/user'); const u = new User('test', 'test@example.com'); console.log(u.getInfo())" && echo "PASS: User class works" || echo "FAIL"
```
