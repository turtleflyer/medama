"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMedama = void 0;
const react_1 = require("react");
const ProvideMedama_1 = require("./ProvideMedama");
const useMedama = ({ pupil: pupilIfProvided, id, } = {}) => {
    const contextValue = (0, react_1.useContext)(ProvideMedama_1.pupilProviderContext);
    const pupil = (0, react_1.useMemo)(() => {
        var _a, _b;
        if (pupilIfProvided)
            return pupilIfProvided;
        const { pupil: pupilFromContext } = id == null || id === contextValue.id ? contextValue : ((_b = (_a = contextValue.lookUp) === null || _a === void 0 ? void 0 : _a.call(contextValue, id)) !== null && _b !== void 0 ? _b : {});
        return pupilFromContext;
    }, [pupilIfProvided, id, contextValue]);
    if (pupil == null)
        throw new Error('Medama Error: ProvideMedama component must be initialized up in component tree');
    return pupil;
};
exports.useMedama = useMedama;
//# sourceMappingURL=useMedama.js.map