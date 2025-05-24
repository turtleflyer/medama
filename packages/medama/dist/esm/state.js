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
    const triggerJobStore = {};
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
    const setState = (stateChange) => [
        runWithRestrictionLifted(() => {
            const mergeToState = typeof stateChange === 'function' ? stateChange(state) : stateChange;
            Object.assign(state, mergeToState);
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
            if (fireKey && !Object.is(oldValue, newValue))
                fireKey();
            return true;
        },
    };
    const state = new Proxy(Object.assign({}, initState), proxyHandler);
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