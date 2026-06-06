import { ValidationError } from "./errors.js";

export interface PaginationParams {
  /** 1-based page number. */
  page: number;
  /** Items per page. */
  pageSize: number;
}

export interface PaginationOptions {
  defaultPageSize: number;
  maxPageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

function parsePositiveInt(
  value: unknown,
  field: string,
): number | undefined {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 1) {
    throw new ValidationError(`'${field}' must be a positive integer`);
  }
  return num;
}

/**
 * Parses and clamps `page`/`pageSize` from a query object. Throws a
 * {@link ValidationError} (400) on malformed values, and clamps `pageSize` to
 * `maxPageSize` so a client can't request an unbounded result set.
 */
export function parsePagination(
  query: Record<string, unknown>,
  options: PaginationOptions,
): PaginationParams {
  const page = parsePositiveInt(query.page, "page") ?? 1;
  const requested =
    parsePositiveInt(query.pageSize, "pageSize") ?? options.defaultPageSize;
  const pageSize = Math.min(requested, options.maxPageSize);
  return { page, pageSize };
}

/**
 * Slices an already-filtered/sorted array into a page and computes metadata.
 */
export function paginate<T>(
  items: readonly T[],
  params: PaginationParams,
): Paginated<T> {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / params.pageSize);
  const start = (params.page - 1) * params.pageSize;
  const data = items.slice(start, start + params.pageSize);

  return {
    data,
    meta: {
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1 && total > 0,
    },
  };
}
