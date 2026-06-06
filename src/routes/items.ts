import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { authenticate, requireRole } from "../auth/authMiddleware.js";
import { parsePagination, paginate } from "../pagination.js";
import type { ItemService } from "../services/itemService.js";
import type {
  CreateItemInput,
  ListItemsQuery,
  UpdateItemInput,
} from "../types.js";

export interface ItemsRouterDeps {
  service: ItemService;
  jwtSecret: string;
  defaultPageSize: number;
  maxPageSize: number;
}

/** CRUD router for the `items` resource with pagination, filtering and auth. */
export function itemsRouter(deps: ItemsRouterDeps): Router {
  const router = Router();
  const { service } = deps;
  const protect = authenticate({ secret: deps.jwtSecret });

  router.get(
    "/items",
    validateQuery({
      page: { type: "number", min: 1 },
      pageSize: { type: "number", min: 1 },
      search: { type: "string" },
      category: { type: "string" },
      minQuantity: { type: "number", min: 0 },
      sortBy: { type: "string", enum: ["name", "quantity", "createdAt"] },
      order: { type: "string", enum: ["asc", "desc"] },
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const q = req.query as Record<string, unknown>;
      const filter: ListItemsQuery = {
        search: q.search as string | undefined,
        category: q.category as string | undefined,
        minQuantity: q.minQuantity as number | undefined,
        sortBy: q.sortBy as ListItemsQuery["sortBy"],
        order: q.order as ListItemsQuery["order"],
      };
      const items = service.list(filter);
      const params = parsePagination(q, {
        defaultPageSize: deps.defaultPageSize,
        maxPageSize: deps.maxPageSize,
      });
      res.status(200).json(paginate(items, params));
    }),
  );

  router.get(
    "/items/:id",
    asyncHandler(async (req: Request, res: Response) => {
      const item = service.get(req.params.id);
      res.status(200).json({ data: item });
    }),
  );

  router.post(
    "/items",
    protect,
    validateBody({
      name: { type: "string", required: true, min: 1, max: 200 },
      quantity: { type: "number", required: true, min: 0 },
      category: { type: "string", min: 1, max: 80 },
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const input = req.body as CreateItemInput;
      const item = service.create(input);
      res.status(201).json({ data: item });
    }),
  );

  router.patch(
    "/items/:id",
    protect,
    validateBody({
      name: { type: "string", min: 1, max: 200 },
      quantity: { type: "number", min: 0 },
      category: { type: "string", min: 1, max: 80 },
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const item = service.update(req.params.id, req.body as UpdateItemInput);
      res.status(200).json({ data: item });
    }),
  );

  router.delete(
    "/items/:id",
    protect,
    requireRole("admin"),
    asyncHandler(async (req: Request, res: Response) => {
      service.delete(req.params.id);
      res.status(204).send();
    }),
  );

  return router;
}
