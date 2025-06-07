export type SelectorTrigger = {
    trigger: () => void;
    isToAdd: () => boolean;
};
type JobQueueMethods = {
    processQueue: () => void;
    addToQueue: (selectorTrigger: SelectorTrigger) => void;
    resetQueue: () => void;
};
export declare const createJobQueue: () => JobQueueMethods;
export {};
//# sourceMappingURL=jobQueue.d.ts.map