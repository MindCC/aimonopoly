const test = require("node:test");
const assert = require("node:assert/strict");

const events = require("../src/events.js");

test("createRecord stores transactionId and normalized delta", () => {
  const record = events.createRecord({
    id: "record_1",
    transactionId: "tx_1",
    at: "2026-04-27T00:00:00.000Z",
    topic: "课堂经营",
    event: "测试事件",
    delta: { cash: 100, product: 1 },
  });

  assert.equal(record.transactionId, "tx_1");
  assert.deepEqual(record.delta, {
    cash: 100,
    users: 0,
    product: 1,
    tech: 0,
    reputation: 0,
    compliance: 0,
  });
});
