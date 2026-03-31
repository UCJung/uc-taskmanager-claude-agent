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
  python -m py_compile $(find . -maxdepth 3 -name "*.py" -not -path "*/venv/*" 2>/dev/null) 2>&1
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
  ├─ TASK-00.md               # No WORK prefix
  ├─ TASK-00_result.md        # Separator: underscore
  └─ TASK-01.md ...
```

- WORK ID: `WORK-NN` (e.g., `WORK-03`)
- TASK ID: `TASK-NN` (e.g., `TASK-00`) — WORK prefix must NOT be included

---

## § 4. File System Discovery Scripts

```
# Find latest WORK with incomplete TASKs
# Use Glob tool: pattern "works/WORK-*/" → list all WORK directories (sorted)
# For each WORK (descending), read last line of works/WORK-NN/work_WORK-NN.log
#   - No log file → not started
#   - Last line contains "COMMITTER_DONE" with last TASK number → check if more TASKs remain
# First WORK that is not fully completed is the active WORK

# List all WORKs
# Use Glob tool: pattern "works/WORK-*/"

# WORK/TASK status from activity log (last line)
# Read last line of works/${WORK_ID}/work_${WORK_ID}.log
#   Format: [timestamp] EVENT — description
#
#   Key rule: *_START without matching *_DONE = interrupted, must REDO that step
#
#   COMMITTER_DONE — TASK-NN → TASK-NN completed, next TASK is TASK-(NN+1)
#   COMMITTER_START — TASK-NN → committer interrupted, redo verifier+committer for TASK-NN
#   VERIFIER_DONE — TASK-NN  → TASK-NN verified, needs committer
#   VERIFIER_START — TASK-NN → verifier interrupted, redo verifier+committer for TASK-NN
#   BUILDER_DONE — TASK-NN   → TASK-NN builder done, needs verifier+committer
#   BUILDER_START — TASK-NN  → builder interrupted, redo builder for TASK-NN
#   PLANNER_DONE             → planning done, start first TASK
#   PLANNER_START            → planner interrupted, redo specifier+planner
#   SPECIFIER_DONE           → specifier done, needs planner
#   SPECIFIER_START          → specifier interrupted, redo specifier+planner
#   No log file              → start from scratch
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

→ `{REFERENCES_DIR}/file-content-schema.md` § 1 reference

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
| WORK-MM | ... | DONE | YYYY-MM-DD | YYYY-MM-DD |
```

| Status | Meaning | Trigger |
|--------|---------|---------|
| `IN_PROGRESS` | WORK is being executed | specifier creates WORK |
| `DONE` | All TASKs completed, awaiting review/push | committer completes last TASK |
| `COMPLETED` | Archived to _COMPLETED/ | push merge (Main Claude batch processes all DONE) |

Rules:
- `LAST_WORK_ID` header tracks the highest WORK ID ever created
- **specifier**: on WORK creation, add IN_PROGRESS row + update `LAST_WORK_ID`
- **committer**: when last TASK is completed, change `IN_PROGRESS` → `DONE` and fill completion date (do NOT move folder or remove row)
- **Main Claude** (push procedure): move all DONE WORKs to `works/_COMPLETED/`, remove their rows from WORK-LIST.md

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

## § 10. Callback & Activity Log

### 10-1. Callback (CE7)

Each agent sends START/DONE/FAILED events to the server via CE7 API.

**Activation condition:** Only when `CALLBACK_URL` is available. Check in order:
1. Dispatch XML `<callback-url>` element (passed from Main Claude)
2. Prompt text containing `CALLBACK_URL=...` line
3. If neither found → **skip all callbacks**

**How to resolve CALLBACK_URL and CALLBACK_TOKEN:**

The runner injects callback info directly into the prompt:
```
POST {CALLBACK_URL}
Authorization: Bearer {CALLBACK_TOKEN}
```
The first agent (specifier) extracts these and passes them via dispatch XML to subsequent agents.

**When to send:**
- **START**: At the very beginning of agent execution (after STARTUP)
- **DONE**: At the very end, before returning task-result XML
- **FAILED**: On unrecoverable failure, before returning FAIL task-result

**How to send** (single curl command):
```bash
curl -s --connect-timeout 3 --max-time 5 -X POST "$CALLBACK_URL" \
  -H "Authorization: Bearer $CALLBACK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage":"BUILDER","event":"START","workId":"WORK-09","taskId":"TASK-01"}' \
  2>/dev/null || true
