export declare const _STATE_ENTRIES_CHANGED: unique symbol;
export type StateEntriesChangedKey = typeof _STATE_ENTRIES_CHANGED;
export type SelectStateEntriesChanged = <State extends object>(stateWithStateEntriesChanged: State) => Partial<State>;
export declare const selectStateEntriesChanged: SelectStateEntriesChanged;
//# sourceMappingURL=selectStateEntriesChanged.d.ts.map