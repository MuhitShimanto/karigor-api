export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const getPagination = (options: PaginationOptions): PaginationResult => {
  const page = Math.max(1, Number(options.page) || 1);
  const rawLimit = Number(options.limit) || 10;
  const limit = Math.min(50, Math.max(1, rawLimit));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};
