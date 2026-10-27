import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { queryOne, query } from "@/lib/db";

const SESSION_COOKIE_NAME = "student_hub_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "student_hub_secure_production_quality_session_key_2026_x"
);

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  roles: string[];
  preferredLanguage?: "en" | "ur";
  onboardingCompleted?: boolean;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    emailVerified: user.emailVerified,
    roles: user.roles,
    preferredLanguage: user.preferredLanguage || "en",
    onboardingCompleted: user.onboardingCompleted ?? false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      emailVerified: Boolean(payload.emailVerified),
      roles: (payload.roles as string[]) || ["student"],
      preferredLanguage: (payload.preferredLanguage as "en" | "ur") || "en",
      onboardingCompleted: Boolean(payload.onboardingCompleted),
    };
  } catch (err) {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSessionToken(user);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getFreshUser(userId: string): Promise<SessionUser | null> {
  const user = await queryOne(
    `SELECT u.id, u.email, u.full_name, u.email_verified, u.status,
            p.preferred_language, p.onboarding_completed
     FROM users u
     LEFT JOIN student_academic_preferences p ON p.user_id = u.id
     WHERE u.id = $1 AND u.status = 'active'`,
    [userId]
  );

  if (!user) return null;

  const roleRows = await query(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = $1`,
    [userId]
  );

  const roles = roleRows.map((r: any) => r.name);

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    emailVerified: user.email_verified,
    roles: roles.length > 0 ? roles : ["student"],
    preferredLanguage: user.preferred_language || "en",
    onboardingCompleted: Boolean(user.onboarding_completed),
  };
}
