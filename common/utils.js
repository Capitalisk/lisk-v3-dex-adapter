const objectType = 'object';
const functionType = 'function';

const firstOrDefault = (array, defaultValue) => (array.length > 0 ? firstValue(array) : defaultValue);

const firstOrNull = (arr) => firstOrDefault(arr, null);

const arrOrDefault = (arr, defaultValue) => isEmptyArray(arr) ? defaultValue : arr;

const arrOrFirstOrNull = (arr) => arr.length > 1 ? arr : firstOrNull(arr);

const firstValue = (array) => array[0];

const isNullOrUndefinedOrEmpty = (obj , checkEmptyString = false) =>
    isNullOrUndefined(obj) || isEmpty(obj) || (checkEmptyString && typeof obj === 'string' && isEmptyString(obj));

const isNullOrUndefined = (obj) => obj == null || obj === undefined;

const isEmptyObjOrFn = (objOrfn) => {
    return typeof objOrfn === objectType && typeof objOrfn !== functionType ? isEmptyObject(objOrfn) : false;
};

const isEmpty = (objOrfnOrArr) => Array.isArray(objOrfnOrArr) ? isEmptyArray(objOrfnOrArr) : isEmptyObjOrFn(objOrfnOrArr);

const isEmptyObject = (obj) => eq(Object.keys(obj).length, 0);

const isEmptyArray = (arr) => arr.length === 0;

const eq = (a, b) => a === b;

const isEmptyString = (stringToCheck, ignoreSpaces = true) => (ignoreSpaces ? stringToCheck.trim() : stringToCheck) === '';

const isLocal = (env) => env === 'development';

const run = (runnable, ...collection) => Promise.all(collection.map(runnable));

const sort = (arr, key) => arr.sort((o1, o2) => {
    return o1[key].localeCompare(o2[key]);
});

const toBuffer = (data) => Buffer.from(data, 'hex')

const bufferToString = (hexBuffer) => hexBuffer.toString('hex')

const wait = (duration) => new Promise(resolve => setTimeout(resolve, duration))

module.exports = {isNullOrUndefinedOrEmpty, firstOrDefault, isLocal, isNullOrUndefined, run, sort, arrOrFirstOrNull, isEmpty, firstOrNull,arrOrDefault, wait, toBuffer, bufferToString};
