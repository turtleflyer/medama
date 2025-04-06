import type { Pupil } from 'medama';
import type { _COMPOSITE_STATE_SIGNATURE } from './const';
import type { Normalize } from './type-helpers/Normalize';
export type CStateG = Record<string | number | symbol, object>;
export type CompositeState<State extends CStateG> = State & {
    [_COMPOSITE_STATE_SIGNATURE]?: true;
};
export type IsStateComposite<T> = true extends T[typeof _COMPOSITE_STATE_SIGNATURE & keyof T] ? true : false;
export type RevealLayersInStateRecursively<State extends CStateG> = {
    [K in keyof State]?: IsStateComposite<State[K]> extends true ? Omit<State[K], typeof _COMPOSITE_STATE_SIGNATURE> extends infer O ? O extends CStateG ? RevealLayersInStateRecursively<O> : Partial<O> : never : Partial<State[K]>;
};
type RevealLayersInPupilsRecursively<T extends object, FR = true> = IsStateComposite<T> extends true ? {
    [K in keyof T]: T[K] extends object ? RevealLayersInPupilsRecursively<T[K], false> : T[K];
} : FR extends true ? T : Partial<T>;
export type LayerPupils<State extends CStateG> = {
    [K in keyof State]: Pupil<RevealLayersInPupilsRecursively<State[K]>>;
};
type MergeRecursively<T1, T2> = T1 extends object ? (object extends T1 ? T2 : {
    [K in Exclude<keyof T1, typeof _COMPOSITE_STATE_SIGNATURE>]: K extends ExtendedWithStringAliases<keyof T2> ? MergeRecursively<T1[K], T2[PickWithMatchedNumericAliases<keyof T2, K>]> : T1[K];
}) extends infer R ? IsStateComposite<T1> extends true ? R extends CStateG ? CompositeState<R> : R : R : never : T1;
export type Merge<S, M extends {
    [K in keyof S]: unknown;
}> = Normalize<{
    [K in keyof S]: K extends ExtendedWithStringAliases<keyof M> ? MergeRecursively<S[K], M[K]> extends infer MR ? MR extends {} ? MR : never : never : S[K];
}>;
export type PickWithMatchedNumericAliases<T, Gauge> = T extends T ? Gauge extends T | `${T & number}` ? T : never : never;
export type ExtendedWithStringAliases<T> = T | `${T & number}`;
export {};
//# sourceMappingURL=auxiliaryTypes.d.ts.map