<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-Subagents-6b5ce7?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude_Marketplace-Preparing-f5a623?style=for-the-badge&logo=anthropic&logoColor=white" />
  <img src="https://img.shields.io/badge/Language_Agnostic-Any_Stack-27ae60?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-GPLv3-f5a623?style=for-the-badge" />
</p>

# uc-taskmanager

Requirements Analysis & Development 6-Agent Full Pipeline + DAG-Based Orchestration + Sliding Window Context Management

**Universal Claude Task Manager** — A WORK-PIPELINE Agent that executes SDD (Specification-Driven Development) for Claude Code.
It formalizes user requirements into specifications,
builds execution plans (WORK) from those specs,
decomposes them into small tasks (TASK) and analyzes dependency graphs (DAG),
then automatically executes TASKs sequentially or in parallel based on dependencies.

Available as a **Claude Marketplace Plugin** (preparing for submission) and as an **npm CLI** (`uctm`). Install once, use `[]`-tagged requests to trigger automated multi-agent pipelines.

<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>uc-taskmanager Pipeline Architecture</title>
<style>
:root {
  --bg: #0f172a;
  --bg-card: #1e293b;
  --bg-card-hover: #334155;
  --text: #e2e8f0;
  --text-muted: #94a3b8;
  --accent: #38bdf8;
  --accent2: #818cf8;
  --accent3: #34d399;
  --accent4: #fb923c;
  --accent5: #f472b6;
  --accent6: #a78bfa;
  --border: #334155;
  --shadow: rgba(0,0,0,0.3);
  --tab-active: #38bdf8;
  --node-router: #38bdf8;
  --node-planner: #818cf8;
  --node-scheduler: #a78bfa;
  --node-builder: #34d399;
  --node-verifier: #fb923c;
  --node-committer: #f472b6;
  --success: #34d399;
  --fail: #f87171;
  --warn: #fbbf24;
}
[data-theme="light"] {
  --bg: #f1f5f9;
  --bg-card: #ffffff;
  --bg-card-hover: #f8fafc;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --shadow: rgba(0,0,0,0.08);
}
* { margin:0; padding:0; box-sizing:border-box; }
body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
}
.header {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-bottom: 1px solid var(--border);
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}
[data-theme="light"] .header {
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
}
.header h1 {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent);
}
.header h1 span { color: var(--text-muted); font-weight: 400; font-size: 0.85rem; margin-left: 0.5rem; }
.theme-toggle {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.theme-toggle:hover { border-color: var(--accent); }
.nav {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 0 2rem;
  display: flex;
  gap: 0;
  overflow-x: auto;
  position: sticky;
  top: 60px;
  z-index: 99;
}
.nav-btn {
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-muted);
  padding: 0.8rem 1.2rem;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.nav-btn:hover { color: var(--text); background: var(--bg-card-hover); }
.nav-btn.active { color: var(--tab-active); border-bottom-color: var(--tab-active); font-weight: 600; }
.content { padding: 2rem; max-width: 1200px; margin: 0 auto; }
.tab-panel { display: none; animation: fadeIn 0.3s ease; }
.tab-panel.active { display: block; }
@keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.section-desc {
  color: var(--text-muted);
  margin-bottom: 2rem;
  font-size: 0.95rem;
  line-height: 1.7;
}
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow);
  transition: all 0.2s;
}
.card:hover { border-color: var(--accent); transform: translateY(-1px); }
.card-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Agent Grid */
.agent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.2rem;
  margin-bottom: 2rem;
}
.agent-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.2rem 1.5rem;
  border-left: 4px solid;
  transition: all 0.3s;
  cursor: default;
}
.agent-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px var(--shadow); }
.agent-card .agent-name {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.agent-card .agent-role { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.6rem; }
.agent-card .agent-level {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(56,189,248,0.15);
  color: var(--accent);
}

/* Flow Diagrams */
.flow-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.flow-diagram {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2rem;
  position: relative;
  overflow-x: auto;
}
.flow-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.flow-badge {
  display: inline-block;
  padding: 0.2rem 0.7rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.flow-nodes {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  justify-content: center;
}
.flow-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  min-width: 100px;
}
.flow-node-box {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
  border: 2px solid;
  min-width: 90px;
  transition: all 0.2s;
}
.flow-node-box:hover { transform: scale(1.05); }
.flow-node-label { font-size: 0.7rem; color: var(--text-muted); max-width: 120px; text-align: center; }
.flow-arrow {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 1.2rem;
  flex-shrink: 0;
}
.flow-group {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
}
.flow-group-label {
  position: absolute;
  top: -10px;
  left: 12px;
  background: var(--bg-card);
  padding: 0 6px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

/* Criteria Table */
.criteria-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
.criteria-table th, .criteria-table td {
  padding: 0.7rem 1rem;
  border: 1px solid var(--border);
  text-align: center;
  font-size: 0.85rem;
}
.criteria-table th {
  background: rgba(56,189,248,0.1);
  font-weight: 600;
  color: var(--accent);
}
.criteria-table td:first-child { text-align: left; font-weight: 500; }
.criteria-table tr:hover td { background: var(--bg-card-hover); }

/* File Tree */
.file-tree {
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 0.85rem;
  line-height: 2;
  padding: 1.5rem;
  background: var(--bg);
  border-radius: 8px;
  border: 1px solid var(--border);
}
.file-tree .dir { color: var(--accent); font-weight: 600; }
.file-tree .file { color: var(--text); }
.file-tree .comment { color: var(--text-muted); font-style: italic; }
.file-tree .indent { display: inline-block; }

/* Pipeline Flow */
.pipeline-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 1rem 0;
}
.pipeline-step {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 600px;
}
.pipeline-step-node {
  width: 200px;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  border: 2px solid;
  flex-shrink: 0;
}
.pipeline-step-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;
}
.pipeline-arrow-down {
  display: flex;
  justify-content: center;
  padding: 0.3rem 0;
  color: var(--text-muted);
  font-size: 1.2rem;
  width: 100%;
  max-width: 600px;
}

