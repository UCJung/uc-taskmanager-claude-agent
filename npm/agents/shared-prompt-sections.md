# Shared Prompt Sections

Common reusable sections. Each agent references these via `cache_control` markers.

---

## § 1. Output Language Rule

```
Priority: PLAN.md > Language: → CLAUDE.md ## Language → en (default)

On dispatch: pass resolved language code in <context><language> field
Section headers (##) are also written in the resolved language (refer to language mapping table)
```

---

## § 2. Build and Lint Commands

```bash
# Auto-detect Build (execute only if script exists)
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

# Auto-detect Lint (execute only if script exists)
if [ -f "package.json" ]; then
  if node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); process.exit(p.scripts&&p.scripts.lint?0:1)" 2>/dev/null; then
    npm run lint 2>&1 || bun run lint 2>&1 || true
  fi
elif [ -f "pyproject.toml" ]; then
  ruff check . 2>&1 || python -m flake8 . 2>&1 || true
fi
```

- If build/lint scripts do not exist → **skip (treat as N/A)**.
- On build/lint failure, always fix before reporting.

---

## § 3. WORK and TASK File Path Patterns

```
works/{WORK_ID}/
  ├─ Requirement.md                 # Created by Specifier (mandatory)
  ├─ PLAN.md
  ├─ PROGRESS.md
  ├─ TASK-00.md               # No WORK prefix
  ├─ TASK-00_progress.md      # Separator: underscore
  ├─ TASK-00_result.md        # Separator: underscore
  └─ TASK-01.md ...
```

- WORK ID: `WORK-NN` (e.g., `WORK-03`)
- TASK ID: `TASK-NN` (e.g., `TASK-00`) — WORK prefix must NOT be included

---

## § 4. File System Discovery Scripts

```bash
# Find latest WORK with incomplete TASKs
for dir in $(ls -d works/WORK-* 2>/dev/null | sort -V -r); do
  WORK_ID=$(basename $dir)
  TOTAL=$(ls $dir/TASK-*.md 2>/dev/null | grep -v result | wc -l)
  DONE=$(ls $dir/TASK-*_result.md 2>/dev/null | wc -l)
  [ "$DONE" -lt "$TOTAL" ] && echo "$WORK_ID" && break
done

# List all WORKs
ls -d works/WORK-* 2>/dev/null | sort -V

# TASK completion status
TOTAL=$(ls works/${WORK_ID}/TASK-*.md 2>/dev/null | grep -v result | wc -l)
DONE=$(ls works/${WORK_ID}/TASK-*_result.md 2>/dev/null | wc -l)
echo "$DONE / $TOTAL"
```

---

## § 5. Task Result XML Format

```xml
<task-result work="{WORK_ID}" task="{TASK_ID}" agent="{agent}" status="{PASS|FAIL}">
  <summary>{1-2 line summary}</summary>
  <files-changed>
    <file action="{created|modified|deleted}" path="{path}">{description}</file>
  </files-changed>
  <verification>
    <check name="{type}" status="{PASS|FAIL|N/A}">{details}</check>
  </verification>
  <notes>{notes for next steps}</notes>
</task-result>
```

---

## § 7. PLAN.md Required Meta-Information — 7 Fields

→ `.claude/agents/file-content-schema.md` § 1 reference

| Field | Required | Description |
|-------|----------|-------------|
| `> Created:` | ✅ | YYYY-MM-DD |
| `> Requirement:` | ✅ | `REQ-XXX` or user request text |
| `> Execution-Mode:` | ✅ | `direct` / `pipeline` / `full` |
| `> Project:` | ✅ | Project name |
| `> Tech Stack:` | ✅ | Detected tech stack |
| `> Language:` | ✅ | Language code (`ko`, `en`, etc.) |
| `> Status:` | ✅ | Always starts as `PLANNED` |

---

## § 8. WORK-LIST.md Update Rules

File: `works/WORK-LIST.md`

**Format:**
```
LAST_WORK_ID: WORK-XX

| WORK | 제목 | 상태 | 생성일 | 완료일 |
|------|------|------|--------|--------|
| WORK-NN | ... | IN_PROGRESS | YYYY-MM-DD | |
```

| Status | Timing |
|--------|--------|
| `IN_PROGRESS` | Added when WORK directory is created |

- WORK-LIST.md contains only `IN_PROGRESS` rows — no COMPLETED rows
- `LAST_WORK_ID` header tracks the highest WORK ID ever created
- specifier: on WORK creation, add IN_PROGRESS row + update `LAST_WORK_ID`
- committer: when last TASK is completed, remove the WORK row from WORK-LIST.md and move `works/${WORK_ID}/` to `works/_COMPLETED/${WORK_ID}/`

---

## § 9. Locale Detection

```
1. CLAUDE.md → check "Language: xx"
2. If not found, ask user for language
3. If not found, auto-detect system locale
   - Windows: powershell -c "[CultureInfo]::CurrentCulture.TwoLetterISOLanguageName"
   - Linux/Mac: locale | grep LANG | grep -oP '[a-z]{2}' | head -1
   - Fallback: "en"
```

---

## § 10. Callback Transmission Template

Replace `{CallbackType}` with the actual key name (e.g., `ProgressCallback`, `TaskCallback`).

```bash
CALLBACK_URL=$(grep "^{CallbackType}:" CLAUDE.md 2>/dev/null | sed 's/^{CallbackType}: //' | tr -d '\r')
CALLBACK_TOKEN=$(grep "^CallbackToken:" CLAUDE.md 2>/dev/null | sed 's/^CallbackToken: //' | tr -d '\r')

if [ -n "$CALLBACK_URL" ] && [ "$CALLBACK_URL" != "{CallbackType}:" ]; then
  PAYLOAD=$(cat <<EOF
{
  "workId": "${WORK_ID}",
  "taskId": "${TASK_ID}",
  ... agent-specific fields ...
}
EOF
  )
  AUTH_HEADER=""
  [ -n "$CALLBACK_TOKEN" ] && AUTH_HEADER="-H \"X-Runner-Api-Key: ${CALLBACK_TOKEN}\""
  curl -s -X POST "$CALLBACK_URL" \
    -H "Content-Type: application/json" \
    $AUTH_HEADER \
    -d "$PAYLOAD" > /dev/null 2>&1
fi
```

Agent-specific payload fields:
- **ProgressCallback** (builder): `"status": "IN_PROGRESS"`, `"currentReasoning": "..."`
- **TaskCallback** (committer): `"status": "SUCCESS"`, `"commitHash": "${COMMIT_HASH}"`

---

## § 11. Project Discovery

```bash
# 1. Check CLAUDE.md language setting
grep -oP '(?<=Language:\s?)[a-z]{2}' CLAUDE.md 2>/dev/null

# 2. Tech stack
cat package.json 2>/dev/null | head -50
cat pyproject.toml 2>/dev/null | head -30
cat Cargo.toml 2>/dev/null | head -20
cat go.mod 2>/dev/null | head -10

# 3. Structure (when needed)
find . -maxdepth 3 -type f \( -name "*.md" -o -name "*.json" -o -name "*.toml" \) | grep -v node_modules | head -30
```

---

## § 12. Progress File Gate Check

Gate conditions for `works/WORK-NN/TASK-XX_progress.md`:
- File exists at the expected path
- `Status: COMPLETED` line is present
- `## Files Changed` section is present and non-empty

On gate failure → return FAIL task-result immediately. Do not proceed to subsequent steps.

---

## Version

- Created: 2026-03-10
- Updated: 2026-03-21
