// Stable keys keep filtered responses separate without caching arbitrary query fields.
const filteredCacheKey = (prefix, fields) => (req) => {
  const filters = fields.filter(field => req.query[field]).map(field => [field, req.query[field]]);
  return filters.length ? prefix + ':' + JSON.stringify(filters) : prefix;
};
module.exports = { filteredCacheKey };
