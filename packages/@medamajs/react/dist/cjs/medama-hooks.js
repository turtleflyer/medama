"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUpdateMedama = exports.useReadMedama = exports.useMedamaSelector = void 0;
const react_1 = require("react");
const useMedama_1 = require("./useMedama");
const useMedamaSelector = (selector, options) => {
    const { readState, subscribeToState } = (0, useMedama_1.useMedama)(options);
    const [_, refresh] = (0, react_1.useState)({});
    (0, react_1.useEffect)(() => subscribeToState(selector, () => () => {
        refresh({});
    }).unsubscribe, [selector, subscribeToState]);
    return readState(selector);
};
exports.useMedamaSelector = useMedamaSelector;
const useReadMedama = (options) => {
    const { readState } = (0, useMedama_1.useMedama)(options);
    return readState;
};
exports.useReadMedama = useReadMedama;
const useUpdateMedama = (options) => {
    const { setState } = (0, useMedama_1.useMedama)(options);
    return setState;
};
exports.useUpdateMedama = useUpdateMedama;
//# sourceMappingURL=medama-hooks.js.map