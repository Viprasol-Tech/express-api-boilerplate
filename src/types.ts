/** A persisted item resource. */
export interface Item {
  id: string;
  name: string;
  quantity: number;
  createdAt: string;
}

/** Shape accepted when creating a new item. */
export interface CreateItemInput {
  name: string;
  quantity: number;
}
