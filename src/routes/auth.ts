import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { authenticate } from "../auth/authMiddleware.js";
import { signJwt } from "../auth/jwt.js";
import type { UserService } from "../services/userService.js";
import type { LoginInput, RegisterUserInput } from "../types.js";

export interface AuthRouterDeps {
  users: UserService;
  jwtSecret: string;
  jwtExpiresInSeconds: number;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Auth router: register, login (issues JWT), and `me` (protected). */
export function authRouter(deps: AuthRouterDeps): Router {
  const router = Router();

  router.post(
    "/auth/register",
    validateBody({
      email: { type: "string", required: true, pattern: EMAIL_PATTERN },
      password: { type: "string", required: true, min: 8, max: 128 },
      role: { type: "string", enum: ["user", "admin"] },
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const input = req.body as RegisterUserInput;
      const user = deps.users.register(input);
      res.status(201).json({ data: user });
    }),
  );

  router.post(
    "/auth/login",
    validateBody({
      email: { type: "string", required: true },
      password: { type: "string", required: true },
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const input = req.body as LoginInput;
      const user = deps.users.authenticate(input);
      const token = signJwt(
        { sub: user.id, role: user.role, email: user.email },
        deps.jwtSecret,
        { expiresInSeconds: deps.jwtExpiresInSeconds },
      );
      res.status(200).json({
        data: { token, tokenType: "Bearer", expiresIn: deps.jwtExpiresInSeconds, user },
      });
    }),
  );

  router.get(
    "/auth/me",
    authenticate({ secret: deps.jwtSecret }),
    asyncHandler(async (req: Request, res: Response) => {
      const user = deps.users.get(req.user!.id);
      res.status(200).json({ data: user });
    }),
  );

  return router;
}
