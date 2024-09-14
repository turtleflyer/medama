import type { Normalize } from './helpers';
export type Selector<State extends object, V = unknown> = (state: State) => V;
export type SubscriptionJob<V> = (selectorResult: V) => void;
export type Subscription<V> = SubscriptionJob<V> | ((selectorResult: V) => SubscriptionJob<V>);
export type Resubscribe<V> = (subscription: Subscription<V>) => void;
export type UnsubscribeFromState = () => void;
export type SubscriptionMethods<V> = {
  unsubscribe: UnsubscribeFromState;
  resubscribe: Resubscribe<V>;
};
export type SubscribeToState<State extends object> = <V>(
  selector: Selector<State, V>,
  subscription: Subscription<V>
) => SubscriptionMethods<V>;
export type ReadState<State extends object> = <V>(selector: Selector<State, V>) => V;
export type Setter<State extends object, K extends keyof State> = (state: State) => Pick<State, K>;
export type SetState<State extends object> = <K extends keyof State>(
  stateChange: Setter<State, K> | Pick<State, K>
) => Pick<State, K>;
export type ResetState<State extends object> = (initState?: Partial<State>) => void;
export type MedamaMethods<State extends object> = {
  subscribeToState: SubscribeToState<State>;
  readState: ReadState<State>;
  setState: SetState<State>;
  resetState: ResetState<State>;
};
export type Medama<State extends object> = MedamaMethods<State> & {
  pupil: MedamaMethods<State>;
};
export type CreateMedama = {
  <State extends object>(initState: State): Normalize<Medama<State>>;
  <State extends object>(initState?: Partial<State>): Normalize<Medama<State>>;
};
