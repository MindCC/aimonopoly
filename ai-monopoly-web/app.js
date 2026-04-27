const {
  initialMetrics,
  metricLabels,
  roleLabels,
  scoreItems,
  boardCells,
  strategies,
  quickActions,
  opportunityCards,
  crisisCards,
  propCards,
  interactionDecks,
} = window.AiMonopolyRules;
let state = loadState();
let editingTeamId = null;
let pendingStrategyId = null;
let lastDrawnCards = {};
let lastInteractionCard = null;
let compactMode = localStorage.getItem("ai-monopoly-compact-mode") === "true";

const el = (id) => document.getElementById(id);
const logic = window.AiMonopolyLogic;
const events = window.AiMonopolyEvents;
const storage = window.AiMonopolyStorage;
const h = (value) => logic.escapeHtml(value);
const money = (value) => `${value >= 0 ? "" : "-"}${Math.abs(value).toLocaleString()} 元`;

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function blankRoles() {
  return { ceo: "", cto: "", cmo: "", cfo: "" };
}

function makeTeam(name, project = "") {
  return {
    id: uid("team"),
    name,
    project,
    roles: blankRoles(),
    boardPosition: 0,
    metrics: { ...initialMetrics },
    records: [],
    props: [],
    scores: Object.fromEntries(scoreItems.map(([key]) => [key, 0])),
  };
}

function defaultState() {
  const classId = uid("class");
  const teams = [
    makeTeam("第一组", "AI 学习助手"),
    makeTeam("第二组", "校园事务 Agent"),
  ];
  teams[0].roles = { ceo: "产品同学", cto: "技术同学", cmo: "运营同学", cfo: "风控同学" };
  return {
    activeClassId: classId,
    activeTeamId: teams[0].id,
    classes: [{ id: classId, name: "AI 创新应用 1 班", teams }],
  };
}

function migrateState(rawState) {
  if (!rawState?.classes?.length) return defaultState();
  rawState.classes.forEach((cls) => {
    cls.teams = cls.teams || [];
    cls.teams.forEach((team) => {
      team.roles = { ...blankRoles(), ...(team.roles || {}) };
      team.boardPosition = Number.isInteger(team.boardPosition) ? team.boardPosition : 0;
      team.metrics = { ...initialMetrics, ...(team.metrics || {}) };
      team.records = team.records || [];
      team.props = (team.props || []).map((prop) => {
        const matched = propCards.find((card) => card.id === prop.id || card.name === prop.name) || {};
        return {
          ...matched,
          ...prop,
          effect: prop.effect || matched.effect || { kind: "note" },
          instanceId: prop.instanceId || uid("prop"),
          used: Boolean(prop.used),
        };
      });
      team.scores = { ...Object.fromEntries(scoreItems.map(([key]) => [key, 0])), ...(team.scores || {}) };
    });
  });
  rawState.activeClassId = rawState.activeClassId || rawState.classes[0].id;
  rawState.activeTeamId =
    rawState.activeTeamId ||
    rawState.classes.find((cls) => cls.id === rawState.activeClassId)?.teams?.[0]?.id ||
    null;
  return rawState;
}

function loadState() {
  return storage.loadState(defaultState, migrateState);
}

function saveState() {
  try {
    storage.saveState(state);
  } catch {
    alert("保存失败：浏览器本地存储空间不足或不可用，请先导出数据备份。");
  }
}

function activeClass() {
  return state.classes.find((item) => item.id === state.activeClassId) || state.classes[0];
}

function activeTeam() {
  const cls = activeClass();
  return cls?.teams.find((item) => item.id === state.activeTeamId) || cls?.teams[0];
}

function clampMetrics(team) {
  ["users", "product", "tech", "reputation", "compliance"].forEach((key) => {
    team.metrics[key] = Math.max(0, Number(team.metrics[key]) || 0);
  });
  team.metrics.cash = Number(team.metrics.cash) || 0;
}

function normalizeDelta(delta = {}) {
  return { cash: 0, users: 0, product: 0, tech: 0, reputation: 0, compliance: 0, ...delta };
}

function applyMatchingPropIfConfirmed(team, delta) {
  const props = team.props || [];
  const candidates = props.filter((prop) => {
    if (prop.used) return false;
    const effect = prop.effect || {};
    if (effect.kind === "shield") return Number(delta[effect.metric]) < 0;
    if (effect.kind === "halvePenalty") {
      return effect.metric ? Number(delta[effect.metric]) < 0 : Object.values(delta).some((value) => Number(value) < 0);
    }
    return false;
  });
  const prop = candidates[0];
  if (!prop) return null;
  if (!confirm(`检测到可用道具卡「${prop.name}」。是否使用它来抵消或减轻本次损失？`)) return null;
  const result = logic.applyPropEffect(team, prop, delta);
  return result.note ? { ...result, prop } : null;
}

