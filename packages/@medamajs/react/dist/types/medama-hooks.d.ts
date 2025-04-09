import type { ReadState, Selector, SetState } from 'medama';
import { type MedamaReactHookOptions } from './useMedama';
export declare const useMedamaSelector: <State extends object, V>(selector: Selector<State, V>, options?: MedamaReactHookOptions<State>) => V;
export declare const useReadMedama: <State extends object>(options?: MedamaReactHookOptions<State>) => ReadState<State>;
export declare const useUpdateMedama: <State extends object>(options?: MedamaReactHookOptions<State>) => SetState<State>;
//# sourceMappingURL=medama-hooks.d.ts.map