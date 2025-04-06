export const createStateImage = (initState) => {
    let calculationAllowed = false;
    let triggerJobRoutine = null;
    const triggerJobStore = {};
    const { addToPool, runPool } = createJobPool();
    const restrictCalculation = () => {
        if (!calculationAllowed)
            throw new Error('Medama Error: The object has no access to its properties');
    };
    const runWithRestrictionLifted = (toRun) => {
        calculationAllowed = true;
        return [toRun(), (calculationAllowed = false), (triggerJobRoutine = null)][0];
    };
    const readStateFromImage = (selector) => runWithRestrictionLifted(() => selector(state));
    const writeState = (toWrite) => {
        runWithRestrictionLifted(() => {
            Object.assign(state, toWrite);
        });
        runPool();
    };
    const registerSelectorTrigger = (selectorTrigger) => {
        triggerJobRoutine = createRegisterTriggerJob(selectorTrigger);
        return readStateFromImage;
    };
    const proxyHandler = {
        get: (target, p) => {
            var _a;
            var _b;
            restrictCalculation();
            if (triggerJobRoutine) {
                const triggerStoreRec = ((_a = triggerJobStore[_b = p]) !== null && _a !== void 0 ? _a : (triggerJobStore[_b] = new Set()));
                triggerJobRoutine(triggerStoreRec);
            }
            return target[p];
        },
        set: (target, p, newValue) => {
            restrictCalculation();
            const oldValue = target[p];
            target[p] = newValue;
            const rec = triggerJobStore[p];
            if (rec && !Object.is(oldValue, newValue))
                addToPool(rec);
            return true;
        },
    };
    const state = new Proxy(Object.assign({}, initState), proxyHandler);
    return { writeState, registerSelectorTrigger };
};
export const createRegisterTriggerJob = (selectorTrigger) => {
    const unregisterPool = new Set();
    const runUnregister = () => {
        unregisterPool.forEach((unregJob) => {
            unregJob();
        });
    };
    const triggerJob = () => {
        selectorTrigger() || runUnregister();
    };
    const registerTriggerJob = (triggerJobSet) => {
        triggerJobSet.add(triggerJob);
        unregisterPool.add(() => {
            triggerJobSet.delete(triggerJob);
        });
    };
    return registerTriggerJob;
};
export const createJobPool = () => {
    const pool = new Set();
    let haveAlreadyBeenRun = new WeakSet();
    const addToPool = (jobs) => {
        pool.add(jobs);
    };
    const runPool = () => {
        pool.forEach((chunk) => {
            chunk.forEach((job) => {
                if (haveAlreadyBeenRun.has(job))
                    return;
                job();
                haveAlreadyBeenRun.add(job);
            });
        });
        pool.clear();
        haveAlreadyBeenRun = new WeakSet();
    };
    return { addToPool, runPool };
};
//# sourceMappingURL=state.js.map