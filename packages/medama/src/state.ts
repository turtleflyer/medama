import type { ReadState, Selector, SetState } from './medama.types';
import type { SelectorTrigger } from './selectorStore';
import { _STATE_ENTRIES_CHANGED, type StateEntriesChangedKey } from './selectStateEntriesChanged';

type UnregisterTriggerFromKeyHandle = () => void;

/**
 * Function to register a selector's trigger with a state property.
 *
 * @param runImmediately Callback to mark the selector as needing recalculation when the property changes.
 * @param trigger Callback to execute when the property changes (typically triggers selector re-evaluation and subscriptions).
 * @returns Cleanup function to unregister both callbacks from the property.
 */
export type KeyHandle = (
  runImmediately: () => void,
  selectorTrigger: SelectorTrigger
) => UnregisterTriggerFromKeyHandle;

export type KeyHandleCollector = (keyHandle: KeyHandle) => void;

export type RegisterSelectorTrigger<State extends object> = (
  selectorTrigger: () => void
) => ReadState<State>;

type KeyHandleRecord = {
  keyHandle: KeyHandle;
  fireKey: () => void;
};

type GetFromTarget<State> = <K extends string | symbol>(
  target: State,
  p: K
) => State[K & keyof State];

type SetToTarget<State> = <K extends string | symbol>(
  target: State,
  p: K,
  newValue: State[K & keyof State]
) => true;

type ProxyHandler<State> = {
  get: GetFromTarget<State>;
  set: SetToTarget<State>;
};

type WithStateEntriesChanged<State extends object> = State & {
  [_STATE_ENTRIES_CHANGED]: Partial<State>;
};

export type RunOverState<State extends object, V> = (
  selector: Selector<State, V>,
  keyHandleCollector?: KeyHandleCollector
) => V;

/**
 * Creates core state management system with controlled access and subscription
 * handling. Provides:
 * - Proxy-wrapped state object with access restrictions
 * - Dependency tracking during selector execution
 * - Subscription management for state changes
 * - Methods for reading and updating state
 *
 * @param initState Optional initial state values
 * @returns Methods for running selectors over state and updating state
 */
