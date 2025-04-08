# _Medama_

![Medama](https://raw.githubusercontent.com/turtleflyer/medama/master/doc/media/medama.png)

_Medama_ is a collection of libraries for state management in TypeScript applications. At its core
is the main `medama` package - a minimalist yet powerful reactive state management solution with
high performance optimization and efficient garbage collection.

## Packages

### [medama](https://github.com/turtleflyer/medama/tree/master/packages/medama#readme)

The core library providing fundamental state management capabilities through four main concepts:

- State management with selectors
- Reactive subscriptions
- Efficient state updates
- Performance-optimized state reading

### [@medamajs/compose](https://github.com/turtleflyer/medama/tree/master/packages/%40medamajs/compose#readme)

A powerful extension that enables composition of multiple medama states into hierarchical
structures:

- Compose multiple state layers
- Maintain state independence
- Enable complex state relationships
- Support nested compositions

## Getting Started

To begin with medama, install the core package:

```bash
npm i medama
```

For state composition capabilities, add the compose package:

```bash
npm i @medamajs/compose
```

Check the individual package documentation for detailed usage instructions and examples.
