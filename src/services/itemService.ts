import { randomUUID } from "node:crypto";
import { NotFoundError } from "../errors.js";
import type { CreateItemInput, Item } from "../types.js";

/**
 * In-memory item store. The service layer keeps persistence concerns out of the
 * route handlers; swap this class for a database-backed implementation without
 * touching the HTTP layer.
 */
export class ItemService {
  private readonly items = new Map<string, Item>();

  list(): Item[] {
    return [...this.items.values()];
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
      createdAt: new Date().toISOString(),
    };
    this.items.set(item.id, item);
    return item;
  }

  delete(id: string): void {
    if (!this.items.delete(id)) {
      throw new NotFoundError(`Item not found: ${id}`);
    }
  }

  clear(): void {
    this.items.clear();
  }
}
