#!/usr/bin/env bash
# run-agent.sh — CLI interface for browsing and managing The Agency's agents.
#
# Usage:
#   ./run-agent.sh dashboard           Generate and open the HTML dashboard
#   ./run-agent.sh list [division]     List all agents (optionally filter by division)
#   ./run-agent.sh search <query>      Search agents by name or description
#   ./run-agent.sh info <name>         Show details for a named agent
#   ./run-agent.sh activate <name>     Print the activation prompt for an agent

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

AGENT_DIRS=(design engineering game-development marketing product
            project-management testing support spatial-computing specialized)

# ── Colour helpers ────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  G=$'\033[0;32m'; Y=$'\033[1;33m'; C=$'\033[0;36m'; B=$'\033[1m'; R=$'\033[0m'
else
  G=''; Y=''; C=''; B=''; R=''
fi

usage() {
  echo "${B}Usage:${R} $0 {dashboard|list|search|info|activate} [args]"
  echo ""
  echo "  ${C}dashboard${R}             Generate dashboard.html and open in browser"
  echo "  ${C}list${R} [division]       List agents (optional: filter by division name)"
  echo "  ${C}search${R} <query>        Search agents by name or description"
  echo "  ${C}info${R} <agent name>     Show full details for a specific agent"
  echo "  ${C}activate${R} <agent name> Print activation prompt for a specific agent"
  echo ""
  echo "Divisions: ${AGENT_DIRS[*]}"
  exit 1
}

# ── Frontmatter helpers ───────────────────────────────────────────────────
get_field() {
  local field="$1" file="$2"
  awk -v f="$field" '/^---$/{fm++; next} fm==1 && $0 ~ "^"f": "{sub("^"f": ",""); print; exit}' "$file"
}

get_body() {
  awk 'BEGIN{n=0} /^---$/{n++; next} n>=2{print}' "$1"
}

# Collect all agent files (only those with frontmatter)
collect_files() {
  local filter="${1:-}"
  for dir in "${AGENT_DIRS[@]}"; do
    local dirpath="$REPO_ROOT/$dir"
    [[ -d "$dirpath" ]] || continue
    [[ -n "$filter" && "$dir" != "$filter" ]] && continue
    while IFS= read -r f; do
      [[ "$(head -1 "$f")" == "---" ]] || continue
      local name
      name="$(get_field "name" "$f")"
      [[ -n "$name" ]] && echo "$f"
    done < <(find "$dirpath" -name "*.md" -type f | sort)
  done
}

# ── dashboard ─────────────────────────────────────────────────────────────
cmd_dashboard() {
  echo "${G}Generating dashboard…${R}"
  python3 "$REPO_ROOT/scripts/generate-dashboard.py"
  local out="$REPO_ROOT/dashboard.html"
  echo "${G}Opening:${R} $out"
  if command -v xdg-open &>/dev/null; then
    xdg-open "$out"
  elif command -v open &>/dev/null; then
    open "$out"
  else
    echo "Open this file in your browser: file://$out"
  fi
}

