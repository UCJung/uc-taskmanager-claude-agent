# TASK-00 Result

> WORK: WORK-30 — Claude Marketplace Plugin 형식 전환
> Completed: 2026-03-20 11:40
> Status: **DONE**
> Commit: 1745cf0

## Summary

Restructured agent directory by moving 12 English agent files from `agents/en/` to `agents/` root, updated npm CLI path constants, and modified package.json to reflect new directory structure for Plugin standard compliance.

## Completed Checklist

- [x] agents/en/*.md (12개) → agents/*.md 루트로 이동
- [x] agents/en/ 디렉토리 제거
- [x] lib/constants.mjs getAgentsSrcDir('en') 경로 수정 (agents/ 루트 반환)
- [x] package.json files 필드 업데이트 ("agents/en/" → "agents/*.md")
- [x] agents/ko/ 디렉토리 및 파일 유지 확인

## Verification Results

- File Structure: ✅ (12 en agents in agents/, ko agents in agents/ko/)
- agents/en/ Removal: ✅ (directory removed)
- constants.mjs Logic: ✅ (en path returns agents/ root)
- package.json Manifest: ✅ (files array updated)

## Files Changed

### Created (Moved from agents/en/)
- `agents/agent-flow.md` — Agent orchestration flow
- `agents/builder.md` — Builder agent implementation
- `agents/committer.md` — Committer agent implementation
- `agents/context-policy.md` — Context window management policy
- `agents/file-content-schema.md` — File format specifications
- `agents/planner.md` — Planner agent implementation
- `agents/scheduler.md` — Scheduler agent implementation
- `agents/shared-prompt-sections.md` — Shared prompt sections
- `agents/specifier.md` — Specifier agent implementation
- `agents/verifier.md` — Verifier agent implementation
- `agents/work-activity-log.md` — Activity log format definition
- `agents/xml-schema.md` — XML communication schema

### Deleted
- `agents/en/agent-flow.md` — (moved to root)
- `agents/en/builder.md` — (moved to root)
- `agents/en/committer.md` — (moved to root)
- `agents/en/context-policy.md` — (moved to root)
- `agents/en/file-content-schema.md` — (moved to root)
- `agents/en/planner.md` — (moved to root)
- `agents/en/scheduler.md` — (moved to root)
- `agents/en/shared-prompt-sections.md` — (moved to root)
- `agents/en/specifier.md` — (moved to root)
- `agents/en/verifier.md` — (moved to root)
- `agents/en/work-activity-log.md` — (moved to root)
- `agents/en/xml-schema.md` — (moved to root)

### Modified
- `lib/constants.mjs` — Added condition to return agents/ root for en language
- `package.json` — Updated files array to include agents/*.md

## Issues Encountered

None

## Notes for Subsequent Tasks

TASK-01 depends on this restructuring being complete. With agents now at Plugin standard location, `.claude-plugin/plugin.json` manifest can be generated referencing the new paths.

## Context Handoff

### Builder Context (SUMMARY)

Successfully relocated 12 English agent definition files from `agents/en/` to `agents/` root directory to align with Claude Plugin marketplace standard directory structure. Updated npm CLI constants and package.json manifest to reference new paths. English agent versions now serve dual purpose: npm CLI (via getAgentsSrcDir('en')) and Plugin marketplace. Korean agents remain in `agents/ko/` for language-specific CLI support.

### Verifier Context (FULL)

**what**: 12 English agent markdown files moved from agents/en/ to agents/ root; lib/constants.mjs updated to return agents/ path for en language; package.json files array modified to include agents/*.md glob pattern.

**why**: Claude Plugin marketplace requires agents at standard plugin root location. Current npm CLI path logic can coexist by conditionally returning agents/ root for en language, allowing Plugin and npm deployments to work from same codebase.

**caution**: agents/ko/ directory remains untouched and should not be affected by this change. Verify that uctm init --lang ko still correctly references agents/ko/ path.

**incomplete**: None. All file movements, deletions, and code updates completed and verified.
