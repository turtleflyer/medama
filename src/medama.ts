import type { Selector, Setter, Subscription } from './medama.types';
import { SelectorStore } from './selectorStore';
import { StateImage } from './state';

export class Medama<State extends object> {
  constructor(initState?: State);

  constructor(initState?: Partial<State>) {
    this.stateImage = new StateImage(initState);
    this.selectorStore = new SelectorStore(this.stateImage);
  }

  private stateImage: StateImage<State>;
  private selectorStore: SelectorStore<State>;

  subscribeToState<V>(selector: Selector<State, V>, subscription: Subscription<V>) {
    const toReturn = new ManageSubscription((sub: Subscription<V>) =>
      this.selectorStore.subscribeToStateInSelectorStore(selector, sub)
    );

    toReturn.resubscribe(subscription);

    return toReturn;
  }

  readState<V>(selector: Selector<State, V>) {
    return this.selectorStore.getSelectorValue(selector);
  }

  setState<K extends keyof State>(stateChange: Setter<State, K> | Pick<State, K>) {
    const mergeToState =
      typeof stateChange === 'function'
        ? this.selectorStore.getSelectorValue(stateChange)
        : stateChange;

    this.stateImage.writeState(mergeToState);

    return mergeToState;
  }

  resetState(initState?: Partial<State>) {
    this.stateImage = new StateImage(initState);
    this.selectorStore = new SelectorStore(this.stateImage);
  }
}

class ManageSubscription<V> {
  constructor(subscribe: (subscription: Subscription<V>) => () => void) {
    this.resubscribe = (subscription: Subscription<V>) => {
      this.unsubscribeFromRecentSubscription?.();
      this.unsubscribeFromRecentSubscription = subscribe(subscription);
    };
  }

  private unsubscribeFromRecentSubscription: (() => void) | null = null;

  unsubscribe() {
    this.unsubscribeFromRecentSubscription?.();
    this.unsubscribeFromRecentSubscription = null;
  }

  resubscribe: (subscription: Subscription<V>) => void;
}
