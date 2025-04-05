/**
 * Utility function similar to Array.forEach but for object properties. Takes an
 * object and a callback function, iterates over enumerable properties:
 * - Gets own properties using Reflect.ownKeys
 * - Filters for enumerable properties only
 * - Collects callback results into array
 *
 * @param obj Source object to iterate over
 * @param fn Callback function receiving key and value, returns result to
 * collect
 * @returns Array of collected callback results
 */
export const forEachOnOwnNumerableProps = <T extends object, R>(
  obj: T,
  fn: <K extends keyof T>(key: K, prop: T[K]) => R
) =>
  (Reflect.ownKeys(obj) as (keyof T)[]).reduce((combineReturns: R[], key) => {
    if (Object.prototype.propertyIsEnumerable.call(obj, key))
      combineReturns.push(fn(key, obj[key]));

    return combineReturns;
  }, []);
