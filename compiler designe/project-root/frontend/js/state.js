// js/state.js — single source of truth

const State = {
  // raw compiler output
  tokens:       [],
  ast:          null,
  irInstructions: [],

  // execution
  currentStep:  -1,       // which IR instruction we're on
  stack:        [],       // evaluation stack at current step
  memory:       {},       // variable store at current step
  snapshots:    [],       // [{stack, memory, instrIndex, description}] one per IR step
  isRunning:    false,
  runTimer:     null,
  speed:        300,      // ms per step

  // errors
  errors:       [],

  reset() {
    this.tokens        = [];
    this.ast           = null;
    this.irInstructions = [];
    this.currentStep   = -1;
    this.stack         = [];
    this.memory        = {};
    this.snapshots     = [];
    this.isRunning     = false;
    this.errors        = [];
    clearTimeout(this.runTimer);
  }
};