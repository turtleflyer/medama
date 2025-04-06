export const forEachOnOwnNumerableProps = (obj, fn) => Reflect.ownKeys(obj).reduce((combineReturns, key) => {
    if (Object.prototype.propertyIsEnumerable.call(obj, key))
        combineReturns.push(fn(key, obj[key]));
    return combineReturns;
}, []);
//# sourceMappingURL=forEachOnOwnNumerableProps.js.map