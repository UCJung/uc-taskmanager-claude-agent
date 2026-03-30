# ref-cache Protocol

## Overview

ref-cache is a mechanism to avoid redundant file reads across sub-agent invocations within a pipeline.
Reference files are passed between agents via `<ref-cache>` XML elements instead of being re-read from disk each time.

## Protocol (4 Steps)

1. **Check** if `<ref-cache>` exists in the received dispatch XML
2. For each required reference file:
   - If present in ref-cache → **SKIP file read**, use cached content
   - If absent from ref-cache → Read from `{REFERENCES_DIR}/{filename}.md` and add to ref-cache
3. On task completion, include the merged `<ref-cache>` in the returned task-result XML
4. **Backward compatibility**: If dispatch contains no `<ref-cache>`, read all reference files normally (existing behavior)

## ref-cache XML Format

See `xml-schema.md` § 6 for the full schema.

```xml
<ref-cache>
  <ref key="file-content-schema">...content...</ref>
  <ref key="shared-prompt-sections">...content...</ref>
  <!-- one <ref> per loaded reference file -->
</ref-cache>
```

## Chain Propagation

See `agent-flow.md` § ref-cache Chain Propagation for how ref-cache flows between agents in the pipeline.
