"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobQueue = void 0;
const createJobQueue = () => {
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
exports.createJobQueue = createJobQueue;
//# sourceMappingURL=jobQueue.js.map