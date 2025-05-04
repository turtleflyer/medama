import { _COMPOSITE_STATE_SIGNATURE, _RELAY_SUBSCRIPTION_MEANS } from './const';
import { forEachOnOwnNumerableProps } from './forEachOnOwnNumerableProps';
import { createJobQueue } from './jobQueue';
import { createReadWorkModeManager, createUpdateWorkModeManager, } from './modeManager';
import { traverseThroughPupils } from './traverseThroughPupils';
const { getReadWorkState, runWithReadModeOn, setSubscriptionMeansRequested, getRequestSubscriptionMeansState, resetReadWorkMode, } = createReadWorkModeManager();
const { getUpdateWorkState, startUpdating, signalDeferredJobsToResolve, createConditionalDeferrer, resetUpdateWorkMode, } = createUpdateWorkModeManager();
export const composeMedama = ((layers, initState) => {
    const { addToQueue: addToStateQueue, processQueue: processStateQueue, resetQueue: resetStateQueue, } = createJobQueue();
    const { deferOrRun: addToStateQueueAndSubscribeOrRun, reset: resetStateQueueSubscription } = createConditionalDeferrer(addToStateQueue, processStateQueue);
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
                    combinedLayers[_RELAY_SUBSCRIPTION_MEANS] =
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
            let unsubscribeHandle = null;
            let currentRevealedSubscriptionJob;
            const evaluateAndSubscribe = (subscriptionToReveal) => {
                startUpdating();
                const { addSubscription, getValue } = selectorStore.get(compositeSelector);
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
            return { unsubscribe, resubscribe };
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
    const addLayers = (layersToAdd, initState) => composeMedama(Object.assign(Object.assign({}, layers), layersToAdd), initState);
    const deleteLayers = (layersToDelete) => {
        const nextLayers = Object.assign({}, layers);
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
    };
    const toReturn = Object.assign(Object.assign({}, pupil), { pupil,
        addLayers,
        deleteLayers });
    return toReturn;
});
const createLayerProcessorWithSubscriptionMeans = () => {
    const subscriptionMeans = [];
    const processLayer = (key, layerState, subscribeToLayer, selectorIdentity, combinedLayers = Object.defineProperty(Object.create(null), _COMPOSITE_STATE_SIGNATURE, {
        value: true,
    })) => {
        var _a;
        combinedLayers[key] = layerState;
        if (getRequestSubscriptionMeansState()) {
            if (_RELAY_SUBSCRIPTION_MEANS in layerState) {
                (_a = layerState[_RELAY_SUBSCRIPTION_MEANS]) === null || _a === void 0 ? void 0 : _a.forEach((chunk) => {
                    subscriptionMeans.push(chunk);
                });
                delete layerState[_RELAY_SUBSCRIPTION_MEANS];
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
export const isComposite = (state) => _COMPOSITE_STATE_SIGNATURE in state;
//# sourceMappingURL=composeMedama.js.map