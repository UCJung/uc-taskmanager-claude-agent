# WORK-02: WORK Seq 인식 오류 개선

> Created: 2026-03-10
> Project: uc-taskmanager
> Tech Stack: Markdown-based agent definitions (no runtime code)
> Language: ko
> Status: PLANNED

## Goal
Planner가 WORK 번호를 결정할 때 MEMORY.md 대신 파일시스템을 우선 참조하도록 개선하여, WORK ID 중복 할당 문제를 방지한다.

## Task Dependency Graph

```
WORK-02-TASK-00: planner.md WORK ID Assignment 로직 개선
        │
        ├──────────────────┐
        ▼                  ▼
WORK-02-TASK-01:     WORK-02-TASK-02:
router.md            README 문서화
WORK 번호 검증       (README.md +
로직 추가            README_KO.md)
```

## Tasks

### WORK-02-TASK-00: planner.md WORK ID Assignment 로직 개선
- **Depends on**: (none)
- **Scope**: planner.md의 "WORK ID Assignment" 섹션을 수정하여 파일시스템 우선 확인 규칙 명시, MEMORY.md 참조 금지, 기존 폴더 존재 시 중단 안전장치 추가
- **Files**:
  - `agents/planner.md` — WORK ID Assignment 섹션 재작성
- **Acceptance Criteria**:
  - [ ] "WORK ID Assignment" 섹션에 파일시스템 우선 규칙이 명시됨
  - [ ] MEMORY.md 참조 금지 규칙이 명시됨
  - [ ] 기존 폴더 존재 시 중단(abort) 안전장치가 포함됨
  - [ ] 기존 Discovery Process의 `ls -d tasks/multi-tasks/WORK-*` 명령이 유지됨
- **Verify**:
  ```bash
  grep -c "MEMORY.md" agents/planner.md | grep -qv "^0$" && grep "파일시스템" agents/planner.md && grep -i "abort\|중단\|safety" agents/planner.md
  ```

### WORK-02-TASK-01: router.md WORK 번호 검증 로직 추가
- **Depends on**: WORK-02-TASK-00
- **Scope**: router.md의 "WORK Assignment Process" 섹션에 WORK 번호 검증 로직 추가. 파일시스템과 MEMORY.md 중 최댓값+1을 사용하는 규칙 명시
- **Files**:
  - `agents/router.md` — WORK Assignment Process 섹션에 검증 로직 추가
- **Acceptance Criteria**:
  - [ ] 파일시스템 스캔 + MEMORY.md 비교 후 최댓값+1 사용 규칙이 명시됨
  - [ ] 검증 로직의 bash 예시 코드가 포함됨
  - [ ] 기존 WORK-LIST.md 관리 로직과 충돌하지 않음
- **Verify**:
  ```bash
  grep "max\|최댓값\|최대" agents/router.md && grep "파일시스템\|filesystem" agents/router.md
  ```

### WORK-02-TASK-02: README 문서 업데이트
- **Depends on**: WORK-02-TASK-00
- **Scope**: README.md와 README_KO.md에 WORK ID 할당 규칙 변경사항 문서화
- **Files**:
  - `README.md` — WORK ID assignment 변경사항 반영
  - `README_KO.md` — 동일 내용 한국어 반영
- **Acceptance Criteria**:
  - [ ] README.md에 파일시스템 우선 WORK ID 할당 규칙이 언급됨
  - [ ] README_KO.md에 동일 내용이 한국어로 언급됨
- **Verify**:
  ```bash
  grep -i "filesystem\|file.system" README.md && grep "파일시스템" README_KO.md
  ```
