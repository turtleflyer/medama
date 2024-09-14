// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Normalize<T> = T extends any ? { [P in keyof T]: T[P] } : never;
