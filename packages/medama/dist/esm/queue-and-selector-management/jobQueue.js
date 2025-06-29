export const createJobQueue = () => {
    let jobQueue = [];
    let queueInProgress = false;
    const resetQueue = () => {
        jobQueue = [];
        queueInProgress = false;
    };
    const addToQueue = ({ trigger, isToAdd }) => {
        isToAdd() && jobQueue.push(trigger);
    };
    const processQueue = () => {
        if (queueInProgress)
            return;
        queueInProgress = true;
        let toRun;
        try {
            do {
                toRun === null || toRun === void 0 ? void 0 : toRun();
                toRun = jobQueue.shift();
            } while (toRun);
        }
        finally {
            resetQueue();
        }
    };
    return { processQueue, addToQueue, resetQueue };
};
//# sourceMappingURL=jobQueue.js.map