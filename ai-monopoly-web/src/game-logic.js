(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AiMonopolyLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const metricKeys = ["cash", "users", "product", "tech", "reputation", "compliance"];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeDelta(delta = {}) {
    const normalized = {};
    metricKeys.forEach((key) => {
      normalized[key] = Number(delta[key]) || 0;
    });
    return normalized;
  }

  function compactDelta(delta = {}) {
    const compacted = {};
    Object.entries(delta).forEach(([key, value]) => {
      const number = Number(value) || 0;
      if (number) compacted[key] = number;
    });
    return compacted;
  }

  function clampTeamMetrics(team) {
    if (!team?.metrics) return;
    ["users", "product", "tech", "reputation", "compliance"].forEach((key) => {
      team.metrics[key] = Math.max(0, Number(team.metrics[key]) || 0);
    });
    team.metrics.cash = Number(team.metrics.cash) || 0;
  }

  function allTeams(state) {
    return (state?.classes || []).flatMap((cls) => cls.teams || []);
  }

  function reverseDelta(team, delta) {
    const fullDelta = normalizeDelta(delta);
    Object.entries(fullDelta).forEach(([key, value]) => {
      team.metrics[key] -= Number(value) || 0;
    });
    clampTeamMetrics(team);
  }

  function undoRecordSideEffects(team, record) {
    if (record?.meta?.propAdded) {
      const index = [...(team.props || [])].reverse().findIndex((prop) => prop.name === record.meta.propAdded);
      if (index >= 0) team.props.splice(team.props.length - 1 - index, 1);
    }
    if (record?.meta?.propUsed) {
      const prop = (team.props || []).find((item) => item.instanceId === record.meta.propUsed || item.id === record.meta.propUsed);
      if (prop) {
        prop.used = false;
        prop.usedAt = null;
      }
    }
    if (record?.meta?.boardMove) {
      team.boardPosition = record.meta.boardMove.previousPosition;
    }
  }

  function undoLastTransaction(state, teamId) {
    const team = allTeams(state).find((item) => item.id === teamId);
    const record = team?.records?.[0];
    if (!record) return false;
    const transactionId = record.transactionId || record.id;

    allTeams(state).forEach((item) => {
      const matching = [];
      item.records = (item.records || []).filter((candidate) => {
        const sameTransaction = (candidate.transactionId || candidate.id) === transactionId;
        if (sameTransaction) matching.push(candidate);
        return !sameTransaction;
      });
      matching.forEach((candidate) => {
        reverseDelta(item, candidate.delta);
        undoRecordSideEffects(item, candidate);
      });
    });

    return true;
  }

  function validateImportState(rawState) {
    if (!rawState || !Array.isArray(rawState.classes)) {
      return { ok: false, reason: "缺少班级列表" };
    }
    for (const cls of rawState.classes) {
      if (!cls || typeof cls.id !== "string" || !Array.isArray(cls.teams)) {
        return { ok: false, reason: "班级结构不正确" };
      }
      for (const team of cls.teams) {
        if (!team || typeof team.id !== "string" || typeof team.metrics !== "object") {
          return { ok: false, reason: "小组结构不正确" };
        }
      }
    }
    return { ok: true };
  }

  function applyPropEffect(team, prop, delta = {}, choice) {
    if (!team || !prop || prop.used) return { delta, note: "" };
    const effect = prop.effect || {};
    let nextDelta = { ...delta };
    let note = "";

    if (effect.kind === "shield" && effect.metric && Number(nextDelta[effect.metric]) < 0) {
      const blocked = Math.min(Math.abs(Number(nextDelta[effect.metric]) || 0), Number(effect.amount) || 1);
      nextDelta[effect.metric] += blocked;
      note = `${prop.name}抵消${blocked}点${effect.metric}`;
    } else if (effect.kind === "halvePenalty") {
      Object.entries(nextDelta).forEach(([key, value]) => {
        if ((!effect.metric || effect.metric === key) && Number(value) < 0) nextDelta[key] = Math.trunc(Number(value) / 2);
      });
      note = `${prop.name}将惩罚减半`;
    } else if (effect.kind === "bonusDelta") {
      nextDelta = compactDelta({ ...nextDelta, ...compactDelta(effect.delta) });
      note = `${prop.name}生效`;
    } else if (effect.kind === "chooseDelta") {
      const selected = effect.options?.[choice] || effect.options?.[0] || {};
      nextDelta = compactDelta({ ...nextDelta, ...compactDelta(selected.delta || selected) });
      note = `${prop.name}生效`;
    } else {
      return { delta, note: "" };
    }

    prop.used = true;
    prop.usedAt = new Date().toISOString();
    return { delta: nextDelta, note };
  }

  return {
    escapeHtml,
    normalizeDelta,
    compactDelta,
    clampTeamMetrics,
    undoLastTransaction,
    validateImportState,
    applyPropEffect,
  };
});
