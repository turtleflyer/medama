import { _COMPOSITE_STATE_SIGNATURE, _RELAY_SUBSCRIPTION_MEANS } from './const';
import { forEachOnOwnNumerableProps } from './forEachOnOwnNumerableProps';
import { createJobQueue } from './jobQueue';
import { createReadWorkModeManager, createUpdateWorkModeManager, } from './modeManager';
import { traverseThroughPupils } from './traverseThroughPupils';
const { getReadWorkState, runWithReadModeOn, setSubscriptionMeansRequested, getRequestSubscriptionMeansState, resetReadWorkMode, } = createReadWorkModeManager();
const { getUpdateWorkState, startUpdating, signalDeferredJobsToResolve, createDeferrer, getSubscribeToLayerWithSelector, resetUpdateWorkMode, } = createUpdateWorkModeManager();
export const composeMedama = ((layers, initState) => {
    const { addToQueue: addToStateQueue, processQueue: processStateQueue, resetQueue: resetStateQueue, } = createJobQueue();
    const { defer: addToStateQueueAndSubscribe, reset: resetStateQueueSubscription } = createDeferrer(addToStateQueue, processStateQueue);
    const initReset = () => {
        resetStateQueue();
        resetReadWorkMode();
        resetUpdateWorkMode();
        resetStateQueueSubscription();
    };
    initReset();
    const pupilRecords = forEachOnOwnNumerableProps(layers, (key, layer) => [key, layer]);
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
            const calculateResultFromLayers = () => traverseThroughPupils(pupilRecords, processLayer, !isInitiator && getRequestSubscriptionMeansState()
                ? (combinedLayers) => {
                    var _a;
                    combinedLayers[_RELAY_SUBSCRIPTION_MEANS] =
                        (_a = getSubscriptionMeans()) !== null && _a !== void 0 ? _a : [];
                    return compositeSelector(combinedLayers);
                }
                : compositeSelector);
            if (isInitiator) {
                const selectorRecord = createSelectorRecord(calculateResultFromLayers, addToStateQueueAndSubscribe, getSubscriptionMeans);
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
            forEachOnOwnNumerableProps(mergeToState, (key, toMerge) => {
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
    const addLayers = (layersToAdd, initState) => composeMedama(Object.assign(Object.create(null), layers, layersToAdd), initState);
    const deleteLayers = (layersToDelete) => {
        const nextLayers = Object.assign(Object.create(null), layers);
        (Array.isArray(layersToDelete) ? layersToDelete : [layersToDelete]).forEach((layerK) => {
            delete nextLayers[layerK];
        });
        return composeMedama(nextLayers);
    };
    const pupil = {
        readState,
        subscribeToState,
        setState,
        resetState,
        addLayers,
        deleteLayers,
    };
    return Object.assign(pupil, { pupil });
});
const createLayerProcessorWithSubscriptionMeans = () => {
    const subscriptionMeans = [];
    let neverRun = true;
    const processLayer = (key, layerState, subscribeToLayer, selectorIdentity, combinedLayers = Object.defineProperty(Object.create(null), _COMPOSITE_STATE_SIGNATURE, {
        value: true,
    })) => {
        var _a;
        neverRun = false;
        combinedLayers[key] = layerState;
        if (getRequestSubscriptionMeansState()) {
            if (_RELAY_SUBSCRIPTION_MEANS in layerState) {
                (_a = layerState[_RELAY_SUBSCRIPTION_MEANS]) === null || _a === void 0 ? void 0 : _a.forEach((chunk) => {
                    subscriptionMeans.push(chunk);
                });
                delete layerState[_RELAY_SUBSCRIPTION_MEANS];
            }
            else {
                subscriptionMeans.push({ subscribeToLayer, layerSelector: selectorIdentity });
            }
        }
        return combinedLayers;
    };
    const getSubscriptionMeans = () => neverRun ? undefined : subscriptionMeans;
    return { processLayer, getSubscriptionMeans };
};
const createSelectorRecord = (calculateResult, addToStateQueueAndSubscribeOrRun, getSubscriptionMeans) => {
    let unsubscribePoolFromLayers;
    let isRegistered = false;
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
    let isToAddValue = false;
    const immediateTask = () => {
        if (isToRecalculateValue)
            return;
        isToRecalculateValue = true;
        isToAddValue = true;
    };
    const jobs = new Set();
    const selectorTrigger = {
        trigger: () => {
            if (jobs.size === 0) {
                unsubscribePoolFromLayers();
                return;
            }
            runSelectorWithMemoization();
            jobs.forEach((job) => {
                job(memValue);
            });
        },
        isToAdd: () => [isToAddValue, (isToAddValue = false)][0],
    };
    let subscribeMethodsCached = undefined;
    const registerTrigger = () => {
        var _a, _b;
        if (isRegistered)
            return;
        const layerTriggerSubscription = () => {
            addToStateQueueAndSubscribeOrRun(immediateTask, selectorTrigger);
        };
        subscribeMethodsCached !== null && subscribeMethodsCached !== void 0 ? subscribeMethodsCached : (subscribeMethodsCached = (_a = getSubscriptionMeans()) === null || _a === void 0 ? void 0 : _a.map(({ subscribeToLayer, layerSelector }) => getSubscribeToLayerWithSelector(subscribeToLayer, layerSelector)));
        const unsubscribeChunks = (_b = subscribeMethodsCached === null || subscribeMethodsCached === void 0 ? void 0 : subscribeMethodsCached.map((subscribeToLayerWithSelector) => subscribeToLayerWithSelector(layerTriggerSubscription))) !== null && _b !== void 0 ? _b : [];
        unsubscribePoolFromLayers = () => {
            if (!isRegistered)
                return;
            unsubscribeChunks.forEach((unsubscribe) => {
                unsubscribe();
            });
            isRegistered = false;
        };
        isRegistered = true;
    };
    const getValue = () => {
        runSelectorWithMemoization();
        registerTrigger();
        return memValue;
    };
    const addSubscription = (subscriptionJob) => {
        jobs.add(subscriptionJob);
        return () => {
            jobs.delete(subscriptionJob);
        };
    };
    return { addSubscription, getValue };
};
export const isComposite = (state) => _COMPOSITE_STATE_SIGNATURE in state;
//# sourceMappingURL=composeMedama.js.map