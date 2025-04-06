import { _COMPOSITE_STATE_SIGNATURE, _RELAY_SUBSCRIPTION_MEANS } from './const';
import { forEachOnOwnNumerableProps } from './forEachOnOwnNumerableProps';
import { createJobQueue } from './jobQueue';
import { createReadWorkModeManager, createUpdateWorkModeManager } from './modeManager';
import { retrieveWithUpdateRequest } from './retrieveWithUpdateRequest';
import { traverseThroughPupils } from './traverseThroughPupils';
const { getReadWorkState, startReading, finishReading, setSubscriptionMeansRequested, getRequestSubscriptionMeansState, resetReadWorkMode, } = createReadWorkModeManager();
const { getUpdateWorkState, startUpdating, signalDeferredJobsToResolve, createConditionalDeferrer, resetUpdateWorkMode, } = createUpdateWorkModeManager();
const composeMedama = (layers, initState) => {
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
            const { processLayer, getSubscriptionMeans } = createLayerProcessorWithSubscriptionMeans();
            const isInitiator = !getReadWorkState();
            const getResult = () => traverseThroughPupils(pupilRecords, processLayer, !isInitiator && getRequestSubscriptionMeansState()
                ? (combinedLayers) => {
                    combinedLayers[_RELAY_SUBSCRIPTION_MEANS] =
                        getSubscriptionMeans();
                    return compositeSelector(combinedLayers);
                }
                : compositeSelector);
            if (isInitiator) {
                if (!selectorStore.has(compositeSelector)) {
                    const addJobToSubscriptionPool = createAddJobToSubscriptionPoolMethod(addToStateQueueAndSubscribeOrRun, getSubscriptionMeans);
                    const { retrieve: getSelectorResult, requestUpdate } = retrieveWithUpdateRequest(() => {
                        startReading();
                        return [getResult(), finishReading(), addJobToSubscriptionPool(requestUpdate)][0];
                    });
                    const subscribeJobToSelector = (subscriptionJob) => {
                        const jobToAdd = () => {
                            subscriptionJob(getSelectorResult());
                        };
                        return addJobToSubscriptionPool(jobToAdd);
                    };
                    selectorStore.set(compositeSelector, {
                        subscribe: subscribeJobToSelector,
                        read: getSelectorResult,
                    });
                    setSubscriptionMeansRequested();
                }
                const { read } = selectorStore.get(compositeSelector);
                return read();
            }
            return getResult();
        }
        catch (e) {
            initReset();
            throw e;
        }
    };
    const subscribeToState = (compositeSelector, subscription) => {
        try {
            readState(compositeSelector);
            const { subscribe, read } = selectorStore.get(compositeSelector);
            const subscribeEvaluatedSubscription = (subscriptionToEvaluate) => {
                startUpdating();
                const possibleSubscriptionJob = subscriptionToEvaluate(read());
                return [
                    subscribe(typeof possibleSubscriptionJob === 'function'
                        ? possibleSubscriptionJob
                        : subscriptionToEvaluate),
                    signalDeferredJobsToResolve(),
                ][0];
            };
            let unsubscribeHandle = subscribeEvaluatedSubscription(subscription);
            return {
                unsubscribe: () => {
                    unsubscribeHandle === null || unsubscribeHandle === void 0 ? void 0 : unsubscribeHandle();
                    unsubscribeHandle = null;
                },
                resubscribe: (subscriptionToEvaluate) => {
                    unsubscribeHandle === null || unsubscribeHandle === void 0 ? void 0 : unsubscribeHandle();
                    unsubscribeHandle = subscribeEvaluatedSubscription(subscriptionToEvaluate);
                },
            };
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
};
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
const createAddJobToSubscriptionPoolMethod = (addToStateQueueAndSubscribeOrRun, getSubscriptionMeans) => {
    let isPoolSubscriptionActive = false;
    let unsubscribePoolFromLayers;
    const subscriptionPool = new Set();
    const runSubscriptionPool = () => {
        subscriptionPool.forEach((piece) => {
            piece();
        });
        if (subscriptionPool.size === 1) {
            unsubscribePoolFromLayers();
            isPoolSubscriptionActive = false;
        }
    };
    const keepSubscriptionConsistent = () => {
        if (isPoolSubscriptionActive)
            return;
        const determineSubscriptionPoolExecution = () => {
            addToStateQueueAndSubscribeOrRun(runSubscriptionPool);
        };
        const unsubscribeChunks = getSubscriptionMeans().map((subscribeToLayer) => subscribeToLayer(() => determineSubscriptionPoolExecution));
        unsubscribePoolFromLayers = () => {
            unsubscribeChunks.forEach((unsubscribe) => {
                unsubscribe();
            });
        };
        isPoolSubscriptionActive = true;
    };
    const addJobToSubscriptionPool = (job) => {
        subscriptionPool.add(job);
        keepSubscriptionConsistent();
        return () => {
            subscriptionPool.delete(job);
        };
    };
    return addJobToSubscriptionPool;
};
export const isComposite = (state) => _COMPOSITE_STATE_SIGNATURE in state;
const _composeMedama = composeMedama;
export { _composeMedama as composeMedama };
//# sourceMappingURL=composeMedama.js.map