# ── list ──────────────────────────────────────────────────────────────────
cmd_list() {
  local filter="${1:-}"
  local count=0
  local current_dir=""
  while IFS= read -r f; do
    local dir
    dir="$(echo "$f" | sed "s|$REPO_ROOT/||" | cut -d'/' -f1)"
    local name desc
    name="$(get_field "name" "$f")"
    desc="$(get_field "description" "$f")"
    if [[ "$dir" != "$current_dir" ]]; then
      echo ""
      echo "${B}${Y}── ${dir}${R}"
      current_dir="$dir"
    fi
    local trunc="${desc:0:60}"
    [[ ${#desc} -gt 60 ]] && trunc+="…"
    printf "  ${C}%-40s${R} %s\n" "$name" "$trunc"
    (( count++ )) || true
  done < <(collect_files "$filter")
  echo ""
  echo "${G}Total: $count agents${R}"
}

# ── search ────────────────────────────────────────────────────────────────
cmd_search() {
  local query="${1:?'search requires a query string'}"
  local ql
  ql="$(echo "$query" | tr '[:upper:]' '[:lower:]')"
  local count=0
  while IFS= read -r f; do
    local name desc
    name="$(get_field "name" "$f")"
    desc="$(get_field "description" "$f")"
    local nl dl
    nl="$(echo "$name" | tr '[:upper:]' '[:lower:]')"
    dl="$(echo "$desc" | tr '[:upper:]' '[:lower:]')"
    if [[ "$nl" == *"$ql"* || "$dl" == *"$ql"* ]]; then
      local rel
      rel="$(echo "$f" | sed "s|$REPO_ROOT/||")"
      echo "${C}$name${R}"
      echo "  ${Y}${rel}${R}"
      echo "  $desc"
      echo ""
      (( count++ )) || true
    fi
  done < <(collect_files)
  echo "${G}Found: $count agents matching \"$query\"${R}"
}

# ── info ──────────────────────────────────────────────────────────────────
cmd_info() {
  local query="${1:?'info requires an agent name'}"
  local ql
  ql="$(echo "$query" | tr '[:upper:]' '[:lower:]')"
  local found=false
  while IFS= read -r f; do
    local name
    name="$(get_field "name" "$f")"
    local nl
    nl="$(echo "$name" | tr '[:upper:]' '[:lower:]')"
    if [[ "$nl" == *"$ql"* ]]; then
      local desc color rel
      desc="$(get_field "description" "$f")"
      color="$(get_field "color" "$f")"
      rel="$(echo "$f" | sed "s|$REPO_ROOT/||")"
      echo ""
      echo "${B}${C}$name${R}"
      echo "${B}────────────────────────────────────${R}"
      echo "${Y}File:${R}        $rel"
      echo "${Y}Color:${R}       $color"
      echo "${Y}Description:${R} $desc"
      echo ""
      echo "${Y}Activation:${R}"
      echo "  Claude Code: Activate $name and help me…"
      echo "  Install:     cp $rel ~/.claude/agents/"
      echo ""
      get_body "$f" | head -40
      found=true
      break
    fi
  done < <(collect_files)
  if ! $found; then
    echo "${Y}No agent found matching: $query${R}"
    exit 1
  fi
}

# ── activate ─────────────────────────────────────────────────────────────
cmd_activate() {
  local query="${1:?'activate requires an agent name'}"
  local ql
  ql="$(echo "$query" | tr '[:upper:]' '[:lower:]')"
  while IFS= read -r f; do
    local name
    name="$(get_field "name" "$f")"
    local nl
    nl="$(echo "$name" | tr '[:upper:]' '[:lower:]')"
    if [[ "$nl" == *"$ql"* ]]; then
      local desc rel
      desc="$(get_field "description" "$f")"
      rel="$(echo "$f" | sed "s|$REPO_ROOT/||")"
      echo ""
      echo "${B}Activation prompts for: ${C}$name${R}"
      echo ""
      echo "${Y}Claude Code / GitHub Copilot:${R}"
      echo "  Activate $name and help me…"
      echo ""
      echo "${Y}Install to Claude Code:${R}"
      echo "  cp $rel ~/.claude/agents/"
      echo ""
      echo "${Y}Install to GitHub Copilot:${R}"
      echo "  cp $rel ~/.github/agents/"
      echo ""
      echo "${Y}Generic (paste into any AI system prompt):${R}"
      echo "  You are $name. $desc"
      return 0
    fi
  done < <(collect_files)
  echo "${Y}No agent found matching: $query${R}"
  exit 1
}

# ── Entry point ───────────────────────────────────────────────────────────
[[ $# -lt 1 ]] && usage

case "$1" in
  dashboard)          cmd_dashboard ;;
  list)               cmd_list "${2:-}" ;;
  search)             cmd_search "${2:-}" ;;
  info)               cmd_info "${2:-}" ;;
  activate)           cmd_activate "${2:-}" ;;
  *)                  usage ;;
esac
