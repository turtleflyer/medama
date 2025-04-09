import type { ReadState, Selector, SetState } from 'medama';
import { useEffect, useState } from 'react';
import { useMedama, type MedamaReactHookOptions } from './useMedama';

export const useMedamaSelector = <State extends object, V>(
  selector: Selector<State, V>,
  options?: MedamaReactHookOptions<State>
): V => {
  const { readState, subscribeToState } = useMedama<State>(options);
  const [_, refresh] = useState<object>({});

  useEffect(
    () =>
      subscribeToState(selector, () => () => {
        refresh({});
      }).unsubscribe,

    /**
     * Dependencies ensure subscription is properly maintained when:
     * - selector changes (e.g., when selector is recreated or parameters
     *   change)
     * - subscribeToState changes (e.g., when different medama state is used)
     */
    [selector, subscribeToState]
  );

  return readState(selector);
};

export const useReadMedama = <State extends object>(
  options?: MedamaReactHookOptions<State>
): ReadState<State> => {
  const { readState } = useMedama<State>(options);

  return readState;
};

export const useUpdateMedama = <State extends object>(
  options?: MedamaReactHookOptions<State>
): SetState<State> => {
  const { setState } = useMedama<State>(options);

  return setState;
};
