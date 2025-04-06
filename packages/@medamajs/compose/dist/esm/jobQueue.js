export const createJobQueue = () => {
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
//# sourceMappingURL=jobQueue.js.map