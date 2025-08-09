import { cookies } from "next/headers";
import { OAuth2RequestError } from "arctic";
import { googleAuth } from "@/lib/auth";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";

// import { createGoogleUserUseCase } from "../../../../../../use-cases/users";
// import { getAccountByGoogleIdUseCase } from "../../../../../../use-cases/accounts";
// import { setSession } from "../../../../../../lib/session";
// import { afterLoginUrl } from "../../../../../../app-config";
// import { errorDict, NotRegisteredError } from "../../../../../../lib/errors";

export async function GET(request: Request) {
  const url = new URL(request.url);
  console.log("🚀 ~ GET ~ url:", url);
  const code = url.searchParams.get("code");
  console.log("🚀 ~ GET ~ code:", code);
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
    console.log("🚀 ~ GET ~ googleUser:", googleUser);

    const user = await db.query.users.findFirst({
      where: eq(users.email, googleUser.email),
    });

    if (!user) {
      return new Response(null, {
        status: 400,
      });
    }
    console.log("🚀 ~ GET ~ user:", user);
    // const existingAccount = await getAccountByGoogleIdUseCase(googleUser.sub);

    // if (existingAccount) {
    //   await setSession(existingAccount.userId);
    //   return new Response(null, {
    //     status: 302,
    //     headers: {
    //       Location: afterLoginUrl,
    //     },
    //   });
    // }

    // const userId = await createGoogleUserUseCase(googleUser);

    // await setSession(userId);

    // return new Response(null, {
    //   status: 302,
    //   headers: {
    //     Location: afterLoginUrl,
    //   },
    // });
  } catch (e) {
    console.error(e);
    // // the specific error message depends on the provider
    // if (e instanceof OAuth2RequestError) {
    //   // invalid code
    //   return new Response(null, {
    //     status: 400,
    //   });
    // }
    // if (e instanceof NotRegisteredError) {
    //   // user is not registered/authorized to access this CMS
    //   return new Response(null, {
    //     status: 302,
    //     headers: {
    //       Location: errorDict.not_registered.redirectUrl,
    //     },
    //   });
    // }
    // return new Response(null, {
    //   status: 500,
    // });
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
  locale: string;
}
