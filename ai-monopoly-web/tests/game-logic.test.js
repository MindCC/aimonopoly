const test = require("node:test");
const assert = require("node:assert/strict");

const logic = require("../src/game-logic.js");
const rules = require("../src/rules.js");

const metrics = {
  cash: 10000,
  users: 0,
  product: 1,
  tech: 1,
  reputation: 1,
  compliance: 1,
};

function team(id, overrides = {}) {
  return {
    id,
    name: id,
    metrics: { ...metrics, ...(overrides.metrics || {}) },
    records: overrides.records || [],
    props: overrides.props || [],
    boardPosition: overrides.boardPosition || 0,
  };
}

test("escapeHtml renders user input as text instead of markup", () => {
  assert.equal(
    logic.escapeHtml(`<img src=x onerror=alert(1)>A&B"`),
    "&lt;img src=x onerror=alert(1)&gt;A&amp;B&quot;"
  );
});

test("undoLastTransaction reverses both teams touched by one interaction", () => {
  const state = {
    classes: [
      {
        id: "class_1",
        teams: [
          team("alpha", {
            metrics: { cash: 9000, product: 2 },
            records: [
              {
                id: "record_alpha",
                transactionId: "tx_1",
                delta: { cash: -1000, product: 1 },
              },
            ],
          }),
          team("beta", {
            metrics: { cash: 9000, product: 2 },
            records: [
              {
                id: "record_beta",
                transactionId: "tx_1",
                delta: { cash: -1000, product: 1 },
              },
            ],
          }),
        ],
      },
    ],
  };

  const undone = logic.undoLastTransaction(state, "alpha");

  assert.equal(undone, true);
  assert.deepEqual(state.classes[0].teams[0].metrics, metrics);
  assert.deepEqual(state.classes[0].teams[1].metrics, metrics);
  assert.equal(state.classes[0].teams[0].records.length, 0);
  assert.equal(state.classes[0].teams[1].records.length, 0);
});

test("validateImportState rejects malformed imported data", () => {
  assert.equal(logic.validateImportState({ classes: "bad" }).ok, false);
  assert.equal(
    logic.validateImportState({
      classes: [{ id: "class_1", teams: [{ id: "team_1", metrics }] }],
    }).ok,
    true
  );
});

test("applyPropEffect consumes a shield prop and blocks matching metric loss", () => {
  const current = team("alpha", {
    props: [
      {
        id: "P02",
        name: "用户口碑卡",
        used: false,
        effect: { kind: "shield", metric: "reputation", amount: 1 },
      },
    ],
  });

  const result = logic.applyPropEffect(current, current.props[0], { reputation: -1, cash: -500 });

  assert.deepEqual(result.delta, { reputation: 0, cash: -500 });
  assert.equal(current.props[0].used, true);
  assert.match(result.note, /抵消/);
});

test("context-bound props only apply in matching classroom contexts", () => {
  const capitalProp = rules.propCards.find((card) => card.id === "P06");
  const productProp = rules.propCards.find((card) => card.id === "P07");

  assert.equal(logic.isPropApplicable(capitalProp, { type: "capital" }, { cash: 5000 }), true);
  assert.equal(logic.isPropApplicable(capitalProp, { type: "product" }, { cash: 5000 }), false);
  assert.equal(logic.isPropApplicable(productProp, { type: "product" }, { product: 1 }), true);
  assert.equal(logic.isPropApplicable(productProp, { type: "capital" }, { product: 1 }), false);
});

test("applyPropEffect consumes a context-bound bonus prop in matching context", () => {
  const current = team("alpha");
  const prop = {
    id: "P06",
    name: "投资人引荐卡",
    used: false,
    effect: { kind: "bonusDelta", contexts: ["capital"], delta: { cash: 3000 } },
  };

  const result = logic.applyPropEffect(current, prop, { cash: 3000 }, undefined, { type: "capital" });

  assert.deepEqual(result.delta, { cash: 6000 });
  assert.equal(prop.used, true);
  assert.match(result.note, /生效/);
});