/* DAG */
.dag-container { position: relative; min-height: 300px; }
.dag-svg { width: 100%; height: auto; }
.dag-node {
  rx: 8;
  ry: 8;
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s;
}
.dag-node:hover { filter: brightness(1.2); }
.dag-text { font-family: 'Segoe UI', sans-serif; font-weight: 600; font-size: 13px; }
.dag-arrow { stroke-width: 2; fill: none; marker-end: url(#arrowhead); }

/* Error Handling */
.error-flow {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.error-scenario {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  padding: 1.2rem;
  background: var(--bg);
  border-radius: 8px;
  border-left: 4px solid;
}
.error-scenario .scenario-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.error-scenario .scenario-content { flex: 1; }
.error-scenario .scenario-title { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.3rem; }
.error-scenario .scenario-detail { font-size: 0.82rem; color: var(--text-muted); }
.error-scenario .scenario-action {
  margin-top: 0.5rem;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.78rem;
  display: inline-block;
}

/* XML Preview */
.xml-block {
  background: #0d1117;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.2rem;
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 0.8rem;
  line-height: 1.8;
  overflow-x: auto;
  white-space: pre;
  color: #e6edf3;
  margin-top: 1rem;
}
.xml-block .tag { color: #7ee787; }
.xml-block .attr { color: #79c0ff; }
.xml-block .val { color: #a5d6ff; }
.xml-block .comment { color: #8b949e; font-style: italic; }

/* Invariant Table */
.invariant-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1rem;
}
.invariant-item {
  padding: 0.6rem 0.8rem;
  background: var(--bg);
  border-radius: 6px;
  border: 1px solid var(--border);
  font-size: 0.82rem;
  text-align: center;
}
.invariant-header { font-weight: 700; color: var(--accent); background: rgba(56,189,248,0.08); }

/* Responsive */
@media (max-width: 768px) {
  .header { padding: 1rem; flex-direction: column; gap: 0.5rem; }
  .content { padding: 1rem; }
  .agent-grid { grid-template-columns: 1fr; }
  .flow-nodes { flex-direction: column; }
  .flow-arrow { transform: rotate(90deg); width: auto; height: 30px; }
  .nav { padding: 0 0.5rem; }
  .nav-btn { padding: 0.6rem 0.8rem; font-size: 0.78rem; }
  .pipeline-step { flex-direction: column; align-items: center; gap: 0.5rem; }
  .invariant-grid { grid-template-columns: 1fr; }
  .criteria-table { font-size: 0.75rem; }
  .criteria-table th, .criteria-table td { padding: 0.4rem 0.5rem; }
}
</style>
</head>
<body data-theme="dark">

<div class="header">
  <h1>uc-taskmanager <span>Pipeline Architecture</span></h1>
  <button class="theme-toggle" onclick="toggleTheme()">Theme</button>
</div>

<div class="nav">
  <button class="nav-btn active" onclick="showTab('overview')">Overview</button>
  <button class="nav-btn" onclick="showTab('agents')">Agents</button>
  <button class="nav-btn" onclick="showTab('modes')">Execution Modes</button>
  <button class="nav-btn" onclick="showTab('files')">File Structure</button>
  <button class="nav-btn" onclick="showTab('pipeline')">Task Pipeline</button>
  <button class="nav-btn" onclick="showTab('dag')">DAG</button>
  <button class="nav-btn" onclick="showTab('error')">Error Handling</button>
  <button class="nav-btn" onclick="showTab('comm')">Communication</button>
</div>

<div class="content">

  <!-- ==================== OVERVIEW ==================== -->
  <div id="tab-overview" class="tab-panel active">
    <div class="section-title">System Overview</div>
    <div class="section-desc">
      uc-taskmanager는 Claude Code CLI 위에서 동작하는 <strong>멀티 에이전트 작업 파이프라인 시스템</strong>이다.
      사용자의 요청을 분석하여 복잡도에 따라 3가지 execution-mode 중 하나로 라우팅하고,
      각 TASK를 에이전트 파이프라인으로 자동 처리한다.
    </div>

    <div class="card">
      <div class="card-title">Core Architecture</div>
      <div class="flow-nodes" style="padding: 1rem 0;">
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--text-muted); background: rgba(148,163,184,0.1);">User Request</div>
          <div class="flow-node-label">[] tag detection</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--node-router); background: rgba(56,189,248,0.1); color: var(--node-router);">Router</div>
          <div class="flow-node-label">Complexity Analysis</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-node" style="border: 2px dashed var(--border); border-radius: 12px; padding: 1rem; min-width: 350px;">
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.5rem;">Execution Mode Selection</div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
            <div class="flow-node-box" style="border-color: var(--accent3); color: var(--accent3); background: rgba(52,211,153,0.1); font-size: 0.78rem; min-width: 80px;">direct</div>
            <div class="flow-node-box" style="border-color: var(--accent4); color: var(--accent4); background: rgba(251,146,60,0.1); font-size: 0.78rem; min-width: 80px;">pipeline</div>
            <div class="flow-node-box" style="border-color: var(--accent5); color: var(--accent5); background: rgba(244,114,182,0.1); font-size: 0.78rem; min-width: 80px;">full</div>
          </div>
        </div>
      </div>
    </div>

    <div class="agent-grid">
      <div class="card" style="text-align: center;">
        <div class="card-title" style="justify-content: center; color: var(--accent3);">direct</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">1 file, 10 lines or less<br>Router handles everything alone</div>
      </div>
      <div class="card" style="text-align: center;">
        <div class="card-title" style="justify-content: center; color: var(--accent4);">pipeline</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">2-3 files, 1-2 steps<br>Router &rarr; B &rarr; V &rarr; C</div>
      </div>
      <div class="card" style="text-align: center;">
        <div class="card-title" style="justify-content: center; color: var(--accent5);">full</div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">4+ files, 3+ steps, dependencies<br>Router &rarr; Planner &rarr; Scheduler &rarr; [B&rarr;V&rarr;C]&times;N</div>
      </div>
    </div>
  </div>

  <!-- ==================== AGENTS ==================== -->
  <div id="tab-agents" class="tab-panel">
    <div class="section-title">Agent Composition</div>
    <div class="section-desc">
      6개의 전문화된 에이전트가 파이프라인을 구성한다. 각 에이전트는 고유한 역할과 모델 레벨을 갖는다.
    </div>
    <div class="agent-grid">
      <div class="agent-card" style="border-left-color: var(--node-router);">
        <div class="agent-name" style="color: var(--node-router);">Router</div>
        <div class="agent-role">사용자 요청 분석, execution-mode 결정 및 실행 오케스트레이터</div>
        <span class="agent-level" style="background: rgba(56,189,248,0.15); color: var(--node-router);">Model: Medium</span>
      </div>
      <div class="agent-card" style="border-left-color: var(--node-planner);">
        <div class="agent-name" style="color: var(--node-planner);">Planner</div>
        <div class="agent-role">WORK 생성 + TASK 분해 + DAG 설계 (full mode only)</div>
        <span class="agent-level" style="background: rgba(129,140,248,0.15); color: var(--node-planner);">Model: High</span>
      </div>
      <div class="agent-card" style="border-left-color: var(--node-scheduler);">
        <div class="agent-name" style="color: var(--node-scheduler);">Scheduler</div>
        <div class="agent-role">DAG 관리 + 파이프라인 실행 오케스트레이터 (full mode only)</div>
        <span class="agent-level" style="background: rgba(167,139,250,0.15); color: var(--node-scheduler);">Model: Medium</span>
      </div>
      <div class="agent-card" style="border-left-color: var(--node-builder);">
        <div class="agent-name" style="color: var(--node-builder);">Builder</div>
        <div class="agent-role">TASK 실제 구현 - 파일 생성, 수정, 설정 변경</div>
        <span class="agent-level" style="background: rgba(52,211,153,0.15); color: var(--node-builder);">Model: High</span>
      </div>
      <div class="agent-card" style="border-left-color: var(--node-verifier);">
        <div class="agent-name" style="color: var(--node-verifier);">Verifier</div>
        <div class="agent-role">구현 결과 검증 - Acceptance Criteria 확인</div>
        <span class="agent-level" style="background: rgba(251,146,60,0.15); color: var(--node-verifier);">Model: Medium</span>
      </div>
      <div class="agent-card" style="border-left-color: var(--node-committer);">
        <div class="agent-name" style="color: var(--node-committer);">Committer</div>
        <div class="agent-role">result.md 작성 + git commit + callback</div>
        <span class="agent-level" style="background: rgba(244,114,182,0.15); color: var(--node-committer);">Model: Low (Cost-efficient)</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Agent Activation by Mode</div>
      <table class="criteria-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th style="color: var(--accent3);">direct</th>
            <th style="color: var(--accent4);">pipeline</th>
            <th style="color: var(--accent5);">full</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Router</td><td>All-in-one</td><td>PLAN + dispatch</td><td>Planner dispatch</td></tr>
          <tr><td>Planner</td><td>--</td><td>--</td><td>PLAN.md</td></tr>
          <tr><td>Scheduler</td><td>--</td><td>--</td><td>DAG + [B-V-C]&times;N</td></tr>
          <tr><td>Builder</td><td>--</td><td>implement</td><td>implement</td></tr>
          <tr><td>Verifier</td><td>--</td><td>verify</td><td>verify</td></tr>
          <tr><td>Committer</td><td>--</td><td>result + commit</td><td>result + commit</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ==================== EXECUTION MODES ==================== -->
  <div id="tab-modes" class="tab-panel">
    <div class="section-title">Execution-Mode 3 Types</div>
    <div class="section-desc">
      Router가 요청 복잡도를 평가하여 세 가지 모드 중 하나를 선택한다.
      <code>.agent/router_rule_config.json</code>으로 프로젝트별 커스터마이즈 가능.
    </div>

    <div class="flow-container">
      <!-- Direct -->
      <div class="flow-diagram" style="border-left: 4px solid var(--accent3);">
        <div class="flow-title">
          <span class="flow-badge" style="background: rgba(52,211,153,0.15); color: var(--accent3);">direct</span>
          Trivial: 1 file, 10 lines or less
        </div>
        <div class="flow-nodes">
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-router); background: rgba(56,189,248,0.1); color: var(--node-router);">Router</div>
            <div class="flow-node-label">WORK file creation</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-router); background: rgba(56,189,248,0.1); color: var(--node-router);">Router</div>
            <div class="flow-node-label">Code modification</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-router); background: rgba(56,189,248,0.1); color: var(--node-router);">Router</div>
            <div class="flow-node-label">Self-check</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-router); background: rgba(56,189,248,0.1); color: var(--node-router);">Router</div>
            <div class="flow-node-label">result.md + commit</div>
          </div>
        </div>
        <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
          No sub-agent invocation. Session init cost (~12,500 tokens) eliminated.
        </div>
      </div>

      <!-- Pipeline -->
      <div class="flow-diagram" style="border-left: 4px solid var(--accent4);">
        <div class="flow-title">
          <span class="flow-badge" style="background: rgba(251,146,60,0.15); color: var(--accent4);">pipeline</span>
          Simple: 2-3 files, 1-2 steps
        </div>
        <div class="flow-nodes">
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-router); background: rgba(56,189,248,0.1); color: var(--node-router);">Router</div>
            <div class="flow-node-label">PLAN creation</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-builder); background: rgba(52,211,153,0.1); color: var(--node-builder);">Builder</div>
            <div class="flow-node-label">Implementation</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-verifier); background: rgba(251,146,60,0.1); color: var(--node-verifier);">Verifier</div>
            <div class="flow-node-label">Verification</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-committer); background: rgba(244,114,182,0.1); color: var(--node-committer);">Committer</div>
            <div class="flow-node-label">result.md + commit</div>
          </div>
        </div>
        <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
          Router acts as stage callback proxy (BUILDER/VERIFIER/COMMITTER START/DONE).
        </div>
      </div>

      <!-- Full -->
      <div class="flow-diagram" style="border-left: 4px solid var(--accent5);">
        <div class="flow-title">
          <span class="flow-badge" style="background: rgba(244,114,182,0.15); color: var(--accent5);">full</span>
          Complex: 4+ files, 3+ steps, dependencies
        </div>
        <div class="flow-nodes">
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-router); background: rgba(56,189,248,0.1); color: var(--node-router);">Router</div>
            <div class="flow-node-label">Dispatch</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-planner); background: rgba(129,140,248,0.1); color: var(--node-planner);">Planner</div>
            <div class="flow-node-label">PLAN + DAG</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node">
            <div class="flow-node-box" style="border-color: var(--node-scheduler); background: rgba(167,139,250,0.1); color: var(--node-scheduler);">Scheduler</div>
            <div class="flow-node-label">DAG Orchestration</div>
          </div>
          <div class="flow-arrow">&rarr;</div>
          <div class="flow-node" style="border: 2px dashed var(--border); border-radius: 12px; padding: 0.8rem; position: relative;">
            <div style="position: absolute; top: -10px; left: 12px; background: var(--bg-card); padding: 0 6px; font-size: 0.7rem; color: var(--text-muted);">&times; N tasks</div>
            <div style="display: flex; align-items: center; gap: 0;">
              <div class="flow-node">
                <div class="flow-node-box" style="border-color: var(--node-builder); background: rgba(52,211,153,0.1); color: var(--node-builder); font-size: 0.75rem; min-width: 70px;">B</div>
              </div>
              <div class="flow-arrow" style="width: 24px; font-size: 0.9rem;">&rarr;</div>
              <div class="flow-node">
                <div class="flow-node-box" style="border-color: var(--node-verifier); background: rgba(251,146,60,0.1); color: var(--node-verifier); font-size: 0.75rem; min-width: 70px;">V</div>
              </div>
              <div class="flow-arrow" style="width: 24px; font-size: 0.9rem;">&rarr;</div>
              <div class="flow-node">
                <div class="flow-node-box" style="border-color: var(--node-committer); background: rgba(244,114,182,0.1); color: var(--node-committer); font-size: 0.75rem; min-width: 70px;">C</div>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted);">
          Default: User approval required after planning before builder phase.
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 2rem;">
      <div class="card-title">Routing Criteria Table</div>
      <table class="criteria-table">
        <thead>
          <tr>
            <th>Criteria</th>
            <th style="color: var(--accent3);">direct</th>
            <th style="color: var(--accent4);">pipeline</th>
            <th style="color: var(--accent5);">full</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Modified Files</td><td>1</td><td>2-3</td><td>4+</td></tr>
          <tr><td>Changed Lines</td><td>&le;10</td><td>&gt;10</td><td>--</td></tr>
          <tr><td>Scope</td><td>Single edit</td><td>Single module</td><td>Multiple modules</td></tr>
          <tr><td>DB Schema Change</td><td>None</td><td>None</td><td>Yes</td></tr>
          <tr><td>TASK Dependencies</td><td>None</td><td>None</td><td>Sequential/Parallel</td></tr>
          <tr><td>Expected Steps</td><td>1</td><td>1-2</td><td>3+</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ==================== FILE STRUCTURE ==================== -->
  <div id="tab-files" class="tab-panel">
    <div class="section-title">WORK / TASK File Structure</div>
    <div class="section-desc">
      모든 execution-mode에서 동일한 파일 구조를 사용한다 (invariant guarantee).
    </div>

    <div class="card">
      <div class="card-title">Directory Layout</div>
      <div class="file-tree">
