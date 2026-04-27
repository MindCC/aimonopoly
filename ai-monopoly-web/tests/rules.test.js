const test = require("node:test");
const assert = require("node:assert/strict");

const rules = require("../src/rules.js");

test("rules module exports the classroom game rule sets", () => {
  assert.equal(rules.boardCells.length, 24);
  assert.equal(rules.opportunityCards.length, 16);
  assert.equal(rules.crisisCards.length, 16);
  assert.equal(rules.propCards.length, 12);
  assert.equal(rules.scoreItems.reduce((sum, [, , points]) => sum + points, 0), 100);
});

test("prop cards use structured effect fields", () => {
  const reputationShield = rules.propCards.find((card) => card.id === "P02");
  assert.deepEqual(reputationShield.effect, {
    kind: "shield",
    metric: "reputation",
    amount: 1,
  });
});
