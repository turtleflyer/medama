export const retrieveWithUpdateRequest = (retrieverCallback) => {
    let isToUpdate = true;
    let memValue;
    const retrieve = () => {
        if (isToUpdate) {
            memValue = retrieverCallback();
            isToUpdate = false;
        }
        return memValue;
    };
    const requestUpdate = () => {
        isToUpdate = true;
    };
    return {
        retrieve,
        requestUpdate,
    };
};
//# sourceMappingURL=retrieveWithUpdateRequest.js.map