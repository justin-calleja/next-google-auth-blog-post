import { Google } from "arctic";
import { authPaths } from "./lib/paths";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

export const googleAuth = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.HOST_NAME}${authPaths.oauthStep2}`
);

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

