import type { Pupil, SubscribeToState } from 'medama';
import type { CStateG } from './auxiliaryTypes';
export declare const traverseThroughPupils: <CS extends CStateG, Acc, R>(pupilRecords: [keyof CS, Pupil<CS[keyof CS]>][], processLayer: (key: keyof CS, layerState: CS[keyof CS], subscribeToState: SubscribeToState<CS[keyof CS]>, selectorIdentity: (state: CS[keyof CS]) => void, acc?: Acc) => Acc, final: (acc: Acc) => R) => R;
//# sourceMappingURL=traverseThroughPupils.d.ts.map