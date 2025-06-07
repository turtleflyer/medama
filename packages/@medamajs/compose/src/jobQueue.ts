export type SelectorTrigger = {
  /**
   * Method to trigger the selector's functionality.
   * This is called when the selector's dependencies change, ensuring that
   * the selector's value is recalculated and all active subscription jobs
   * are notified with the updated value.
   */
  trigger: () => void;

  /**
   * Method to check if the selector's trigger should be added to the queue.
   * Ensures that the selector's trigger is not added to the queue multiple times.
   * Returns a boolean indicating whether the selector's trigger has already been added.
   */
  isToAdd: () => boolean;
};

type JobQueueMethods = {
  /**
   * Processes all jobs in queue sequentially until queue is empty. Each job is
   * removed from queue before execution.
   */
  processQueue: () => void;

  /**
   * Adds a new job to the queue. Jobs can be added during queue processing.
   */
  addToQueue: (selectorTrigger: SelectorTrigger) => void;

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

  const processQueue = (): void => {
    let toRun: (() => void) | undefined;

    do {
      toRun?.();
      toRun = jobQueue.shift();
    } while (toRun);
  };

  const addToQueue = ({ trigger, isToAdd }: SelectorTrigger): void => {
    isToAdd() && jobQueue.push(trigger);
  };

  const resetQueue = (): void => {
    jobQueue = [];
  };

  return { processQueue, addToQueue, resetQueue };
};
