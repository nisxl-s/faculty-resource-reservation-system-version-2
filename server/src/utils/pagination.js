const { httpError } = require('./httpError');
function pagination(query = {}, defaultLimit = 100) {
  const parse = (value, fallback, minimum, maximum) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) throw httpError(400, 'limit and offset must be whole numbers');
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw httpError(400, 'Pagination is out of range');
    return number;
  };
  return { limit: parse(query.limit, defaultLimit, 1, 200), offset: parse(query.offset, 0, 0, 1000000) };
}
module.exports = { pagination };
