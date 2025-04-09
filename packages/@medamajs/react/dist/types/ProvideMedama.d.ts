import type { Pupil } from 'medama';
type LookUp<State extends object = {}> = (idToLookUp: string | number | symbol) => PupilProviderProps<State> | undefined;
export type PupilProviderProps<State extends object = {}> = {
    pupil?: Pupil<State>;
    id?: string | number | symbol | undefined;
    lookUp?: LookUp<State>;
};
export declare const pupilProviderContext: import("react").Context<PupilProviderProps<{}>>;
export declare const ProvideMedama: ({ pupil, id, children, }: {
    pupil: Pupil<{}>;
    id?: string | number | symbol;
    children?: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProvideMedama.d.ts.map