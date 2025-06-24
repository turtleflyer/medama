import type { ReadState, SubscribeToState } from 'medama';
import type {
  CompositeState,
  CStateG,
  ExtendedWithStringAliases,
  LayerPupils,
  LayerPupilsPreventInference,
  Merge,
  PickOriginalNumericKeys,
  RevealLayersInStateRecursively,
} from './auxiliaryTypes';
import type { Normalize } from './type-helpers/Normalize';

/**
 * Function to create partial state update for composite state.
 * Used in setState to generate changes based on current values.
 *
 * @template State The type of composite state object
 * @template SChange The type of changes to apply to layers
 */
export type SetterForCompositeState<
  State extends CStateG,
  SChange extends RevealLayersInStateRecursively<State>,
> = (state: State) => SChange;

/**
 * Function to update composite state with partial changes.
 * Accepts either direct state changes or setter function.
 *
 * @template State The type of composite state object
 */
export type SetCompositeState<State extends CStateG> = <
  SChange extends RevealLayersInStateRecursively<State>,
>(
  stateChange: SChange | SetterForCompositeState<State, SChange>
) => SChange;

/**
 * Function to reset composite state to initial values.
 * Optionally accepts new initial state for layers.
 *
 * @template State The type of composite state object
 */
export type ResetCompositeState<State extends CStateG> = (
  initState?: RevealLayersInStateRecursively<State>
) => void;

/**
 * Function to create new composite state with additional layers.
 * Returns new instance combining existing and new layers.
 * Supports both complete and partial initial state for new layers.
 *
 * @template State The current composite state type
 */
export type AddLayers<State extends CStateG> = {
  <AddedState extends CStateG, Init extends RevealLayersInStateRecursively<State & AddedState>>(
    layers: LayerPupils<AddedState>,
    initState?: Init
  ): Normalize<CompositeMedama<Normalize<State & Merge<AddedState, Init>>>>;

  /**
   * Overload that requires explicit generic AddedState parameter.
   * Prevents type inference from arguments to ensure type safety.
   */
  <AddedState extends CStateG>(
    layers: LayerPupilsPreventInference<AddedState>,
    initState?: RevealLayersInStateRecursively<State & AddedState>
  ): Normalize<CompositeMedama<Normalize<State & AddedState>>>;
};

/**
 * Function to create new composite state without specified layers.
 * Returns new instance excluding requested layers.
 * Accepts either single layer key or array of keys.
 *
 * @template State The current composite state type
 * @template K The type of layer keys to exclude
 */
export type DeleteLayers<State extends CStateG> = <K extends string | number | symbol>(
  layersToDelete:
    | PickOriginalNumericKeys<K, keyof State>
    | (K[] & PickOriginalNumericKeys<K, keyof State>[])
) => Normalize<CompositeMedama<Normalize<Omit<State, ExtendedWithStringAliases<K>>>>>;

/**
 * Core interface for interacting with composite state.
 * Extends basic state operations to work with layered state structure.
 *
 * @template State The type of composite state object
 */
export type CompositePupil<State extends CStateG> = {
  /**
   * Function to create subscription for selector value changes.
   * Runs subscription function during initial setup.
   * Returns methods to manage subscription lifecycle.
   */
  subscribeToState: SubscribeToState<CompositeState<State>>;

  /**
   * Function to read current value from state using selector.
   * Returns memoized result if dependencies haven't changed.
   */
  readState: ReadState<CompositeState<State>>;

  /**
   * Function to update composite state with partial changes.
   * Accepts either direct state changes or setter function.
   */
  setState: SetCompositeState<CompositeState<State>>;

  /**
   * Function to reset composite state to initial values.
   * Optionally accepts new initial state for layers.
   */
  resetState: ResetCompositeState<CompositeState<State>>;
};

/**
 * Extended interface for composite state management.
 * Adds layer manipulation methods on top of basic state operations.
 *
 * @template State The type of composite state object
 */
export type CompositeMedama<State extends CStateG> = CompositePupil<State> & {
  /**
   * Core interface for interacting with composite state.
   * Extends basic state operations to work with layered state structure.
   */
  pupil: CompositePupil<State>;

  /**
   * Function to create new composite state with additional layers.
   * Returns new instance combining existing and new layers.
   * Supports both complete and partial initial state for new layers.
   */
  addLayers: AddLayers<State>;

  /**
   * Function to create new composite state without specified layers.
   * Returns new instance excluding requested layers.
   * Accepts either single layer key or array of keys.
   */
  deleteLayers: DeleteLayers<State>;
};

/**
 * Factory function type for creating composite state instances.
 * Supports both complete and partial initial state for layers.
 *
 * @template State The type of composite state to be created
 * @template Init The type of initial state values
 */
export type ComposeMedama = {
  <State extends CStateG, Init extends RevealLayersInStateRecursively<State>>(
    layers: LayerPupils<State>,
    initState?: Init
  ): Normalize<CompositeMedama<Merge<State, Init>>>;

  /**
   * Overload that requires explicit generic State parameter.
   * Prevents type inference from arguments to ensure type safety.
   */
  <State extends CStateG>(
    layers: LayerPupilsPreventInference<State>,
    initState?: RevealLayersInStateRecursively<State>
  ): Normalize<CompositeMedama<State>>;
};

/**
 * Type guard to check if a state object is composite.
 * Used to ensure type safety when working with layered state.
 *
 * @template State The type of state object to check
 */
export type IsComposite = <State extends object>(
  state: State
) => state is CompositeState<State & CStateG>;

export type { CompositeState };
