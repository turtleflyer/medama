"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveWithUpdateRequest = void 0;
const retrieveWithUpdateRequest = (retrieverCallback) => {
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
exports.retrieveWithUpdateRequest = retrieveWithUpdateRequest;
//# sourceMappingURL=retrieveWithUpdateRequest.js.map