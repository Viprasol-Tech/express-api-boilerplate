/** A persisted item resource. */
export interface Item {
  id: string;
  name: string;
  quantity: number;
  /** Optional grouping/category for filtering. */
  category: string;
  createdAt: string;
}

/** Shape accepted when creating a new item. */
export interface CreateItemInput {
  name: string;
  quantity: number;
  category?: string;
}

/** Shape accepted when updating an item (all fields optional). */
export interface UpdateItemInput {
  name?: string;
  quantity?: number;
  category?: string;
}

/** Filter/sort options for listing items. */
export interface ListItemsQuery {
  /** Case-insensitive substring match on name. */
  search?: string;
  /** Exact-match category filter. */
  category?: string;
  /** Minimum quantity (inclusive). */
  minQuantity?: number;
  /** Field to sort by. */
  sortBy?: "name" | "quantity" | "createdAt";
  /** Sort direction. */
  order?: "asc" | "desc";
}

/** A registered user (auth subject). */
export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

/** Public-safe user projection (never leaks the password hash). */
export type PublicUser = User;

export interface RegisterUserInput {
  email: string;
  password: string;
  role?: "user" | "admin";
}

export interface LoginInput {
  email: string;
  password: string;
}
