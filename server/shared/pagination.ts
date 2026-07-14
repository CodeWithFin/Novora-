export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function parsePagination(query: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

export function getPaginationOffset(params: PaginationParams): {
  limit: number;
  offset: number;
} {
  return {
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
  };
}

export function buildMeta(
  params: PaginationParams,
  total: number
): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit) || 1,
  };
}
