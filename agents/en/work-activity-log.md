# Work Activity Log

Defines the rules for each agent to record WORK progress in the `works/{WORK_ID}/work_{WORK_ID}.log` file.

---

# 1. Stages and Log Content
* On first execution: The received prompt message** Content of the prompt message received at agent startup (Required)
* On Callback invocation: Called Callback URL, success status, Payload, Response (Required)
* During work: Work items and work content
* On task completion: The prompt message sent to other agents** Content of the prompt message received at agent startup (Required)

## log_work Function

```bash
AGENT_NAME="ROUTER"  # Set appropriately in each agent file

log_work() {
  local WORK_ID="$1" AGENT="$2" STAGE="$3" DESC="$4"
  mkdir -p "works/${WORK_ID}"
  printf '[%s]_%s_%s_%s\n' \
    "$(date '+%Y-%m-%dT%H:%M:%S')" "$AGENT" "$STAGE" "$DESC" \
    >> "works/${WORK_ID}/work_${WORK_ID}.log"
}
```

---

## STAGE Table

| STAGE | Timing | Description Example |
|-------|--------|---------------------|
| `INIT` | After WORK_ID determined | `WORK-NN created — Execution-Mode: direct/pipeline/full` |
| `REF` | After STARTUP references | `References: CLAUDE.md, .agent/router_rule_config.json, agents/file-content-schema.md` |
| `PLAN` | After PLAN.md + TASK files created | `PLAN.md, TASK-00.md created` |
| `IMPL` | When direct mode code implementation starts | `Code implementation started — References: {modified file list}` |
| `BUILD` | After self-check passes | `Build/lint passed` |
| `COMMIT` | After git commit completed | `commit {hash}` |
| `DISPATCH` | On pipeline/full dispatch | `Builder dispatch` or `Planner dispatch` |

---

## Reference Collection Rules

Cumulatively track files read during STARTUP and subsequent exploration, recording them all at once during the `REF` stage.
