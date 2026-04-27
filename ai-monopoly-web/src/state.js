(function (root, factory) {
  const api = factory(root.AiMonopolyLogic, typeof require === "function" ? require("./game-logic.js") : null);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AiMonopolyState = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (browserLogic, nodeLogic) {
  const logic = browserLogic || nodeLogic;

  function applyDeltaToTeam(team, delta) {
    if (!team) return;
    const fullDelta = logic.normalizeDelta(delta);
    Object.entries(fullDelta).forEach(([key, value]) => {
      team.metrics[key] += Number(value) || 0;
    });
    logic.clampTeamMetrics(team);
  }

  return { applyDeltaToTeam };
});
