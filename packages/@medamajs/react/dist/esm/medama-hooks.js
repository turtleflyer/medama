import { useEffect, useState } from 'react';
import { useMedama } from './useMedama';
export const useMedamaSelector = (selector, options) => {
    const { readState, subscribeToState } = useMedama(options);
    const [_, refresh] = useState({});
    useEffect(() => subscribeToState(selector, () => () => {
        refresh({});
    }).unsubscribe, [selector, subscribeToState]);
    return readState(selector);
};
export const useReadMedama = (options) => {
    const { readState } = useMedama(options);
    return readState;
};
export const useUpdateMedama = (options) => {
    const { setState } = useMedama(options);
    return setState;
};
//# sourceMappingURL=medama-hooks.js.map