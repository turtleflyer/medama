import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
export const pupilProviderContext = createContext({});
const { Provider: PupilProvider } = pupilProviderContext;
export const ProvideMedama = ({ pupil, id, children, }) => {
    const valueFromProviderNextInChain = useContext(pupilProviderContext);
    const valueToProvide = useMemo(() => ({
        pupil,
        id,
        lookUp: (idToLookUp) => {
            var _a;
            return valueFromProviderNextInChain.id === idToLookUp
                ? valueFromProviderNextInChain
                : (_a = valueFromProviderNextInChain.lookUp) === null || _a === void 0 ? void 0 : _a.call(valueFromProviderNextInChain, idToLookUp);
        },
    }), [pupil, id, valueFromProviderNextInChain]);
    return _jsx(PupilProvider, { value: valueToProvide, children });
};
//# sourceMappingURL=ProvideMedama.js.map