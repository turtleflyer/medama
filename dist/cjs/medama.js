'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Medama = void 0;
const selectorStore_1 = require('./selectorStore');
const state_1 = require('./state');
class Medama {
  constructor(initState) {
    this.stateImage = new state_1.StateImage(initState);
    this.selectorStore = new selectorStore_1.SelectorStore(this.stateImage);
  }
  subscribeToState(selector, subscription) {
    const toReturn = new ManageSubscription((sub) =>
      this.selectorStore.subscribeToStateInSelectorStore(selector, sub)
    );
    toReturn.resubscribe(subscription);
    return toReturn;
  }
  readState(selector) {
    return this.selectorStore.getSelectorValue(selector);
  }
  setState(stateChange) {
    const mergeToState =
      typeof stateChange === 'function'
        ? this.selectorStore.getSelectorValue(stateChange)
        : stateChange;
    this.stateImage.writeState(mergeToState);
    return mergeToState;
  }
  resetState(initState) {
    this.stateImage = new state_1.StateImage(initState);
    this.selectorStore = new selectorStore_1.SelectorStore(this.stateImage);
  }
}
exports.Medama = Medama;
class ManageSubscription {
  constructor(subscribe) {
    this.unsubscribeFromRecentSubscription = null;
    this.resubscribe = (subscription) => {
      var _a;
      (_a = this.unsubscribeFromRecentSubscription) === null || _a === void 0
        ? void 0
        : _a.call(this);
      this.unsubscribeFromRecentSubscription = subscribe(subscription);
    };
  }
  unsubscribe() {
    var _a;
    (_a = this.unsubscribeFromRecentSubscription) === null || _a === void 0
      ? void 0
      : _a.call(this);
    this.unsubscribeFromRecentSubscription = null;
  }
}
//# sourceMappingURL=medama.js.map
