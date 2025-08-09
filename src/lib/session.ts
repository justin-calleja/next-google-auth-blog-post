import { createSession, generateSessionToken, validateRequest } from "@/auth";
import { UserId } from "@/use-cases/types";
import { cache } from "react";
import { getSessionToken, setSessionTokenCookie } from "./session-storage";

export const getCurrentUser = cache(async () => {
  const sessionToken = await getSessionToken();
  const { user } = await validateRequest(sessionToken);
  return user ?? undefined;
});

export const assertAuthenticated = async () => {
  const user = await getCurrentUser();
  if (!user) {
    // throw new AuthenticationError();
    throw new Error("You must be logged in to view this content");
  }
  return user;
};

export const setSession = async (userId: UserId) => {
  const token = generateSessionToken();
  const session = await createSession(token, userId);
  await setSessionTokenCookie(token, session.expiresAt);
};
