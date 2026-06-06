import { describe, it, expect, beforeEach } from "vitest";
import { ItemService } from "../src/services/itemService.js";
import { NotFoundError } from "../src/errors.js";

describe("ItemService", () => {
  let service: ItemService;

  beforeEach(() => {
    service = new ItemService();
  });

  it("creates and retrieves an item with a default category", () => {
    const created = service.create({ name: "Gadget", quantity: 3 });
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.category).toBe("uncategorized");
    expect(service.get(created.id)).toEqual(created);
  });

  it("lists all items", () => {
    service.create({ name: "A", quantity: 1 });
    service.create({ name: "B", quantity: 2 });
    expect(service.list()).toHaveLength(2);
    expect(service.count()).toBe(2);
  });

  it("filters by search substring (case-insensitive)", () => {
    service.create({ name: "Red Widget", quantity: 1 });
    service.create({ name: "Blue Gadget", quantity: 1 });
    const result = service.list({ search: "widget" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Red Widget");
  });

  it("filters by category and minQuantity", () => {
    service.create({ name: "A", quantity: 5, category: "tools" });
    service.create({ name: "B", quantity: 1, category: "tools" });
    service.create({ name: "C", quantity: 9, category: "food" });
    const result = service.list({ category: "tools", minQuantity: 3 });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("A");
  });

  it("sorts by quantity ascending and descending", () => {
    service.create({ name: "A", quantity: 3 });
    service.create({ name: "B", quantity: 1 });
    service.create({ name: "C", quantity: 2 });
    const asc = service.list({ sortBy: "quantity", order: "asc" });
    expect(asc.map((i) => i.quantity)).toEqual([1, 2, 3]);
    const desc = service.list({ sortBy: "quantity", order: "desc" });
    expect(desc.map((i) => i.quantity)).toEqual([3, 2, 1]);
  });

  it("updates an item partially", () => {
    const item = service.create({ name: "Old", quantity: 1, category: "x" });
    const updated = service.update(item.id, { quantity: 7 });
    expect(updated.name).toBe("Old");
    expect(updated.quantity).toBe(7);
    expect(updated.category).toBe("x");
  });

  it("throws NotFoundError when updating a missing id", () => {
    expect(() => service.update("nope", { quantity: 1 })).toThrow(NotFoundError);
  });

  it("throws NotFoundError for missing id", () => {
    expect(() => service.get("nope")).toThrow(NotFoundError);
  });

  it("deletes an item", () => {
    const item = service.create({ name: "Temp", quantity: 1 });
    service.delete(item.id);
    expect(() => service.get(item.id)).toThrow(NotFoundError);
  });

  it("throws when deleting a missing id", () => {
    expect(() => service.delete("nope")).toThrow(NotFoundError);
  });

  it("clears all items", () => {
    service.create({ name: "A", quantity: 1 });
    service.clear();
    expect(service.count()).toBe(0);
  });
});
