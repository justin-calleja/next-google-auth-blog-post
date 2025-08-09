import { createSession, generateSessionToken } from "@/auth";
import { UserId } from "@/use-cases/types";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "appsession";

export const setSessionTokenCookie = async (
  token: string,
  expiresAt: Date
): Promise<void> => {
  const allCookies = await cookies();
  allCookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
};

export const setSession = async (userId: UserId) => {
  const token = generateSessionToken();
  const session = await createSession(token, userId);
  await setSessionTokenCookie(token, session.expiresAt);
};
