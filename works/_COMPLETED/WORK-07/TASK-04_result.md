# WORK-07-TASK-04 Result

## Status
SUCCESS

## What

Modified `agents/verifier.md` to add builder context-handoff based verification and verifier context-handoff output rules:

1. **Step 7: Builder Context-Handoff Based Verification** (NEW SECTION)
   - How to use builder's context-handoff for effective verification
   - Check `what` field against Acceptance Criteria
   - Prioritize verification based on `caution` field concerns
   - Assess `incomplete` field for task scope violations
   - Verification priority order: AC > context-handoff > verify commands > conventions

2. **Step 8: Verifier Context-Handoff Output** (NEW SECTION)
   - Verifier must output context-handoff in task-result XML
   - 4-field structure with verifier-specific guidelines
   - `what`: verification results and AC satisfaction summary
   - `why`: reasoning for pass/fail verdict
   - `caution`: test limitations, manual verification needs
   - `incomplete`: environment constraints or deferred verification
   - Integration with committer's result.md synthesis

3. **Updated XML Schema Reference**
   - Added references to context-handoff element (Section 4.5.1)
   - Added reference to context-policy.md for guidelines
   - Clarified builder-result includes context-handoff

4. **Preserved existing functionality**
   - All verification steps (build, lint, tests, AC, files, conventions)
   - Read-only nature (NEVER modify code)
   - Report format and failure details

## Why

Builder context-handoff provides verifier with implementation intent and edge cases, enabling more targeted and efficient verification. By understanding what builder flagged as concerning (caution field), verifier can focus quality gate efforts on high-risk areas.

Verifier context-handoff output provides downstream consumers (committer, subsequent TASKs) with:
- What verification concluded (pass/fail with reasons)
- Why those conclusions were reached
- What couldn't be verified (test limitations, environment constraints)
- What remains for manual verification

This structured output supports both immediate quality gate decisions and downstream context compression via sliding window.

## Caution

Builder context-handoff may not always be present (legacy or non-XML dispatch). Verifier should gracefully fall back to standard verification if context-handoff is missing.

The `caution` field from builder should enhance, not replace, standard verification. Don't skip critical checks just because builder didn't flag them.

Verifier must maintain its read-only nature — using context-handoff for verification guidance is fine, but never modify code based on suggestions in context-handoff.

## Incomplete

None — all acceptance criteria met. Verifier.md now includes complete builder context-handoff based verification rules and verifier context-handoff output specifications.

## Files Changed

| Path | Action |
|------|--------|
| `agents/verifier.md` | modified |

## Context Handoff

### Builder Context (SUMMARY)
Modified agents/verifier.md to add Step 7 builder context-handoff based verification using what/caution/incomplete fields for targeted verification, and Step 8 verifier context-handoff output with 4-field structure for downstream consumption.

### Verifier Context (FULL)
Verified all 7 acceptance criteria: builder context-handoff usage documentation, caution field prioritization, incomplete field assessment, verifier context-handoff output section, 4-field structure definition, AC verification preservation, and Verify command section preservation. Verifier.md now provides complete builder context-handoff leveraging and verifier context-handoff output rules.

## Commit

```
docs(WORK-07-TASK-04): verifier.md context-handoff 기반 검증 규칙

- Step 7: Builder Context-Handoff Based Verification (NEW)
  - Use builder's context-handoff for effective verification
  - Check what field against AC
  - Prioritize verification based on caution field
  - Assess incomplete field for scope violations
  - Verification priority order defined

- Step 8: Verifier Context-Handoff Output (NEW)
  - Verifier outputs context-handoff in task-result XML
  - 4-field structure (what/why/caution/incomplete)
  - Verifier-specific field guidelines
  - Integration with committer result.md synthesis

- Updated XML Schema Reference
  - context-handoff element reference (Section 4.5.1)
  - context-policy.md reference

- All existing functionality preserved
  - Verification steps (build, lint, tests, AC, files)
  - Read-only nature
  - Report format and failure details

Builder 컨텍스트-핸드오프로 타겟 검증.
Verifier 컨텍스트-핸드오프로 검증 결과 전달.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
