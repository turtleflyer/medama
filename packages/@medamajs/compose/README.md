# _@medamajs/compose_

_@medamajs/compose_ extends _medama_'s capabilities by enabling composition of multiple state layers
into a cohesive unit. It maintains all the original guarantees while allowing for sophisticated
state hierarchies.

## Installation

```bash
npm i @medamajs/compose
```

## Basic Usage

The main function `composeMedama` allows you to combine multiple `medama` states:

```ts
const { readState, subscribeToState, setState, pupil } = composeMedama(
  {
    layer1: createMedama<Layer1State>(),
    layer2: createMedama<Layer2State>(),
  },

  {
    layer1: { /* initial state */ },
    layer2: { /* initial state */ }
  }
);
```

## State Layers

Each layer in a composite state maintains its independence while being part of a larger state
structure. Layers can be accessed and modified individually or as part of the whole:

```ts
const selector = (state: { layer1: Layer1State; layer2: Layer2State }) => ({
  ...state.layer1,
  ...state.layer2
});

subscribeToState(selector, (value) => {
  // Reacts to changes in either layer
  console.log(value);
});
```

## Dynamic Layer Management

Layers can be added or removed dynamically:

```ts
const { addLayers, deleteLayers } = composeMedama(/* ... */);

// Add new layers
const extendedState = addLayers({
  layer3: createMedama<Layer3State>()
});

// Remove layers
const reducedState = deleteLayers('layer2');

/**
 * Can also pass array of layer names
 *
 * const reducedState = deleteLayers(['layer1', 'layer2']);
*/
```

## Nested Composition

States can be composed hierarchically to create complex state structures:

```ts
const nestedState = composeMedama({
  outer: composeMedama({
    inner1: createMedama<InnerState1>(),
    inner2: createMedama<InnerState2>()
  }),

  sibling: createMedama<SiblingState>()
});
```

## Performance Optimization

The composition maintains _medama_'s performance characteristics:

- Efficient memoization of selector results
- Targeted subscription updates
- Garbage collection of unused selectors
- Smart dependency tracking through the layer hierarchy

Note that state objects passed to selectors and setters maintain the same safety guarantees as the
base _medama_ implementation, preventing unauthorized state access outside of designated operations.

## Powerful Subscription Behavior

Unlike the original medama, composite states allow state changes during subscription callbacks, both
when the subscription is initially created and when it's triggered by state updates. This opens up
powerful capabilities like:

- Self-adjusting states
- Automatic state synchronization
- Reactive state chains
- State-based finite state machines

Here's an example of a self-adjusting counter:

```ts
const { subscribeToState, setState } = composeMedama({
  counter: createMedama<{ value: number }>(),
}, {
  counter: { value: 0 }
});

subscribeToState(
  (state) => state.counter.value,

  (value) => {
    // Safe to call setState here
    if (value < 5) {
      setState({
        counter: { value: value + 1 };
      });
    }
  }
);
```

This feature enables complex state automation while maintaining predictable state updates and
preserving all composition benefits.

## Parallel Compositions

A unique characteristic of _@medamajs/compose_ is that different compositions of the same layers can
coexist independently, regardless of their configuration or nesting depth. When a state update
occurs in one composite state, it automatically triggers subscriptions in other composite states
that share the affected layers:

```ts
// Create two different compositions sharing some layers
const stateA = createMedama<SharedLayerState>();
const stateB = createMedama<SharedLayerState>();

const composition1 = composeMedama({
  shared1: stateA,
  local1: createMedama<LocalState>()
});

const composition2 = composeMedama({
  nested: composeMedama({
    shared1: stateA,  // Same layer as in composition1
    shared2: stateB
  })
});

// Updates in composition1 trigger subscriptions in composition2
composition1.setState({
  shared1: { value: 42 }
});

// Subscriptions in composition2 react to shared layer changes
composition2.subscribeToState(
  (state) => state.nested.shared1.value,
  (value) => console.log(value) // Logs: 42
);
```

This powerful feature enables decentralized state management where different parts of your
application can maintain their own state compositions while staying synchronized through shared
layers.

This approach also allows you to organize selectors based on different logical requirements
throughout your application. Each part of your application can compose exactly the states it needs
to observe:

```ts
// Authentication related composition
const authComposition = composeMedama({
  user: userState,
  session: sessionState
});

// Feature specific composition combining auth and feature state
const featureComposition = composeMedama({
  user: userState,
  featureA: featureState,
  settings: settingsState
});

// Different selectors for different needs
authComposition.subscribeToState(
  (state) => ({
    isLoggedIn: state.user.loggedIn,
    sessionValid: state.session.valid
  }),

  // ...
);

featureComposition.subscribeToState(
  (state) => ({
    canAccess: state.user.permissions.includes('featureA'),
    featureEnabled: state.featureA.enabled && state.settings.featureAEnabled
  }),

  // ...
);
```

## Checking Composite State Layers

The `isComposite` utility function allows you to check if a state layer within a selector is itself
a composite state. This is useful when working with nested compositions and needing to handle layers
differently based on their composition status:

```ts
import { isComposite } from '@medamajs/compose';

const complexState = composeMedama({
  simple: createMedama<SimpleState>(),

  nested: composeMedama({
    inner1: createMedama<InnerState>(),
    inner2: createMedama<InnerState>()
  })
});

complexState.subscribeToState(
  (state) => {
    // isComposite can only be used within selectors
    const isNestedComposite = isComposite(state.nested); // true
    const isSimpleComposite = isComposite(state.simple); // false

    return {
      // Use the composition information to handle state differently
    };
  },

  // ...
);
```

Note that `isComposite` can only be used within selector functions. Attempting to use it outside of
a selector context will result in an error, as the state objects are only accessible during selector
execution.
