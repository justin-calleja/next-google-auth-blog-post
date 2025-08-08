import "server-only";
import { Google } from "arctic";

export const googleAuth = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.HOST_NAME}/api/sign-in/google/callback`
);
