import type { Pupil } from 'medama';
import type { _COMPOSITE_STATE_SIGNATURE } from './const';
import type { Normalize } from './type-helpers/Normalize';
export type CStateG = Record<string | number | symbol, object>;
export type CompositeState<State extends CStateG> = State & {
    [_COMPOSITE_STATE_SIGNATURE]?: true;
};
export type IsCompositeState<T> = true extends T[typeof _COMPOSITE_STATE_SIGNATURE & keyof T] ? true : false;
export type RevealLayersInStateRecursively<State extends CStateG> = {
    [K in keyof State]?: IsCompositeState<State[K]> extends true ? Omit<State[K], typeof _COMPOSITE_STATE_SIGNATURE> extends infer O ? O extends CStateG ? RevealLayersInStateRecursively<O> : Partial<O> : never : Partial<State[K]>;
};
type RevealLayersInPupilsRecursively<T extends object, FR = true> = IsCompositeState<T> extends true ? {
    [K in keyof T]: T[K] extends object ? RevealLayersInPupilsRecursively<T[K], false> : T[K];
} : FR extends true ? T : Partial<T>;
export type LayerPupilsPreventInference<State extends CStateG> = CStateG extends State ? never : {
    [K in keyof State]: Pupil<RevealLayersInPupilsRecursively<State[K]>>;
};
export type LayerPupils<State extends CStateG> = {
    [K in keyof State]: Pupil<State[K]>;
};
export type ExtendedWithStringAliases<K> = K | `${K & number}`;
export type PickOriginalNumericKeys<K, SA> = K extends K ? SA extends ExtendedWithStringAliases<K> ? K : never : never;
type MergeRecursively<T1, T2> = T1 extends object ? (object extends T1 ? T2 : {
    [K in Exclude<keyof T1, typeof _COMPOSITE_STATE_SIGNATURE>]: K extends ExtendedWithStringAliases<keyof T2> ? MergeRecursively<T1[K], T2[PickOriginalNumericKeys<keyof T2, K>]> : T1[K];
}) extends infer R ? IsCompositeState<T1> extends true ? R extends CStateG ? CompositeState<R> : R : R : never : T1;
export type Merge<S, M extends {
    [K in keyof S]: unknown;
}> = Normalize<{
    [K in keyof S]: K extends ExtendedWithStringAliases<keyof M> ? MergeRecursively<S[K], M[K]> extends infer MR ? MR extends object ? MR : never : never : S[K];
}>;
export {};
//# sourceMappingURL=auxiliaryTypes.d.ts.map