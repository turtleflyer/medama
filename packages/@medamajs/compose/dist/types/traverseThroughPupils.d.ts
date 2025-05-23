import type { Pupil, SubscribeToState } from 'medama';
import type { CStateG } from './auxiliaryTypes';
export type ProcessLayer<State extends CStateG, Acc> = (key: keyof State, layerState: State[keyof State], subscribeToState: SubscribeToState<State[keyof State]>, selectorIdentity: (state: State[keyof State]) => void, acc?: Acc) => Acc;
export declare const traverseThroughPupils: <State extends CStateG, Acc, R>(pupilRecords: [keyof State, Pupil<State[keyof State]>][], processLayer: ProcessLayer<State, Acc>, final: (acc: Acc) => R) => R;
//# sourceMappingURL=traverseThroughPupils.d.ts.map