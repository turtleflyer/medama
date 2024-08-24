export type Normalize<T> = T extends any
  ? {
      [P in keyof T]: T[P];
    }
  : never;
