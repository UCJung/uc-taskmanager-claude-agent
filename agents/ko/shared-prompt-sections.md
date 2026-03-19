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

→ `.claude/agents/file-content-schema.md` § 1 참조

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

| 상태 | 시점 |
|------|------|
| `IN_PROGRESS` | WORK 디렉토리 생성 시 추가 |
| `COMPLETED` | 마지막 TASK 완료 시 committer가 자동 변경 |

- WORK 디렉토리 생성 시 반드시 IN_PROGRESS 추가
- committer: 마지막 TASK commit 후 WORK-LIST.md를 `IN_PROGRESS` → `COMPLETED`로 변경

---

## Version

- Created: 2026-03-10
- Updated: 2026-03-15
