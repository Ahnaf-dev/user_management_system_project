function isEnumMatched(enums, value) {
  let capitilizedValue = value[0].toUpperCase() + value.slice(1);
  return enums.includes(capitilizedValue);
}

module.exports = isEnumMatched;
