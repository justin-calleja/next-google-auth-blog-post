import { db } from "@/db";
import { type Session, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const insertSession = async (session: Session) => {
  await db.insert(sessions).values(session);
};

export const findSessionById = async (sessionId: Session["id"]) => {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
  return session;
};

export const deleteSessionById = async (sessionId: Session["id"]) => {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
};

export const updateSessionExpiryDateById = async (
  sessionId: Session["id"],
  expiresAt: Session["expiresAt"]
) => {
  await db
    .update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.id, sessionId));
};
