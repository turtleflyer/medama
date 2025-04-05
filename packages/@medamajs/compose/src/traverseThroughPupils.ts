import type { Pupil, SubscribeToState } from 'medama';
import type { CStateG } from './auxiliaryTypes';

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
export const traverseThroughPupils = <CS extends CStateG, Acc, R>(
  pupilRecords: [keyof CS, Pupil<CS[keyof CS]>][],

  processLayer: (
    key: keyof CS,
    layerState: CS[keyof CS],
    subscribeToState: SubscribeToState<CS[keyof CS]>,
    selectorIdentity: (state: CS[keyof CS]) => void,
    acc?: Acc
  ) => Acc,

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

  const createStep = (key: keyof CS, { subscribeToState }: Pupil<CS[keyof CS]>) => {
    const stepEmitted = (state: CS[keyof CS]): R => {
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