<span class="dir">works/</span>
  <span class="file">WORK-LIST.md</span>  <span class="comment">-- All WORK list (IN_PROGRESS / COMPLETED)</span>
  <span class="dir">WORK-NN/</span>
    <span class="file">PLAN.md</span>             <span class="comment">-- WORK overview + DAG (mini or full)</span>
    <span class="file">PROGRESS.md</span>          <span class="comment">-- Scheduler progress state (full mode only)</span>
    <span class="file">TASK-XX.md</span>            <span class="comment">-- TASK specification (no WORK prefix)</span>
    <span class="file">TASK-XX_progress.md</span>   <span class="comment">-- Real-time checkpoint (builder/router)</span>
    <span class="file">TASK-XX_result.md</span>     <span class="comment">-- Completion report (committer/router)</span>
    <span class="file">work_WORK-NN.log</span>      <span class="comment">-- Activity log</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Invariant Guarantee</div>
      <div class="section-desc" style="margin-bottom: 0.5rem;">Mode-independent mandatory creation/dispatch items:</div>
      <div class="invariant-grid">
        <div class="invariant-item invariant-header">Item</div>
        <div class="invariant-item invariant-header">direct</div>
        <div class="invariant-item invariant-header">pipeline / full</div>

        <div class="invariant-item">works/WORK-NN/ directory</div>
        <div class="invariant-item">Router</div>
        <div class="invariant-item">Router / Planner</div>

        <div class="invariant-item">PLAN.md</div>
        <div class="invariant-item">Router</div>
        <div class="invariant-item">Router / Planner</div>

        <div class="invariant-item">TASK-XX.md</div>
        <div class="invariant-item">Router</div>
        <div class="invariant-item">Router / Planner</div>

        <div class="invariant-item">TASK-XX_result.md</div>
        <div class="invariant-item" style="color: var(--node-router);">Router</div>
        <div class="invariant-item" style="color: var(--node-committer);">Committer</div>

        <div class="invariant-item">COMMITTER DONE callback</div>
        <div class="invariant-item" style="color: var(--node-router);">Router</div>
        <div class="invariant-item" style="color: var(--node-committer);">Committer</div>

        <div class="invariant-item">WORK-LIST.md IN_PROGRESS</div>
        <div class="invariant-item">Router</div>
        <div class="invariant-item">Router</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">File Naming Rules</div>
      <table class="criteria-table">
        <thead>
          <tr><th>Type</th><th>Format</th><th>Creator</th></tr>
        </thead>
        <tbody>
          <tr><td>WORK Plan</td><td><code>PLAN.md</code></td><td>planner / router</td></tr>
          <tr><td>TASK Spec</td><td><code>TASK-NN.md</code></td><td>planner / router</td></tr>
          <tr><td>TASK Progress</td><td><code>TASK-NN_progress.md</code></td><td>planner(template) / builder(update)</td></tr>
          <tr><td>TASK Result</td><td><code>TASK-NN_result.md</code></td><td>committer / router(direct)</td></tr>
          <tr><td>WORK Progress</td><td><code>PROGRESS.md</code></td><td>scheduler</td></tr>
        </tbody>
      </table>
      <div style="margin-top: 0.8rem; padding: 0.6rem; background: rgba(248,113,113,0.1); border-radius: 6px; border-left: 3px solid var(--fail); font-size: 0.82rem;">
        <strong>PROHIBITED:</strong> <code>WORK-NN-TASK-NN.md</code> format &mdash; <code>parseTaskFilename()</code> cannot recognize it.
      </div>
    </div>
  </div>

  <!-- ==================== TASK PIPELINE ==================== -->
  <div id="tab-pipeline" class="tab-panel">
    <div class="section-title">TASK Pipeline Flow</div>
    <div class="section-desc">
      각 TASK는 Builder &rarr; Verifier &rarr; Committer 순서로 실행된다. (pipeline / full 공통)
    </div>

    <div class="card">
      <div class="card-title">Sequential Pipeline</div>
      <div class="pipeline-vertical">
        <div class="pipeline-step">
          <div class="pipeline-step-node" style="border-color: var(--text-muted); background: rgba(148,163,184,0.1); color: var(--text-muted);">
            Dispatcher
          </div>
          <div class="pipeline-step-desc">Router (pipeline) or Scheduler (full) dispatches TASK</div>
        </div>
        <div class="pipeline-arrow-down">&darr;</div>

        <div class="pipeline-step">
          <div class="pipeline-step-node" style="border-color: var(--node-builder); background: rgba(52,211,153,0.1); color: var(--node-builder);">
            [1] Builder
          </div>
          <div class="pipeline-step-desc">
            Implementation execution<br>
            progress.md real-time recording<br>
            context-handoff generation &rarr; return
          </div>
        </div>
        <div class="pipeline-arrow-down">&darr;</div>

        <div class="pipeline-step">
          <div class="pipeline-step-node" style="border-color: var(--node-verifier); background: rgba(251,146,60,0.1); color: var(--node-verifier);">
            [2] Verifier
          </div>
          <div class="pipeline-step-desc">
            Builder context-handoff based target verification<br>
            Acceptance criteria check<br>
            context-handoff generation &rarr; return
          </div>
        </div>
        <div class="pipeline-arrow-down">&darr;</div>

        <div class="pipeline-step">
          <div class="pipeline-step-node" style="border-color: var(--node-committer); background: rgba(244,114,182,0.1); color: var(--node-committer);">
            [3] Committer
          </div>
          <div class="pipeline-step-desc">
            <strong>[Gate]</strong> progress.md exists + COMPLETED check<br>
            Gate FAIL &rarr; dispatcher FAIL return &rarr; builder re-dispatch<br>
            Gate PASS &rarr; result.md + git commit + COMMITTER DONE callback
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Committer Gate Logic</div>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem;">
        <div style="flex: 1; min-width: 200px; padding: 1rem; border-radius: 8px; background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.3);">
          <div style="font-weight: 600; color: var(--accent3); margin-bottom: 0.5rem;">PASS Conditions</div>
          <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.8;">
            1. progress.md file exists<br>
            2. Status: COMPLETED<br>
            3. Files changed is not empty
          </div>
        </div>
        <div style="flex: 1; min-width: 200px; padding: 1rem; border-radius: 8px; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.3);">
          <div style="font-weight: 600; color: var(--fail); margin-bottom: 0.5rem;">FAIL Actions</div>
          <div style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.8;">
            1. Return FAIL to dispatcher<br>
            2. Dispatcher re-dispatches builder<br>
            3. Builder resumes from last checkpoint
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Progress Status Transitions</div>
      <div class="flow-nodes" style="padding: 1rem 0;">
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--text-muted); background: rgba(148,163,184,0.1); color: var(--text-muted); font-size: 0.78rem;">PENDING</div>
          <div class="flow-node-label">planner template</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--accent); background: rgba(56,189,248,0.1); color: var(--accent); font-size: 0.78rem;">STARTED</div>
          <div class="flow-node-label">builder start</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--accent4); background: rgba(251,146,60,0.1); color: var(--accent4); font-size: 0.78rem;">IN_PROGRESS</div>
          <div class="flow-node-label">file changes</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--accent3); background: rgba(52,211,153,0.1); color: var(--accent3); font-size: 0.78rem;">COMPLETED</div>
          <div class="flow-node-label">done</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== DAG ==================== -->
  <div id="tab-dag" class="tab-panel">
    <div class="section-title">DAG Dependency Management</div>
    <div class="section-desc">
      full 모드에서 PLAN.md에 정의된 TASK 간 의존성을 scheduler가 DAG로 관리한다.
      Sliding Window 규칙에 따라 선행 TASK의 context-handoff를 전달한다.
    </div>

    <div class="card">
      <div class="card-title">Example DAG</div>
      <div style="display: flex; justify-content: center; padding: 1rem;">
        <svg viewBox="0 0 600 320" style="max-width: 600px; width: 100%;">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8"/>
            </marker>
          </defs>
          <!-- TASK-00 -->
          <rect x="230" y="20" width="140" height="44" rx="8" fill="rgba(52,211,153,0.15)" stroke="#34d399" stroke-width="2"/>
          <text x="300" y="47" text-anchor="middle" fill="#34d399" font-family="Segoe UI" font-weight="600" font-size="14">TASK-00</text>
          <text x="300" y="82" text-anchor="middle" fill="#94a3b8" font-size="11">no dependency</text>

          <!-- Arrows from TASK-00 -->
          <line x1="300" y1="64" x2="300" y2="120" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrowhead)"/>
          <line x1="260" y1="64" x2="120" y2="120" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrowhead)"/>
          <line x1="340" y1="64" x2="480" y2="120" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrowhead)"/>

          <!-- TASK-01 -->
          <rect x="230" y="120" width="140" height="44" rx="8" fill="rgba(56,189,248,0.15)" stroke="#38bdf8" stroke-width="2"/>
          <text x="300" y="147" text-anchor="middle" fill="#38bdf8" font-family="Segoe UI" font-weight="600" font-size="14">TASK-01</text>
          <text x="300" y="182" text-anchor="middle" fill="#94a3b8" font-size="11">depends: TASK-00</text>

          <!-- TASK-03 (parallel) -->
          <rect x="50" y="120" width="140" height="44" rx="8" fill="rgba(251,146,60,0.15)" stroke="#fb923c" stroke-width="2"/>
          <text x="120" y="147" text-anchor="middle" fill="#fb923c" font-family="Segoe UI" font-weight="600" font-size="14">TASK-03</text>
          <text x="120" y="182" text-anchor="middle" fill="#94a3b8" font-size="11">depends: TASK-00</text>

          <!-- TASK-04 (parallel) -->
          <rect x="410" y="120" width="140" height="44" rx="8" fill="rgba(251,146,60,0.15)" stroke="#fb923c" stroke-width="2"/>
          <text x="480" y="147" text-anchor="middle" fill="#fb923c" font-family="Segoe UI" font-weight="600" font-size="14">TASK-04</text>
          <text x="480" y="182" text-anchor="middle" fill="#94a3b8" font-size="11">depends: TASK-00</text>

          <!-- Arrow from TASK-01 to TASK-02 -->
          <line x1="300" y1="164" x2="300" y2="220" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrowhead)"/>

          <!-- TASK-02 -->
          <rect x="230" y="220" width="140" height="44" rx="8" fill="rgba(129,140,248,0.15)" stroke="#818cf8" stroke-width="2"/>
          <text x="300" y="247" text-anchor="middle" fill="#818cf8" font-family="Segoe UI" font-weight="600" font-size="14">TASK-02</text>
          <text x="300" y="282" text-anchor="middle" fill="#94a3b8" font-size="11">depends: TASK-01</text>

          <!-- Parallel indicator -->
          <rect x="40" y="105" width="520" height="70" rx="12" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="5,5"/>
          <text x="565" y="145" text-anchor="end" fill="#94a3b8" font-size="10" font-style="italic"></text>
          <text x="50" y="100" fill="#94a3b8" font-size="10">TASK-00 complete -> parallel execution possible</text>
        </svg>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Execution Order</div>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <div style="font-weight: 600; color: var(--accent3); margin-bottom: 0.5rem;">Sequential Execution</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 2;">
            TASK-00 (no dependency) &rarr; execute immediately<br>
            TASK-01 (depends: TASK-00) &rarr; after TASK-00<br>
            TASK-02 (depends: TASK-01) &rarr; after TASK-01
          </div>
        </div>
        <div style="flex: 1; min-width: 250px;">
          <div style="font-weight: 600; color: var(--accent4); margin-bottom: 0.5rem;">Parallel Execution</div>
          <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 2;">
            TASK-03 (depends: TASK-00) &rarr; after TASK-00<br>
            TASK-04 (depends: TASK-00) &rarr; after TASK-00<br>
            TASK-03 and TASK-04 can run in parallel
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Sliding Window Context</div>
      <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.7;">
        When executing dependent TASKs, the scheduler passes the preceding TASK's <code>context-handoff</code>
        according to the sliding window rule. This optimizes token usage while maintaining necessary context
        for dependent tasks. See <code>spec_sliding-window-context.md</code> for details.
      </div>
    </div>
  </div>

  <!-- ==================== ERROR HANDLING ==================== -->
  <div id="tab-error" class="tab-panel">
    <div class="section-title">Abnormal Termination Handling</div>
    <div class="section-desc">
      Builder 세션 크래시, 작업 미완료 등 비정상 상황에 대한 자동 복구 메커니즘.
    </div>

    <div class="card">
      <div class="error-flow">
        <div class="error-scenario" style="border-left-color: var(--fail);">
          <div class="scenario-icon" style="background: rgba(248,113,113,0.15); color: var(--fail);">X</div>
          <div class="scenario-content">
            <div class="scenario-title">Builder Session Crash</div>
            <div class="scenario-detail">
              <strong>Detection:</strong> Committer detects missing progress.md<br>
              <strong>Response:</strong> Dispatcher re-dispatches builder
            </div>
            <div class="scenario-action" style="background: rgba(248,113,113,0.1); color: var(--fail);">
              No progress.md &rarr; FAIL return &rarr; Builder re-dispatch
            </div>
          </div>
        </div>

        <div class="error-scenario" style="border-left-color: var(--warn);">
          <div class="scenario-icon" style="background: rgba(251,191,36,0.15); color: var(--warn);">!</div>
          <div class="scenario-content">
            <div class="scenario-title">Builder Incomplete Work</div>
            <div class="scenario-detail">
              <strong>Detection:</strong> progress.md Status is not COMPLETED<br>
              <strong>Response:</strong> Dispatcher re-dispatches builder with progress.md included
            </div>
            <div class="scenario-action" style="background: rgba(251,191,36,0.1); color: var(--warn);">
              Status != COMPLETED &rarr; FAIL return &rarr; Builder re-dispatch (with checkpoint)
            </div>
          </div>
        </div>

        <div class="error-scenario" style="border-left-color: var(--accent5);">
          <div class="scenario-icon" style="background: rgba(244,114,182,0.15); color: var(--accent5);">3</div>
          <div class="scenario-content">
            <div class="scenario-title">Retry Limit Exceeded (3 retries)</div>
            <div class="scenario-detail">
              <strong>Detection:</strong> Dispatcher retry counter exceeds 3<br>
              <strong>Response:</strong> TASK marked as FAILED, pipeline halted
            </div>
            <div class="scenario-action" style="background: rgba(244,114,182,0.1); color: var(--accent5);">
              Retry > 3 &rarr; TASK FAILED &rarr; Pipeline halt
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Builder Retry Protocol</div>
      <div class="flow-nodes" style="padding: 1rem 0;">
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--accent); background: rgba(56,189,248,0.1); color: var(--accent); font-size: 0.78rem;">Read progress.md</div>
          <div class="flow-node-label">Check last checkpoint</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--accent4); background: rgba(251,146,60,0.1); color: var(--accent4); font-size: 0.78rem;">Resume from checkpoint</div>
          <div class="flow-node-label">Skip completed files</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--accent3); background: rgba(52,211,153,0.1); color: var(--accent3); font-size: 0.78rem;">Complete remaining</div>
          <div class="flow-node-label">Status: COMPLETED</div>
        </div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-node">
          <div class="flow-node-box" style="border-color: var(--accent3); background: rgba(52,211,153,0.1); color: var(--accent3); font-size: 0.78rem;">Report</div>
          <div class="flow-node-label">task-result XML</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== COMMUNICATION ==================== -->
  <div id="tab-comm" class="tab-panel">
    <div class="section-title">Agent Communication</div>
    <div class="section-desc">
      에이전트 간 데이터는 구조화된 XML로 전달된다.
      dispatch (dispatcher &rarr; receiver)와 task-result (receiver &rarr; dispatcher) 두 가지 방향이 있다.
    </div>

    <div class="card">
      <div class="card-title">Dispatch XML (Dispatcher &rarr; Agent)</div>
      <div class="xml-block"><span class="tag">&lt;dispatch</span> <span class="attr">to</span>=<span class="val">"builder"</span> <span class="attr">work</span>=<span class="val">"WORK-NN"</span> <span class="attr">task</span>=<span class="val">"TASK-XX"</span>
         <span class="attr">execution-mode</span>=<span class="val">"pipeline|full"</span><span class="tag">&gt;</span>
  <span class="tag">&lt;context&gt;</span>
    <span class="tag">&lt;project&gt;</span>uc-taskmanager<span class="tag">&lt;/project&gt;</span>
    <span class="tag">&lt;language&gt;</span>ko<span class="tag">&lt;/language&gt;</span>
    <span class="tag">&lt;plan-file&gt;</span>works/WORK-NN/PLAN.md<span class="tag">&lt;/plan-file&gt;</span>
  <span class="tag">&lt;/context&gt;</span>
  <span class="tag">&lt;task-spec&gt;</span>
    <span class="tag">&lt;file&gt;</span>works/WORK-NN/TASK-XX.md<span class="tag">&lt;/file&gt;</span>
    <span class="tag">&lt;title&gt;</span>TASK Title<span class="tag">&lt;/title&gt;</span>
    <span class="tag">&lt;action&gt;</span>implement<span class="tag">&lt;/action&gt;</span>
  <span class="tag">&lt;/task-spec&gt;</span>
  <span class="tag">&lt;previous-results&gt;</span>
    <span class="tag">&lt;result</span> <span class="attr">task</span>=<span class="val">"TASK-XX"</span> <span class="attr">status</span>=<span class="val">"PASS"</span><span class="tag">&gt;</span>summary<span class="tag">&lt;/result&gt;</span>
  <span class="tag">&lt;/previous-results&gt;</span>
