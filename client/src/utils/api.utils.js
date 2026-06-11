/**
 * Helpers to safely extract data from API responses.
 *
 * All backend responses follow two shapes:
 *   Single:    { success, data: T, message }
 *   Paginated: { success, data: T[], meta: { pagination: { total, page, limit, totalPages, hasNextPage, hasPrevPage } }, message }
 */

export const getData = (res) => res?.data?.data ?? null;

export const getList = (res) => {
  const d = res?.data?.data;
  return Array.isArray(d) ? d : [];
};

export const getPagination = (res) => ({
  total: res?.data?.meta?.pagination?.total ?? 0,
  page: res?.data?.meta?.pagination?.page ?? 1,
  limit: res?.data?.meta?.pagination?.limit ?? 20,
  totalPages: res?.data?.meta?.pagination?.totalPages ?? 1,
  hasNextPage: res?.data?.meta?.pagination?.hasNextPage ?? false,
  hasPrevPage: res?.data?.meta?.pagination?.hasPrevPage ?? false,
});

export const getErrorMessage = (err, fallback = 'An unexpected error occurred') =>
  err?.response?.data?.message || err?.message || fallback;

/**
 * Server root URL (strips /api/v1 suffix).
 * Used for the health check endpoint which sits at GET /health, not /api/v1/health.
 */
export const getServerBaseUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || '';
  return apiUrl.replace(/\/api\/v1\/?$/, '');
};
