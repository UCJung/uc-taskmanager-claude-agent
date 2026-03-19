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

| Status | Timing |
|--------|--------|
| `IN_PROGRESS` | Added when WORK directory is created |
| `COMPLETED` | Automatically changed by committer when last TASK is completed |

- Must add IN_PROGRESS when WORK directory is created
- committer: after committing the last TASK, change WORK-LIST.md from `IN_PROGRESS` to `COMPLETED`

---

## Version

- Created: 2026-03-10
- Updated: 2026-03-15
