"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isComposite = exports.composeMedama = void 0;
const const_1 = require("./const");
const forEachOnOwnNumerableProps_1 = require("./forEachOnOwnNumerableProps");
const jobQueue_1 = require("./jobQueue");
const modeManager_1 = require("./modeManager");
const traverseThroughPupils_1 = require("./traverseThroughPupils");
const { getReadWorkState, runWithReadModeOn, setSubscriptionMeansRequested, getRequestSubscriptionMeansState, resetReadWorkMode, } = (0, modeManager_1.createReadWorkModeManager)();
const { getUpdateWorkState, startUpdating, signalDeferredJobsToResolve, createConditionalDeferrer, resetUpdateWorkMode, } = (0, modeManager_1.createUpdateWorkModeManager)();
exports.composeMedama = ((layers, initState) => {
    const { addToQueue: addToStateQueue, processQueue: processStateQueue, resetQueue: resetStateQueue, } = (0, jobQueue_1.createJobQueue)();
    const { deferOrRun: addToStateQueueAndSubscribeOrRun, reset: resetStateQueueSubscription } = createConditionalDeferrer(addToStateQueue, processStateQueue);
    const initReset = () => {
        resetStateQueue();
        resetReadWorkMode();
        resetUpdateWorkMode();
        resetStateQueueSubscription();
    };
    initReset();
    const pupilRecords = (0, forEachOnOwnNumerableProps_1.forEachOnOwnNumerableProps)(layers, (key, layer) => [key, layer]);
    const pupilMap = Object.fromEntries(pupilRecords);
    initState != null &&
        pupilRecords.forEach(([key, { setState }]) => {
            key in initState && setState(initState[key]);
        });
    let selectorStore = new WeakMap();
    const readState = (compositeSelector) => {
        try {
            if (selectorStore.has(compositeSelector)) {
                const { getValue } = selectorStore.get(compositeSelector);
                return getValue();
            }
            const { processLayer, getSubscriptionMeans } = createLayerProcessorWithSubscriptionMeans();
            const isInitiator = !getReadWorkState();
            const calculateResultFromLayers = () => (0, traverseThroughPupils_1.traverseThroughPupils)(pupilRecords, processLayer, !isInitiator && getRequestSubscriptionMeansState()
                ? (combinedLayers) => {
                    combinedLayers[const_1._RELAY_SUBSCRIPTION_MEANS] =
                        getSubscriptionMeans();
                    return compositeSelector(combinedLayers);
                }
                : compositeSelector);
            if (isInitiator) {
                const selectorRecord = createSelectorRecord(calculateResultFromLayers, addToStateQueueAndSubscribeOrRun, getSubscriptionMeans);
                selectorStore.set(compositeSelector, selectorRecord);
                setSubscriptionMeansRequested();
                const { getValue } = selectorRecord;
                return getValue();
            }
            return calculateResultFromLayers();
        }
        catch (e) {
            initReset();
            throw e;
        }
    };
    const subscribeToState = (compositeSelector, subscription) => {
        try {
            readState(compositeSelector);
            let currentSelectorStoreRecord = selectorStore.get(compositeSelector);
            let unsubscribeHandle = null;
            let currentRevealedSubscriptionJob;
            const evaluateAndSubscribe = (subscriptionToReveal) => {
                startUpdating();
                const { addSubscription, getValue } = currentSelectorStoreRecord;
                const possibleSubscriptionJob = subscriptionToReveal(getValue());
                currentRevealedSubscriptionJob =
                    typeof possibleSubscriptionJob === 'function'
                        ? possibleSubscriptionJob
                        : subscriptionToReveal;
                unsubscribeHandle = addSubscription(currentRevealedSubscriptionJob);
                signalDeferredJobsToResolve();
            };
            evaluateAndSubscribe(subscription);
            const unsubscribe = () => {
                unsubscribeHandle === null || unsubscribeHandle === void 0 ? void 0 : unsubscribeHandle();
                unsubscribeHandle = null;
            };
            const resubscribe = (subscriptionToResubscribe) => {
                unsubscribe();
                evaluateAndSubscribe(subscriptionToResubscribe);
            };
            const transfer = (selectorToTransferTo) => {
                unsubscribe();
                readState(selectorToTransferTo);
                currentSelectorStoreRecord = selectorStore.get(selectorToTransferTo);
                evaluateAndSubscribe(currentRevealedSubscriptionJob);
            };
            return { unsubscribe, resubscribe, transfer };
        }
        catch (e) {
            initReset();
            throw e;
        }
    };
    const setState = (stateChange) => {
        try {
            const isUpdateInitiator = !getUpdateWorkState();
            startUpdating();
            const mergeToState = typeof stateChange === 'function' ? readState(stateChange) : stateChange;
            (0, forEachOnOwnNumerableProps_1.forEachOnOwnNumerableProps)(mergeToState, (key, toMerge) => {
                var _a;
                const { setState: setNestedState } = (_a = pupilMap[key]) !== null && _a !== void 0 ? _a : {};
                setNestedState === null || setNestedState === void 0 ? void 0 : setNestedState(toMerge);
            });
            return [mergeToState, isUpdateInitiator && signalDeferredJobsToResolve()][0];
        }
        catch (e) {
            initReset();
            throw e;
        }
    };
    const resetState = (initState) => {
        initReset();
        pupilRecords.forEach(([key, { resetState }]) => {
            resetState(initState === null || initState === void 0 ? void 0 : initState[key]);
        });
        selectorStore = new WeakMap();
    };
    const addLayers = (layersToAdd, initState) => (0, exports.composeMedama)(Object.assign(Object.assign({}, layers), layersToAdd), initState);
    const deleteLayers = (layersToDelete) => {
        const nextLayers = Object.assign({}, layers);
        (Array.isArray(layersToDelete) ? layersToDelete : [layersToDelete]).forEach((layerK) => {
            delete nextLayers[layerK];
        });
        return (0, exports.composeMedama)(nextLayers);
    };
    const pupil = {
        readState,
        subscribeToState,
        setState,
        resetState,
    };
    const toReturn = Object.assign(Object.assign({}, pupil), { pupil,
        addLayers,
        deleteLayers });
    return toReturn;
});
const createLayerProcessorWithSubscriptionMeans = () => {
    const subscriptionMeans = [];
    const processLayer = (key, layerState, subscribeToLayer, selectorIdentity, combinedLayers = Object.defineProperty(Object.create(null), const_1._COMPOSITE_STATE_SIGNATURE, {
        value: true,
    })) => {
        var _a;
        combinedLayers[key] = layerState;
        if (getRequestSubscriptionMeansState()) {
            if (const_1._RELAY_SUBSCRIPTION_MEANS in layerState) {
                (_a = layerState[const_1._RELAY_SUBSCRIPTION_MEANS]) === null || _a === void 0 ? void 0 : _a.forEach((chunk) => {
                    subscriptionMeans.push(chunk);
                });
                delete layerState[const_1._RELAY_SUBSCRIPTION_MEANS];
            }
            else {
                subscriptionMeans.push((subscription) => subscribeToLayer(selectorIdentity, subscription).unsubscribe);
            }
        }
        return combinedLayers;
    };
    const getSubscriptionMeans = () => subscriptionMeans;
    return { processLayer, getSubscriptionMeans };
};
const createSelectorRecord = (calculateResult, addToStateQueueAndSubscribeOrRun, getSubscriptionMeans) => {
    let unsubscribePoolFromLayers;
    let isRegistered = false;
    const registerTrigger = () => {
        if (isRegistered)
            return;
        const determineSubscriptionPoolExecution = () => {
            addToStateQueueAndSubscribeOrRun(selectorTrigger);
        };
        const unsubscribeChunks = getSubscriptionMeans().map((subscribeToLayer) => subscribeToLayer(() => determineSubscriptionPoolExecution));
        unsubscribePoolFromLayers = () => {
            unsubscribeChunks.forEach((unsubscribe) => {
                unsubscribe();
            });
        };
        isRegistered = true;
    };
    let memValue;
    let isToRecalculateValue = true;
    const runSelectorWithMemoization = () => {
        if (isToRecalculateValue) {
            runWithReadModeOn(() => {
                memValue = calculateResult();
            });
            isToRecalculateValue = false;
        }
    };
    const jobs = new Set();
    const selectorTrigger = () => {
        isToRecalculateValue = true;
        if (jobs.size === 0) {
            unsubscribePoolFromLayers();
            isRegistered = false;
            return;
        }
        runSelectorWithMemoization();
        jobs.forEach((job) => {
            job(memValue);
        });
    };
    const addSubscription = (subscriptionJob) => {
        jobs.add(subscriptionJob);
        return () => {
            jobs.delete(subscriptionJob);
        };
    };
    const getValue = () => {
        runSelectorWithMemoization();
        registerTrigger();
        return memValue;
    };
    return { addSubscription, getValue };
};
const isComposite = (state) => const_1._COMPOSITE_STATE_SIGNATURE in state;
exports.isComposite = isComposite;
//# sourceMappingURL=composeMedama.js.map