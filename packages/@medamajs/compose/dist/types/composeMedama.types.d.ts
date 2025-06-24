import type { ReadState, SubscribeToState } from 'medama';
import type { CompositeState, CStateG, ExtendedWithStringAliases, LayerPupils, LayerPupilsPreventInference, Merge, PickOriginalNumericKeys, RevealLayersInStateRecursively } from './auxiliaryTypes';
import type { Normalize } from './type-helpers/Normalize';
export type SetterForCompositeState<State extends CStateG, SChange extends RevealLayersInStateRecursively<State>> = (state: State) => SChange;
export type SetCompositeState<State extends CStateG> = <SChange extends RevealLayersInStateRecursively<State>>(stateChange: SChange | SetterForCompositeState<State, SChange>) => SChange;
export type ResetCompositeState<State extends CStateG> = (initState?: RevealLayersInStateRecursively<State>) => void;
export type AddLayers<State extends CStateG> = {
    <AddedState extends CStateG, Init extends RevealLayersInStateRecursively<State & AddedState>>(layers: LayerPupils<AddedState>, initState?: Init): Normalize<CompositeMedama<Normalize<State & Merge<AddedState, Init>>>>;
    <AddedState extends CStateG>(layers: LayerPupilsPreventInference<AddedState>, initState?: RevealLayersInStateRecursively<State & AddedState>): Normalize<CompositeMedama<Normalize<State & AddedState>>>;
};
export type DeleteLayers<State extends CStateG> = <K extends string | number | symbol>(layersToDelete: PickOriginalNumericKeys<K, keyof State> | (K[] & PickOriginalNumericKeys<K, keyof State>[])) => Normalize<CompositeMedama<Normalize<Omit<State, ExtendedWithStringAliases<K>>>>>;
export type CompositePupil<State extends CStateG> = {
    subscribeToState: SubscribeToState<CompositeState<State>>;
    readState: ReadState<CompositeState<State>>;
    setState: SetCompositeState<CompositeState<State>>;
    resetState: ResetCompositeState<CompositeState<State>>;
};
export type CompositeMedama<State extends CStateG> = CompositePupil<State> & {
    pupil: CompositePupil<State>;
    addLayers: AddLayers<State>;
    deleteLayers: DeleteLayers<State>;
};
export type ComposeMedama = {
    <State extends CStateG, Init extends RevealLayersInStateRecursively<State>>(layers: LayerPupils<State>, initState?: Init): Normalize<CompositeMedama<Merge<State, Init>>>;
    <State extends CStateG>(layers: LayerPupilsPreventInference<State>, initState?: RevealLayersInStateRecursively<State>): Normalize<CompositeMedama<State>>;
};
export type IsComposite = <State extends object>(state: State) => state is CompositeState<State & CStateG>;
export type { CompositeState };
//# sourceMappingURL=composeMedama.types.d.ts.map