function applyDelta(delta, event, topic = el("roundTopic")?.value || "课堂经营", meta = {}) {
  const team = activeTeam();
  if (!team) return;
  let fullDelta = normalizeDelta(delta);
  let eventText = event;
  const transactionId = meta.transactionId || uid("tx");
  const propResult = applyMatchingPropIfConfirmed(team, fullDelta);
  if (propResult) {
    fullDelta = normalizeDelta(propResult.delta);
    eventText = `${eventText}；${propResult.note}`;
    meta = { ...meta, propUsed: propResult.prop.instanceId || propResult.prop.id };
  }
  Object.entries(fullDelta).forEach(([key, value]) => {
    team.metrics[key] += Number(value) || 0;
  });
  clampMetrics(team);
  team.records.unshift(
    events.createRecord({
      id: uid("record"),
      transactionId,
      at: new Date().toLocaleString("zh-CN"),
      topic,
      event: eventText,
      delta: fullDelta,
      meta,
    })
  );
  saveState();
  render();
}

function render() {
  renderClasses();
  renderTeams();
  renderTopbar();
  renderDock();
  renderMetrics();
  renderRoles();
  renderStrategies();
  renderPendingStrategy();
  renderQuickActions();
  renderLeaderboard();
  renderBoard();
  renderTargetTeamSelect();
  renderProps();
  renderScores();
  renderProfile();
  renderRecords();
}

function renderTargetTeamSelect() {
  const select = el("targetTeamSelect");
  if (!select) return;
  const cls = activeClass();
  const current = activeTeam();
  const teams = (cls?.teams || []).filter((team) => team.id !== current?.id);
  select.innerHTML = teams.length
    ? teams.map((team) => `<option value="${h(team.id)}">${h(team.name)}</option>`).join("")
    : `<option value="">暂无目标小组</option>`;
}

function renderClasses() {
  const list = el("classList");
  list.innerHTML = "";
  state.classes.forEach((cls) => {
    const button = document.createElement("button");
    button.className = `class-row ${cls.id === state.activeClassId ? "active" : ""}`;
    button.innerHTML = `${h(cls.name)}<span>${cls.teams.length} 个小组</span>`;
    button.addEventListener("click", () => {
      state.activeClassId = cls.id;
      state.activeTeamId = cls.teams[0]?.id || null;
      pendingStrategyId = null;
      saveState();
      render();
    });
    list.appendChild(button);
  });
}

function renderTeams() {
  const list = el("teamList");
  const cls = activeClass();
  list.innerHTML = "";
  if (!cls?.teams.length) {
    list.innerHTML = `<p class="empty">当前班级还没有小组。</p>`;
    return;
  }
  cls.teams.forEach((team) => {
    const button = document.createElement("button");
    button.className = `team-row ${team.id === state.activeTeamId ? "active" : ""}`;
    button.innerHTML = `${h(team.name)}<span>${h(team.project || "未填写项目名称")} · 估值 ${money(valuation(team))}</span>`;
    button.addEventListener("click", () => {
      state.activeTeamId = team.id;
      pendingStrategyId = null;
      saveState();
      render();
    });
    button.addEventListener("dblclick", () => openTeamDialog(team));
    list.appendChild(button);
  });
}

function renderTopbar() {
  const cls = activeClass();
  const team = activeTeam();
  el("currentClassLabel").textContent = cls ? `当前班级：${cls.name}` : "当前班级";
  el("currentTeamTitle").textContent = team
    ? `${team.name}${team.project ? ` · ${team.project}` : ""}`
    : "选择一个小组开始经营";
}

function renderDock() {
  document.body.classList.toggle("compact-mode", compactMode);
  const team = activeTeam();
  const button = el("quickClassBtn");
  if (button) button.textContent = compactMode ? "退出上课模式" : "上课模式";
  if (el("dockTeamName")) el("dockTeamName").textContent = team ? team.name : "未选择小组";
  if (el("dockCash")) el("dockCash").textContent = team ? `现金 ${money(team.metrics.cash)}` : "";
}

function renderMetrics() {
  const team = activeTeam();
  const strip = el("metricsStrip");
  strip.innerHTML = "";
  Object.entries(metricLabels).forEach(([key, label]) => {
    const div = document.createElement("div");
    div.className = "metric";
    const value = team ? team.metrics[key] : 0;
    div.innerHTML = `<span>${label}</span><strong>${key === "cash" ? money(value) : value}</strong>`;
    strip.appendChild(div);
  });
}

