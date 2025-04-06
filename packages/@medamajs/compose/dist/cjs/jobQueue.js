"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobQueue = void 0;
const createJobQueue = () => {
    const jobQueue = new Set();
    const processQueue = () => {
        while (jobQueue.size > 0) {
            const toRun = jobQueue.values().next().value;
            jobQueue.delete(toRun);
            toRun();
        }
    };
    const addToQueue = (job) => {
        jobQueue.add(job);
    };
    const resetQueue = () => {
        jobQueue.clear();
    };
    return { processQueue, addToQueue, resetQueue };
};
exports.createJobQueue = createJobQueue;
//# sourceMappingURL=jobQueue.js.map