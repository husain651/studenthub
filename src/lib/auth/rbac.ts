import { getCurrentUser, SessionUser } from "./session";

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorizationError("You must be logged in to access this resource.");
  }
  return user;
}

export async function requireRole(allowedRoles: string | string[]): Promise<SessionUser> {
  const user = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  const hasRole = user.roles.some((r) => roles.includes(r) || r === "admin");
  if (!hasRole) {
    throw new AuthorizationError("You do not have permission to perform this action.");
  }
  return user;
}

export function hasPermission(user: SessionUser | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role) || user.roles.includes("admin");
}
