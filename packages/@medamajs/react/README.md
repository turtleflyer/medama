# _@medamajs/react_

React bindings for the medama state management library. Provides hooks and components for seamless
integration of medama state into React applications.

## Installation

```bash
npm install @medamajs/react
```

## Usage

### Provider Setup

Wrap your app or component tree with `ProvideMedama` to make medama state available:

```tsx
import { ProvideMedama } from '@medamajs/react';
import { createMedama } from 'medama';
import { initialState, type AppState } from './state';

const pupil = createMedama<AppState>(initialState);

function App() {
  return (
    <ProvideMedama pupil={pupil}>
      <YourComponents />
    </ProvideMedama>
  );
}
```

### Using Hooks

#### useMedamaSelector

Subscribe to specific state pieces with automatic re-renders:

```tsx
import { useMedamaSelector } from '@medamajs/react';
import type { AppState } from './state';

function Counter() {
  const count = useMedamaSelector<AppState>((state) => state.count);
  return <div>{count}</div>;
}
```

#### useReadMedama

Get access to state reading functionality:

```tsx
import { useReadMedama } from '@medamajs/react';
import type { AppState } from './state';

function StateReader() {
  const readState = useReadMedama<AppState>();
  const value = readState((state) => state.someValue);

  return <div>{value}</div>;
}
```

#### useUpdateMedama

Get access to state update functionality:

```tsx
import { useUpdateMedama } from '@medamajs/react';
import type { AppState } from './state';

function StateUpdater() {
  const setState = useUpdateMedama<AppState>();

  return (
    <button onClick={() => setState((state) => ({ count: state.count + 1 }))}>
      Increment
    </button>
  );
}
```

### Multiple Providers

You can nest providers and identify them with IDs:

```tsx
<ProvideMedama pupil={globalPupil} id="global">
  <ProvideMedama pupil={featurePupil} id="feature">
    <YourComponents />
  </ProvideMedama>
</ProvideMedama>
```

Access specific provider in hooks:

```tsx
import type { GlobalState } from './state';
import type { FeatureState } from './feature';

const globalValue = useMedamaSelector<GlobalState>(selector, { id: "global" });
const featureValue = useMedamaSelector<FeatureState>(selector, { id: "feature" });
```

## API

### Components

- `ProvideMedama`: Context provider component
  - `pupil`: Medama pupil instance
  - `id?`: Optional identifier for nested providers
  - `children`: React nodes

### Hooks

- `useMedamaSelector<State, Value>(selector, options?)`
- `useReadMedama<State>(options?)`
- `useUpdateMedama<State>(options?)`

### Options

All hooks accept optional configuration:

```typescript
type MedamaReactHookOptions<State> =
  | { pupil: Pupil<State>; id?: undefined }
  | { id: string | number | symbol; pupil?: undefined }
```

When options are omitted, hooks use the nearest provider's state.

## License

MIT
