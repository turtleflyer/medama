type JobQueueMethods = {
    processQueue: () => void;
    addToQueue: (job: () => void) => void;
    resetQueue: () => void;
};
export declare const createJobQueue: () => JobQueueMethods;
export {};
//# sourceMappingURL=jobQueue.d.ts.map