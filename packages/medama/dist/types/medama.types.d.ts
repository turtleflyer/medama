import type { Normalize } from './type-helpers/Normalize';
export type Selector<State extends object, V = unknown> = (state: State) => V;
export type SubscriptionJob<V> = (selectorResult: V) => void;
export type Subscription<V> = SubscriptionJob<V> | ((selectorResult: V) => SubscriptionJob<V>);
export type UnsubscribeFromState = () => void;
export type Resubscribe<V> = (subscription: Subscription<V>) => void;
export type TransferSubscription<State extends object, V> = (newSelector: Selector<State, V>) => void;
export type SubscriptionMethods<State extends object, V> = {
    unsubscribe: UnsubscribeFromState;
    resubscribe: Resubscribe<V>;
    transfer: TransferSubscription<State, V>;
};
export type SubscribeToState<State extends object> = <V>(selector: Selector<State, V>, subscription: Subscription<V>) => SubscriptionMethods<State, V>;
export type ReadState<State extends object> = <V>(selector: Selector<State, V>) => V;
export type Setter<State extends object, SChange extends Partial<State>> = (state: State) => SChange;
export type SetState<State extends object> = <SChange extends Partial<State>>(stateChange: SChange | Setter<State, SChange>) => SChange;
export type ResetState<State extends object> = (initState?: Partial<State>) => void;
export type Pupil<State extends object> = {
    subscribeToState: SubscribeToState<State>;
    readState: ReadState<State>;
    setState: SetState<State>;
    resetState: ResetState<State>;
};
export type Medama<State extends object> = Pupil<State> & {
    pupil: Pupil<State>;
};
export type CreateMedama = {
    <State extends object>(initState: State): Normalize<Medama<State>>;
    <State extends object>(initState?: Partial<State>): Normalize<Medama<State>>;
};
//# sourceMappingURL=medama.types.d.ts.map