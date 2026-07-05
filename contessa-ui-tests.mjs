import assert from "node:assert/strict";
import test from "node:test";
import {
  buildObjectivesFilterTabs,
  migrateImportedAppStatePayload,
} from "./src/contessa_app_data.mjs";

test("objectives filter tabs expose the expected labels, counts, and active state", () => {
  const tabs = buildObjectivesFilterTabs(
    {
      totalObjectives: 9,
      pending: 4,
      ongoing: 3,
      waitingApproval: 0,
      blocked: 0,
      completed: 2,
    },
    "ongoing"
  );

  assert.deepEqual(
    tabs.map((tab) => ({ value: tab.value, label: tab.label, count: tab.count, active: tab.active })),
    [
      { value: "all", label: "All", count: 9, active: false },
      { value: "pending", label: "To Do", count: 4, active: false },
      { value: "ongoing", label: "In Progress", count: 3, active: true },
      { value: "waiting-approval", label: "Waiting Approval", count: 0, active: false },
      { value: "blocked", label: "Blocked", count: 0, active: false },
      { value: "completed", label: "Done", count: 2, active: false },
    ]
  );
});

test("version 1 imports promote legacy aliases before the UI consumes them", () => {
  const migrated = migrateImportedAppStatePayload({
    app: "M/Y Contessa",
    version: 1,
    state: {
      actor: "Chief Mate",
      declined: [{ id: "CT-005", name: "Legacy Declined", area: "Bow", status: "declined" }],
      maintenance: [{ id: "MI-2", title: "Winch service", area: "Bow", nextDueDate: "2026-04-21" }],
    },
  });

  assert.equal(migrated.state.actorName, "Chief Mate");
  assert.equal(migrated.state.declinedTasks.length, 1);
  assert.equal(migrated.state.maintenanceItems.length, 1);
});

test("future alias fallbacks cover objectives and crew expense renames", () => {
  const migrated = migrateImportedAppStatePayload({
    app: "M/Y Contessa",
    version: 99,
    state: {
      objectives: [{ id: "CT-011", name: "Polish rails", area: "Aft Deck" }],
      crew: [{ id: "CE-2", title: "Fuel taxi", amount: 35 }],
      userName: "Captain",
    },
  });

  assert.equal(migrated.state.actorName, "Captain");
  assert.equal(migrated.state.tasks[0].id, "CT-011");
  assert.equal(migrated.state.crewExpenses[0].id, "CE-2");
});
