import type { SelectorTrigger } from './selectorRecord';

/**
 * Adds a new job to the queue. Jobs can be added during queue processing.
 *
 * @param selectorTrigger An object containing the trigger function and a
 * predicate (isToAdd) to determine if it should be added to the queue
 */
type AddToQueue = (selectorTrigger: SelectorTrigger) => void;

type JobQueueMethods = {
  /**
   * Adds a new job to the queue. Jobs can be added during queue processing.
   */
  addToQueue: AddToQueue;

  /**
   * Processes all jobs in queue sequentially until queue is empty. Each job is
   * removed from queue before execution.
   */
  processQueue: () => void;

  /**
   * Clears all pending jobs from queue. Used during initialization and error
   * handling to ensure clean state.
   */
  resetQueue: () => void;
};

/**
 * Creates a queue for managing jobs with methods to:
 * - Add jobs to queue (also possible during queue processing)
 * - Process all queued jobs sequentially
 * - Reset queue by clearing all pending jobs
 *
 * Ensures FIFO processing order. New jobs can be added while processing
 * existing ones.
 *
 * @returns Object with queue management methods: processQueue, addToQueue,
 * resetQueue
 */
export const createJobQueue = (): JobQueueMethods => {
  let jobQueue: (() => void)[] = [];

  const addToQueue: AddToQueue = ({ trigger, isToAdd }) => {
    isToAdd() && jobQueue.push(trigger);
  };

  const processQueue = (): void => {
    let toRun: (() => void) | undefined;

    do {
      toRun?.();
      toRun = jobQueue.shift();
    } while (toRun);
  };

  const resetQueue = (): void => {
    jobQueue = [];
  };

  return { processQueue, addToQueue, resetQueue };
};
