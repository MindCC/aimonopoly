const test = require("node:test");
const assert = require("node:assert/strict");

const stateLogic = require("../src/state.js");

test("applyDeltaToTeam updates metrics and clamps non-cash metrics at zero", () => {
  const team = {
    metrics: { cash: 1000, users: 5, product: 1, tech: 1, reputation: 1, compliance: 1 },
  };

  stateLogic.applyDeltaToTeam(team, { cash: -1500, users: -10, compliance: -3 });

  assert.deepEqual(team.metrics, {
    cash: -500,
    users: 0,
    product: 1,
    tech: 1,
    reputation: 1,
    compliance: 0,
  });
});
