"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvideMedama = exports.pupilProviderContext = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
exports.pupilProviderContext = (0, react_1.createContext)({});
const { Provider: PupilProvider } = exports.pupilProviderContext;
const ProvideMedama = ({ pupil, id, children, }) => {
    const valueFromProviderNextInChain = (0, react_1.useContext)(exports.pupilProviderContext);
    const valueToProvide = (0, react_1.useMemo)(() => ({
        pupil,
        id,
        lookUp: (idToLookUp) => {
            var _a;
            return valueFromProviderNextInChain.id === idToLookUp
                ? valueFromProviderNextInChain
                : (_a = valueFromProviderNextInChain.lookUp) === null || _a === void 0 ? void 0 : _a.call(valueFromProviderNextInChain, idToLookUp);
        },
    }), [pupil, id, valueFromProviderNextInChain]);
    return (0, jsx_runtime_1.jsx)(PupilProvider, { value: valueToProvide, children });
};
exports.ProvideMedama = ProvideMedama;
//# sourceMappingURL=ProvideMedama.js.map