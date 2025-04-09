import type { Pupil } from 'medama';
export type MedamaReactHookOptions<State extends object> = {
    pupil: Pupil<State>;
    id?: undefined;
} | {
    id: string | number | symbol;
    pupil?: undefined;
};
export declare const useMedama: <State extends object>({ pupil: pupilIfProvided, id, }?: Partial<MedamaReactHookOptions<State>>) => Pupil<State>;
//# sourceMappingURL=useMedama.d.ts.map