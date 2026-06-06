import { describe, it, expect } from "vitest";
import { parsePagination, paginate } from "../src/pagination.js";
import { ValidationError } from "../src/errors.js";

const OPTS = { defaultPageSize: 20, maxPageSize: 50 };

describe("parsePagination", () => {
  it("defaults page=1 and the default page size", () => {
    expect(parsePagination({}, OPTS)).toEqual({ page: 1, pageSize: 20 });
  });

  it("parses provided values", () => {
    expect(parsePagination({ page: 3, pageSize: 10 }, OPTS)).toEqual({
      page: 3,
      pageSize: 10,
    });
  });

  it("clamps pageSize to maxPageSize", () => {
    expect(parsePagination({ pageSize: 999 }, OPTS).pageSize).toBe(50);
  });

  it("rejects non-positive page", () => {
    expect(() => parsePagination({ page: 0 }, OPTS)).toThrow(ValidationError);
    expect(() => parsePagination({ page: -1 }, OPTS)).toThrow(ValidationError);
  });

  it("rejects non-integer pageSize", () => {
    expect(() => parsePagination({ pageSize: 2.5 }, OPTS)).toThrow(
      ValidationError,
    );
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("returns the correct page slice and meta", () => {
    const result = paginate(items, { page: 2, pageSize: 10 });
    expect(result.data).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(result.meta).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
  });

  it("flags the last page as having no next", () => {
    const result = paginate(items, { page: 3, pageSize: 10 });
    expect(result.data).toEqual([21, 22, 23, 24, 25]);
    expect(result.meta.hasNext).toBe(false);
    expect(result.meta.hasPrev).toBe(true);
  });

  it("handles an empty collection", () => {
    const result = paginate([], { page: 1, pageSize: 10 });
    expect(result.data).toEqual([]);
    expect(result.meta).toMatchObject({
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });
});