<span class="tag">&lt;/dispatch&gt;</span></div>
    </div>

    <div class="card">
      <div class="card-title">Task Result XML (Agent &rarr; Dispatcher)</div>
      <div class="xml-block"><span class="tag">&lt;task-result</span> <span class="attr">work</span>=<span class="val">"WORK-NN"</span> <span class="attr">task</span>=<span class="val">"TASK-XX"</span>
              <span class="attr">agent</span>=<span class="val">"builder"</span> <span class="attr">status</span>=<span class="val">"PASS"</span><span class="tag">&gt;</span>
  <span class="tag">&lt;summary&gt;</span>Implementation summary<span class="tag">&lt;/summary&gt;</span>
  <span class="tag">&lt;files-changed&gt;</span>
    <span class="tag">&lt;file</span> <span class="attr">action</span>=<span class="val">"created"</span> <span class="attr">path</span>=<span class="val">"path/to/file"</span><span class="tag">&gt;</span>description<span class="tag">&lt;/file&gt;</span>
  <span class="tag">&lt;/files-changed&gt;</span>
  <span class="tag">&lt;context-handoff</span> <span class="attr">from</span>=<span class="val">"builder"</span> <span class="attr">detail-level</span>=<span class="val">"FULL"</span><span class="tag">&gt;</span>
    <span class="tag">&lt;what&gt;</span>Changes made<span class="tag">&lt;/what&gt;</span>
    <span class="tag">&lt;why&gt;</span>Decision rationale<span class="tag">&lt;/why&gt;</span>
    <span class="tag">&lt;caution&gt;</span>Caveats<span class="tag">&lt;/caution&gt;</span>
    <span class="tag">&lt;incomplete&gt;</span>Pending items<span class="tag">&lt;/incomplete&gt;</span>
  <span class="tag">&lt;/context-handoff&gt;</span>
