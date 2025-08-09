import { cookies } from "next/headers";
import { googleAuth } from "@/auth";
import { authPaths } from "@/lib/paths";
import { setSession } from "@/lib/session";
import { findUserByEmail, updateUserById } from "@/data-access/users";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const allCookies = await cookies();
  const storedState = allCookies.get("google_oauth_state")?.value ?? null;
  const codeVerifier = allCookies.get("google_code_verifier")?.value ?? null;

  if (
    !code ||
    !state ||
    !storedState ||
    state !== storedState ||
    !codeVerifier
  ) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await googleAuth.validateAuthorizationCode(
      code,
      codeVerifier
    );
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      }
    );

    const googleUser: GoogleUser = await response.json();

    const user = await findUserByEmail(googleUser.email);

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${authPaths.signin}?error=unauthorized`,
        },
      });
    }

    if (!user.family_name || !user.given_name || !user.name || !user.picture) {
      await updateUserById(user.id, {
        family_name: googleUser.family_name,
        given_name: googleUser.given_name,
        name: googleUser.name,
        picture: googleUser.picture,
      });
    }

    await setSession(user.id);

    return new Response(null, {
      status: 302,
      headers: {
        Location: authPaths.signinSuccessRedirect,
      },
    });
  } catch (e) {
    console.error(e);

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${authPaths.signin}?error=something-went-wrong`,
      },
    });
  }
}

export interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}
