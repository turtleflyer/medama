"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forEachOnOwnNumerableProps = void 0;
const forEachOnOwnNumerableProps = (obj, fn) => Reflect.ownKeys(obj).reduce((combineReturns, key) => {
    if (Object.prototype.propertyIsEnumerable.call(obj, key))
        combineReturns.push(fn(key, obj[key]));
    return combineReturns;
}, []);
exports.forEachOnOwnNumerableProps = forEachOnOwnNumerableProps;
//# sourceMappingURL=forEachOnOwnNumerableProps.js.map