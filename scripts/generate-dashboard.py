#!/usr/bin/env python3
"""
generate-dashboard.py — Generate a self-contained HTML agent dashboard.

Reads all agent .md files from the standard category directories, extracts
YAML frontmatter (name, description, color) and the markdown body, then
writes a single dashboard.html to the repo root.

Usage:
    python3 scripts/generate-dashboard.py [--out <path>]

Options:
    --out <path>   Output file path (default: dashboard.html in repo root)
    --help         Show this message
"""

import os
import sys
import json
import argparse
import re

# ---------------------------------------------------------------------------
# Paths & config
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)

DIVISIONS = [
    ("engineering",        "💻",  "Engineering"),
    ("design",             "🎨",  "Design"),
    ("marketing",          "📢",  "Marketing"),
    ("product",            "📊",  "Product"),
    ("project-management", "🎬",  "Project Management"),
    ("testing",            "🧪",  "Testing"),
    ("support",            "🛟",  "Support"),
    ("spatial-computing",  "🥽",  "Spatial Computing"),
    ("specialized",        "🎯",  "Specialized"),
    ("game-development",   "🎮",  "Game Development"),
]

# Mapping for named CSS colours → hex (matches the values used in agent files)
NAMED_COLORS = {
    "cyan":   "#06b6d4",
    "purple": "#a855f7",
    "blue":   "#3b82f6",
    "green":  "#22c55e",
    "orange": "#f97316",
    "red":    "#ef4444",
    "pink":   "#ec4899",
    "teal":   "#14b8a6",
    "amber":  "#f59e0b",
    "indigo": "#6366f1",
    "yellow": "#eab308",
    "lime":   "#84cc16",
}

# ---------------------------------------------------------------------------
# Frontmatter parsing
# ---------------------------------------------------------------------------

def parse_frontmatter(text):
    """Return (fields_dict, body_str) from a markdown file with YAML frontmatter."""
    if not text.startswith("---"):
        return {}, text

    lines = text.split("\n")
    end = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end = i
            break
    if end is None:
        return {}, text

    fm_lines = lines[1:end]
    body = "\n".join(lines[end + 1:]).strip()

    fields = {}
    for line in fm_lines:
        m = re.match(r'^(\w[\w\s-]*):\s*(.*)', line)
        if m:
            key = m.group(1).strip().lower()
            val = m.group(2).strip().strip('"').strip("'")
            fields[key] = val

    return fields, body


def resolve_color(raw):
    """Normalise a color value to a hex string."""
    if not raw:
        return "#6366f1"
    raw = raw.strip().strip('"').strip("'").lower()
    if raw in NAMED_COLORS:
        return NAMED_COLORS[raw]
    if raw.startswith("#"):
        return raw
    return "#6366f1"


# ---------------------------------------------------------------------------
# Agent collection
# ---------------------------------------------------------------------------

def collect_agents():
    agents = []
    for dir_slug, div_emoji, div_label in DIVISIONS:
        dirpath = os.path.join(REPO_ROOT, dir_slug)
        if not os.path.isdir(dirpath):
            continue
        for root, _, files in os.walk(dirpath):
            for fname in sorted(files):
                if not fname.endswith(".md"):
                    continue
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath, encoding="utf-8") as fh:
                        text = fh.read()
                except OSError:
                    continue

                fields, body = parse_frontmatter(text)
                name = fields.get("name", "").strip()
                if not name:
                    continue

                description = fields.get("description", "").strip()
                color = resolve_color(fields.get("color", ""))
                rel_path = os.path.relpath(fpath, REPO_ROOT)

                agents.append({
                    "name":        name,
                    "description": description,
                    "color":       color,
                    "division":    dir_slug,
                    "divLabel":    div_label,
                    "divEmoji":    div_emoji,
                    "path":        rel_path,
                    "body":        body,
                })

    return agents


