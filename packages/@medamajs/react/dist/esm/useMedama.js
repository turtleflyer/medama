import { useContext, useMemo } from 'react';
import { pupilProviderContext } from './ProvideMedama';
export const useMedama = ({ pupil: pupilIfProvided, id, } = {}) => {
    const contextValue = useContext(pupilProviderContext);
    const pupil = useMemo(() => {
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
//# sourceMappingURL=useMedama.js.map