const { PAGINATION } = require('./constants');

const getPaginationParams = (query) => {
  let page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const getSortParams = (query, allowedFields = []) => {
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  if (allowedFields.length && !allowedFields.includes(sortBy)) {
    return { createdAt: -1 };
  }

  return { [sortBy]: sortOrder };
};

const getSearchFilter = (query, searchFields = []) => {
  if (!query.search || !searchFields.length) return {};

  const searchRegex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: searchFields.map((field) => ({ [field]: searchRegex })),
  };
};

module.exports = { getPaginationParams, getSortParams, getSearchFilter };
