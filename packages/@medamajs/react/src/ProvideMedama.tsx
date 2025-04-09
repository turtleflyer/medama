import type { Pupil } from 'medama';
import { createContext, useContext, useMemo } from 'react';

/**
 * Function to search for pupil provider with specified id up through the chain
 * of PupilProvider components in React context.
 */
type LookUp<State extends object = {}> = (
  idToLookUp: string | number | symbol
) => PupilProviderProps<State> | undefined;

export type PupilProviderProps<State extends object = {}> = {
  pupil?: Pupil<State>;
  id?: string | number | symbol | undefined;
  lookUp?: LookUp<State>;
};

export const pupilProviderContext = createContext<PupilProviderProps>({});

const { Provider: PupilProvider } = pupilProviderContext;

export const ProvideMedama = ({
  pupil,
  id,
  children,
}: {
  pupil: Pupil<{}>;
  id?: string | number | symbol;
  children?: React.ReactNode;
}) => {
  const valueFromProviderNextInChain = useContext(pupilProviderContext);

  const valueToProvide = useMemo(
    () => ({
      pupil,
      id,

      /**
       * Compare provided id with the id from next PupilProvider in context
       * chain. Return either matching provider's value or continue lookup up
       * the chain.
       */
      lookUp: (idToLookUp: string | number | symbol) =>
        valueFromProviderNextInChain.id === idToLookUp
          ? valueFromProviderNextInChain
          : valueFromProviderNextInChain.lookUp?.(idToLookUp),
    }),

    [pupil, id, valueFromProviderNextInChain]
  );

  return <PupilProvider {...{ value: valueToProvide, children }} />;
};
