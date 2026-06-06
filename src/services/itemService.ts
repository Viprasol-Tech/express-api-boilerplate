import { randomUUID } from "node:crypto";
import { NotFoundError } from "../errors.js";
import type {
  CreateItemInput,
  Item,
  ListItemsQuery,
  UpdateItemInput,
} from "../types.js";

/**
 * In-memory item store. The service layer keeps persistence concerns out of the
 * route handlers; swap this class for a database-backed implementation without
 * touching the HTTP layer.
 */
export class ItemService {
  private readonly items = new Map<string, Item>();

  /**
   * Returns items, applying optional filtering and sorting. Pagination is the
   * caller's responsibility (see `paginate`) so this stays a pure data query.
   */
  list(query: ListItemsQuery = {}): Item[] {
    let result = [...this.items.values()];

    if (query.search) {
      const needle = query.search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(needle));
    }
    if (query.category) {
      result = result.filter((i) => i.category === query.category);
    }
    if (query.minQuantity !== undefined) {
      result = result.filter((i) => i.quantity >= query.minQuantity!);
    }

    const sortBy = query.sortBy ?? "createdAt";
    const dir = query.order === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return result;
  }

  get(id: string): Item {
    const item = this.items.get(id);
    if (!item) throw new NotFoundError(`Item not found: ${id}`);
    return item;
  }

  create(input: CreateItemInput): Item {
    const item: Item = {
      id: randomUUID(),
      name: input.name,
      quantity: input.quantity,
      category: input.category ?? "uncategorized",
      createdAt: new Date().toISOString(),
    };
    this.items.set(item.id, item);
    return item;
  }

  /** Partially updates an item, returning the updated record. */
  update(id: string, input: UpdateItemInput): Item {
    const existing = this.get(id);
    const updated: Item = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
    };
    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    if (!this.items.delete(id)) {
      throw new NotFoundError(`Item not found: ${id}`);
    }
  }

  count(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }
}
