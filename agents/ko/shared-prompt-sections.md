# Shared Prompt Sections

공통 재사용 섹션. 각 에이전트가 `cache_control` 마커로 참조한다.

---

## § 1. Output Language Rule

```
우선순위: PLAN.md > Language: → CLAUDE.md ## Language → en (default)

dispatch 시: <context><language> 필드에 resolved language code 전달
섹션 헤더(##)도 resolved language로 작성 (언어별 매핑 테이블 참조)
```

---

## § 2. Build and Lint Commands

```bash
# Auto-detect Build (스크립트 존재 시에만 실행)
if [ -f "package.json" ]; then
  if node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); process.exit(p.scripts&&p.scripts.build?0:1)" 2>/dev/null; then
    npm run build 2>&1 || bun run build 2>&1 || yarn build 2>&1
  fi
elif [ -f "Cargo.toml" ]; then
  cargo build 2>&1
elif [ -f "go.mod" ]; then
  go build ./... 2>&1
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  python -m py_compile $(find . -name "*.py" -not -path "*/venv/*" | head -20) 2>&1
elif [ -f "Makefile" ]; then
  make build 2>&1 || make 2>&1
fi

# Auto-detect Lint (스크립트 존재 시에만 실행)
if [ -f "package.json" ]; then
  if node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); process.exit(p.scripts&&p.scripts.lint?0:1)" 2>/dev/null; then
    npm run lint 2>&1 || bun run lint 2>&1 || true
  fi
elif [ -f "pyproject.toml" ]; then
  ruff check . 2>&1 || python -m flake8 . 2>&1 || true
fi
```

- 빌드/린트 스크립트가 존재하지 않으면 **skip (N/A 처리)**.
- 빌드/린트 실패 시 보고 전에 반드시 수정.

---

## § 3. WORK and TASK File Path Patterns

```
works/{WORK_ID}/
  ├─ Requirement.md                 # Specifier 생성 (필수)
  ├─ PLAN.md
  ├─ PROGRESS.md
  ├─ TASK-00.md               # WORK prefix 없음
  ├─ TASK-00_progress.md      # 구분자: 언더스코어
  ├─ TASK-00_result.md        # 구분자: 언더스코어
  └─ TASK-01.md ...
```

- WORK ID: `WORK-NN` (e.g., `WORK-03`)
- TASK ID: `TASK-NN` (e.g., `TASK-00`) — WORK prefix 포함 금지

---

## § 4. File System Discovery Scripts

```bash
# 미완료 TASK가 있는 최신 WORK 찾기
for dir in $(ls -d works/WORK-* 2>/dev/null | sort -V -r); do
  WORK_ID=$(basename $dir)
  TOTAL=$(ls $dir/TASK-*.md 2>/dev/null | grep -v result | wc -l)
  DONE=$(ls $dir/TASK-*_result.md 2>/dev/null | wc -l)
  [ "$DONE" -lt "$TOTAL" ] && echo "$WORK_ID" && break
done

# 전체 WORK 목록
ls -d works/WORK-* 2>/dev/null | sort -V

# TASK 완료 현황
TOTAL=$(ls works/${WORK_ID}/TASK-*.md 2>/dev/null | grep -v result | wc -l)
DONE=$(ls works/${WORK_ID}/TASK-*_result.md 2>/dev/null | wc -l)
echo "$DONE / $TOTAL"
```

---

## § 5. Task Result XML Format

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2줄 요약}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{description}</file>
  </files-changed>
  <verification>
    <check name="{type}" status="{PASS|FAIL|N/A}">{details}</check>
  </verification>
  <notes>{다음 단계 참고사항}</notes>
</task-result>
```

---

## § 7. PLAN.md 필수 메타정보 7개 필드

→ `{REFERENCES_DIR}/file-content-schema.md` § 1 참조

| 필드 | 필수 | 설명 |
|------|------|------|
| `> Created:` | ✅ | YYYY-MM-DD |
| `> 요구사항:` | ✅ | `REQ-XXX` 또는 사용자 요청 텍스트 |
| `> Execution-Mode:` | ✅ | `direct` / `pipeline` / `full` |
| `> Project:` | ✅ | 프로젝트명 |
| `> Tech Stack:` | ✅ | 감지된 기술 스택 |
| `> Language:` | ✅ | 언어 코드 (`ko`, `en` 등) |
| `> Status:` | ✅ | 항상 `PLANNED`로 시작 |

---

## § 8. WORK-LIST.md 갱신 규칙

파일: `works/WORK-LIST.md`

**포맷:**
```
LAST_WORK_ID: WORK-XX

