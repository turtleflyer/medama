/**
 * Symbol used as a special key to track which state entries have changed.
 */
export const _STATE_ENTRIES_CHANGED = Symbol('STATE_ENTRIES_CHANGED');

export type StateEntriesChangedKey = typeof _STATE_ENTRIES_CHANGED;

export type SelectStateEntriesChanged = <State extends object>(
  stateWithStateEntriesChanged: State
) => Partial<State>;

/**
 * Selector function to extract the changed state entries from a state object.
 * It expects the state to have a property keyed by _STATE_ENTRIES_CHANGED containing the changed entries.
 * Returns a new object with only the changed entries.
 */
export const selectStateEntriesChanged: SelectStateEntriesChanged = <State extends object>({
  [_STATE_ENTRIES_CHANGED as keyof State]: changedEntries,
}: State) => Object.assign(Object.create(null), changedEntries);
