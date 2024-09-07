# _Medama_

This version of README do not reflect the implementation of medama. It is rewrote using classes and
OOP principles.

![Medama](medama.png)

_Medama_ is a minimalist yet powerful universal reactive state management library crafted in
_TypeScript_. It boasts high performance optimization and efficient garbage collection. At its core,
_medama_ operates on four fundamental concepts: **state**, **selectors**, **subscriptions**, and
**setters**.

## Installation

```bash
npm i medama
```

## State

In _medama_, the state is represented by a streamlined flat object, with each key holding a distinct
state record. The journey begins with initializing _medama_,

```ts
const { readState, subscribeToState, setState, resetState, pupil } = createMedama<State>();
```

and conveniently, the state can be set up during this creation phase.

```ts
const initState: Partial<State> = { foo: 'foo_record', bar: 'bar_record' }

const { readState, subscribeToState, setState, resetState, pupil } = createMedama<State>(initState);
```

## Selectors

Selectors serve as the primary interface for reading the state and subscribing to state changes.

```ts
const selector = ({ foo, bar }: State) => foo + bar;

readState(selector); // 'foo_record bar_record'
```

They offer a refined method to access individual records from the state, ensuring precise data
retrieval.

```ts
readState(({ foo }) => ({ foo })); // { foo: 'foo_record' }
```

## Subscriptions

Subscribing to state changes is achieved by pairing a selector with a subscription. In its simplest
form, a subscription manifests as a subscription job.

```ts
subscribeToState(selector, (value) => {
  console.log(value);
});
// print 'foo_record bar_record'
```

By default, the subscription job activates immediately upon establishment. For cases where immediate
execution isn't desired, the subscription can be defined as a function that returns the subscription
job.

```ts
subscribeToState(selector, () => (value) => {
  console.log(value);
});
// no side effect
```

_medama_ also offers the flexibility to define separate jobs: one that runs at the moment of
subscribing, and another that registers as an ongoing subscription job.

```ts
subscribeToState(selector, (value) => {
  console.log('This is the first run with value:', value)

  return (value) => {
    console.log(value);
  };
});
// print 'This is the first run with value: foo_record bar_record'
```

The subscription process establishes a dependency between the subscription job and the specific
state records that the selector relies upon.

## Setters

State updates in _medama_ are handled through a smooth merging process of an object into the state
object. The most straightforward approach is to directly pass the object for merging.

```ts
setState({ foo: 'new_foo' });
readState(({ foo, bar }) => ({ foo, bar })); // { foo: 'new_foo', bar: 'bar_record' }
```

Alternatively, a setter can be employed. Similar to a selector, a setter takes the state object as a
parameter but returns an object destined for merging into the state.

```ts
setState(({ foo, bar }) => ({ foo: 'next_' + foo, bar: 'next_' + bar }));
readState(({ foo, bar }) => ({ foo, bar })); // { foo: 'next_new_foo', bar: 'next_bar_record' }
```

Any modifications to a single state record trigger the execution of subscription jobs that are
subscribed to selectors depending on that record, ensuring targeted and efficient reactive updates.

```ts
subscribeToState(selector, (value) => {
  console.log(value);
})

setState({ bar: 'very_new_bar' });
// print 'next_new_foo very_new_bar'
```

## Reset state

Occasionally, a complete state reset is necessary. The `resetState` method caters to this need,
allowing for a fresh start. During this reset, the state can be initialized with new values if
desired.

```ts
resetState(initState);
```

It's important to note that resetting the state dissolves all existing subscriptions, providing a
truly clean slate.

## `pupil`

The `createMedama` function yields a `pupil` object, which encapsulates all available methods.

```ts
const { readState, subscribeToState, setState, resetState } = pupil;
```

The name "Medama" draws inspiration from the Japanese word 目玉, meaning "eyeball," with the pupil
representing the core of _medama_. This `pupil` object is designed to facilitate the development of
supporting libraries. Moreover, the `pupil` object can be passed as an opaque object within these
libraries, enabling the establishment of interconnected logic based on state updates.

## Notes about performance optimization

_Medama_'s design prioritizes efficiency. It recalculates selector values only when dependency
records have been updated and active subscriptions exist for that selector. In scenarios with
multiple subscriptions or the need for arbitrary state reading, the selector's calculated value is
memoized following the most recent state update, avoiding unnecessary recalculations.

This optimization hinges on selector identity consistency. For the memoization to function
correctly, the same selector instance must be used, rather than just identical function literals.
This design choice influences how _medama_ determines state record dependencies. Upon the first
subscription establishment, the selector's value is calculated to identify its dependencies. For
subsequent subscriptions, if the dependency records remain unchanged and the selector instance is
consistent, _medama_ skips recalculation, leveraging the existing results.

Importantly, _medama_ provides an additional layer of safety. The state object passed to selectors
and setters, if captured, does not allow direct access to the state. This access is restricted to
within _medama_ itself during the processing of selectors and setters, ensuring data integrity and
preventing unauthorized state modifications.
