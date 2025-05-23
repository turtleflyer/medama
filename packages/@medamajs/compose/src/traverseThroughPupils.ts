import type { Pupil, SubscribeToState } from 'medama';
import type { CStateG } from './auxiliaryTypes';

export type ProcessLayer<State extends CStateG, Acc> = (
  key: keyof State,
  layerState: State[keyof State],
  subscribeToState: SubscribeToState<State[keyof State]>,
  selectorIdentity: (state: State[keyof State]) => void,
  acc?: Acc
) => Acc;

/**
 * Higher-order function similar to Array.reduce but specialized for traversing
 * nested states. Key features:
 *
 * 1. Sequential processing: Iterates through pupil records, allowing custom
 *    processing via processLayer
 * 2. Final transform: Applies final operation to accumulated result
 * 3. Selector sealing: Prevents re-evaluation of emitted steps when triggered
 *    as a selector in subscription events
 *
 * @param pupilRecords Array of tuples containing state keys and associated
 * pupils
 * @param processLayer Function to process each layer (can accumulate state,
 * handle subscriptions, etc.)
 * @param final Function to transform accumulated result into final value
 * @returns Result of applying final function to accumulated value
 */
export const traverseThroughPupils = <State extends CStateG, Acc, R>(
  pupilRecords: [keyof State, Pupil<State[keyof State]>][],

  processLayer: ProcessLayer<State, Acc>,

  final: (acc: Acc) => R
): R => {
  let i = 0;
  let selectorToSeal = false;
  let acc: Acc | undefined;

  const stepLogic = () => {
    const nextPupilWithKey = pupilRecords[i++];
    const [, { readState }] = nextPupilWithKey;
    const nextStep = createStep(...nextPupilWithKey);

    return readState(nextStep);
  };

  const createStep = (key: keyof State, { subscribeToState }: Pupil<State[keyof State]>) => {
    const stepEmitted = (state: State[keyof State]): R => {
      if (selectorToSeal) return undefined as R;

      acc = processLayer(key, state, subscribeToState, stepEmitted, acc);

      if (i < pupilRecords.length) return stepLogic();

      selectorToSeal = true;

      return final(acc);
    };

    return stepEmitted;
  };

  return stepLogic();
};