```

- `--connect-timeout 3`: 연결 대기 최대 3초
- `--max-time 5`: 전체 요청 최대 5초
- `|| true`: 실패해도 agent 실행 계속

**Include docs (actual file content, not references):**
- specifier DONE: `"docs": {"requirementContent": "<Requirement.md content>"}`
- planner DONE: `"docs": {"planContent": "<PLAN.md content>"}`
- builder START: `"docs": {"taskContent": "<TASK-NN.md content>"}`
- committer DONE: `"docs": {"resultContent": "<TASK-NN_result.md content>"}`

**Token usage** (DONE event only, optional):
```json
{"inputTokens": 1234, "outputTokens": 567, "cacheCreationTokens": 890, "cacheReadTokens": 456}
```

Callback failure must NOT block agent execution. Always continue.

### 10-2. Activity Log

Each agent records start/end to `works/{WORK_ID}/work_{WORK_ID}.log`.

**All WORKs** — no CALLBACK_URL condition.

**Timestamp:** Run `date -u +"%Y-%m-%dT%H:%M:%SZ"` via Bash tool to get the real UTC time. Do NOT use dummy/placeholder timestamps.

**Format:**
```
[2026-03-30T14:30:00Z] AGENT_EVENT — description
```

**How to write:** Use `Edit` tool to append (NOT Bash).

**Required entries per agent (START and DONE only):**
```
[{timestamp}] SPECIFIER_START — WORK-NN specifier started
[{timestamp}] SPECIFIER_DONE — WORK-NN specifier completed
[{timestamp}] BUILDER_START — TASK-NN implement
[{timestamp}] BUILDER_DONE — TASK-NN complete
[{timestamp}] VERIFIER_START — TASK-NN verification
[{timestamp}] VERIFIER_DONE — TASK-NN verified
[{timestamp}] COMMITTER_START — TASK-NN commit
[{timestamp}] COMMITTER_DONE — TASK-NN committed
```

Do NOT write INIT, REF, PLAN, DISPATCH or other intermediate entries. Only START and DONE per agent role.

---

## § 11. Project Discovery

```bash
# 1. Check CLAUDE.md language setting
grep -oP '(?<=Language:\s?)[a-z]{2}' CLAUDE.md 2>/dev/null

# 2. Tech stack
head -50 package.json 2>/dev/null
head -30 pyproject.toml 2>/dev/null
head -20 Cargo.toml 2>/dev/null
head -10 go.mod 2>/dev/null

# 3. Structure (when needed)
find . -maxdepth 3 -type f \( -name "*.md" -o -name "*.json" -o -name "*.toml" \) -not -path "*/node_modules/*" 2>/dev/null
```

---

## § 12. Bash Command Rules

Bash commands MUST follow these rules for permission compatibility.

**MANDATORY:**
- One simple command per Bash call — NO compound commands (`&&`, `||`, `;`, `|`)
- NO `cd dir && command` — you are already in the project root
- NO multi-line scripts — split into separate Bash calls
- NO sub-shell expansions in arguments — e.g., `$(date ...)` inside `printf`
- Use relative paths from project root (e.g., `works/WORK-01/`) — NO absolute paths
- Use `git add file`, `git commit -m "msg"` — NO `git -C path` flag

**For file operations, prefer dedicated tools over Bash:**
- Read files → `Read` tool (NOT `cat`)
- Write/append files → `Write` tool (NOT `echo >>` or `printf >>`)
- Edit files → `Edit` tool (NOT `sed -i`)
- Search files → `Grep` tool (NOT `grep`)
- Find files → `Glob` tool (NOT `find`)

**Activity log example:**
```
WRONG: printf '[%s]_%s\n' "$(date ...)" "INIT" >> work.log
RIGHT: Use Write tool to append a line to the log file
```

**Git example:**
```
WRONG: cd /path/to/project && git add file && git commit -m "msg"
RIGHT: git add file        (one call)
       git commit -m "msg"  (next call)
```

---

## Version

- Created: 2026-03-10
- Updated: 2026-03-28
