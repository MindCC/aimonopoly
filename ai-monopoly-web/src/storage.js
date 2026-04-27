(function (root, factory) {
  const api = factory(root.AiMonopolyLogic, typeof require === "function" ? require("./game-logic.js") : null);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AiMonopolyStorage = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (browserLogic, nodeLogic) {
  const logic = browserLogic || nodeLogic;
  const SCHEMA_VERSION = 2;
  const STORAGE_KEY = "ai-monopoly-web-v2";
  const OLD_STORAGE_KEY = "ai-monopoly-web-v1";

  function withSchemaVersion(state) {
    return { ...state, schemaVersion: SCHEMA_VERSION };
  }

  function parseImportedState(text) {
    try {
      const state = JSON.parse(text);
      const validation = logic.validateImportState(state);
      if (!validation.ok) return { ok: false, reason: validation.reason };
      return { ok: true, state: withSchemaVersion(state) };
    } catch {
      return { ok: false, reason: "JSON 格式不正确" };
    }
  }

  function loadState(defaultState, migrateState, localStorageRef = root.localStorage) {
    try {
      const raw = localStorageRef.getItem(STORAGE_KEY) || localStorageRef.getItem(OLD_STORAGE_KEY);
      return raw ? migrateState(JSON.parse(raw)) : defaultState();
    } catch {
      return defaultState();
    }
  }

  function saveState(state, localStorageRef = root.localStorage) {
    localStorageRef.setItem(STORAGE_KEY, JSON.stringify(withSchemaVersion(state)));
  }

  function exportState(state) {
    return JSON.stringify(withSchemaVersion(state), null, 2);
  }

  return {
    SCHEMA_VERSION,
    STORAGE_KEY,
    OLD_STORAGE_KEY,
    withSchemaVersion,
    parseImportedState,
    loadState,
    saveState,
    exportState,
  };
});
