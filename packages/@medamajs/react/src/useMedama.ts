import type { Pupil } from 'medama';
import { useContext, useMemo } from 'react';
import { pupilProviderContext, type PupilProviderProps } from './ProvideMedama';

/**
 * Optional parameter type for all library hooks to specify which medama pupil
 * to use. Options are mutually exclusive:
 * - Direct pupil instance
 * - ID to search through PupilProvider context chain
 *
 * When options are omitted in any library hook, the nearest PupilProvider's
 * value from context is used.
 */
export type MedamaReactHookOptions<State extends object> =
  | { pupil: Pupil<State>; id?: undefined }
  | { id: string | number | symbol; pupil?: undefined };

/**
 * Internal hook used by library hooks implementation. Not exposed to end users
 * directly. Retrieves pupil instance either from:
 * - Directly provided pupil (takes precedence)
 * - Context chain lookup by provided ID
 * - Nearest PupilProvider's value if no options provided
 */
export const useMedama = <State extends object>({
  pupil: pupilIfProvided,
  id,
}: Partial<MedamaReactHookOptions<State>> = {}): Pupil<State> => {
  const contextValue = useContext(pupilProviderContext) as PupilProviderProps<State>;

  const pupil = useMemo(() => {
    if (pupilIfProvided) return pupilIfProvided;

    const { pupil: pupilFromContext } =
      id == null || id === contextValue.id ? contextValue : (contextValue.lookUp?.(id) ?? {});

    return pupilFromContext;
  }, [pupilIfProvided, id, contextValue]);

  if (pupil == null)
    throw new Error(
      'Medama Error: ProvideMedama component must be initialized up in component tree'
    );

  return pupil;
};
