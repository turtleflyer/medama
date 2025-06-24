import type { SelectorTrigger } from './selectorRecord';
type AddToQueue = (selectorTrigger: SelectorTrigger) => void;
type JobQueueMethods = {
    addToQueue: AddToQueue;
    processQueue: () => void;
    resetQueue: () => void;
};
export declare const createJobQueue: () => JobQueueMethods;
export {};
//# sourceMappingURL=jobQueue.d.ts.map