import { _STATE_ENTRIES_CHANGED } from './selectStateEntriesChanged';
export const createStateImage = (initState) => {
    let calculationAllowed = false;
    const restrictCalculation = () => {
        if (!calculationAllowed)
            throw new Error('Medama Error: The object has no access to its properties');
    };
    const runWithRestrictionLifted = (toRun) => {
        calculationAllowed = true;
        return [toRun(), (calculationAllowed = false)][0];
    };
    let activeKeyHandleCollector;
    const runOverState = (selector, keyHandleCollector) => {
        activeKeyHandleCollector = keyHandleCollector;
        return [
            runWithRestrictionLifted(() => selector(state)),
            (activeKeyHandleCollector = undefined),
        ][0];
    };
    const triggerJobStore = Object.create(null);
    const { addToQueue, runQueue } = createJobQueue();
    const createKeyHandleRecord = () => {
        const immediateTaskSet = new Set();
        const triggerSet = new Set();
        const keyHandle = (runImmediately, trigger) => {
            immediateTaskSet.add(runImmediately);
            triggerSet.add(trigger);
            return () => {
                immediateTaskSet.delete(runImmediately);
                triggerSet.delete(trigger);
            };
        };
        const fireKey = () => {
            immediateTaskSet.forEach((task) => {
                task();
            });
            addToQueue(triggerSet);
        };
        return { keyHandle, fireKey };
    };
    let stateEntriesChanged;
    const setState = (stateChange) => [
        runWithRestrictionLifted(() => {
            stateEntriesChanged = Object.create(null);
            const mergeToState = typeof stateChange === 'function' ? stateChange(state) : stateChange;
            Object.assign(state, mergeToState);
            Reflect.ownKeys(stateEntriesChanged).length > 0 &&
                (state[_STATE_ENTRIES_CHANGED] = stateEntriesChanged);
            return mergeToState;
        }),
        runQueue(),
    ][0];
    const proxyHandler = {
        get: (target, p) => {
            var _a;
            var _b;
            restrictCalculation();
            if (activeKeyHandleCollector) {
                const { keyHandle } = ((_a = triggerJobStore[_b = p]) !== null && _a !== void 0 ? _a : (triggerJobStore[_b] = createKeyHandleRecord()));
                activeKeyHandleCollector(keyHandle);
            }
            return target[p];
        },
        set: (target, p, newValue) => {
            var _a;
            restrictCalculation();
            const oldValue = target[p];
            target[p] = newValue;
            const { fireKey } = (_a = triggerJobStore[p]) !== null && _a !== void 0 ? _a : {};
            if (!Object.is(oldValue, newValue)) {
                Object.prototype.propertyIsEnumerable.call(target, p) &&
                    (stateEntriesChanged[p] = newValue);
                fireKey === null || fireKey === void 0 ? void 0 : fireKey();
            }
            return true;
        },
    };
    const stateTargetObject = Object.defineProperty(Object.assign(Object.create(null), initState), _STATE_ENTRIES_CHANGED, { value: Object.create(null), writable: true });
    const state = new Proxy(stateTargetObject, proxyHandler);
    return { runOverState, setState };
};
export const createJobQueue = () => {
    const queue = new Set();
    const addToQueue = (triggerSet) => {
        triggerSet.forEach((trigger) => {
            queue.add(trigger);
        });
    };
    const runQueue = () => {
        queue.forEach((trigger) => {
            trigger();
        });
        queue.clear();
    };
    return { addToQueue, runQueue };
};
//# sourceMappingURL=state.js.map