function renderRoles() {
  const team = activeTeam();
  const wrap = el("roleStrip");
  if (!team) {
    wrap.innerHTML = "";
    return;
  }
  wrap.innerHTML = Object.entries(roleLabels)
    .map(([key, label]) => `<div class="role-chip"><span>${label}</span><strong>${h(team.roles[key] || "未设置")}</strong></div>`)
    .join("");
}

function renderStrategies() {
  const grid = el("strategyGrid");
  const team = activeTeam();
  grid.innerHTML = "";
  strategies.forEach((strategy) => {
    const disabled = team && strategy.disabled?.(team);
    const button = document.createElement("button");
    button.className = `strategy-button ${pendingStrategyId === strategy.id ? "selected" : ""}`;
    button.disabled = disabled;
    const successDelta = strategyDelta(strategy, "success");
    button.innerHTML = `
      <div class="strategy-head">
        <h4>${strategy.name}</h4>
        <span>${roleLabels[strategy.role]}</span>
      </div>
      ${strategy.group ? `<em class="strategy-tag">${strategy.group}</em>` : ""}
      <p>成本 ${money(Math.abs(strategy.cost))}；成功：${formatDelta(successDelta)}</p>
      <p>${strategy.note}${disabled ? " 当前不可选。" : ""}</p>
    `;
    button.addEventListener("click", () => {
      pendingStrategyId = strategy.id;
      renderStrategies();
      renderPendingStrategy();
    });
    grid.appendChild(button);
  });
}

function renderPendingStrategy() {
  const box = el("pendingStrategy");
  const strategy = strategies.find((item) => item.id === pendingStrategyId);
  if (!strategy) {
    box.innerHTML = `<p class="empty">先从左侧选择一个运营策略，再根据课堂表现结算。</p>`;
    return;
  }
  const team = activeTeam();
  const speaker = team?.roles?.[strategy.role] || "对应角色";
  box.innerHTML = `
    <div class="pending-title">
      <div>
        <span>待判定策略</span>
        <h4>${strategy.name}</h4>
      </div>
      <strong>${roleLabels[strategy.role]}：${h(speaker)}</strong>
    </div>
    <p>${strategy.note}</p>
    <div class="settle-actions">
      <button class="primary-button" data-settle="success">成功</button>
      <button class="ghost-button" data-settle="partial">部分成功</button>
      <button class="danger-button" data-settle="fail">失败</button>
    </div>
  `;
  box.querySelectorAll("[data-settle]").forEach((button) => {
    button.addEventListener("click", () => settleStrategy(strategy, button.dataset.settle));
  });
}

function strategyDelta(strategy, result) {
  return normalizeDelta({ ...(strategy[result] || {}), cash: strategy.cost + (strategy[result]?.cash || 0) });
}

function settleStrategy(strategy, result) {
  const labels = { success: "成功", partial: "部分成功", fail: "失败" };
  applyDelta(strategyDelta(strategy, result), `策略${labels[result]}：${strategy.name}`);
  pendingStrategyId = null;
}

function renderQuickActions() {
  const wrap = el("quickActions");
  wrap.innerHTML = "";
  quickActions.forEach(([label, delta, note]) => {
    const button = document.createElement("button");
    button.className = "quick-button";
    button.innerHTML = `<strong>${label}</strong><span>${formatDelta(delta)} · ${note}</span>`;
    button.addEventListener("click", () => applyDelta(delta, note));
    wrap.appendChild(button);
  });
}

