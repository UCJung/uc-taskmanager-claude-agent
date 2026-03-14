# WORK-04-TASK-00: builder.md Serena 탐색 지침 개선

## 목적

`agents/builder.md`를 수정하여 Serena MCP 도구를 우선 활용하도록 개선한다.

## 변경 사항

### 1. tools 헤더 수정

```
# 현재
tools: Read, Write, Edit, Bash, Glob, Grep

# 변경 후
tools: Read, Write, Edit, Bash, Glob, Grep, mcp__serena__*
```

### 2. "Before ANY Implementation" 섹션 교체

bash 명령어 기반 탐색을 Serena MCP 도구 우선 탐색으로 교체한다.

**Serena 탐색 우선순위 (반드시 이 순서 준수)**:
1. `mcp__serena__get_symbols_overview` — 파일/모듈 전체 구조 파악 (파일 전체 읽기 전 항상 먼저)
2. `mcp__serena__find_symbol(include_body=false, depth=1)` — 클래스/모듈의 메서드 목록 파악
3. `mcp__serena__find_symbol(include_body=true)` — 수정할 심볼의 body만 정밀 읽기
4. `mcp__serena__find_referencing_symbols` — 변경 시 영향 받는 참조 심볼 사전 파악
5. `Read` 도구 — 위 4가지로 불충분할 때만 (최후 수단)

### 3. 코드 탐색-편집 흐름 섹션 추가

```
탐색 → 편집 흐름:
1. get_symbols_overview(파일) → 구조 파악
2. find_symbol(클래스, depth=1) → 메서드 목록
3. find_symbol(클래스/메서드, include_body=true) → 정밀 읽기
4. 편집: replace_symbol_body 또는 Edit 도구
5. find_referencing_symbols → 영향 범위 확인 후 필요 시 추가 수정
```

## 대상 파일

- `C:\rnd\agent\uc-taskmanager\agents\builder.md`

## 완료 기준

- tools 헤더에 `mcp__serena__*` 추가됨
- "Before ANY Implementation" 섹션에 Serena 도구 우선순위 지침 포함됨
- 기존 bash self-check 섹션은 유지 (빌드/린트 검증은 bash로 유지)
