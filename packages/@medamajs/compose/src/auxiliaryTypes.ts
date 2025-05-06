import type { Pupil } from 'medama';
import type { _COMPOSITE_STATE_SIGNATURE } from './const';
import type { Normalize } from './type-helpers/Normalize';

/**
 * Base generic state type that represents a record of states.
 * Each key in the record maps to an object that represents a state.
 * Used as a constraint for composite state structures where keys can be strings, numbers, or symbols.
 */
export type CStateG = Record<string | number | symbol, object>;

/**
 * Represents a composite state that extends a base state type with a signature marker.
 *
 * @template State - The base state type that extends CStateG
 * @returns A type that combines the original state with a composite state signature property
 */
export type CompositeState<State extends CStateG> = State & {
  [_COMPOSITE_STATE_SIGNATURE]?: true;
};

/**
 * Type guard that checks if a given type is a composite state.
 * Returns true if the type has the composite state signature property, false otherwise.
 *
 * @template T - The type to check for composite state signature
 */
export type IsCompositeState<T> = true extends T[typeof _COMPOSITE_STATE_SIGNATURE & keyof T]
  ? true
  : false;

/**
 * Recursively reveals all layers in a composite state structure by making them optional.
 * For composite states, it removes the signature and continues recursion.
 * For non-composite states, it makes the properties partial.
 *
 * @template State - The composite state structure extending CStateG
 */
export type RevealLayersInStateRecursively<State extends CStateG> = {
  [K in keyof State]?: IsCompositeState<State[K]> extends true
    ? Omit<State[K], typeof _COMPOSITE_STATE_SIGNATURE> extends infer O
      ? O extends CStateG
        ? RevealLayersInStateRecursively<O>
        : Partial<O>
      : never
    : Partial<State[K]>;
};

/**
 * Recursively processes object properties for Pupil type transformations.
 * For composite states, recursively processes all nested object properties.
 * For non-composite states, makes properties partial unless it's the first run.
 *
 * @template T - The object type to process
 * @template FR - First run flag, defaults to true. Determines if properties should be made partial
 */
type RevealLayersInPupilsRecursively<T extends object, FR = true> =
  IsCompositeState<T> extends true
    ? {
        [K in keyof T]: T[K] extends object ? RevealLayersInPupilsRecursively<T[K], false> : T[K];
      }
    : FR extends true
      ? T
      : Partial<T>;

/**
 * Creates a mapped type where each key from the state maps to a Pupil type.
 * Used in ComposeMedama and AddLayers overload resolution to require explicit generic type parameters.
 * Returns never when State is widest possible (CStateG), which directly indicates
 * the overload is being used with type inference instead of explicit type declaration.
 * This prevents these overloads from being selected in inference scenarios.
 *
 * @template State - The state structure extending CStateG that must be explicitly specified
 */
export type LayerPupilsPreventInference<State extends CStateG> = CStateG extends State
  ? never
  : {
      [K in keyof State]: Pupil<RevealLayersInPupilsRecursively<State[K]>>;
    };

/**
 * Creates a mapped type where each key from the state maps to a Pupil type.
 * Converts a state structure into a corresponding structure of Pupil types.
 * Used for basic layer creation without inference prevention.
 *
 * @template State - The state structure extending CStateG
 */
export type LayerPupils<State extends CStateG> = {
  [K in keyof State]: Pupil<State[K]>;
};

/**
 * Extends numeric keys with their string literal equivalents.
 * Needed because TypeScript sometimes converts numeric keys to strings during type inference,
 * which can break type compatibility with objects that use numeric keys.
 * Example: 1 becomes union of number 1 | "1"
 *
 * @template K - The type containing numeric keys
 */
export type ExtendedWithStringAliases<K> = K | `${K & number}`;

/**
 * Helps maintain type compatibility when numeric keys are converted to strings.
 * Used in merge operations where TypeScript inference might convert numeric keys to strings,
 * ensuring the types still match the original object shape with numeric keys.
 *
 * @template K - The original key type (typically numeric)
 * @template SA - The potentially converted key type to check against
 */
export type PickOriginalNumericKeys<K, SA> = K extends K
  ? SA extends ExtendedWithStringAliases<K>
    ? K
    : never
  : never;

/**
 * Recursively merges two types while maintaining type compatibility.
 * Performs a deep merge while:
 * - Maintaining original numeric keys even if they were converted to strings
 * - Preserving composite state signatures in the merged result
 * - Preventing merges with ambiguous first type (like 'object') that would discard source structure
 *
 * @template T1 - Source type to merge into
 * @template T2 - Type being merged
 */
type MergeRecursively<T1, T2> = T1 extends object
  ? (
      object extends T1
        ? T2
        : {
            [K in Exclude<
              keyof T1,
              typeof _COMPOSITE_STATE_SIGNATURE
            >]: K extends ExtendedWithStringAliases<keyof T2>
              ? MergeRecursively<T1[K], T2[PickOriginalNumericKeys<keyof T2, K>]>
              : T1[K];
          }
    ) extends infer R
    ? IsCompositeState<T1> extends true
      ? R extends CStateG
        ? CompositeState<R>
        : R
      : R
    : never
  : T1;

/**
 * Merges two state structures while preserving type integrity.
 * Handles numeric key compatibility and maintains composite state signatures.
 * Normalizes the result to clean up internal type machinery.
 *
 * @template S - Source state structure
 * @template M - State structure to merge, must have matching keys with S
 */
export type Merge<S, M extends { [K in keyof S]: unknown }> = Normalize<{
  [K in keyof S]: K extends ExtendedWithStringAliases<keyof M>
    ? MergeRecursively<S[K], M[K]> extends infer MR
      ? MR extends object
        ? MR
        : never
      : never
    : S[K];
}>;