<span class="tag">&lt;/task-result&gt;</span></div>
    </div>

    <div class="card">
      <div class="card-title">Context-Handoff Detail Levels</div>
      <table class="criteria-table">
        <thead>
          <tr><th>Level</th><th>Fields</th><th>Usage</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>FULL</strong></td>
            <td>what, why, caution, incomplete</td>
            <td>Builder &rarr; Verifier, dependent TASK handoff</td>
          </tr>
          <tr>
            <td><strong>SUMMARY</strong></td>
            <td>what only (1-3 lines)</td>
            <td>Non-adjacent TASK reference</td>
          </tr>
          <tr>
            <td><strong>DROP</strong></td>
            <td>Element omitted</td>
            <td>No context needed</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-title">Dispatcher-Receiver Mapping</div>
      <table class="criteria-table">
        <thead>
          <tr><th>Dispatcher</th><th>Receiver</th><th>Mode</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>Router</td><td>(self)</td><td style="color:var(--accent3);">direct</td><td>No sub-agent</td></tr>
          <tr><td>Router</td><td>Planner</td><td style="color:var(--accent5);">full</td><td>Complex WORK planning</td></tr>
          <tr><td>Router</td><td>Scheduler</td><td style="color:var(--accent5);">full</td><td>Planned WORK execution</td></tr>
          <tr><td>Router</td><td>Builder</td><td style="color:var(--accent4);">pipeline</td><td>Single TASK implementation</td></tr>
          <tr><td>Scheduler</td><td>Builder</td><td style="color:var(--accent5);">full</td><td>N TASK implementation</td></tr>
          <tr><td>Scheduler</td><td>Verifier</td><td style="color:var(--accent5);">full</td><td>N TASK verification</td></tr>
          <tr><td>Scheduler</td><td>Committer</td><td style="color:var(--accent5);">full</td><td>N TASK commit</td></tr>
        </tbody>
      </table>
    </div>
  </div>

</div>

<script>
function showTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  event.target.classList.add('active');
}

function toggleTheme() {
  const body = document.body;
  const current = body.getAttribute('data-theme');
  body.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
}
</script>
</body>
</html>

**[한국어 문서 (Korean)](README_KO.md)**

---

## Quick Start

### Option 1: Claude Marketplace Plugin (Preparing for Submission)

> Plugin submission is in preparation. Once published, install directly from the Marketplace — no npm or CLI setup required.

