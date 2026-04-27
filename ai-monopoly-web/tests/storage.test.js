const test = require("node:test");
const assert = require("node:assert/strict");

const storage = require("../src/storage.js");

test("withSchemaVersion adds the current schema version to exported state", () => {
  const state = { classes: [] };
  assert.deepEqual(storage.withSchemaVersion(state), {
    schemaVersion: storage.SCHEMA_VERSION,
    classes: [],
  });
});

test("parseImportedState validates JSON and returns parsed state", () => {
  const parsed = storage.parseImportedState('{"classes":[{"id":"class_1","teams":[]}]}');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.state.schemaVersion, storage.SCHEMA_VERSION);
});

test("parseImportedState rejects invalid JSON structures", () => {
  assert.equal(storage.parseImportedState('{"classes":"bad"}').ok, false);
  assert.equal(storage.parseImportedState("{bad json").ok, false);
});
