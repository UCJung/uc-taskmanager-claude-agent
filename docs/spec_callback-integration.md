# Specification: Task Callback Integration

## Overview

The uc-taskmanager pipeline supports optional HTTP callbacks for external system integration. This allows external systems (e.g., uc-teamspace) to receive real-time notifications of task progress and completion results.

### Design Principles

1. **Optional Activation**: Callbacks are only active if TaskCallback/ProgressCallback URLs are configured in CLAUDE.md
2. **Failure Tolerance**: If curl fails, agents print a warning and continue (never block task execution)
3. **Universal Compatibility**: Projects without callback configuration operate unchanged

### Callback Agents

- **TaskCallback**: Invoked by committer after result.md is generated and git commit completes
- **ProgressCallback**: Invoked by builder after progress.md checkpoint updates

---

## CLAUDE.md Configuration Spec

Add the following optional fields to your project's `CLAUDE.md`:

```markdown
## Task Callbacks

TaskCallback: http://your-system.com/api/v1/task-result
ProgressCallback: http://your-system.com/api/v1/task-progress
CallbackToken: <bearer-token>
```

### Configuration Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `TaskCallback` | Optional | HTTP endpoint to receive final task results (POST) | `http://localhost:3000/api/v1/task-result` |
| `ProgressCallback` | Optional | HTTP endpoint to receive progress updates (POST) | `http://localhost:3000/api/v1/task-progress` |
| `CallbackToken` | Optional | Bearer token for Authorization header | `sk_test_abcd1234...` |

### Behavior

- If `TaskCallback` is missing → No task completion notifications sent
- If `ProgressCallback` is missing → No progress updates sent
- If `CallbackToken` is missing → curl requests use no Authorization header
- If all three are missing → Pipeline operates in standalone mode (no external notifications)

---

## TaskCallback Payload Schema

Sent by **committer** after git commit completes.

### JSON Schema

```json
{
  "workId": "WORK-09",
  "taskId": "WORK-09-TASK-01",
  "status": "SUCCESS|PARTIAL|FAILED",
  "what": "Implementation summary: files created/modified/deleted, features added, verification results",
  "why": "Technical reasoning: why implemented this way, alternatives considered",
  "caution": "Edge cases, conditional completion, assumptions made, manual verification needed",
  "incomplete": "Unfinished items, postponed work, known limitations, or empty string if complete",
  "filesChanged": [
    "agents/committer.md",
    "agents/shared-prompt-sections.md"
  ],
  "commitHash": "a3dc4f0",
  "timestamp": "2026-03-12T10:15:30Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `workId` | string | WORK identifier (e.g., `WORK-09`) |
| `taskId` | string | Task identifier (e.g., `WORK-09-TASK-01`) |
| `status` | enum | `SUCCESS` = all acceptance criteria met, `PARTIAL` = some criteria incomplete, `FAILED` = task failed |
| `what` | string | Concrete summary of changes: files created/modified, new functions, configuration updates (2-5 lines) |
| `why` | string | Technical reasoning for implementation approach, alternatives considered (2-4 lines) |
| `caution` | string | Edge cases, conditional completion, assumptions, verifier notes (1-3 lines) |
| `incomplete` | string | Unfinished items, postponed work, limitations (1-2 lines, or empty if complete) |
| `filesChanged` | array | List of relative file paths modified (e.g., `["agents/committer.md", "agents/builder.md"]`) |
| `commitHash` | string | Git commit hash (short form, e.g., `a3dc4f0`) |
| `timestamp` | string | ISO 8601 UTC timestamp (e.g., `2026-03-12T10:15:30Z`) |

### HTTP Request Format

```bash
curl -X POST "http://your-system.com/api/v1/task-result" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_test_abcd1234..." \
  -d '{
    "workId": "WORK-09",
    "taskId": "WORK-09-TASK-01",
    "status": "SUCCESS",
    "what": "Added TaskCallback section to committer.md with conditional curl invocation",
    "why": "Enable external systems to receive task completion notifications",
    "caution": "Curl failure must not block commit completion",
    "incomplete": "",
    "filesChanged": ["agents/committer.md"],
    "commitHash": "a3dc4f0",
    "timestamp": "2026-03-12T10:15:30Z"
  }'
