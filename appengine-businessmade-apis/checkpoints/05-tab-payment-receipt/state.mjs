// Only the current visit may own these dependent business records.
export function resetVisitState(state) {
  for (const key of [
    "work",
    "mechanic",
    "tab",
    "breakdown",
    "requestId",
    "closed",
    "cleared",
    "receipt",
    "payment",
    "assignment",
    "standId",
    "position",
  ])
    delete state[key];
}