1. Open [Claude Marketplace](https://claude.ai/marketplace) (or `platform.claude.com/plugins`)
2. Search for **uc-taskmanager**
3. Click **Install Plugin**
4. Open Claude Code — the 6 pipeline agents are immediately available

### Option 2: npm CLI

```bash
npm install -g uctm
cd your-project
uctm init --lang en   # English agents
uctm init --lang ko   # 한국어 에이전트 (Korean — npm only)
uctm init             # Interactive language selection
```

### Start Using

Once installed (either method), start Claude Code and use pipeline tags:

```
claude
> [new-feature] Add a hello world feature
```

To run without permission prompts (file creation, shell commands, etc.), use bypass mode:

```bash
claude --dangerously-skip-permissions
```

> **Warning**: Only use bypass mode in isolated environments or when you trust the pipeline fully. See [Claude Code Permissions](https://code.claude.com/docs/en/permissions) for details.

The agents analyze your request, plan the work, and execute through isolated subagent pipelines.

---

## What Makes This Pipeline Different

### 1. Procedures Must Be Executed Properly and Recorded

* Rather than focusing on *writing better code* (like TDD or DDD), this agent focuses on **executing development procedures properly**.
* It systematizes the full pipeline: **Requirement (user) → Specification → WORK Plan → Per-TASK Execution Plan → Per-TASK Execution/Verification/Completion → Per-TASK Result Storage** (WORK PIPELINE)
* The result: end-to-end records from requirement to delivery, providing full traceability.

**How to work with this AI Agent:**

* **Start**: Give a prompt starting with `[]` to trigger the WORK-PIPELINE
```
[game-dev] Build a brick breaker game in HTML
```

* **Requirement Analysis**: The agent analyzes your requirement and asks for approval. Review `works/WORK-NN/Requirement.md` and type **"approve"** to proceed.
```
{Requirement specification content}
If you approve Requirement.md, I will call the Planner to create PLAN.md + TASK decomposition.
Let me know if you want to modify anything.
```

* **WORK Execution Plan**: The agent builds an execution plan and asks again. Review `works/WORK-NN/PLAN.md` and `TASK-NN.md`, then type **"approve"** to proceed.
```
WORK-31 Development Approval Request

  Project folder structure reorganization ~~~~~~~ / ########

  ┌─────────┬─────────────────────────┐
  │  Item   │        Details          │
  ├─────────┼─────────────────────────┤
  │ Mode    │ full                    │
  ├─────────┼─────────────────────────┤
  │ TASKs   │ 6 (TASK-00 ~ TASK-05)  │
  └─────────┴─────────────────────────┘

  DAG Structure

  TASK-00 (move agents/ en files → en/ subdirectory)
     ├─→ TASK-01 (~~~~~~~~~~~~) ─→ TASK-03 (#########)
     ├─→ TASK-02 (create plugin/) ─→ TASK-04 (????????)
     └─────────────────────────────────→ TASK-05 ($$$$$$$$$)

  - TASK-01/02 parallel, TASK-03/04 parallel, TASK-05 final integration
  - If approved, scheduler → builder → verifier → committer pipeline will execute.

  Proceed?
```
* Per-TASK: build → verify → commit repeats automatically for each TASK.
```
● TASK-05 committed. Updating PROGRESS.md and finalizing WORK-31.
```
* When TASKs complete, verify via `works/WORK-NN/TASK-NN_result.md` and actual testing.
```
  push, merge
```

**Want to rollback?** Type `WORK-NN rollback`. Commit hashes are stored in the files, so only that WORK's changes are reverted.

**Too much ceremony for a simple button rename?**
```
[WORK start] Change the submit button label to "Send" — auto
```
Add "auto" to skip all approval steps and run the entire process automatically.

### 2. Token Economy

I'm cost-conscious (honestly). So this agent applies four token-saving strategies:

**(1) Serena MCP for codebase analysis.**
The agent prioritizes [Serena MCP](https://github.com/oraios/serena) for code exploration — reading symbols instead of entire files. (Huge thanks to the Serena team.)

**(2) Three execution modes to minimize subagent overhead.** The WORK-PIPELINE has 6 agent stages running sequentially. For a single-TASK WORK, that's 6 subagent sessions — each consuming tokens just to boot up. Wasteful. So the specifier agent decides the execution mode based on complexity: **direct** mode uses only 3 agent calls (specifier → builder → committer), skipping planner, scheduler, and verifier. See [Three Execution Modes](#concept-three-execution-modes).

**(3) Structured XML communication.** Subagents can't nest — Main Claude orchestrates everything.
* When one agent finishes and the next agent starts, Main Claude sits in between, causing data to be transmitted twice. This communication is a blob of text —
* The receiving side has to parse it again. So we standardized the communication format as XML.
* Every bit helps.
* (This also made agent log monitoring much easier.) See [Structured Agent Communication](#structured-agent-communication).

**(4) Sliding Window Context Transfer.** Agent A finishes and tells B what it did. B finishes and tells C what A did plus what B did. But does C really need A's full details? So B passes its own work in full to C, and summarizes A's work. **One degree of separation = just a name and phone number** — you don't need to know their personality. If curious, just ask them directly. Testing shows ~20-30% token savings. See [Sliding Window Context Transfer](#sliding-window-context-transfer).

**"Why not skip agents entirely and do everything in one session?"** See [Context Isolation](#context-isolation). In long sessions, AI gradually loses coherence — like sudden memory loss mid-conversation. Strict context isolation prevents this and directly impacts output quality.

### 3. Dependency-Aware Parallel Execution

TASKs within a WORK have dependency management via DAG. Parallel execution only happens when TASKs have no mutual dependencies — meaning no source code conflicts from concurrent edits.

I've also built a **requirement management system** that integrates with this pipeline. It manages requirements per project. Queue up requirements before bed, and by morning they're all developed — your to-do list just shifts to *reviewing* instead of *coding*. WORKs execute in parallel across projects too (cross-project dependencies don't exist).

### What's Next

Currently designing a **RAG-based system** to store accumulated artifacts and query similar past requirements during specification analysis — for faster and more accurate requirement decomposition. (If enough data accumulates, who knows — maybe a fine-tuned LLM behind an MCP someday.)

> **Tip for prompting AI agents**: Think of it like SQL WHERE clause ordering (developers only). The first condition should narrow the dataset the most — and if it hits an index, even better. That's why I maintain a glossary with terms and source code entry points, and have the agent reference it. My tokens are precious.

---

Six subagents work across any project and any language, automatically handling **request routing → task decomposition → dependency management → code implementation → verification → commit**.

```
"[new-feature] Build a user authentication feature"
→ specifier decides WORK, planner creates WORK-01 with 5 TASKs, pipeline executes
```

---

## Usage

### Trivial Fix (direct mode)

```
> [bugfix] Fix typo in login error message
```

Main Claude calls specifier, which selects `execution-mode: direct` and returns a dispatch XML. Main Claude then calls builder (implements the change) and committer (commits). Creates WORK-NN directory + PLAN + result.md + commit.

### Quick Task (pipeline mode)

```
> [bugfix] Fix the login button not responding on mobile
```

Main Claude calls specifier, which selects `execution-mode: pipeline` and creates PLAN. Then Main Claude calls builder → verifier → committer in sequence.

### Complex Feature (WORK)

#### 1. Create WORK (Planning)

```
> [new-feature] Build a user authentication feature. Plan it.
```

The planner analyzes the project and creates WORK-01:

```
WORK-01: User Authentication

  WORK-01: TASK-00: Project initialization        ← no dependencies
  WORK-01: TASK-01: DB schema design              ← TASK-00
  WORK-01: TASK-02: JWT auth API                  ← TASK-01
  WORK-01: TASK-03: User CRUD                     ← TASK-02
  WORK-01: TASK-04: Tests + documentation         ← TASK-03

  Do you approve this plan?
```

#### 2. Execute WORK

```
> Run WORK-01 pipeline
```

The scheduler executes WORK-01's TASKs in dependency order.

#### 3. Add to Existing WORK

If WORK-01 is IN_PROGRESS, the specifier asks:
> "WORK-01 (User Authentication) is in progress. Add as a new TASK or create a new WORK?"

#### 4. Check Status

```
> WORK list
```

```
WORK Status
   WORK-01: User Authentication    ✅ 5/5 completed
   WORK-02: Payment Integration    🔄 2/4 in progress
   WORK-03: Admin Dashboard        ⬜ 0/6 pending
```

#### 5. Auto Mode / Resume

```
> Run WORK-02 automatically
> Resume WORK-02
```

#### 6. Run a Specific TASK

Skip to a specific TASK within a WORK (e.g., retry after a failure):

```
> Run WORK-02: TASK-02
```

The scheduler returns the next TASK, then Main Claude calls builder → verifier → committer in sequence.

#### 7. Force WORK Creation (Skip Complexity Check)

Use the `[new-work]` tag to always create a new WORK regardless of complexity:

```
> [new-work] Refactor the auth module
```

#### 8. Handle Failure / Retry

If a TASK fails during the pipeline, the scheduler retries up to 3 times automatically.
If it still fails, you can inspect the result file and retry manually:

```
> WORK-02: TASK-01 failed. Retry it.
```

Or fix the issue and re-run:

```
> Fix the issue in src/auth.ts, then retry WORK-02: TASK-01
```

#### 9. Add a TASK to an In-Progress WORK

```
> [enhancement] Add rate limiting to the auth API
```

If WORK-02 is `IN_PROGRESS`, the specifier asks:
> "WORK-02 (Auth Module) is in progress. Add as a new TASK, or create a new WORK?"

#### 10. Check Individual TASK Status

```
> Show WORK-02 progress
> What's the status of WORK-03: TASK-02?
```

The scheduler reads `PROGRESS.md` and `result.md` files to report current state.

---

## The `[]` Tag System

Prefix your request with a `[]` tag to trigger the pipeline:

| Tag | Meaning |
|-----|---------|
| `[new-feature]` | New feature |
| `[enhancement]` | Enhancement |
| `[bugfix]` | Bug fix |
| `[new-work]` | Always create new WORK (skip complexity check) |

No `[]` tag = handled directly without pipeline.

To register this rule in your project, add the following to your `CLAUDE.md`:

```markdown
## Agent 호출 규칙

`[]` 태그로 시작하는 요청 → specifier 에이전트 호출 (WORK 파이프라인 시작)
```

This ensures Claude automatically delegates `[]`-tagged requests to the specifier agent without manual invocation.

---

## Installation

### Claude Marketplace Plugin (Preparing for Submission)

Once published, install directly from the Claude Marketplace — no terminal required:

1. Visit [Claude Marketplace](https://claude.ai/marketplace) (or `platform.claude.com/plugins`)
2. Search for **uc-taskmanager**
3. Click **Install Plugin**
4. Claude Code automatically discovers agents from the plugin's `agents/` directory

The Marketplace Plugin includes **English agents only** (6 core agents in `agents/` + 6 support files in `skills/sdd-pipeline/references/`).

> **Marketplace Plugin vs npm CLI**: The Plugin requires no installation steps and is always up to date. The npm CLI supports Korean agents (`--lang ko`) and project-level customization via `CLAUDE.md`.

### npm CLI (All Languages + Customization)

```bash
npm install -g uctm

# Per-project (copies agents + config + updates CLAUDE.md)
cd your-project
uctm init --lang en          # English agents
uctm init --lang ko          # 한국어 에이전트
uctm init                    # Interactive language selection

# Global (copies agents to ~/.claude/agents/)
uctm init --global --lang en

# Update agents after upgrading uctm (--lang required)
uctm update --lang en
```

### Manual

```bash
git clone https://github.com/UCJung/uc-taskmanager-claude-agent.git /tmp/uc-tm
mkdir -p .claude/agents
cp /tmp/uc-tm/agents/en/*.md .claude/agents/   # or agents/ko/ for Korean
rm -rf /tmp/uc-tm
git add .claude/agents/ && git commit -m "chore: add uc-taskmanager agents"
```

### Local Plugin Test

```bash
# Test plugin locally before Marketplace submission
claude --plugin-dir ./
```

### Verify

```bash
claude
> /agents
# specifier, planner, scheduler, builder, verifier, committer → confirm all 6
```

---

## Concept: Three Execution Modes

Main Claude detects the `[]` tag and calls the **specifier** subagent, which selects one of three `execution-mode` values:

```
User Request → Main Claude (orchestrator)
                    │
                    ▼
              ┌───────────┐
              │ specifier │ (called by Main Claude)
              └─────┬─────┘
                    │
              execution-mode returned
                    │
      ├─ direct  (no build/test required)
      │   → specifier returns dispatch XML → Main Claude calls builder → committer
      │
      ├─ pipeline  (build/test required, single domain, sequential)
      │   → Main Claude calls: builder → verifier → committer (in sequence)
      │
      └─ full  (multi-domain / complex DAG / new module / 5+ tasks)
          → Main Claude calls: planner → scheduler → [builder → verifier → committer] × N
```

All three modes output to `works/WORK-NN/` and guarantee `result.md` + `COMMITTER DONE` callback.

### WORK (Multi-Task, full mode)

A two-level hierarchy for complex features:

```
WORK (unit of work)       A single goal. The unit requested by the user.
└── TASK (unit of task)   An individual execution unit to achieve the WORK.
    └── result            Completion proof. Auto-generated after verification.
```

### pipeline mode (Single Task, Delegated)

Subagent-delegated path for moderate single tasks. Main Claude calls each agent in sequence. Specifier stays clean.

```
Main Claude → builder(sonnet) → verifier(haiku) → committer(haiku)
              (each called individually by Main Claude)
```

### direct mode (Trivial)

Main Claude calls specifier, which determines direct mode and returns a dispatch XML. Main Claude then calls builder (implements the change) and committer (commits).

```
Main Claude → specifier: Analyze → return dispatch XML → [back to Main Claude]
Main Claude → builder: Implement → Self-check → [back to Main Claude]
Main Claude → committer: Commit → result.md
```

---

## Pipeline

### WORK Pipeline (Complex)

> Subagents cannot nest — Main Claude (CLI terminal) orchestrates every call.

```
                               Main Claude (orchestrator)
                    ┌─────────────┼──────────────────────┐
                    │             │                       │
  specifier        planner          scheduler         builder          verifier         committer
 ┌──────────┐    ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │Request   │────▶│Create   │────▶│Dependency│────▶│Code      │────▶│Build/Test│────▶│Result    │
 │Analysis  │     │WORK/TASK│     │DAG+Order │     │Implement │     │Verify    │     │→ git     │
 └──────────┘    └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
                                                        │                │                │
                                                        └── Retry on fail┘                │
                                                           (max 3 times)                  │
                                                                          Next TASK loop ◀┘
```

### pipeline mode (Simple → Delegated)

```
  specifier         builder          verifier         committer
 ┌──────────┐      ┌──────────┐     ┌──────────┐     ┌──────────┐
 │PLAN      │─────▶│Code      │────▶│Build/Test│────▶│Result    │
 │+TASK     │      │Implement │     │Verify    │     │→ git     │
 └──────────┘      └──────────┘     └──────────┘     └──────────┘
                    (sonnet)         (haiku)           (haiku)
              ← each called by Main Claude →
```

### direct mode (Trivial)

```
  specifier        builder                            committer
 ┌──────────┐     ┌──────────────────────────┐       ┌──────────┐
 │ Analyze  │────▶│ Implement → Self-check   │──────▶│Commit    │
 │ dispatch │     └──────────────────────────┘       │→ result  │
 └──────────┘      (no build/test required)          └──────────┘
```

### Agents

Six agents work together in a clean, isolated pipeline:

| Agent | Role | Model | Permission | MCP |
|-------|------|-------|------------|-----|
| **specifier** | `[]` tag detection, execution-mode selection (direct/pipeline/full), PLAN creation, WORK-LIST management, returns dispatch XML for all modes | **opus** | read + dispatch | Serena (codebase exploration), sequential-thinking (complexity check) |
| **planner** | Create WORK + decompose TASKs + generate PLAN.md (full mode) + pre-create progress templates | **opus** | read-only | Serena (codebase exploration), sequential-thinking (task decomposition) |
| **scheduler** | Manage DAG for a specific WORK + run pipeline with sliding window context | **haiku** | read + dispatch | — |
| **builder** | Code implementation + progress.md checkpoint recording | **sonnet** | full access | Serena (symbol-level explore/edit) |
| **verifier** | Progress gate (Status=COMPLETED) → build/lint/test verification (read-only) | **haiku** | read + execute | — |
| **committer** | Gate check (progress.md) → write result.md → git commit → COMMITTER DONE callback | **haiku** | read + write + git | — |

### Support Files (included in Plugin)

In addition to the 6 pipeline agents, the plugin includes 6 support files that agents reference at startup.
These are located in `plugin/skills/sdd-pipeline/references/` (synced from `agents/en/`):

| File | Purpose |
|------|---------|
| `agent-flow.md` | Pipeline orchestration rules — how Main Claude calls each agent in sequence |
| `file-content-schema.md` | Single source of truth for all file formats (PLAN.md, TASK.md, progress.md, result.md) |
| `shared-prompt-sections.md` | Shared prompt sections with cache_control — reduces repeated token cost up to 90% |
| `context-policy.md` | Sliding window context transfer rules between agents |
| `work-activity-log.md` | Activity log format for builder stage tracking |
| `xml-schema.md` | XML communication format for dispatch and task-result messages |

---

## File Structure

```
works/
├── WORK-LIST.md                      ← Master list of all WORKs (managed by specifier)
├── WORK-01/                          ← "User Authentication"
│   ├── PLAN.md                       ← Plan + dependency graph
│   ├── PROGRESS.md                   ← Progress tracking (auto-updated)
│   ├── TASK-00.md                    ← Task specification
│   ├── TASK-00_progress.md           ← Real-time checkpoint (builder writes)
│   ├── TASK-00_result.md             ← Completion report (committer writes)
│   ├── TASK-01.md
│   └── ...
└── WORK-02/
    └── ...
```

### File Naming Convention

| File | Naming Rule |
|------|-------------|
| Task spec | `TASK-NN.md` (no prefix) |
| Progress checkpoint | `TASK-NN_progress.md` (underscore separator) |
| Completion report | `TASK-NN_result.md` |
| Plan | `PLAN.md` |
| Work progress | `PROGRESS.md` |

### WORK-LIST.md

The specifier maintains `works/WORK-LIST.md` as the master index:

| WORK ID | Title | Status | Created |
|---------|-------|--------|---------|
| WORK-01 | User Authentication | COMPLETED | 2026-03-01 |
| WORK-02 | Payment Integration | IN_PROGRESS | 2026-03-05 |

| Status | Meaning |
|--------|---------|
| `IN_PROGRESS` | TASKs in progress |
| `COMPLETED` | All TASKs committed — set automatically by committer |

- **IN_PROGRESS**: specifier checks this before creating new WORKs
- **COMPLETED**: committer automatically updates WORK-LIST to COMPLETED when the last TASK completes

#### git push Procedure

When you ask Claude to push (`"push this"`, `"git push"`), Claude handles the full sequence automatically:

```
1. Agent sync — copy agents/ source to npm/agents/ and plugin/agents/
2. Check README.md — update if changes are missing
3. git push
```

> **WORK-LIST COMPLETED is set by committer** when the last TASK completes — not at push time. The push procedure no longer includes a WORK-LIST update step.

---

## Tips

### Keep CLAUDE.md Up to Date

The language setting and project context live in `CLAUDE.md`. Agents read this on every invocation — keeping it accurate reduces back-and-forth.

### Use `[]` Tags Consistently

Requests without `[]` tags are handled directly by Claude without routing. If you want guaranteed pipeline behavior, always use a tag.

### Parallel TASKs

The planner creates dependency-aware TASK graphs. Independent TASKs (same `blockedBy` set) can be dispatched concurrently by the scheduler — mention it when approving:

```
> Approve. Run independent tasks in parallel.
```

### Resume After Context Reset

If Claude loses context mid-pipeline, you can always resume:

```
> Resume WORK-02 from where it stopped
```

The scheduler reads `PROGRESS.md` to determine the last completed TASK and continues.

---

## Example Session

```
User: [new-feature] Build a comment feature for the blog system.

Claude: [specifier → WORK path]
  Complexity: 4+ files, DB schema change, multiple modules
  → Creating new WORK

Claude: [planner]
  Project analysis
     Tech Stack: Next.js + Prisma + PostgreSQL
     Existing code: Post CRUD done, Auth done

  WORK-03: Comment Feature

  WORK-03: TASK-00: Comment model + migration          ← no dependencies
  WORK-03: TASK-01: Comment CRUD API                   ← TASK-00
  WORK-03: TASK-02: Nested comments (self-relation)    ← TASK-01
  WORK-03: TASK-03: Frontend comment component         ← TASK-00 (parallelizable)
  WORK-03: TASK-04: Integration + notifications        ← TASK-02, TASK-03

  Do you approve?

User: Approve. Run automatically.

Claude: [scheduler → auto mode]
  WORK-03: TASK-00 → builder → verifier ✅ → committer [a1b2c3d]
  WORK-03: TASK-01 → builder → verifier ✅ → committer [d4e5f6g]
  WORK-03: TASK-02 → builder → verifier ✅ → committer [h7i8j9k]
  WORK-03: TASK-03 → builder → verifier ✅ → committer [l0m1n2o]
  WORK-03: TASK-04 → builder → verifier ✅ → committer [p3q4r5s]

  🎉 WORK-03 completed! 5 tasks, 5 commits
```

---

## Why This Approach?

### Agent File Design

All agent files (`agents/*.md`) are written with a single principle: **core content only, no decoration**. Descriptions, emphasis markers, and redundant examples have been removed. The result is ~1,600 lines total across all agents — less than half the original size — while covering the same functional scope.

Each agent file follows a consistent four-section structure:

```
## 1. 역할 (Role)
   Agent's purpose and responsibility declaration.
   Single paragraph stating what the agent is and what it owns.

## 2. 수행업무 (Responsibilities)
   Flat table of owned tasks.
   | 업무 (Task) | 설명 (Description) |

## 3. 업무수행단계 및 내용 (Execution Steps)
   Step-by-step procedure for each task listed in § 2.
   Always starts with a STARTUP block listing required files to read on boot.
   References file formats via file-content-schema.md (single source of truth).
   References inter-agent communication via xml-schema.md.

## 4. 제약사항 및 금지사항 (Constraints and Prohibitions)
   Immutable rules the agent must always follow.
   Written as a flat prohibition/constraint list.
```

`file-content-schema.md` is the single authoritative definition for all file formats (PLAN.md, TASK.md, progress.md, result.md). Agents reference it instead of embedding format specs inline — eliminating duplication across 6 agent files.

### WORK ID Assignment Strategy

WORK IDs are assigned based on a **filesystem-first approach**:

1. **Filesystem Source**: The planner scans `works/` directory to find existing WORK directories and determines the next WORK ID based on the latest directory found.
2. **MEMORY.md NOT used**: Project memory (MEMORY.md) is never referenced for WORK numbering. Only the filesystem is the authoritative source.
3. **Consistency Check**: The specifier validates WORK ID consistency by checking both the filesystem and WORK-LIST.md before dispatching to the planner.

This ensures:
- No duplicate WORK IDs even if MEMORY.md is stale or corrupted
- Reliable resumption across sessions
- Clear traceability: WORK-NN directly corresponds to `works/WORK-NN/`

### Context Isolation

Each subagent runs in an independent context. Even if the builder creates 50 files using 20,000 tokens, the scheduler only receives a 3-line summary.

```
scheduler's context after 5 TASKs:

  PLAN.md (loaded once)                              ~500 tokens
  WORK-01: TASK-00 result: "20 files, PASS"           ~200 tokens
  WORK-01: TASK-01 result: "15 files, PASS"           ~200 tokens
  WORK-01: TASK-02 result: "8 files, PASS"            ~200 tokens
  WORK-01: TASK-03 result: "12 files, PASS"           ~200 tokens
  WORK-01: TASK-04 result: "5 files, PASS"            ~200 tokens
  ────────────────────────────────────────
  Total: ~1,500 tokens (stays flat)
```

### Single Session vs uc-taskmanager

| | Single Session | uc-taskmanager |
|---|---|---|
| Context per TASK | All code + logs stacked | Summary only (~200 tokens) |
| After 10 TASKs | 50K~100K tokens, quality degrades | ~3K tokens, quality stable |
| Failure recovery | Start over | Resume from last result file |
| Tracking | Scroll chat history | File-based (PLAN.md, result.md) |
| Verification | Manual | Automated (build/lint/test) |

### Router Rule Config (`.agent/router_rule_config.json`)

The specifier reads `.agent/router_rule_config.json` from the project root to determine routing criteria. If the file is absent, the specifier uses its built-in defaults.

**File location:**
```
{project-root}/.agent/router_rule_config.json
```

**JSON structure:**
```json
{
  "$schema": "http://uc-taskmanager.local/schemas/specifier-rules/v1.0.json",
  "version": "1.1.0",
  "description": "Specifier execution-mode decision criteria. Customize per project.",
  "decision_flow": [
    "1. build_test_required? → false → direct",
    "2. single_domain + sequential DAG → pipeline",
    "3. any full_conditions met → full"
  ],
  "rules": {
    "direct": {
      "criteria": {
        "build_test_required": false,
        "note": "File/line count irrelevant. If no build/test needed → direct (text edits, config changes, simple substitutions)"
      }
    },
    "pipeline": {
      "criteria": {
        "build_test_required": true,
        "single_domain_only": true,
        "max_tasks": 5,
        "dag_complexity": "sequential"
      }
    },
    "full": {
      "criteria": {
        "any_of": [
          "task_count > 5",
          "dag_complexity == complex (2+ dependency levels)",
          "multi_domain == true (BE + FE simultaneously)",
          "new_module == true (design → implement → verify multi-phase)",
          "partial_rollback_needed == true"
        ]
      }
    }
  },
  "customization_guide": {
    "doc-heavy projects (md edits)": "Widen direct scope. Most build_test_required=false cases → direct",
    "code-heavy projects": "Center on pipeline/full. Simple bug fixes → pipeline, multi-domain → full",
    "max_tasks tuning": "Adjust pipeline max_tasks between 3–7 based on team size or context limits"
  }
}
```

**Key fields:**
| Field | Description |
|-------|-------------|
| `rules.direct.criteria.build_test_required` | `false` → specifier handles implementation, then committer commits |
| `rules.pipeline.criteria.max_tasks` | Max task count before escalating to full (default: 5) |
| `rules.pipeline.criteria.dag_complexity` | `sequential` only; complex DAG → escalates to full |
| `rules.full.criteria.any_of` | List of conditions — any match triggers full mode |

**Fallback behavior:** If `.agent/router_rule_config.json` is absent or malformed, the specifier falls back to its built-in defaults (equivalent to the structure above).

**Per-project customization example:**

For a documentation-heavy project where most changes are text edits:
```json
{
  "rules": {
    "direct": {
      "criteria": { "build_test_required": false }
    },
    "pipeline": {
      "criteria": { "max_tasks": 3, "single_domain_only": true, "dag_complexity": "sequential" }
    }
  }
}
```

For a monorepo with strict build requirements:
```json
{
  "rules": {
    "pipeline": {
      "criteria": { "max_tasks": 7 }
    },
    "full": {
      "criteria": {
        "any_of": ["task_count > 7", "multi_domain == true"]
      }
    }
  }
}
```

### Three Execution Modes

The specifier matches effort to complexity via `execution-mode`:
- **direct**: 1-line typo fix — Main Claude calls specifier, which returns a dispatch XML. Main Claude then calls builder (implements) + committer (commits). Minimal subagent overhead.
- **pipeline**: Moderate fix — Main Claude calls builder → verifier → committer in sequence. Main Claude only orchestrates, minimizing its own context usage
- **full**: Complex features — full planning, decomposition, and tracking

All three modes output to `works/WORK-NN/` with identical artifact structure (PLAN.md + result.md + COMMITTER DONE callback), ensuring Runner integration works regardless of mode.

### Structured Agent Communication

Instead of ambiguous natural language prompts, agents communicate using structured XML format:

**Dispatch Format** (Caller → Receiver):
```xml
<dispatch to="builder" work="WORK-03" task="TASK-00" execution-mode="pipeline">
  <context>
    <project>uc-taskmanager</project>
    <language>ko</language>
    <plan-file>works/WORK-03/PLAN.md</plan-file>
  </context>
  <task-spec>
    <file>works/WORK-03/TASK-00.md</file>
    <title>공통 시스템 프롬프트 섹션 식별 및 XML 스키마 설계</title>
    <action>implement</action>
  </task-spec>
  <cache-hint sections="output-language-rule,build-commands"/>
</dispatch>
```

**Result Format** (Receiver → Caller):
```xml
<task-result work="WORK-03" task="TASK-00" agent="builder" status="PASS">
  <summary>Created shared-prompt-sections.md and xml-schema.md</summary>
  <files-changed>
    <file action="created" path="agents/shared-prompt-sections.md">Common sections with cache_control</file>
  </files-changed>
  <verification>
    <check name="file_existence" status="PASS">Both files created</check>
  </verification>
</task-result>
```

**Benefits**:
- **Clarity**: Explicit XML structure eliminates ambiguous natural language ("Pass the context" ← confusing vs. `<context>` ← explicit)
- **Lower Output Tokens**: Agents don't generate clarification questions; receivers parse XML directly
- **Prompt Caching**: Common sections (Output Language Rule, Build Commands) are marked with Anthropic API `cache_control`, saving up to **90% on repeated tokens**
- **Scalability**: Cache hit rates improve with WORK count (5 TASKs at ~0.03 tokens/token vs 2K+ tokens without cache)

See `agents/xml-schema.md` for complete format, and `agents/shared-prompt-sections.md` for cacheable sections.

### Sliding Window Context Transfer

Each subagent starts with an empty context — the cost of isolation. The **sliding window** system minimizes token waste when passing context between agents and across dependent TASKs.

**Rule**: the further back, the less detail:

| Distance | Detail Level | Content |
|----------|-------------|---------|
| Immediate predecessor | `FULL` | what + why + caution + incomplete |
| 2 steps back | `SUMMARY` | what only (1–3 lines) |
| 3+ steps back | `DROP` | not transmitted |

Each agent outputs a **context-handoff** — a structured reasoning document, not just a result log:

```xml
<context-handoff from="builder" detail-level="FULL">
  <what>auth.ts modified — added JWT silent refresh logic</what>
  <why>Previous code returned 401 immediately on expiry. Silent refresh improves UX.</why>
  <caution>Coupled to session.ts setSession(). Changes there may cause side effects.</caution>
  <incomplete>Unit tests not written. Verifier should check.</incomplete>
</context-handoff>
```

**Result responsibility shift**: builder focuses on implementation only, writing a `progress.md` checkpoint. The **committer** synthesizes builder + verifier context-handoffs into the final `result.md`. This prevents result files from being skipped when builder is context-pressured.

**Estimated token savings**: ~48% on a 3-TASK dependency chain vs. the naive approach of passing full results forward.

See `docs/spec_sliding-window-context.md` for full design details.

### External System Callback (Optional)

uc-taskmanager is generic by default. To integrate with an external system (e.g., a CI/CD backend), add callback URLs to `CLAUDE.md`:

```markdown
## Task Callbacks
TaskCallback: http://localhost:3000/api/v1/runner/{{executionId}}/task-result
ProgressCallback: http://localhost:3000/api/v1/runner/{{executionId}}/task-progress
CallbackToken: <your-token>
```

- **No config** → works as-is, no external calls made
- **TaskCallback** → committer POSTs result after each TASK commit
- **ProgressCallback** → builder POSTs checkpoint after each progress.md update
- Callback failures are non-fatal — a warning is printed and the pipeline continues

See `docs/spec_callback-integration.md` for payload schema and implementation guide.

---

## Output Language

Output language is resolved from **CLAUDE.md** in your project. No manual configuration needed after first setup.

```
1. Check CLAUDE.md for "Language: xx"
   ├─ Found → use that language
   └─ Not found ↓

2. Ask: "Would you like to set the output language? (e.g., ko, en, ja)"
   ├─ User specifies → write to CLAUDE.md + use it
   └─ User declines ↓

3. Auto-detect system locale → write to CLAUDE.md as default
```

Once set, stored in CLAUDE.md and never asked again. Priority: `PLAN.md > CLAUDE.md > en`

By default, **all output** including git commit messages and code comments uses the configured language:

| Item | Default | Override |
|------|---------|----------|
| PLAN.md / TASK descriptions | Language | — |
| Result reports | Language | — |
| Git commit messages (title/body) | Language | `CommitLanguage: en` |
| Code comments | Language | `CommentLanguage: en` |
| Commit type prefix (`feat`, `fix`...) | Always English | — |
| File names, paths, commands | Always English | — |

### Per-Category Override

Add to CLAUDE.md to override specific categories:

```markdown
## Language
ko
CommitLanguage: en
CommentLanguage: en
```

This gives you `ko` for plans/reports but `en` for commits and code comments — useful for open-source projects or global teams.

---

## Customization

Place a file with the same name in `.claude/agents/` to override.

| What | File | Section |
|------|------|---------|
| Routing criteria | `specifier.md` | 3-2. Execution-Mode 결정 |
| Approval policy | `scheduler.md` | Phase 1: User Approval |
| Commit message format | `committer.md` | Step 3: Stage + Commit |
| Verification steps | `verifier.md` | Verification Pipeline |
| Task granularity | `planner.md` | Task Decomposition Rules |
| Build/lint commands | `builder.md` + `verifier.md` | Self-Check / Step 1-2 |
| Output language | `planner.md` | Output Language Rule |

---

## Supported Stacks

Auto-detected from project files. No configuration needed.

| File | Stack |
|------|-------|
| `package.json` | Node.js / TypeScript / React / NestJS / Next.js |
| `pyproject.toml` / `setup.py` | Python / FastAPI / Django |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `build.gradle` / `pom.xml` | Java / Kotlin |
| `Gemfile` | Ruby |
| `Makefile` | Generic |

---

## Repository Structure

```
uc-taskmanager/
├── agents/                  ← Agent source (edit here — authoritative)
│   ├── en/                  ← English agent prompts (12 files)
│   │   ├── specifier.md     ← [] tag detection + execution-mode routing
│   │   ├── planner.md       ← WORK creation + TASK decomposition
│   │   ├── scheduler.md     ← DAG management + pipeline orchestration
│   │   ├── builder.md       ← Code implementation
│   │   ├── verifier.md      ← Build/lint/test verification
│   │   ├── committer.md     ← git commit + result.md
│   │   ├── agent-flow.md    ← Pipeline orchestration rules
│   │   ├── file-content-schema.md  ← File format definitions
│   │   ├── shared-prompt-sections.md  ← Cacheable shared sections
│   │   ├── context-policy.md    ← Sliding window context rules
│   │   ├── work-activity-log.md ← Activity log format
│   │   └── xml-schema.md    ← XML communication format
│   └── ko/                  ← Korean agent prompts (12 files)
├── npm/                     ← npm package (published as `uctm`)
│   ├── agents/              ← Synced from agents/en/ (+ ko/ subfolder)
│   │   └── ko/              ← Synced from agents/ko/
│   ├── bin/cli.mjs          ← CLI entry point (uctm init/update)
│   ├── lib/                 ← CLI implementation (constants.mjs, init.mjs, update.mjs)
│   ├── .agent/              ← Default router config bundled with npm
│   │   └── router_rule_config.json
│   ├── package.json         ← npm package config
│   ├── .npmignore
│   └── LICENSE
├── plugin/                  ← Claude Marketplace Plugin
│   ├── agents/              ← Synced from agents/en/ (6 core agents)
│   ├── skills/              ← Plugin skills (reference docs)
│   │   ├── sdd-pipeline/
│   │   │   ├── SKILL.md     ← Skill manifest
│   │   │   └── references/  ← Synced from agents/en/ (6 support files)
│   │   ├── work-pipeline/
│   │   │   └── SKILL.md
│   │   └── work-status/
│   │       └── SKILL.md
│   ├── .claude-plugin/
│   │   └── plugin.json      ← Plugin manifest (name, version, agents array)
│   └── README.md
├── .claude/                 ← Local Claude settings (not committed)
│   └── settings.local.json
├── README.md                ← English (default, this file)
├── README_KO.md             ← Korean
├── CLAUDE.md                ← Project-level Claude instructions (push procedure, language, agent call rules)
├── LICENSE
├── docs/                    ← Design specifications
│   ├── spec_pipeline-architecture.md       ← Pipeline structure & agent roles (v1.2)
│   ├── spec_pipeline-architecture_v1.1.md  ← Pipeline architecture v1.1 (archived)
│   ├── spec_sliding-window-context.md      ← Sliding window context design
│   ├── spec_callback-integration.md        ← External system callback integration
│   ├── spec_SDD_with_ucagent_requirement.md ← SDD requirement management system design
│   ├── pipeline-architecture-visual.html   ← Interactive pipeline visualization
│   └── sliding-window-context-visual.html  ← Interactive sliding window visualization
└── works/                   ← WORK directories (auto-generated)
    ├── WORK-LIST.md          ← Master index
    ├── WORK-01/              ← all modes output here (direct/pipeline/full)
    └── ...
```

---

## Requirements

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)
- Git initialized (`git init`)
- No other dependencies.

---

## Optional: MCP Configuration

### Serena MCP — Symbol-Level Code Navigation

Special thanks to the [Oraios](https://github.com/oraios) team for building and open-sourcing [Serena](https://github.com/oraios/serena). Their symbol-level code navigation tools make a real difference in reducing token usage and improving edit precision for AI agents.

The **builder** agent integrates with [Serena MCP](https://github.com/oraios/serena) for symbol-level code exploration. When Serena is available, builder follows this exploration hierarchy instead of reading entire files:

| Step | Tool | Purpose |
|------|------|---------|
| 1 | `list_dir` | Directory structure (replaces `find`) |
| 2 | `get_symbols_overview` | File symbol map before any file read |
| 3 | `find_symbol(depth=1)` | Class/module method list |
| 4 | `find_symbol(include_body=true)` | Precise body read for target symbol only |
| 5 | `find_referencing_symbols` | Impact analysis before editing |
| 6 | `Read` | Last resort when above tools are insufficient |

This reduces read tokens by 30–50% on large codebases by reading only the symbols needed, not entire files.

#### Disable Auto Browser Launch

Serena opens a web dashboard in your browser on every startup. To disable this, add `--open-web-dashboard False` to your `~/.claude.json`:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--context", "ide-assistant",
        "--project", ".",
        "--open-web-dashboard", "False"
      ]
    }
  }
}
```

The dashboard is still available at `http://localhost:PORT` — it just won't auto-open on startup.

---

## The Bigger Picture

This agent is designed to work with an **SDD-based requirement management and automated development system** — a server application that links requirement management → automated development → plans and artifacts. The full system architecture is documented in [`docs/spec_SDD_with_ucagent_requirement.md`](docs/spec_SDD_with_ucagent_requirement.md). Use it as a reference to build your own system tailored to your needs.

---

## License

GPL-3.0
