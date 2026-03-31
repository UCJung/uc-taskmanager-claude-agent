# TASK-00: shared-prompt-sections.md Bash→Tool 전환 + 동기화

## WORK
WORK-46: Bash 명령을 Claude 내부 툴로 전환

## Dependencies
- (none)

## Scope

### § 9 Locale Detection 변경
현재:
```
1. CLAUDE.md → check "Language: xx"
```
변경:
```
1. Use Grep tool: pattern "Language:\s*[a-z]{2}" in CLAUDE.md → extract language code
```
- powershell, locale 명령은 Bash 유지 (변경 금지)

### § 11 Project Discovery 변경
현재:
```bash
grep -oP '(?<=Language:\s?)[a-z]{2}' CLAUDE.md 2>/dev/null
head -50 package.json 2>/dev/null
head -30 pyproject.toml 2>/dev/null
head -20 Cargo.toml 2>/dev/null
head -10 go.mod 2>/dev/null
find . -maxdepth 3 -type f \( -name "*.md" -o -name "*.json" -o -name "*.toml" \) -not -path "*/node_modules/*" 2>/dev/null
```
변경:
```
# 1. Check CLAUDE.md language setting
Use Grep tool: pattern "Language:\s*[a-z]{2}" in CLAUDE.md

# 2. Tech stack
Use Read tool: "package.json" (limit: 50 lines)
Use Read tool: "pyproject.toml" (limit: 30 lines)
Use Read tool: "Cargo.toml" (limit: 20 lines)
Use Read tool: "go.mod" (limit: 10 lines)

# 3. Structure (when needed)
Use Glob tool: pattern "**/*.{md,json,toml}" (exclude node_modules)
```

### 동기화
- `develop/references/shared-prompt-sections.md` → `plugin/references/shared-prompt-sections.md`
- `develop/references/shared-prompt-sections.md` → `npm/references/shared-prompt-sections.md`

## Files
| Path | Action | Description |
|------|--------|-------------|
| `develop/references/shared-prompt-sections.md` | MODIFY | § 9, § 11 Bash→Tool 전환 |
| `plugin/references/shared-prompt-sections.md` | MODIFY | 동기화 |
| `npm/references/shared-prompt-sections.md` | MODIFY | 동기화 |

## Acceptance Criteria
- [ ] § 9: Grep 도구 지시문, powershell/locale Bash 유지
- [ ] § 11: grep → Grep, head → Read(limit), find → Glob
- [ ] plugin/, npm/ 동기화 완료

## Verify
```bash
grep -c "grep -oP" develop/references/shared-prompt-sections.md
# Expected: 0 (모든 grep 명령 제거 확인)
```
