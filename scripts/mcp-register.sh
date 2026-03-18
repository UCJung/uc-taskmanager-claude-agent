#!/usr/bin/env bash
# uc-taskmanager MCP Server — Claude Code CLI 등록 스크립트
#
# Usage:
#   ./scripts/mcp-register.sh                          # 현재 디렉토리를 프로젝트로 등록 (project scope)
#   ./scripts/mcp-register.sh /path/to/project         # 특정 프로젝트 경로 지정
#   ./scripts/mcp-register.sh /path/to/project user    # user scope로 등록
#   ./scripts/mcp-register.sh --remove                 # 등록 해제
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_SERVER_ENTRY="$REPO_ROOT/mcp-server/dist/index.js"
MCP_NAME="uc-taskmanager"

# --- 등록 해제 ---
if [[ "${1:-}" == "--remove" ]]; then
  echo "Removing MCP server: $MCP_NAME"
  claude mcp remove "$MCP_NAME" 2>/dev/null && echo "Removed." || echo "Not registered."
  exit 0
fi

# --- 빌드 확인 ---
if [[ ! -f "$MCP_SERVER_ENTRY" ]]; then
  echo "MCP Server not built. Building..."
  (cd "$REPO_ROOT/mcp-server" && npm install && npm run build)
fi

# --- 프로젝트 경로 ---
PROJECT_ROOT="${1:-$(pwd)}"
PROJECT_ROOT="$(cd "$PROJECT_ROOT" && pwd)"

echo "=== uc-taskmanager MCP Server Registration ==="
echo "  Server:  $MCP_SERVER_ENTRY"
echo "  Project: $PROJECT_ROOT"
echo ""

# --- 기존 등록 제거 (중복 방지) ---
claude mcp remove "$MCP_NAME" 2>/dev/null || true

# --- 스코프 (project | user) ---
SCOPE="${2:-project}"

# --- 등록 ---
claude mcp add "$MCP_NAME" \
  -s "$SCOPE" \
  -e MCP_PROJECT_ROOT="$PROJECT_ROOT" \
  -- node "$MCP_SERVER_ENTRY"

echo ""
echo "Registered. Verify with: claude mcp list"
