import type { UserId } from "./user";

export const setSession = async (userId: UserId) => {
  const token = generateSessionToken();
  const session = await createSession(token, userId);
  await setSessionTokenCookie(token, session.expiresAt);
};

export type UserSession = {
  id: UserId;
};
