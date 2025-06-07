export const createJobQueue = () => {
    let jobQueue = [];
    const processQueue = () => {
        let toRun;
        do {
            toRun === null || toRun === void 0 ? void 0 : toRun();
            toRun = jobQueue.shift();
        } while (toRun);
    };
    const addToQueue = ({ trigger, isToAdd }) => {
        isToAdd() && jobQueue.push(trigger);
    };
    const resetQueue = () => {
        jobQueue = [];
    };
    return { processQueue, addToQueue, resetQueue };
};
//# sourceMappingURL=jobQueue.js.map