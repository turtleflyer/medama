import type { Selector, Setter, Subscription } from './medama.types';
export declare class Medama<State extends object> {
  constructor(initState?: State);
  private stateImage;
  private selectorStore;
  subscribeToState<V>(
    selector: Selector<State, V>,
    subscription: Subscription<V>
  ): ManageSubscription<V>;
  readState<V>(selector: Selector<State, V>): V;
  setState<K extends keyof State>(stateChange: Setter<State, K> | Pick<State, K>): Pick<State, K>;
  resetState(initState?: Partial<State>): void;
}
declare class ManageSubscription<V> {
  constructor(subscribe: (subscription: Subscription<V>) => () => void);
  private unsubscribeFromRecentSubscription;
  unsubscribe(): void;
  resubscribe: (subscription: Subscription<V>) => void;
}
export {};
