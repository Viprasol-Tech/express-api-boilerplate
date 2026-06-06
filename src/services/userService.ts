import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { ConflictError, NotFoundError, UnauthorizedError } from "../errors.js";
import type { LoginInput, PublicUser, RegisterUserInput, User } from "../types.js";

interface StoredUser extends User {
  passwordHash: string;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function toPublic(user: StoredUser): PublicUser {
  const { passwordHash: _omit, ...rest } = user;
  return rest;
}

/**
 * In-memory user store with salted scrypt password hashing. Passwords are never
 * stored or returned in plaintext, and the hash is stripped from every public
 * projection.
 */
export class UserService {
  private readonly byId = new Map<string, StoredUser>();
  private readonly idByEmail = new Map<string, string>();

  /** Registers a new user. Throws {@link ConflictError} on duplicate email. */
  register(input: RegisterUserInput): PublicUser {
    const email = input.email.toLowerCase();
    if (this.idByEmail.has(email)) {
      throw new ConflictError(`Email already registered: ${email}`);
    }
    const user: StoredUser = {
      id: randomUUID(),
      email,
      role: input.role ?? "user",
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(input.password),
    };
    this.byId.set(user.id, user);
    this.idByEmail.set(email, user.id);
    return toPublic(user);
  }

  /**
   * Validates credentials and returns the public user on success. Throws
   * {@link UnauthorizedError} for both unknown email and wrong password so
   * callers cannot enumerate accounts.
   */
  authenticate(input: LoginInput): PublicUser {
    const id = this.idByEmail.get(input.email.toLowerCase());
    const user = id ? this.byId.get(id) : undefined;
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedError("Invalid email or password");
    }
    return toPublic(user);
  }

  get(id: string): PublicUser {
    const user = this.byId.get(id);
    if (!user) throw new NotFoundError(`User not found: ${id}`);
    return toPublic(user);
  }

  list(): PublicUser[] {
    return [...this.byId.values()].map(toPublic);
  }

  count(): number {
    return this.byId.size;
  }

  clear(): void {
    this.byId.clear();
    this.idByEmail.clear();
  }
}
