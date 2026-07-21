---
name: uctm-init
description: Initialize uc-taskmanager for the current project. Creates works/ directory and configures Bash permissions in .claude/settings.local.json. Use when the user says "uctm init", "initialize uctm", "uctm 초기화", or "초기화".
---

# uc-taskmanager 초기화

현재 프로젝트를 uc-taskmanager 파이프라인 실행을 위해 초기화합니다.

## 단계

### 1. works/ 디렉토리 생성

```
works/가 없으면:
  works/ 생성
  보고: ✓ works/ 디렉토리 생성됨
아니면:
  보고: - works/ 이미 존재
```

### 2. Bash 권한 설정

**먼저 사용자에게 확인:** "에이전트에 필요한 Bash 권한을 .claude/settings.local.json에 자동 설정할까요? (recommended) [Y/n]"

사용자가 승인하면 (yes/Y/확인):

`.claude/settings.local.json` 읽기 (없으면 생성). 다음 권한을 `permissions.allow` 배열에 병합 — **이미 있는 것은 건너뛰기** (중복 금지):

```json
[
  "Read(/**)",
  "Edit(/**)",
  "Write(/**)",
  "Read(**)",
  "Edit(**)",
  "Write(**)",
  "Bash(ls:*)",
  "Bash(cat:*)",
  "Bash(mkdir:*)",
  "Bash(basename:*)",
  "Bash(find:*)",
  "Bash(wc:*)",
  "Bash(sort:*)",
  "Bash(tail:*)",
  "Bash(head:*)",
  "Bash(echo:*)",
  "Bash(printf:*)",
  "Bash(grep:*)",
  "Bash(sed:*)",
  "Bash(cut:*)",
  "Bash(tr:*)",
  "Bash(node:*)",
  "Bash(npm run:*)",
  "Bash(npm test:*)",
  "Bash(bun run:*)",
  "Bash(yarn:*)",
  "Bash(cargo:*)",
  "Bash(go build:*)",
  "Bash(go test:*)",
  "Bash(python:*)",
  "Bash(ruff:*)",
  "Bash(make:*)",
  "Bash(git:*)"
]
```

기존 `permissions.allow` 및 `permissions.deny` 항목을 보존하고 누락된 것만 추가.

```
권한 추가됨:
  보고: ✓ {N}개 권한이 .claude/settings.local.json에 추가됨 (총: {T})
사용자가 건너뛰면:
  보고: - 권한 설정 건너뜀
이미 모두 설정됨:
  보고: - 모든 권한이 이미 설정됨
```

### 3. 요약

모든 단계 완료 후 요약 표시:

```
uc-taskmanager 초기화 완료!

  ✓ works/ 디렉토리 준비됨
  ✓ Bash 권한 설정됨

  다음: [new-feature] Add a hello world feature 입력
```

## Arguments

$ARGUMENTS
