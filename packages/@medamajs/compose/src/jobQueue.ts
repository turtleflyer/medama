type JobQueueMethods = {
  /**
   * Processes all jobs in queue sequentially until queue is empty. Each job is
   * removed from queue before execution.
   */
  processQueue: () => void;

  /**
   * Adds a new job to the queue. Jobs can be added during queue processing.
   * Uses Set to ensure job uniqueness.
   */
  addToQueue: (job: () => void) => void;

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
 * Uses Set to maintain unique jobs and ensure FIFO processing order. New jobs
 * can be added while processing existing ones.
 *
 * @returns Object with queue management methods: processQueue, addToQueue,
 * resetQueue
 */
export const createJobQueue = (): JobQueueMethods => {
  const jobQueue = new Set<() => void>();

  const processQueue = (): void => {
    while (jobQueue.size > 0) {
      // jobPool is not empty

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const toRun = jobQueue.values().next().value!;
      jobQueue.delete(toRun);
      toRun();
    }
  };

  const addToQueue = (job: () => void): void => {
    jobQueue.add(job);
  };

  const resetQueue = (): void => {
    jobQueue.clear();
  };

  return { processQueue, addToQueue, resetQueue };
};