```

### Expected Response

- **Success (2xx)**: Callback received and processed
- **Failure (4xx/5xx)**: Callback processing failed
- **Network Error**: Connection timeout, DNS failure, etc.

**Agent Behavior on Failure**: Print warning and continue (commit already completed)

---

## ProgressCallback Payload Schema

Sent by **builder** after progress.md checkpoint updates.

### JSON Schema

```json
{
  "workId": "WORK-09",
  "taskId": "WORK-09-TASK-02",
  "status": "IN_PROGRESS|COMPLETED|FAILED",
  "checklist": [
    {
      "item": "agents/builder.md modified",
      "done": true
    },
    {
      "item": "agents/shared-prompt-sections.md checked",
      "done": true
    },
    {
      "item": "Documentation updated",
      "done": false
    }
  ],
  "currentReasoning": "Currently updating builder.md with ProgressCallback section. Remaining: shared-prompt-sections.md reference, verifier.md integration.",
  "timestamp": "2026-03-12T10:16:45Z"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `workId` | string | WORK identifier |
| `taskId` | string | Task identifier |
| `status` | enum | `IN_PROGRESS` = task ongoing, `COMPLETED` = all work done, `FAILED` = task failed |
| `checklist` | array | List of completed/pending work items (each with `item` name and `done` boolean) |
| `currentReasoning` | string | Human-readable summary of progress so far and what remains |
| `timestamp` | string | ISO 8601 UTC timestamp |

### HTTP Request Format

```bash
curl -X POST "http://your-system.com/api/v1/task-progress" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_test_abcd1234..." \
  -d '{
    "workId": "WORK-09",
    "taskId": "WORK-09-TASK-02",
    "status": "IN_PROGRESS",
    "checklist": [
      {"item": "agents/builder.md modified", "done": true},
      {"item": "Verification passed", "done": true},
      {"item": "Documentation review", "done": false}
    ],
    "currentReasoning": "Completed builder.md changes. Verifying against acceptance criteria.",
    "timestamp": "2026-03-12T10:16:45Z"
  }'
```

### Callback Frequency

- Called **multiple times per TASK** (once per progress checkpoint)
- Example: file 1 created → callback, file 2 modified → callback, final status → callback
- External system should be prepared for duplicate timestamps and incremental updates

### Expected Response

- **Success (2xx)**: Callback received and processed
- **Failure (4xx/5xx)**: Callback processing failed
- **Network Error**: Connection timeout, DNS failure, etc.

**Agent Behavior on Failure**: Print warning and continue (implementation continues)

---

## Callback Execution Flow

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Scheduler
    participant Builder
    participant Committer
    participant External System

    Scheduler->>Builder: dispatch (implement TASK)

    loop Progress Checkpoints
        Builder->>Builder: Modify file(s)
        Builder->>Builder: Update progress.md
        Builder->>External System: POST ProgressCallback (if configured)
        External System-->>Builder: 200 OK or error
        Note over Builder: Continue regardless of callback result
    end

    Builder->>Scheduler: return task-result (PASS/FAIL)

    Scheduler->>Committer: dispatch (commit TASK)
    Committer->>Committer: Generate result.md
    Committer->>Committer: Git commit
    Committer->>External System: POST TaskCallback (if configured)
    External System-->>Committer: 200 OK or error
    Note over Committer: Continue regardless of callback result
    Committer->>Scheduler: return task-result with commit hash
```

### Timeline

1. **Builder Phase**:
   - Modifies files and updates progress.md
   - After each checkpoint: if ProgressCallback configured → curl POST
   - If curl fails: print WARNING and continue
   - Returns task-result (PASS/FAIL)

2. **Verifier Phase**:
   - Reviews builder's work and progress.md
   - No callbacks triggered

3. **Committer Phase**:
   - Creates result.md report
   - Performs git commit
   - After commit succeeds: if TaskCallback configured → curl POST with result summary
   - If curl fails: print WARNING and continue
   - Returns task-result with commit hash

---

## Error Handling Strategy

### Curl Failures

**Scenario**: `curl: (7) Failed to connect to host` or `curl: (28) Operation timeout`

**Agent Behavior**:
```bash
curl ... 2>/dev/null || echo "WARNING: callback request failed ($CALLBACK_URL), continuing..."
```

**Result**:
- Warning message logged
- Task execution continues
- No retry attempted
- Commit/result already finalized (for committer)

### Network Transience

**Assumption**: Network issues are temporary and non-critical.

**Rationale**:
- Pipeline reliability should not depend on external system availability
- Callbacks are best-effort notifications, not critical path
- External system should implement client-side polling if needed

### Timeouts

**Default**: Use curl default timeout (usually 30 seconds)

**Recommendation for Receivers**:
- Implement idempotency: handle duplicate timestamp/same `commitHash` as single operation
- Log all received callbacks (audit trail)
- Don't block sender on slow processing

### Authorization Failures

**Scenario**: External system returns `401 Unauthorized` or `403 Forbidden`

**Agent Behavior**:
- Print warning message
- Continue (no retry)
- Check `CallbackToken` value in CLAUDE.md

**Debugging Steps**:
1. Verify `CallbackToken` is correct
2. Check external system endpoint authentication requirements
3. Test curl manually with correct headers

---

## Implementation Guide for External Systems

### Receiving TaskCallback (Committer Results)

Expected HTTP request:

```
POST /api/v1/task-result
Content-Type: application/json
Authorization: Bearer <token>

{
  "workId": "WORK-09",
  "taskId": "WORK-09-TASK-01",
  "status": "SUCCESS",
  "what": "...",
  "why": "...",
  "caution": "...",
  "incomplete": "...",
  "filesChanged": ["agents/committer.md"],
  "commitHash": "a3dc4f0",
  "timestamp": "2026-03-12T10:15:30Z"
}
```

### Receiving ProgressCallback (Builder Checkpoints)

Expected HTTP requests (multiple):

```
POST /api/v1/task-progress
Content-Type: application/json
Authorization: Bearer <token>

{
  "workId": "WORK-09",
  "taskId": "WORK-09-TASK-02",
  "status": "IN_PROGRESS",
  "checklist": [
    {"item": "agents/builder.md modified", "done": true},
    {"item": "agents/shared-prompt-sections.md checked", "done": false}
  ],
  "currentReasoning": "...",
  "timestamp": "2026-03-12T10:16:45Z"
}
```

### Idempotency Considerations

Since **multiple ProgressCallbacks** can be sent per TASK:

1. Use `(taskId, timestamp)` as idempotency key for progress updates
2. If `timestamp` is identical → duplicate from same checkpoint
3. If `timestamp` differs → new checkpoint

For **TaskCallback**:
1. Use `commitHash` as idempotency key
2. Single TaskCallback per task completion
3. Same `commitHash` → duplicate (ignore)

### Implementation Checklist

- [ ] Endpoint accepts POST with `Content-Type: application/json`
- [ ] Validates `Authorization: Bearer <token>` header
- [ ] Parses JSON payload according to schema
- [ ] Stores task result in database or cache
- [ ] Returns `200 OK` (or `204 No Content`)
- [ ] Implements error logging for failed requests
- [ ] Implements idempotency for duplicate callbacks
- [ ] (Optional) Triggers notifications based on status (`SUCCESS`, `FAILED`, etc.)
- [ ] (Optional) Updates real-time dashboard with progress

---

## Example: uc-teamspace Integration

### CLAUDE.md Configuration

```markdown
## Task Callbacks

TaskCallback: http://localhost:3000/api/v1/execution/{{executionId}}/task-result
ProgressCallback: http://localhost:3000/api/v1/execution/{{executionId}}/task-progress
CallbackToken: sk_live_execution_token_xyz
```

### uc-teamspace Handler (Node.js Example)

```javascript
// POST /api/v1/execution/:executionId/task-result
app.post("/api/v1/execution/:executionId/task-result", (req, res) => {
  const { workId, taskId, status, commitHash, timestamp } = req.body;

  // Log callback
  console.log(`[${timestamp}] ${taskId} completed with status=${status}`);

  // Update execution status
  db.updateTaskResult({
    executionId: req.params.executionId,
    taskId,
    status,
    commitHash,
    receivedAt: new Date(),
  });

  // Trigger notification if SUCCESS
  if (status === "SUCCESS") {
    notifications.send({
      type: "task_completed",
      taskId,
      message: `Task ${taskId} completed successfully`,
    });
  }

  res.status(200).json({ received: true });
});

// POST /api/v1/execution/:executionId/task-progress
app.post("/api/v1/execution/:executionId/task-progress", (req, res) => {
  const { workId, taskId, status, checklist, timestamp } = req.body;

  // Update real-time dashboard
  realtime.emit("task_progress", {
    executionId: req.params.executionId,
    taskId,
    status,
    progress: `${checklist.filter(c => c.done).length}/${checklist.length}`,
    timestamp,
  });

  res.status(200).json({ received: true });
});
```

---

## Testing Callback Integration

### 1. Local Testing with Mock Endpoint

```bash
# Start local callback receiver
nc -l 127.0.0.1 3000 &

# Or use a tool like httpbin
curl https://httpbin.org/post -X POST -d '{"test": "data"}'
```

### 2. Add to CLAUDE.md

```markdown
## Task Callbacks

TaskCallback: http://127.0.0.1:3000/task-result
ProgressCallback: http://127.0.0.1:3000/task-progress
CallbackToken: test_token_123
```

### 3. Run Builder/Committer and Monitor

```bash
# Monitor curl calls
strace -e trace=network -f builder.sh 2>&1 | grep curl
```

### 4. Verify Callback Format

```bash
# Manually test with curl
curl -X POST "http://127.0.0.1:3000/task-result" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token_123" \
  -d '{"workId":"WORK-09","taskId":"WORK-09-TASK-01","status":"SUCCESS","commitHash":"abc123"}'
```

---

## Version & History

- **Created**: 2026-03-12
- **Purpose**: WORK-09 — Document callback integration design for external system notifications
- **Referenced by**: CLAUDE.md, agents/shared-prompt-sections.md (Section 6), agents/builder.md (ProgressCallback), agents/committer.md (Step 4.5)

---

## Related Documents

- `agents/shared-prompt-sections.md` § 6: Task Callbacks configuration guide
- `agents/builder.md` → ProgressCallback section: Builder implementation
- `agents/committer.md` → Step 4.5: Committer implementation
- `agents/xml-schema.md`: Agent communication format (baseline)
