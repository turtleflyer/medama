'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SelectorRecord = exports.SelectorStore = void 0;
/**
 * The class manages the map of each selector to its record that is methods allowing to get the most
 * updated value and manage subscriptions. The map is a WeakMap that allow garbage collecting if all
 * references to the selector was gone.
 */
class SelectorStore {
  constructor(stateImage) {
    this.selectorSubscriptionStore = new WeakMap();
    this.getSelectorRecord = (selector) => {
      var _a;
      const selectorRecord =
        (_a = this.selectorSubscriptionStore.get(selector)) !== null && _a !== void 0
          ? _a
          : new SelectorRecord(selector, stateImage);
      this.selectorSubscriptionStore.set(selector, selectorRecord);
      return selectorRecord;
    };
  }
  getSelectorValue(selector) {
    return this.getSelectorRecord(selector).getValue();
  }
  subscribeToStateInSelectorStore(selector, subscription) {
    const selectorRecord = this.getSelectorRecord(selector);
    const possibleSubscriptionJob = subscription(selectorRecord.getValue());
    return selectorRecord.addSubscription(
      possibleSubscriptionJob !== null && possibleSubscriptionJob !== void 0
        ? possibleSubscriptionJob
        : subscription
    );
  }
}
exports.SelectorStore = SelectorStore;
/**
 * The class manages adding subscriptions to the state changes along with the method of getting the
 * most recently updated calculation result for the selector. It designed in the way preventing the
 * unnecessary recalculating that.
 */
class SelectorRecord {
  constructor(selector, stateImage) {
    /**
     * The result value for the selector is set to be calculated lazily preventing unnecessary
     * recalculating.
     */
    this.value = null;
    this.toRecalculateValue = true;
    /**
     * Indicates if the selector is currently registered.
     */
    this.registered = true;
    /**
     * Jobs are getting run when the selector's dependencies change.
     */
    this.jobs = new Set();
    const selectorTrigger = () => {
      /**
       * If the job list is empty it sends the states image the signal to remove the trigger.
       */
      if (this.jobs.size === 0) {
        this.toRecalculateValue = true;
        this.registered = false;
        return false;
      }
      this.value = this.calculateValue();
      this.jobs.forEach((job) => {
        job(this.value);
      });
      return true;
    };
    const readState = stateImage.registerSelectorTrigger(selectorTrigger);
    this.calculateValue = () => readState(selector);
    this.getValue = () => {
      /**
       * If on reading the selector value it appears that the selector is unregistered it gets
       * registered right away even if there are no jobs (it will be unregistered on the next
       * update of the selector's dependencies) to make sure the next reading will recalculate the
       * value only if it was updated.
       */
      if (!this.registered) {
        stateImage.registerSelectorTrigger(selectorTrigger);
        this.registered = true;
      }
      this.value = this.toRecalculateValue ? this.calculateValue() : this.value;
      this.toRecalculateValue = false;
      return this.value;
    };
  }
  addSubscription(subscriptionJob) {
    this.jobs.add(subscriptionJob);
    return () => {
      this.jobs.delete(subscriptionJob);
    };
  }
}
exports.SelectorRecord = SelectorRecord;
//# sourceMappingURL=selectorStore.js.map
