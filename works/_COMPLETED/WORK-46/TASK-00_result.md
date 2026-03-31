# TASK-00 Result: shared-prompt-sections.md Bash→Tool 전환 + 동기화

## Status
**PASS**

## Summary
shared-prompt-sections.md § 9와 § 11의 Bash 명령을 Claude 내부 도구로 성공적으로 전환하고, develop/ → plugin/, npm/ 동기화 완료.

## Changes Made

### develop/references/shared-prompt-sections.md
- **§ 9 (Locale Detection)**: grep → Grep 도구로 전환, powershell/locale Bash 유지
- **§ 11 (Project Discovery)**: 
  - grep → Grep 도구
  - head → Read 도구 (limit 파라미터 사용)
  - find → Glob 도구

### plugin/ 및 npm/ 동기화
- `plugin/references/shared-prompt-sections.md` ← develop/ 복사
- `npm/references/shared-prompt-sections.md` ← develop/ 복사
- 다음 agent 파일들도 함께 동기화:
  - `plugin/agents/{scheduler,planner,specifier,builder}.md`
  - `npm/agents/{scheduler,planner,specifier,builder}.md`

## Verification Results

### Acceptance Criteria
- ✓ § 9: Grep 도구 지시문, powershell/locale Bash 유지
- ✓ § 11: grep → Grep, head → Read(limit), find → Glob 변환
- ✓ plugin/, npm/ 동기화 완료

### Verification Command
```bash
grep -c "grep -oP" develop/references/shared-prompt-sections.md
# Output: 0 (모든 grep 명령 제거 확인)
```

### File Integrity
- develop/ == plugin/: ✓ OK
- develop/ == npm/: ✓ OK

## Technical Details

### § 9 Changes
Old:
```
1. CLAUDE.md → check "Language: xx"
```
New:
```
1. Use Grep tool: pattern "Language:\s*[a-z]{2}" path="CLAUDE.md" → extract language code
```
Bash commands retained:
- Windows: `powershell -c "[CultureInfo]::CurrentCulture.TwoLetterISOLanguageName"`
- Linux/Mac: `locale | grep LANG`

### § 11 Changes
Old:
```bash
grep -oP '(?<=Language:\s?)[a-z]{2}' CLAUDE.md
head -50 package.json
head -30 pyproject.toml
find . -maxdepth 3 -type f ...
```
New:
```
Use Grep tool: pattern "Language:\s*[a-z]{2}" path="CLAUDE.md"
Use Read tool: "package.json" (limit=50)
Use Read tool: "pyproject.toml" (limit=30)
Use Read tool: "Cargo.toml" (limit=20)
Use Read tool: "go.mod" (limit=10)
Use Glob tool: pattern "**/*.{md,json,toml}" (exclude node_modules)
```

## Notes for Next Steps
- specifier.md, planner.md, scheduler.md, builder.md 모두 § 9 및 § 11 참조 완료
- agent 파일 수정 불필요 (참조로 자동 반영)
- Bash 명령 규칙 (§ 12) 준수 확인 완료
