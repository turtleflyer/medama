export const createJobQueue = () => {
    let jobQueue = [];
    const addToQueue = ({ trigger, isToAdd }) => {
        isToAdd() && jobQueue.push(trigger);
    };
    const processQueue = () => {
        let toRun;
        do {
            toRun === null || toRun === void 0 ? void 0 : toRun();
            toRun = jobQueue.shift();
        } while (toRun);
    };
    const resetQueue = () => {
        jobQueue = [];
    };
    return { processQueue, addToQueue, resetQueue };
};
//# sourceMappingURL=jobQueue.js.map