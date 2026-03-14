# WORK-08: 슬라이딩 윈도우 컨텍스트 전달 시스템 동작 검증 테스트

> Created: 2026-03-12
> 요구사항: N/A
> Project: uc-taskmanager (Universal Claude Task Manager)
> Tech Stack: JavaScript (Node.js)
> Language: ko
> Status: PLANNED

## Goal

WORK-07에서 구현한 슬라이딩 윈도우 컨텍스트 전달 시스템이 실제로 동작하는지 검증하기 위한 테스트 WORK. 모든 파일은 `tmp/` 폴더 안에서만 작업하며 실제 프로젝트 파일은 건드리지 않는다.

## Task Dependency Graph

```
TASK-00 (tmp/user.js 생성)
   |
   v
TASK-01 (tmp/user-validator.js 생성)
   |
   v
TASK-02 (tmp/README.md 생성)
```

## Tasks

### WORK-08-TASK-00: User 클래스 생성
- **Depends on**: (none)
- **Scope**: `tmp/user.js` 파일을 생성하여 name, email 필드와 getInfo() 메서드를 가진 User 클래스를 구현한다
- **Files**: `tmp/user.js`
- **Acceptance Criteria**:
  - [ ] tmp/user.js 파일이 생성됨
  - [ ] User 클래스에 name, email 필드 존재
  - [ ] getInfo() 메서드가 정의됨
  - [ ] module.exports로 User 클래스가 내보내짐

### WORK-08-TASK-01: Email 검증 함수 생성
- **Depends on**: WORK-08-TASK-00
- **Scope**: `tmp/user-validator.js` 파일을 생성하여 user.js의 User 클래스를 import하고 email 형식 검증 함수를 추가한다
- **Files**: `tmp/user-validator.js`
- **Acceptance Criteria**:
  - [ ] tmp/user-validator.js 파일이 생성됨
  - [ ] user.js의 User 클래스를 require로 import
  - [ ] email 형식 검증 함수가 정의됨
  - [ ] 검증 함수가 module.exports로 내보내짐

### WORK-08-TASK-02: README 문서 생성
- **Depends on**: WORK-08-TASK-01
- **Scope**: `tmp/README.md` 파일을 생성하여 user.js와 user-validator.js의 사용법을 설명한다
- **Files**: `tmp/README.md`
- **Acceptance Criteria**:
  - [ ] tmp/README.md 파일이 생성됨
  - [ ] user.js 사용법 설명 포함
  - [ ] user-validator.js 사용법 설명 포함
  - [ ] 코드 예제 포함
