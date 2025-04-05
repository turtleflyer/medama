/**
 * Creates a memoized retriever with update control. Used to:
 * - Cache result of expensive retrieval operations
 * - Control when cached value needs updating
 * - Avoid redundant recalculations
 *
 * @param retrieverCallback Function that produces value to be cached
 * @returns Object with retrieve and requestUpdate methods
 */
export const retrieveWithUpdateRequest = <R>(
  retrieverCallback: () => R
): {
  /**
   * Gets cached value, recalculating only if update was requested. Ensures
   * expensive calculations happen only when needed.
   */
  retrieve: () => R;

  /**
   * Marks cached value as stale, triggering recalculation on next retrieve.
   * Used to indicate when cached value needs refreshing.
   */
  requestUpdate: () => void;
} => {
  let isToUpdate = true;
  let memValue: R;

  const retrieve = (): R => {
    if (isToUpdate) {
      memValue = retrieverCallback();
      isToUpdate = false;
    }

    return memValue;
  };

  const requestUpdate = (): void => {
    isToUpdate = true;
  };

  return {
    retrieve,
    requestUpdate,
  };
};