| WORK | 제목 | 상태 | 생성일 | 완료일 |
|------|------|------|--------|--------|
| WORK-NN | ... | IN_PROGRESS | YYYY-MM-DD | |
| WORK-MM | ... | DONE | YYYY-MM-DD | YYYY-MM-DD |
```

| 상태 | 의미 | 전환 시점 |
|------|------|-----------|
| `IN_PROGRESS` | WORK 실행 중 | specifier가 WORK 생성 시 |
| `DONE` | 모든 TASK 완료, 리뷰/push 대기 중 | committer가 마지막 TASK 완료 시 |
| `COMPLETED` | _COMPLETED/에 아카이브됨 | push merge (Main Claude가 DONE 일괄 처리) |

규칙:
- `LAST_WORK_ID` 헤더는 지금까지 생성된 최고 WORK ID를 추적
- **specifier**: WORK 생성 시 IN_PROGRESS 행 추가 + `LAST_WORK_ID` 갱신
- **committer**: 마지막 TASK 완료 시 `IN_PROGRESS` → `DONE` 변경 + 완료일 기입 (폴더 이동 또는 행 제거 금지)
- **Main Claude** (push 절차): DONE 상태의 WORK를 모두 `works/_COMPLETED/`로 이동 + WORK-LIST.md에서 해당 행 제거

---

## § 9. 로케일 감지

```
1. CLAUDE.md → "Language: xx" 확인
2. 없으면 사용자에게 언어 질문
3. 없으면 시스템 로케일 자동 감지
   - Windows: powershell -c "[CultureInfo]::CurrentCulture.TwoLetterISOLanguageName"
   - Linux/Mac: locale | grep LANG | grep -oP '[a-z]{2}' | head -1
   - Fallback: "en"
```

---

## § 10. 콜백 전송 템플릿

→ **Bash 명령 규칙: § 13 참조** — 아래 각 단계는 별도 도구 호출이다.

`{CallbackType}`을 실제 키 이름으로 대체 (예: `ProgressCallback`, `TaskCallback`).

**1단계.** `Grep` 도구로 CLAUDE.md에서 `{CallbackType}:` 줄을 찾는다. 없으면 콜백을 건너뛴다.

**2단계.** `Grep` 도구로 CLAUDE.md에서 `CallbackToken:` 줄을 찾는다 (선택).

**3단계.** 단일 `curl` 명령으로 콜백 전송:
```bash
curl -s -X POST "CALLBACK_URL" -H "Content-Type: application/json" -H "X-Runner-Api-Key: TOKEN" -d '{"workId":"WORK-01","taskId":"TASK-00",...}'
```

에이전트별 페이로드 필드:
- **ProgressCallback** (builder): `"status": "IN_PROGRESS"`, `"currentReasoning": "..."`
- **TaskCallback** (committer): `"status": "SUCCESS"`, `"commitHash": "${COMMIT_HASH}"`

---

## § 11. 프로젝트 탐색

```bash
# 1. CLAUDE.md 언어 설정 확인
grep -oP '(?<=Language:\s?)[a-z]{2}' CLAUDE.md 2>/dev/null

# 2. 기술 스택
cat package.json 2>/dev/null | head -50
cat pyproject.toml 2>/dev/null | head -30
cat Cargo.toml 2>/dev/null | head -20
cat go.mod 2>/dev/null | head -10

# 3. 구조 (필요 시)
find . -maxdepth 3 -type f \( -name "*.md" -o -name "*.json" -o -name "*.toml" \) | grep -v node_modules | head -30
```

---

## § 12. Progress File Gate Check

`works/WORK-NN/TASK-XX_progress.md` Gate 조건:
- 파일이 해당 경로에 존재
- `Status: COMPLETED` 줄이 있음
- `## Files Changed` 섹션이 있고 비어 있지 않음

Gate 실패 시 → 즉시 FAIL task-result 반환. 이후 단계 진행 금지.

---

## § 13. Bash 명령 규칙

Bash 명령은 권한 호환성을 위해 다음 규칙을 반드시 따른다.

**필수:**
- Bash 호출 1회에 단순 명령 1개 — 복합 명령 금지 (`&&`, `||`, `;`, `|`)
- `cd dir && command` 금지 — 이미 프로젝트 루트에서 실행 중
- 멀티라인 스크립트 금지 — 별도 Bash 호출로 분리
- 인자 내 서브셸 확장 금지 — 예: `printf` 안에 `$(date ...)`
- 프로젝트 루트 기준 상대경로 사용 (예: `works/WORK-01/`) — 절대경로 금지
- `git add file`, `git commit -m "msg"` 형식 — `git -C path` 플래그 금지

**파일 작업은 Bash 대신 전용 도구 사용:**
- 파일 읽기 → `Read` 도구 (`cat` 금지)
- 파일 쓰기/추가 → `Write` 도구 (`echo >>`, `printf >>` 금지)
- 파일 편집 → `Edit` 도구 (`sed -i` 금지)
- 파일 검색 → `Grep` 도구 (`grep` 금지)
- 파일 찾기 → `Glob` 도구 (`find` 금지)

**Activity log 예시:**
```
잘못: printf '[%s]_%s\n' "$(date ...)" "INIT" >> work.log
올바름: Write 도구로 로그 파일에 한 줄 추가
```

**Git 예시:**
```
잘못: cd /path/to/project && git add file && git commit -m "msg"
올바름: git add file        (1회 호출)
        git commit -m "msg"  (다음 호출)
```

---

## Version

- Created: 2026-03-10
- Updated: 2026-03-28