export const createStateImage = <State extends object>(
  initState?: Partial<State>
): {
  runOverState: RunOverState<State, unknown>;
  setState: SetState<State>;
} => {
  let calculationAllowed = false;

  /**
   * Enforces authorized access to state properties. Throws error if attempting
   * to access state outside of:
   * - Selector execution
   * - State update operations
   */
  const restrictCalculation = (): void => {
    if (!calculationAllowed)
      throw new Error('Medama Error: The object has no access to its properties');
  };

  /**
   * Temporarily allows state property access during execution of provided
   * function. Sets calculationAllowed flag to true before execution and resets
   * it after. Used during selector execution and state updates.
   *
   * @param toRun Function to execute with state access allowed
   * @returns Result of executed function
   */
  const runWithRestrictionLifted = <V>(toRun: () => V): V => {
    calculationAllowed = true;
    const toReturn = toRun();
    calculationAllowed = false;

    return toReturn;
  };

  /**
   * Tracks current key handle collector during selector execution. Set when
   * running selector to collect state property dependencies. Used by proxy
   * handler to register key handles for accessed properties. Reset to undefined
   * after selector execution completes.
   */
  let activeKeyHandleCollector: KeyHandleCollector | undefined;

  /**
   * Executes selector over state with dependency tracking.
   * - Sets active key handle collector for dependency tracking
   * - Runs selector with authorized access to state properties
   * - Resets collector after execution
   *
   * @param selector Function to run over state
   * @param keyHandleCollector Optional collector for registering dependencies
   * @returns Result of selector execution
   */
  const runOverState: RunOverState<State, unknown> = (selector, keyHandleCollector?) => {
    activeKeyHandleCollector = keyHandleCollector;
    const toReturn = runWithRestrictionLifted(() => selector(state));
    activeKeyHandleCollector = undefined;

    return toReturn;
  };

  const triggerJobStore: Partial<Record<keyof State, KeyHandleRecord>> = Object.create(null);
  const { addToQueue, runQueue } = createJobQueue();

  /**
   * Creates a record to manage triggers for a state property.
   * - keyHandle: Registers callbacks for when the property changes. These include:
   *   - runImmediately: Marks dependent selectors as needing recalculation.
   *   - trigger: Notifies selectors/subscribers of the property change.
   *   Returns a cleanup function to unregister both callbacks.
   * - fireKey: Invoked when the property value changes. It:
   *   - Calls all runImmediately callbacks to mark selectors as stale.
   *   - Queues all trigger callbacks for batched execution (avoiding duplicate runs).
   *   This ensures efficient and correct propagation of state changes to all dependents.
   */
  const createKeyHandleRecord = (): KeyHandleRecord => {
    const immediateTaskSet = new Set<() => void>();
    const triggerSet = new Set<SelectorTrigger>();

    const keyHandle: KeyHandle = (runImmediately, trigger) => {
      immediateTaskSet.add(runImmediately);
      triggerSet.add(trigger);

      return (): void => {
        immediateTaskSet.delete(runImmediately);
        triggerSet.delete(trigger);
      };
    };

    const fireKey = (): void => {
      immediateTaskSet.forEach((task) => {
        task();
      });

      addToQueue(triggerSet);
    };

    return { keyHandle, fireKey };
  };

  /**
   * Stores the set of state entries that have changed during a state update.
   * This is used to support the selector `selectStateEntriesChanged` by exposing
   * the changed entries through the state key `_STATE_ENTRIES_CHANGED`.
   */
  let stateEntriesChanged: Partial<State>;

  /**
   * Updates state with new values and triggers subscriptions.
   * - Accepts either partial state object or state updater function
   * - Runs update with authorized access to state properties
   * - Executes all queued subscription triggers after update
   *
   * @param stateChange Partial state object or updater function
   * @returns Applied state changes
   */
  const setState: SetState<State> = (stateChange) => {
    const toReturn = runWithRestrictionLifted(() => {
      stateEntriesChanged = Object.create(null);
      const mergeToState = typeof stateChange === 'function' ? stateChange(state) : stateChange;
      Object.assign(state, mergeToState);

      /**
       * If any state entries have changed, attach the changed entries to the
       * state object under the _STATE_ENTRIES_CHANGED symbol. Changing this
       * entry will fire selectStateEntriesChanged.
       */
      Reflect.ownKeys(stateEntriesChanged).length > 0 &&
        (state[_STATE_ENTRIES_CHANGED] = stateEntriesChanged);

      return mergeToState;
    });

    runQueue();

    return toReturn;
  };

  /**
   * Creates a Proxy handler for the state object with following
   * responsibilities:
   * - Tracks dependencies by registering key handles when
   *   activeKeyHandleCollector is present (set during selector execution to
   *   collect accessed state properties)
   * - Triggers subscriptions when state properties change by comparing old/new
   *   values
   * - Enforces authorized access through calculationAllowed flag
   */
  const proxyHandler: ProxyHandler<WithStateEntriesChanged<State>> = {
    get: <K extends string | symbol>(
      target: WithStateEntriesChanged<State>,
      p: K
    ): WithStateEntriesChanged<State>[K & (keyof State | StateEntriesChangedKey)] => {
      restrictCalculation();

      if (activeKeyHandleCollector) {
        const { keyHandle } = (triggerJobStore[p as K & keyof State] ??= createKeyHandleRecord());

        activeKeyHandleCollector(keyHandle);
      }

      return target[p as K & (keyof State | StateEntriesChangedKey)];
    },

    set: <K extends string | symbol>(
      target: WithStateEntriesChanged<State>,
      p: K,
      newValue: WithStateEntriesChanged<State>[K & (keyof State | StateEntriesChangedKey)]
    ): true => {
      restrictCalculation();
      const oldValue = target[p as K & (keyof State | StateEntriesChangedKey)];
      target[p as K & (keyof State | StateEntriesChangedKey)] = newValue;
      const { fireKey } = triggerJobStore[p as K & (keyof State | StateEntriesChangedKey)] ?? {};

      if (!Object.is(oldValue, newValue)) {
        /**
         * When a state property is changed and the value is different, record the change
         * in stateEntriesChanged for later processing and trigger all registered callbacks.
         */
        Object.prototype.propertyIsEnumerable.call(target, p) &&
          (stateEntriesChanged[p as K & keyof State] = newValue as State[K & keyof State]);

        fireKey?.();
      }

      return true;
    },
  };

  const stateTargetObject = Object.defineProperty(
    Object.assign(Object.create(null), initState) as WithStateEntriesChanged<State>,
    _STATE_ENTRIES_CHANGED,
    { value: Object.create(null) as Partial<State>, writable: true }
  );

  /**
   * The state object wrapped in a Proxy to:
   * - Track property access for dependency collection
   * - Trigger subscriptions on property changes
   * - Enforce authorized access through restriction mechanism
   */
  const state = new Proxy(stateTargetObject, proxyHandler);

  return { runOverState, setState };
};

type AddToQueue = (triggerSet: Set<SelectorTrigger>) => void;

type RunQueue = () => void;

/**
 * Creates a queue system to manage selector trigger execution.
 * - Queue is populated when state properties change via Proxy's set handler
 * - Relies on the inner mechanism of the selector trigger (`isToAdd`) to
 *   determine whether the trigger method should be added to the queue, ensuring
 *   no duplicate executions
 * - Provides methods to add triggers and process the entire queue
 * - Clears the queue after processing all triggers
 */
export const createJobQueue = (): {
  addToQueue: AddToQueue;
  runQueue: RunQueue;
} => {
  let queue: (() => void)[] = [];

  const addToQueue: AddToQueue = (triggerSet) => {
    triggerSet.forEach(({ trigger, isToAdd }) => {
      isToAdd() && queue.push(trigger);
    });
  };

  const runQueue: RunQueue = () => {
    queue.forEach((trigger) => {
      trigger();
    });

    queue = [];
  };

  return { addToQueue, runQueue };
};
