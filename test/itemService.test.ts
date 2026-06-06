import { describe, it, expect, beforeEach } from "vitest";
import { ItemService } from "../src/services/itemService.js";
import { NotFoundError } from "../src/errors.js";

describe("ItemService", () => {
  let service: ItemService;

  beforeEach(() => {
    service = new ItemService();
  });

  it("creates and retrieves an item", () => {
    const created = service.create({ name: "Gadget", quantity: 3 });
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(service.get(created.id)).toEqual(created);
  });

  it("lists all items", () => {
    service.create({ name: "A", quantity: 1 });
    service.create({ name: "B", quantity: 2 });
    expect(service.list()).toHaveLength(2);
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
});
