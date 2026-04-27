(function (root, factory) {
  const api = factory(root.AiMonopolyLogic, typeof require === "function" ? require("./game-logic.js") : null);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AiMonopolyEvents = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (browserLogic, nodeLogic) {
  const logic = browserLogic || nodeLogic;

  function createRecord({ id, transactionId, at, topic, event, delta, meta = {} }) {
    return {
      id,
      transactionId,
      at,
      topic,
      event,
      delta: logic.normalizeDelta(delta),
      meta,
    };
  }

  return { createRecord };
});
