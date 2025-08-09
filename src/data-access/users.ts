import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

export const findByEmail = async (email: string): Promise<User | undefined> => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  return user;
};
