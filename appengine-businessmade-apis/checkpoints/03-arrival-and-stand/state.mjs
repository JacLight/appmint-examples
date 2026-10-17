// Clear records owned by the selected visit before switching context.
export function resetVisitState(state) {
  for (const key of ["assignment", "standId", "position"]) delete state[key];
}