function renderLeaderboard() {
  const rows = el("leaderboardRows");
  if (!rows) return;
  const teams = [...(activeClass()?.teams || [])].sort((a, b) => valuation(b) - valuation(a));
  rows.innerHTML = teams.length
    ? teams
        .map((team, index) => {
          const m = team.metrics;
          return `
            <tr class="${team.id === state.activeTeamId ? "highlight-row" : ""}">
              <td>${index + 1}</td>
              <td>${h(team.name)}</td>
              <td>${h(team.project || "-")}</td>
              <td>${money(valuation(team))}</td>
              <td>${money(m.cash)}</td>
              <td>${m.users}</td>
              <td>${m.product}</td>
              <td>${m.tech}</td>
              <td>${m.reputation}</td>
              <td>${m.compliance}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="10" class="empty">当前班级还没有小组。</td></tr>`;
}

function renderBoard() {
  const grid = el("boardGrid");
  const task = el("boardTask");
  if (!grid || !task) return;
  const team = activeTeam();
  if (!team) {
    grid.innerHTML = "";
    task.innerHTML = `<p class="empty">请选择小组。</p>`;
    return;
  }
  grid.innerHTML = boardCells
    .map((cell) => {
      const active = team.boardPosition === cell.index;
      return `
        <button class="board-cell ${active ? "active" : ""} type-${cell.type}" data-cell="${cell.index}">
          <span>${cell.index + 1}</span>
          <strong>${cell.title}</strong>
          <small>${cell.task}</small>
        </button>
      `;
    })
    .join("");
  grid.querySelectorAll("[data-cell]").forEach((button) => {
    button.addEventListener("click", () => setBoardPosition(Number(button.dataset.cell), "教师指定落点"));
  });
  const current = boardCells[team.boardPosition] || boardCells[0];
  task.innerHTML = `
    <div class="task-card">
      <span>${current.title}</span>
      <h4>${current.task}</h4>
      <p>${boardAdvice(current.type)}</p>
      <div class="settle-actions">
        <button class="primary-button" data-board-reward="success">完成优秀</button>
        <button class="ghost-button" data-board-reward="partial">基本完成</button>
        <button class="danger-button" data-board-reward="fail">处理失败</button>
      </div>
    </div>
  `;
  task.querySelectorAll("[data-board-reward]").forEach((button) => {
    button.addEventListener("click", () => settleBoardTask(current, button.dataset.boardReward));
  });
}

function setBoardPosition(position, reason) {
  const team = activeTeam();
  if (!team) return;
  const previousPosition = team.boardPosition || 0;
  team.boardPosition = position % boardCells.length;
  const cell = boardCells[team.boardPosition];
  applyDelta({}, `${reason}：${cell.title} - ${cell.task}`, "期末大富翁棋盘", {
    boardMove: { previousPosition, nextPosition: team.boardPosition },
  });
}

function rollDice() {
  const team = activeTeam();
  if (!team) return;
  const dice = Math.floor(Math.random() * 6) + 1;
  el("diceResult").textContent = dice;
  setBoardPosition((team.boardPosition + dice) % boardCells.length, `掷骰子 ${dice} 点`);
}

function settleBoardTask(cell, result) {
  const table = {
    product: { success: { product: 1 }, partial: {}, fail: { product: -1 } },
    tech: { success: { tech: 1 }, partial: {}, fail: { tech: -1 } },
    market: { success: { users: 30, reputation: 1 }, partial: { users: 10 }, fail: { users: -10 } },
    risk: { success: { compliance: 1 }, partial: {}, fail: { compliance: -1 } },
    capital: { success: { cash: 3000 }, partial: { cash: 1000 }, fail: {} },
    demo: { success: { product: 1, tech: 1 }, partial: { product: 1 }, fail: { reputation: -1 } },
    review: { success: { reputation: 1 }, partial: {}, fail: {} },
    final: { success: { reputation: 2, cash: 5000 }, partial: { reputation: 1 }, fail: {} },
    start: { success: {}, partial: {}, fail: {} },
    opportunity: { success: {}, partial: {}, fail: {} },
    crisis: { success: {}, partial: {}, fail: {} },
  };
  if (cell.type === "opportunity") {
    drawCard(opportunityCards, "opportunityCard", "机会卡");
    switchTab("cards");
    return;
  }
  if (cell.type === "crisis") {
    drawCard(crisisCards, "crisisCard", "危机卡");
    switchTab("cards");
    return;
  }
  const labels = { success: "优秀完成", partial: "基本完成", fail: "处理失败" };
  applyDelta(table[cell.type]?.[result] || {}, `${cell.title}${labels[result]}：${cell.task}`, "期末大富翁棋盘");
}

function boardAdvice(type) {
  const map = {
    product: "建议由 CEO / 产品经理回答，重点讲用户、痛点和取舍。",
    tech: "建议由 CTO 回答，重点讲 Agent、Workflow、Prompt 或知识库。",
    market: "建议由 CMO 回答，重点讲用户验证、渠道和竞品差异。",
    risk: "建议由 CFO 回答，重点讲隐私、版权、伦理和数据安全。",
    capital: "建议由 CFO 或 CEO 回答，重点讲成本、收益和继续投入理由。",
    demo: "建议 CTO 主演示，其他成员补充用户场景。",
    review: "建议全组复盘一次关键决策。",
    final: "进入最终投资人路演。",
    opportunity: "系统将抽取机会卡。",
    crisis: "系统将抽取危机卡。",
    start: "准备开始路演。",
  };
  return map[type] || "";
}

function renderProps() {
  const team = activeTeam();
  const list = el("propList");
  if (!team) {
    list.innerHTML = `<p class="empty">请选择小组。</p>`;
    return;
  }
  list.innerHTML = team.props.length
    ? team.props
        .map(
          (card, index) => `
        <div class="prop-card">
          <h4>${index + 1}. ${h(card.name)}${card.used ? "（已使用）" : ""}</h4>
          <p>${h(card.desc)}</p>
          ${
            card.used
              ? ""
              : `<div class="settle-actions"><button class="ghost-button" data-use-prop="${index}">使用</button></div>`
          }
        </div>`
        )
        .join("")
    : `<p class="empty">还没有购买道具卡。</p>`;
  list.querySelectorAll("[data-use-prop]").forEach((button) => {
    button.addEventListener("click", () => useProp(Number(button.dataset.useProp)));
  });
}

function renderScores() {
  const team = activeTeam();
  const form = el("scoreForm");
  form.innerHTML = "";
  let total = 0;
  scoreItems.forEach(([key, label, max]) => {
    const value = Number(team?.scores?.[key] || 0);
    total += value;
    const row = document.createElement("label");
    row.className = "score-row";
    row.innerHTML = `
      <div><strong>${label}</strong><span>满分 ${max}</span></div>
      <input data-score="${key}" type="number" min="0" max="${max}" value="${value}" />
    `;
    form.appendChild(row);
  });
  el("scoreTotal").textContent = total;
  form.querySelectorAll("[data-score]").forEach((input) => {
    input.addEventListener("input", updateLiveScoreTotal);
  });
}

function updateLiveScoreTotal() {
  let total = 0;
  document.querySelectorAll("[data-score]").forEach((input) => {
    const max = Number(input.max);
    total += Math.max(0, Math.min(max, Number(input.value) || 0));
  });
  el("scoreTotal").textContent = total;
}

function renderProfile() {
  const team = activeTeam();
  const wrap = el("profileSummary");
  if (!team) {
    wrap.innerHTML = `<p class="empty">请选择小组。</p>`;
    return;
  }
  const m = team.metrics;
  const prompts = [
    ["综合估值", money(valuation(team))],
    ["现金排名", `第 ${rankTeams("cash", team.id)} 名`],
    ["用户排名", `第 ${rankTeams("users", team.id)} 名`],
    ["棋盘位置", `${(team.boardPosition || 0) + 1} / ${boardCells.length}`],
    ["可购买道具", `${Math.max(0, Math.min(3 - team.props.length, Math.floor(m.cash / 3000)))} 张`],
    ["建议追问", buildPrompt(m)],
  ];
  wrap.innerHTML = prompts
    .map(([label, value]) => `<div class="profile-row"><strong>${label}</strong><span>${value}</span></div>`)
    .join("");
}

function renderRecords() {
  const team = activeTeam();
  const rows = el("recordRows");
  if (!team?.records.length) {
    rows.innerHTML = `<tr><td colspan="9" class="empty">暂无经营记录。</td></tr>`;
    return;
  }
  rows.innerHTML = team.records
    .map((record) => {
      const d = normalizeDelta(record.delta);
      return `
        <tr>
          <td>${h(record.at)}</td>
          <td>${h(record.topic)}</td>
          <td>${h(record.event)}</td>
          <td>${signedMoney(d.cash)}</td>
          <td>${signed(d.users)}</td>
          <td>${signed(d.product)}</td>
          <td>${signed(d.tech)}</td>
          <td>${signed(d.reputation)}</td>
          <td>${signed(d.compliance)}</td>
        </tr>
      `;
    })
    .join("");
}

function formatDelta(delta, exclude = []) {
  return (
    Object.entries(delta)
      .filter(([key, value]) => !exclude.includes(key) && value)
      .map(([key, value]) => `${metricLabels[key]} ${key === "cash" ? signedMoney(value) : signed(value)}`)
      .join("；") || "无指标变化"
  );
}

function signed(value) {
  const number = Number(value) || 0;
  return number > 0 ? `+${number}` : `${number}`;
}

function signedMoney(value) {
  const number = Number(value) || 0;
  return number > 0 ? `+${money(number)}` : money(number);
}

function valuation(team) {
  const m = team.metrics;
  return Math.round(m.cash + m.users * 80 + (m.product + m.tech) * 1200 + (m.reputation + m.compliance) * 900);
}

function rankTeams(metric, teamId) {
  const cls = activeClass();
  const sorted = [...(cls?.teams || [])].sort((a, b) => b.metrics[metric] - a.metrics[metric]);
  return sorted.findIndex((team) => team.id === teamId) + 1 || "-";
}

function buildPrompt(metrics) {
  if (metrics.compliance < 2) return "优先追问数据来源、授权和隐私边界";
  if (metrics.tech < 3) return "优先追问 Agent 架构和稳定性";
  if (metrics.product < 3) return "优先追问 MVP 取舍和真实痛点";
  if (metrics.users < 30) return "优先追问用户验证和推广策略";
  return "可追问商业模式、迭代计划和长期风险";
}

function drawCard(cards, targetId, type) {
  const card = cards[Math.floor(Math.random() * cards.length)];
  lastDrawnCards[targetId] = card;
  renderDrawnCard(targetId, card, type);
  applyDelta({}, `抽取${type}：${card.name}`, "期末大富翁决战");
}

function renderDrawnCard(targetId, card, type) {
  const canAuto = typeof card.settle === "function";
  const actions = canAuto
    ? `<button class="primary-button" data-card-auto="${targetId}">按条件结算</button>`
    : `<button class="primary-button" data-card-result="${targetId}:success">成功</button>
       <button class="danger-button" data-card-result="${targetId}:fail">失败</button>`;
  el(targetId).innerHTML = `
    <span class="type">${type}</span>
    <h4>${card.name}</h4>
    <p>${card.desc}</p>
    <div class="settle-actions">${actions}</div>
  `;
  el(targetId).querySelectorAll("[data-card-auto]").forEach((button) => {
    button.addEventListener("click", () => settleCard(targetId, "auto"));
  });
  el(targetId).querySelectorAll("[data-card-result]").forEach((button) => {
    const [, result] = button.dataset.cardResult.split(":");
    button.addEventListener("click", () => settleCard(targetId, result));
  });
}

function settleCard(targetId, result) {
  const card = lastDrawnCards[targetId];
  const team = activeTeam();
  if (!card || !team) return;
  const delta = result === "auto" ? card.settle(team) : card[result] || {};
  const resultLabel = result === "auto" ? "按条件结算" : result === "success" ? "成功结算" : "失败结算";
  applyDelta(delta, `${card.name}${resultLabel}`, "期末大富翁决战");
  el(targetId).querySelector(".settle-actions")?.remove();
}

function targetTeam() {
  const id = el("targetTeamSelect")?.value;
  return activeClass()?.teams.find((team) => team.id === id);
}

function applyDeltaToTeam(team, delta) {
  if (!team) return;
  const fullDelta = normalizeDelta(delta);
  Object.entries(fullDelta).forEach(([key, value]) => {
    team.metrics[key] += Number(value) || 0;
  });
  clampMetrics(team);
}

function addRecordToTeam(team, delta, event, topic = "组间互动卡", transactionId = uid("tx")) {
  if (!team) return;
  team.records.unshift(
    events.createRecord({
      id: uid("record"),
      transactionId,
      at: new Date().toLocaleString("zh-CN"),
      topic,
      event,
      delta,
      meta: { interaction: true },
    })
  );
}

function applyInteraction(selfDelta, targetDelta, event) {
  const self = activeTeam();
  const target = targetTeam();
  if (!self || !target) {
    alert("请先选择一个目标小组。");
    return;
  }
  const transactionId = uid("tx");
  applyDeltaToTeam(self, selfDelta);
  applyDeltaToTeam(target, targetDelta);
  addRecordToTeam(self, selfDelta, `${event}；目标：${target.name}`, "组间互动卡", transactionId);
  addRecordToTeam(target, targetDelta, `${event}；来源：${self.name}`, "组间互动卡", transactionId);
  saveState();
  render();
}

function drawInteraction(type) {
  const deck = interactionDecks[type];
  const card = deck[Math.floor(Math.random() * deck.length)];
  lastInteractionCard = { ...card, type };
  renderInteractionCard();
}

function renderInteractionCard() {
  const box = el("interactionCard");
  const card = lastInteractionCard;
  if (!box) return;
  if (!card) {
    box.innerHTML = `<p class="empty">抽取一张组间互动卡后，在这里完成结算。</p>`;
    return;
  }
  const typeLabel = { coop: "合作卡", battle: "商战卡", negotiation: "谈判卡" }[card.type];
  let actions = "";
  if (card.type === "coop") {
    actions = `<button class="primary-button" data-interaction="coop">双方同意并结算</button>`;
  } else if (card.type === "battle") {
    actions = `
      <button class="primary-button" data-interaction="battle-success">防守成功</button>
      <button class="danger-button" data-interaction="battle-fail">防守失败</button>
    `;
  } else {
    actions = `
      <button class="primary-button" data-interaction="negotiation-success">谈判成功</button>
      <button class="danger-button" data-interaction="negotiation-fail">谈判失败</button>
    `;
  }
  box.innerHTML = `
    <span class="type">${typeLabel}</span>
    <h4>${card.name}</h4>
    <p>${card.desc}</p>
    ${card.defense ? `<p class="defense-tip">防守：${card.defense}</p>` : ""}
    <div class="settle-actions">${actions}</div>
  `;
  box.querySelectorAll("[data-interaction]").forEach((button) => {
    button.addEventListener("click", () => settleInteraction(button.dataset.interaction));
  });
}

function settleInteraction(result) {
  const card = lastInteractionCard;
  if (!card) return;
  if (result === "coop") {
    applyInteraction(card.self, card.target, `合作卡结算：${card.name}`);
  } else if (result === "battle-success") {
    applyInteraction(card.self || {}, card.targetSuccess || {}, `商战卡防守成功：${card.name}`);
  } else if (result === "battle-fail") {
    applyInteraction(card.self || {}, card.targetFail || {}, `商战卡防守失败：${card.name}`);
  } else if (result === "negotiation-success") {
    applyInteraction(card.successSelf || {}, card.successTarget || {}, `谈判卡成功：${card.name}`);
  } else if (result === "negotiation-fail") {
    applyInteraction(card.failSelf || {}, card.failTarget || {}, `谈判卡失败：${card.name}`);
  }
  lastInteractionCard = null;
  renderInteractionCard();
}

function useProp(index) {
  const team = activeTeam();
  const prop = team?.props?.[index];
  if (!team || !prop || prop.used) return;
  const effect = prop.effect || {};
  let delta = {};
  let choice = 0;
  if (effect.kind === "chooseDelta") {
    const labels = (effect.options || []).map((option, itemIndex) => `${itemIndex + 1}. ${option.label}`).join("\n");
    const answer = prompt(`请选择道具效果：\n${labels}`, "1");
    choice = Math.max(0, Math.min((effect.options || []).length - 1, Number(answer || 1) - 1));
  } else if (effect.kind === "note" || effect.kind === "shield" || effect.kind === "halvePenalty") {
    prop.used = true;
    prop.usedAt = new Date().toISOString();
    applyDelta({}, `使用道具卡：${prop.name}（${prop.desc}）`, "期末大富翁决战", {
      propUsed: prop.instanceId || prop.id,
    });
    return;
  }
  const result = logic.applyPropEffect(team, prop, delta, choice);
  applyDelta(result.delta, `使用道具卡：${prop.name}`, "期末大富翁决战", {
    propUsed: prop.instanceId || prop.id,
  });
}

function buyProp() {
  const team = activeTeam();
  if (!team) return;
  if (team.props.length >= 3) {
    alert("每组最多购买 3 张道具卡。");
    return;
  }
  if (team.metrics.cash < 3000) {
    alert("现金不足 3000 元，无法购买。");
    return;
  }
  const card = propCards[Math.floor(Math.random() * propCards.length)];
  const owned = { ...card, effect: { ...(card.effect || {}) }, instanceId: uid("prop"), used: false, acquiredAt: new Date().toISOString() };
  team.props.push(owned);
  applyDelta({ cash: -3000 }, `购买道具卡：${owned.name}`, "期末大富翁决战", { propAdded: owned.name });
}

function openTeamDialog(team = null) {
  editingTeamId = team?.id || null;
  el("dialogTitle").textContent = team ? "编辑小组与角色" : "新增小组";
  el("teamNameInput").value = team?.name || "";
  el("projectNameInput").value = team?.project || "";
  el("roleCeoInput").value = team?.roles?.ceo || "";
  el("roleCtoInput").value = team?.roles?.cto || "";
  el("roleCmoInput").value = team?.roles?.cmo || "";
  el("roleCfoInput").value = team?.roles?.cfo || "";
  el("teamDialog").showModal();
}

function saveTeamFromDialog(event) {
  event.preventDefault();
  const cls = activeClass();
  const name = el("teamNameInput").value.trim();
  const project = el("projectNameInput").value.trim();
  if (!name) return;
  const roles = {
    ceo: el("roleCeoInput").value.trim(),
    cto: el("roleCtoInput").value.trim(),
    cmo: el("roleCmoInput").value.trim(),
    cfo: el("roleCfoInput").value.trim(),
  };
  if (editingTeamId) {
    const team = cls.teams.find((item) => item.id === editingTeamId);
    team.name = name;
    team.project = project;
    team.roles = roles;
  } else {
    const team = makeTeam(name, project);
    team.roles = roles;
    cls.teams.push(team);
    state.activeTeamId = team.id;
  }
  saveState();
  el("teamDialog").close();
  render();
}

function addClass() {
  const name = prompt("请输入班级名称", `AI 创新应用 ${state.classes.length + 1} 班`);
  if (!name?.trim()) return;
  const cls = { id: uid("class"), name: name.trim(), teams: [] };
  state.classes.push(cls);
  state.activeClassId = cls.id;
  state.activeTeamId = null;
  pendingStrategyId = null;
  saveState();
  render();
}

function applyManual() {
  const delta = {
    cash: Number(el("manualCash").value) || 0,
    users: Number(el("manualUsers").value) || 0,
    product: Number(el("manualProduct").value) || 0,
    tech: Number(el("manualTech").value) || 0,
    reputation: Number(el("manualReputation").value) || 0,
    compliance: Number(el("manualCompliance").value) || 0,
  };
  const note = el("manualNote").value.trim() || "手动调整";
  applyDelta(delta, note);
  ["manualCash", "manualUsers", "manualProduct", "manualTech", "manualReputation", "manualCompliance"].forEach(
    (id) => (el(id).value = 0)
  );
  el("manualNote").value = "";
}

function saveScore() {
  const team = activeTeam();
  if (!team) return;
  document.querySelectorAll("[data-score]").forEach((input) => {
    const key = input.dataset.score;
    const max = Number(input.max);
    team.scores[key] = Math.max(0, Math.min(max, Number(input.value) || 0));
  });
  saveState();
  render();
}

function undoLast() {
  const team = activeTeam();
  if (!team || !logic.undoLastTransaction(state, team.id)) {
    alert("当前小组没有可撤销的记录。");
    return;
  }
  saveState();
  render();
}

function exportData() {
  const blob = new Blob([storage.exportState(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ai-monopoly-data-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = storage.parseImportedState(reader.result);
      if (!parsed.ok) throw new Error(parsed.reason);
      const imported = migrateState(parsed.state);
      state = imported;
      saveState();
      render();
    } catch {
      alert("导入失败，请选择正确的 JSON 文件。");
    }
  };
  reader.readAsText(file);
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.tab === name));
  document.querySelectorAll(".tab-view").forEach((item) => item.classList.remove("active"));
  el(`${name}View`).classList.add("active");
}

function bindEvents() {
  el("addClassBtn").addEventListener("click", addClass);
  el("addTeamBtn").addEventListener("click", () => openTeamDialog());
  el("editTeamBtn").addEventListener("click", () => {
    const team = activeTeam();
    if (team) openTeamDialog(team);
  });
  el("saveTeamBtn").addEventListener("click", saveTeamFromDialog);
  el("manualApplyBtn").addEventListener("click", applyManual);
  el("drawOpportunityBtn").addEventListener("click", () =>
    drawCard(opportunityCards, "opportunityCard", "机会卡")
  );
  el("drawCrisisBtn").addEventListener("click", () => drawCard(crisisCards, "crisisCard", "危机卡"));
  el("drawCoopBtn").addEventListener("click", () => drawInteraction("coop"));
  el("drawBattleBtn").addEventListener("click", () => drawInteraction("battle"));
  el("drawNegotiationBtn").addEventListener("click", () => drawInteraction("negotiation"));
  el("buyPropBtn").addEventListener("click", buyProp);
  el("rollDiceBtn").addEventListener("click", rollDice);
  el("saveScoreBtn").addEventListener("click", saveScore);
  el("undoBtn").addEventListener("click", undoLast);
  el("dockUndoBtn").addEventListener("click", undoLast);
  el("quickClassBtn").addEventListener("click", () => {
    compactMode = !compactMode;
    localStorage.setItem("ai-monopoly-compact-mode", String(compactMode));
    render();
  });
  document.querySelectorAll("[data-dock-tab]").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.dockTab));
  });
  el("exportBtn").addEventListener("click", exportData);
  el("importInput").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) importData(file);
    event.target.value = "";
  });
  el("resetBtn").addEventListener("click", () => {
    if (!confirm("确定重置为示例数据吗？当前浏览器本地数据会被覆盖。建议先导出数据备份。")) return;
    state = defaultState();
    pendingStrategyId = null;
    saveState();
    render();
  });
  el("clearRecordsBtn").addEventListener("click", () => {
    const team = activeTeam();
    if (!team || !confirm("确定清空本组经营记录吗？资源数值不会重置。")) return;
    team.records = [];
    saveState();
    render();
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
}

bindEvents();
render();

