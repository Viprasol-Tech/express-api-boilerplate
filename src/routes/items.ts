import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { ItemService } from "../services/itemService.js";
import type { CreateItemInput } from "../types.js";

/** CRUD router for the in-memory `items` resource. */
export function itemsRouter(service: ItemService): Router {
  const router = Router();

  router.get(
    "/items",
    asyncHandler(async (_req: Request, res: Response) => {
      res.status(200).json({ data: service.list() });
    }),
  );

  router.post(
    "/items",
    validateBody({
      name: { type: "string", required: true, min: 1 },
      quantity: { type: "number", required: true, min: 0 },
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const input = req.body as CreateItemInput;
      const item = service.create(input);
      res.status(201).json({ data: item });
    }),
  );

  router.get(
    "/items/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const item = service.get(req.params.id);
      res.status(200).json({ data: item });
    }),
  );

  router.delete(
    "/items/:id",
    asyncHandler(async (req: Request, res: Response) => {
      service.delete(req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