# ---------------------------------------------------------------------------
# HTML generation
# ---------------------------------------------------------------------------

HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Agency — Agent Dashboard</title>
<style>
/* ── Reset & base ─────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #0d0d14;
  color: #e2e8f0;
  min-height: 100vh;
}

/* ── Layout ───────────────────────────────────────────────── */
.site-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-bottom: 1px solid #1e293b;
  padding: 24px 32px;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}
.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}
.logo { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; }
.logo span { background: linear-gradient(90deg, #818cf8, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.tagline { color: #94a3b8; font-size: 0.85rem; }
.search-wrap { margin-left: auto; position: relative; }
.search-input {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 0.9rem;
  padding: 10px 16px 10px 40px;
  width: 280px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,0.15); }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
.stats-bar {
  background: #111827;
  border-bottom: 1px solid #1e293b;
  padding: 10px 32px;
  font-size: 0.8rem;
  color: #64748b;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.stats-bar strong { color: #a5b4fc; }

/* ── Filters ──────────────────────────────────────────────── */
.filters {
  background: #111827;
  border-bottom: 1px solid #1e293b;
  padding: 12px 32px;
  overflow-x: auto;
  white-space: nowrap;
}
.filter-row { max-width: 1400px; margin: 0 auto; display: flex; gap: 8px; }
.filter-btn {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.82rem;
  padding: 6px 14px;
  transition: all 0.15s;
  white-space: nowrap;
}
.filter-btn:hover { background: #273549; color: #e2e8f0; }
.filter-btn.active { background: #312e81; border-color: #818cf8; color: #c7d2fe; font-weight: 600; }

/* ── Main content ─────────────────────────────────────────── */
.main { max-width: 1400px; margin: 0 auto; padding: 32px; }
.section-title {
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 16px;
  margin-top: 32px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title:first-child { margin-top: 0; }

/* ── Cards ────────────────────────────────────────────────── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 16px;
}
.agent-card {
  background: #1a1a2e;
  border: 1px solid #1e293b;
  border-radius: 12px;
  cursor: pointer;
  padding: 20px;
  position: relative;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
  overflow: hidden;
}
.agent-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--agent-color, #818cf8);
  border-radius: 12px 12px 0 0;
}
.agent-card:hover {
  border-color: var(--agent-color, #818cf8);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px var(--agent-color, #818cf8);
  transform: translateY(-2px);
}
.card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
.color-dot {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--agent-color, #818cf8);
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  opacity: 0.9;
}
.card-name { font-weight: 700; font-size: 0.95rem; color: #f1f5f9; line-height: 1.3; }
.card-division { font-size: 0.72rem; color: #64748b; margin-top: 2px; }
.card-desc { font-size: 0.82rem; color: #94a3b8; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.card-footer { margin-top: 12px; display: flex; align-items: center; justify-content: space-between; }
.card-path { font-size: 0.7rem; color: #475569; font-family: "SF Mono", "Fira Code", monospace; }
.card-arrow { color: #475569; font-size: 0.75rem; }

/* ── No results ───────────────────────────────────────────── */
.no-results { text-align: center; padding: 80px 20px; color: #475569; }
.no-results h3 { font-size: 1.2rem; margin-bottom: 8px; color: #64748b; }

/* ── Modal overlay ────────────────────────────────────────── */
.modal-overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 1000;
  backdrop-filter: blur(4px);
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}
.modal-overlay.open { display: flex; }

.modal {
  background: #1a1a2e;
  border: 1px solid #334155;
  border-radius: 16px;
  max-width: 860px;
  width: 100%;
  margin: auto;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}
.modal-header {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-bottom: 1px solid #334155;
  padding: 24px 28px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  position: relative;
}
.modal-color-block {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: var(--modal-color, #818cf8);
  flex-shrink: 0;
}
.modal-title { font-size: 1.4rem; font-weight: 800; color: #f8fafc; }
.modal-division { font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }
.modal-desc { font-size: 0.9rem; color: #cbd5e1; margin-top: 6px; line-height: 1.5; }
.modal-close {
  position: absolute; top: 16px; right: 16px;
  background: #334155; border: none; border-radius: 8px;
  color: #94a3b8; cursor: pointer; font-size: 1.1rem;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.modal-close:hover { background: #475569; color: #f1f5f9; }

.modal-body { padding: 0; display: flex; flex-direction: column; }

/* Usage instructions panel */
.usage-panel {
  background: #0f172a;
  border-bottom: 1px solid #1e293b;
  padding: 20px 28px;
}
.usage-panel h4 { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 12px; }
.tool-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
.tool-tab {
  background: #1e293b; border: 1px solid #334155; border-radius: 6px;
  color: #94a3b8; cursor: pointer; font-size: 0.75rem; padding: 5px 12px;
  transition: all 0.15s;
}
.tool-tab.active { background: #312e81; border-color: #818cf8; color: #c7d2fe; }
.tool-pane { display: none; }
.tool-pane.active { display: block; }
.usage-instruction { font-size: 0.82rem; color: #94a3b8; margin-bottom: 8px; line-height: 1.5; }
.copy-block {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  margin-top: 6px;
}
.copy-code {
  flex: 1;
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 0.78rem;
  color: #a5b4fc;
  padding: 10px 14px;
  overflow-x: auto;
  white-space: pre;
  line-height: 1.5;
}
.copy-btn {
  background: #334155; border: none; border-left: 1px solid #475569;
  color: #94a3b8; cursor: pointer; font-size: 0.75rem;
  padding: 0 14px; flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.copy-btn:hover { background: #475569; color: #f1f5f9; }
.copy-btn.copied { background: #166534; color: #86efac; }

/* Markdown content */
.agent-content {
  padding: 24px 28px;
  max-height: 50vh;
  overflow-y: auto;
  font-size: 0.875rem;
  line-height: 1.7;
  color: #cbd5e1;
}
.agent-content::-webkit-scrollbar { width: 6px; }
.agent-content::-webkit-scrollbar-track { background: transparent; }
.agent-content::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

/* Rendered markdown */
.md h1, .md h2, .md h3, .md h4 { color: #f1f5f9; margin: 1.2em 0 0.5em; font-weight: 700; }
.md h1 { font-size: 1.2rem; border-bottom: 1px solid #1e293b; padding-bottom: 8px; }
.md h2 { font-size: 1.05rem; }
.md h3 { font-size: 0.95rem; color: #e2e8f0; }
.md h4 { font-size: 0.875rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.md p { margin: 0.6em 0; }
.md ul, .md ol { margin: 0.5em 0 0.5em 1.5em; }
.md li { margin: 0.25em 0; }
.md code {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 4px; font-family: "SF Mono","Fira Code",monospace;
  font-size: 0.82em; padding: 1px 5px; color: #a5b4fc;
}
.md pre {
  background: #0f172a; border: 1px solid #1e293b;
  border-radius: 8px; overflow-x: auto;
  margin: 0.8em 0; padding: 14px 16px;
}
.md pre code { background: none; border: none; padding: 0; color: #7dd3fc; font-size: 0.8rem; }
.md blockquote {
  border-left: 3px solid #818cf8; margin: 0.8em 0;
  padding: 6px 16px; color: #94a3b8; background: #1e293b; border-radius: 0 6px 6px 0;
}
.md strong { color: #f1f5f9; font-weight: 700; }
.md em { color: #c4b5fd; font-style: italic; }
.md hr { border: none; border-top: 1px solid #1e293b; margin: 1.2em 0; }
.md a { color: #818cf8; text-decoration: none; }
.md a:hover { text-decoration: underline; }
.md table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 0.82rem; }
.md th { background: #1e293b; color: #e2e8f0; padding: 8px 12px; text-align: left; border: 1px solid #334155; }
.md td { padding: 7px 12px; border: 1px solid #1e293b; }
.md tr:nth-child(even) td { background: #111827; }

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 640px) {
  .site-header { padding: 16px; }
  .header-inner { gap: 12px; }
  .search-input { width: 100%; }
  .search-wrap { width: 100%; margin-left: 0; }
  .main { padding: 16px; }
  .modal-overlay { padding: 12px; }
  .modal-header { padding: 16px 18px; }
  .usage-panel { padding: 16px 18px; }
  .agent-content { padding: 16px 18px; }
}
</style>
</head>
<body>

<!-- ── Header ──────────────────────────────────────────────── -->
<header class="site-header">
  <div class="header-inner">
    <div>
      <div class="logo">🎭 <span>The Agency</span></div>
      <div class="tagline">AI Specialists Ready to Transform Your Workflow</div>
    </div>
    <div class="search-wrap">
      <span class="search-icon">🔍</span>
      <input class="search-input" id="searchInput" type="search"
             placeholder="Search agents by name or description…" autocomplete="off">
    </div>
  </div>
</header>

<!-- ── Stats bar ───────────────────────────────────────────── -->
<div class="stats-bar" id="statsBar">
  <span>Loading…</span>
</div>

<!-- ── Division filters ────────────────────────────────────── -->
<div class="filters">
  <div class="filter-row" id="filterRow">
    <button class="filter-btn active" data-div="all">All Divisions</button>
    <!-- injected by JS -->
  </div>
</div>

<!-- ── Main roster ─────────────────────────────────────────── -->
<main class="main" id="mainContent">
  <!-- injected by JS -->
</main>

<!-- ── Agent detail modal ──────────────────────────────────── -->
<div class="modal-overlay" id="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <div class="modal">
    <div class="modal-header" id="modalHeader">
      <div class="modal-color-block" id="modalColorBlock"></div>
      <div>
        <div class="modal-title" id="modalTitle"></div>
        <div class="modal-division" id="modalDivision"></div>
        <div class="modal-desc" id="modalDesc"></div>
      </div>
      <button class="modal-close" id="modalClose" aria-label="Close">✕</button>
    </div>
    <div class="modal-body">

      <!-- Usage instructions -->
      <div class="usage-panel">
        <h4>⚡ How to Use This Agent</h4>
        <div class="tool-tabs" id="toolTabs">
          <button class="tool-tab active" data-tool="claude">Claude Code</button>
          <button class="tool-tab" data-tool="copilot">GitHub Copilot</button>
          <button class="tool-tab" data-tool="cursor">Cursor</button>
          <button class="tool-tab" data-tool="aider">Aider</button>
          <button class="tool-tab" data-tool="generic">Any AI Tool</button>
        </div>

        <div class="tool-pane active" id="pane-claude">
          <p class="usage-instruction">Install the agent file into your Claude Code agents directory, then reference it by name in any session:</p>
          <div class="copy-block">
            <div class="copy-code" id="claude-install-cmd"></div>
            <button class="copy-btn" onclick="copyCode('claude-install-cmd', this)">Copy</button>
          </div>
          <div class="copy-block" style="margin-top:8px">
            <div class="copy-code" id="claude-activate-cmd"></div>
            <button class="copy-btn" onclick="copyCode('claude-activate-cmd', this)">Copy</button>
          </div>
        </div>

        <div class="tool-pane" id="pane-copilot">
          <p class="usage-instruction">Copy the agent file to your GitHub Copilot agents directory, then reference it by name in Copilot Chat:</p>
          <div class="copy-block">
            <div class="copy-code" id="copilot-install-cmd"></div>
            <button class="copy-btn" onclick="copyCode('copilot-install-cmd', this)">Copy</button>
          </div>
          <div class="copy-block" style="margin-top:8px">
            <div class="copy-code" id="copilot-activate-cmd"></div>
            <button class="copy-btn" onclick="copyCode('copilot-activate-cmd', this)">Copy</button>
          </div>
        </div>

        <div class="tool-pane" id="pane-cursor">
          <p class="usage-instruction">Generate a Cursor rule file with the conversion script, then activate by name in Cursor:</p>
          <div class="copy-block">
            <div class="copy-code" id="cursor-install-cmd"></div>
            <button class="copy-btn" onclick="copyCode('cursor-install-cmd', this)">Copy</button>
          </div>
          <div class="copy-block" style="margin-top:8px">
            <div class="copy-code" id="cursor-activate-cmd"></div>
            <button class="copy-btn" onclick="copyCode('cursor-activate-cmd', this)">Copy</button>
          </div>
        </div>

        <div class="tool-pane" id="pane-aider">
          <p class="usage-instruction">All agents are compiled into a single CONVENTIONS.md. Install it, then reference by name in Aider:</p>
          <div class="copy-block">
            <div class="copy-code" id="aider-install-cmd"></div>
            <button class="copy-btn" onclick="copyCode('aider-install-cmd', this)">Copy</button>
          </div>
          <div class="copy-block" style="margin-top:8px">
            <div class="copy-code" id="aider-activate-cmd"></div>
            <button class="copy-btn" onclick="copyCode('aider-activate-cmd', this)">Copy</button>
          </div>
        </div>

        <div class="tool-pane" id="pane-generic">
          <p class="usage-instruction">Open the agent's .md file, copy the full contents, and paste it into any AI tool's system prompt or context window:</p>
          <div class="copy-block">
            <div class="copy-code" id="generic-path-cmd"></div>
            <button class="copy-btn" onclick="copyCode('generic-path-cmd', this)">Copy</button>
          </div>
          <div class="copy-block" style="margin-top:8px">
            <div class="copy-code" id="generic-activate-cmd"></div>
            <button class="copy-btn" onclick="copyCode('generic-activate-cmd', this)">Copy</button>
          </div>
        </div>
      </div>

      <!-- Full agent content -->
      <div class="agent-content">
        <div class="md" id="agentMarkdown"></div>
      </div>
    </div>
  </div>
</div>

<script>
// ── Embedded agent data ───────────────────────────────────────────────────
const AGENTS = __AGENTS_JSON__;

// ── State ─────────────────────────────────────────────────────────────────
let currentDiv = 'all';
let currentSearch = '';

// ── Division metadata ─────────────────────────────────────────────────────
const DIVISION_META = {
  'engineering':        { emoji: '💻', label: 'Engineering' },
  'design':             { emoji: '🎨', label: 'Design' },
  'marketing':          { emoji: '📢', label: 'Marketing' },
  'product':            { emoji: '📊', label: 'Product' },
  'project-management': { emoji: '🎬', label: 'Project Management' },
  'testing':            { emoji: '🧪', label: 'Testing' },
  'support':            { emoji: '🛟', label: 'Support' },
  'spatial-computing':  { emoji: '🥽', label: 'Spatial Computing' },
  'specialized':        { emoji: '🎯', label: 'Specialized' },
  'game-development':   { emoji: '🎮', label: 'Game Development' },
};
const DIV_ORDER = Object.keys(DIVISION_META);

// ── Build filter buttons ───────────────────────────────────────────────────
function buildFilters() {
  const row = document.getElementById('filterRow');
  const counts = {};
  for (const a of AGENTS) counts[a.division] = (counts[a.division] || 0) + 1;
  for (const div of DIV_ORDER) {
    if (!counts[div]) continue;
    const m = DIVISION_META[div];
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.div = div;
    btn.textContent = `${m.emoji} ${m.label} (${counts[div]})`;
    btn.addEventListener('click', () => { currentDiv = div; render(); });
    row.appendChild(btn);
  }
}

// ── Stats bar ──────────────────────────────────────────────────────────────
function updateStats(visible) {
  const bar = document.getElementById('statsBar');
  const divs = new Set(visible.map(a => a.division)).size;
  bar.innerHTML = `<strong>${AGENTS.length}</strong> total agents &nbsp;·&nbsp; <strong>${divs}</strong> divisions &nbsp;·&nbsp; showing <strong>${visible.length}</strong> agents`;
}

// ── Filtering ──────────────────────────────────────────────────────────────
function getFiltered() {
  const q = currentSearch.toLowerCase();
  return AGENTS.filter(a => {
    const divMatch = currentDiv === 'all' || a.division === currentDiv;
    const textMatch = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    return divMatch && textMatch;
  });
}

// ── Render grid ────────────────────────────────────────────────────────────
function render() {
  // Update filter button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.div === currentDiv);
  });

  const filtered = getFiltered();
  updateStats(filtered);

  const main = document.getElementById('mainContent');
  main.innerHTML = '';

  if (filtered.length === 0) {
    main.innerHTML = `<div class="no-results"><h3>No agents found</h3><p>Try a different search term or division filter.</p></div>`;
    return;
  }

  if (currentDiv === 'all') {
    // Group by division in canonical order
    const groups = {};
    for (const a of filtered) {
      if (!groups[a.division]) groups[a.division] = [];
      groups[a.division].push(a);
    }
    for (const div of DIV_ORDER) {
      if (!groups[div]) continue;
      const m = DIVISION_META[div];
      const sec = document.createElement('div');
      sec.innerHTML = `<div class="section-title">${m.emoji} ${m.label} <span style="color:#475569;font-weight:400">(${groups[div].length})</span></div>
                       <div class="card-grid">${groups[div].map(cardHTML).join('')}</div>`;
      main.appendChild(sec);
    }
  } else {
    const grid = document.createElement('div');
    grid.className = 'card-grid';
    grid.innerHTML = filtered.map(cardHTML).join('');
    main.appendChild(grid);
  }

  // Attach click handlers
  main.querySelectorAll('.agent-card').forEach(card => {
    card.addEventListener('click', () => openModal(parseInt(card.dataset.idx)));
  });
}

// ── Card HTML ──────────────────────────────────────────────────────────────
function cardHTML(agent, _i, _arr) {
  const idx = AGENTS.indexOf(agent);
  const initial = agent.name.charAt(0).toUpperCase();
  return `<div class="agent-card" data-idx="${idx}" style="--agent-color:${agent.color}" tabindex="0" role="button" aria-label="${esc(agent.name)}">
    <div class="card-top">
      <div class="color-dot" style="background:${agent.color}">${initial}</div>
      <div>
        <div class="card-name">${esc(agent.name)}</div>
        <div class="card-division">${DIVISION_META[agent.division]?.emoji || ''} ${agent.divLabel}</div>
      </div>
    </div>
    <div class="card-desc">${esc(agent.description)}</div>
    <div class="card-footer">
      <span class="card-path">${esc(agent.path)}</span>
      <span class="card-arrow">›</span>
    </div>
  </div>`;
}

// ── Modal ──────────────────────────────────────────────────────────────────
function openModal(idx) {
  const a = AGENTS[idx];
  const overlay = document.getElementById('modalOverlay');
  const slug = a.path.split('/').pop().replace('.md','');

  document.getElementById('modalTitle').textContent = a.name;
  document.getElementById('modalDivision').textContent = `${a.divEmoji} ${a.divLabel}`;
  document.getElementById('modalDesc').textContent = a.description;
  document.getElementById('modalColorBlock').style.background = a.color;

  // Usage commands
  setText('claude-install-cmd',   `cp ${a.path} ~/.claude/agents/`);
  setText('claude-activate-cmd',  `Activate ${a.name} and help me…`);
  setText('copilot-install-cmd',  `cp ${a.path} ~/.github/agents/`);
  setText('copilot-activate-cmd', `Use the ${a.name} agent to help me…`);
  setText('cursor-install-cmd',   `./scripts/convert.sh && ./scripts/install.sh --tool cursor`);
  setText('cursor-activate-cmd',  `Use the ${a.name} agent to…`);
  setText('aider-install-cmd',    `./scripts/convert.sh && ./scripts/install.sh --tool aider`);
  setText('aider-activate-cmd',   `Use the ${a.name} agent to review this code.`);
  setText('generic-path-cmd',     a.path);
  setText('generic-activate-cmd', `You are ${a.name}. ${a.description}`);

  // Render markdown body
  document.getElementById('agentMarkdown').innerHTML = renderMarkdown(a.body);

  // Reset tool tab to first
  document.querySelectorAll('.tool-tab').forEach(t => t.classList.toggle('active', t.dataset.tool === 'claude'));
  document.querySelectorAll('.tool-pane').forEach(p => p.classList.toggle('active', p.id === 'pane-claude'));

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  overlay.scrollTop = 0;
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Simple markdown renderer ───────────────────────────────────────────────
function renderMarkdown(md) {
  if (!md) return '';
  let html = md
    // fenced code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="lang-${lang}">${escCode(code.trimEnd())}</code></pre>`)
    // inline code
    .replace(/`([^`\n]+)`/g, (_, c) => `<code>${escCode(c)}</code>`)
    // headings
    .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>')
    // hr
    .replace(/^---+$/gm, '<hr>')
    // blockquote
    .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // unordered lists (greedy grouping handled below)
    .replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>')
    // ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`);

  // Paragraphs: wrap lines not already in a block tag
  const lines = html.split('\n');
  const out = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) { out.push(''); continue; }
    if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|p)/.test(t)) { out.push(t); continue; }
    out.push(`<p>${t}</p>`);
  }
  return out.join('\n');
}

// ── Utilities ──────────────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escCode(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function setText(id, text) { document.getElementById(id).textContent = text; }

function copyCode(id, btn) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1800);
  });
}

// ── Event wiring ───────────────────────────────────────────────────────────
document.getElementById('searchInput').addEventListener('input', e => {
  currentSearch = e.target.value;
  render();
});

document.getElementById('filterRow').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  currentDiv = btn.dataset.div;
  render();
});

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

document.getElementById('toolTabs').addEventListener('click', e => {
  const tab = e.target.closest('.tool-tab');
  if (!tab) return;
  const tool = tab.dataset.tool;
  document.querySelectorAll('.tool-tab').forEach(t => t.classList.toggle('active', t === tab));
  document.querySelectorAll('.tool-pane').forEach(p => p.classList.toggle('active', p.id === `pane-${tool}`));
});

// Keyboard nav for cards
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement?.classList.contains('agent-card')) {
    document.activeElement.click();
  }
});

// ── Boot ───────────────────────────────────────────────────────────────────
buildFilters();
render();
</script>
</body>
</html>
"""


def build_html(agents):
    agents_json = json.dumps(agents, ensure_ascii=False, indent=None)
    return HTML_TEMPLATE.replace("__AGENTS_JSON__", agents_json)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--out",
        default=os.path.join(REPO_ROOT, "dashboard.html"),
        help="Output file path (default: <repo-root>/dashboard.html)",
    )
    args = parser.parse_args()

    agents = collect_agents()
    if not agents:
        print("ERROR: No agent files found. Run from the repo root.", file=sys.stderr)
        sys.exit(1)

    html = build_html(agents)

    out_dir = os.path.dirname(os.path.abspath(args.out))
    os.makedirs(out_dir, exist_ok=True)

    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(html)

    divisions = len({a["division"] for a in agents})
    print(f"✓ Dashboard generated: {args.out}")
    print(f"  {len(agents)} agents across {divisions} divisions")
    print(f"  Open in your browser: file://{os.path.abspath(args.out)}")


if __name__ == "__main__":
    main()
