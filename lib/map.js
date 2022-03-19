const { mapValues, isObject, isFunction } = require('lodash');

 const mapValuesDeep = (
  obj,
  callback,
  parentKey = '',
) => {
  if (!isObject(obj) || isFunction(obj)) {
    return callback(obj, parentKey);
  }

  if (Array.isArray(obj)) {
    const newArray = callback(obj, parentKey);

    return newArray.map((value, index) => {
      return mapValuesDeep(value, callback, `${index}`);
    });
  }

  const newObj = callback(obj, parentKey);

  return mapValues(newObj, (v, k) => {
    return mapValuesDeep(v, callback, k);
  });
};

module.exports = {
 mapValuesDeep
}
