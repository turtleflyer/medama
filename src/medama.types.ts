export type Selector<State extends object, V = unknown> = (state: State) => V;

export type SubscriptionJob<V> = (selectorResult: V) => void;

export type Subscription<V> = SubscriptionJob<V> | ((selectorResult: V) => SubscriptionJob<V>);

export type Setter<State extends object, K extends keyof State> = (state: State) => Pick<State, K>;

export type ResetState<State extends object> = (initState?: Partial<State>) => void;
