export const traverseThroughPupils = (pupilRecords, processLayer, final) => {
    let i = 0;
    let selectorToSeal = false;
    let acc;
    const stepLogic = () => {
        const nextPupilWithKey = pupilRecords[i++];
        const [, { readState }] = nextPupilWithKey;
        const nextStep = createStep(...nextPupilWithKey);
        return readState(nextStep);
    };
    const createStep = (key, { subscribeToState }) => {
        const stepEmitted = (state) => {
            if (selectorToSeal)
                return undefined;
            acc = processLayer(key, state, subscribeToState, stepEmitted, acc);
            if (i < pupilRecords.length)
                return stepLogic();
            selectorToSeal = true;
            return final(acc);
        };
        return stepEmitted;
    };
    return stepLogic();
};
//# sourceMappingURL=traverseThroughPupils.js.map