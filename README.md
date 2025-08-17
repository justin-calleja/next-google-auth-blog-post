---
title: Google sign-in with Next.js
published: true
description: 
tags: nextjs, oauth2
# cover_image: https://direct_url_to_image.jpg
# Use a ratio of 100:42 for best results.
# published_at: 2025-07-11 10:36 +0000
---

## Goal

Set up Google sign-in in a Next.js project - but - the use-case here is that of an internal CMS (content management system). The requirement is clear in that there should only be a Google sign-in and no actual sign-up (i.e. users are added by an admin - they don't actually "sign up" anywhere).

## Starter kit

The code in this blog post is based off of this starter kit by [Web Dev Cody](https://webdevcody.com/): https://github.com/webdevcody/wdc-saas-starter-kit

I have taken the relevant parts from the starter kit to accomplish the goal in question and made some minor changes / additions along the way.

## Git repo for this blog post

https://github.com/justin-calleja/next-google-auth-blog-post

(if you find an issue with the snippets here, best to refer to `main` branch in this repo).

## Get required env vars

Let's start by getting the required client id / secret from [console.cloud.google.com](https://console.cloud.google.com/)

- Create new project (call it what you want) and select it after it's done being created.
- From sidebar hamburger menu; go to "APIs & Services" -> "OAuth Consent Screen". Click the "get started" button and fill in the form.
- Again from sidebar hamburger menu; go to "APIs & Services" -> Credentials; Then add an OAuth Client Id
  - Select "web application" for app type and name it something.
  - For "Authorized JavaScript origins", we don't have a deployed app with a domain name yet so put something like `http://localhost:3000` for now.
  - For "Authorized redirect URIs", same situation re the domain but we'll need a path our Next.js app will handle soon. Let's say this will be: `http://localhost:3000/api/sign-in/google/callback`
- After clicking create, copy / paste the given client id and secret in your next.js app's `.env` file:

```
GOOGLE_CLIENT_ID="copy this over"
GOOGLE_CLIENT_SECRET="copy this over"
```

## Setup drizzle

### Install drizzle

```
pnpm add drizzle-orm pg dotenv
pnpm add -D drizzle-kit tsx @types/pg
```

### Run postgres

To run postgres locally, I'll use `docker-compose` with this `docker-compose.yml` file:

```
services:
  postgres:
    image: postgres:15.1
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: pass234
    ports:
      - '5432:5432'
    volumes:
      - next-google-auth-db:/data/blog-next-google-auth-db
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

volumes:
  next-google-auth-db:
```

The `next-google-auth-db` volume is so the data is persisted after stopping the container and the addition of `init-db.sql` is just so I create a new db to work with:

```sql
-- init-db.sql
CREATE DATABASE "next-google-auth-db";
```

That way - with postgres running with `docker-compose up` - I can connect to the db with:

```
psql -h localhost -p 5432 -U admin -d next-google-auth-db
# pass234

next-google-auth-db=# \l
                                                      List of databases
        Name         | Owner | Encoding | Locale Provider |  Collate   |   Ctype    | Locale | ICU Rules | Access privileges
---------------------+-------+----------+-----------------+------------+------------+--------+-----------+-------------------
 next-google-auth-db | admin | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           |
 postgres            | admin | UTF8     | libc            | en_US.utf8 | en_US.utf8 |        |           |
```

That's a separate db for drizzle - we can safely drop and re-create it. The `postgres` db may or may not be something we want to drop so casually.

(you can also use `./node_modules/.bin/drizzle-kit studio` to interact with the db - or your fav db client).

### Define table schemas

Next, I'll define a `tmp_user` and `tmp_session` table:

```ts
import { index, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('tmp_user', {
  id: serial('id').primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  given_name: text('given_name'),
  family_name: text('family_name'),
  picture: text('picture'),
});

export const sessions = pgTable(
  'tmp_session',
  {
    id: text('id').primaryKey(),
    userId: serial('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)]
);

export type User = typeof users.$inferSelect;

export type Session = typeof sessions.$inferSelect;
```

When a user in `tmp_user` is deleted, we're telling the db to delete all sessions with the deleted user's id (that's what the "onDelete cascade" part is doing) and, there's an index on the session table's `userId` because we can expect to be searching on that when e.g. a user wants to sign out of all signed-in devices.

### Make the db reflect the schema

To do this, drizzle needs our db connection info so add this to the `.env`:

```
DATABASE_URL="postgresql://admin:pass234@localhost:5432/next-google-auth-db"
```

Then run `drizzle-kit generate` to generate a migrationn (DDL scripts) and `drizzle-kit migrate` to run the migration which should result in a db structure as defined in our `schema.ts`

```sh
pnpm exec drizzle-kit generate
# or: npx drizzle-kit generate
# or: ./node_modules/.bin/drizzle-kit generate

pnpm exec drizzle-kit migrate
```

```
next-google-auth-db=# \d tmp_user;
                               Table "public.tmp_user"
   Column    |  Type   | Collation | Nullable |               Default
-------------+---------+-----------+----------+--------------------------------------
 id          | integer |           | not null | nextval('tmp_user_id_seq'::regclass)
 email       | text    |           |          |
 name        | text    |           |          |
 given_name  | text    |           |          |
 family_name | text    |           |          |
 picture     | text    |           |          |
Indexes:
    "tmp_user_pkey" PRIMARY KEY, btree (id)
    "tmp_user_email_unique" UNIQUE CONSTRAINT, btree (email)
Referenced by:
    TABLE "tmp_session" CONSTRAINT "tmp_session_userId_tmp_user_id_fk" FOREIGN KEY ("userId") REFERENCES tmp_user(id) ON DELETE CASCADE

next-google-auth-db=# \d tmp_session;
                                          Table "public.tmp_session"
   Column   |           Type           | Collation | Nullable |                    Default
------------+--------------------------+-----------+----------+-----------------------------------------------
 id         | text                     |           | not null |
 userId     | integer                  |           | not null | nextval('"tmp_session_userId_seq"'::regclass)
 expires_at | timestamp with time zone |           | not null |
Indexes:
    "tmp_session_pkey" PRIMARY KEY, btree (id)
    "sessions_user_id_idx" btree ("userId")
Foreign-key constraints:
    "tmp_session_userId_tmp_user_id_fk" FOREIGN KEY ("userId") REFERENCES tmp_user(id) ON DELETE CASCADE
```

## Next.js setup

### A button to sign in with

With all that db legwork out of the way, lets switch to some Next.js prep work and set up `shadcn`.

Delete the contents of `globals.css` except for the tailwind import at the top; and then run:

```sh
pnpm dlx shadcn@latest init
```

… or the equivalent for your package manager - see https://ui.shadcn.com/docs/installation/next

Then add the button component with `pnpm dlx shadcn@latest add button`. Now, use this component in a page - I'll introduce an `(auth)` route group and put the button in: `src/app/(auth)/sign-in/page.tsx`:

```tsx
// src/app/(auth)/sign-in/page.tsx

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Link href={authPaths.oauthStep1}>
        <Button className="cursor-pointer">Continue with Google</Button>
      </Link>
    </div>
  );
}

// src/lib/paths.ts

export const authPaths = {
  oauthStep1: '/api/sign-in/google',
  oauthStep2: '/api/sign-in/google/callback',
  signinSuccessRedirect: '/dashboard',
  signin: '/sign-in',
};
```

### OAuth 2.0

Finally, we get to the meat of this exercise. However, I do not intend to write an OAuth 2.0 client by hand. Copying the starter kit, I'll install [arctic](https://arcticjs.dev/) with `pnpm add arctic`. That way, I don't have to deal with the minutiae of OAuth 2.0 - nor the differences in requirements if I decide to support other providers in the future (e.g. login with Github - you can find the list of providers it supports on its website).

We'll be adding 2 endpoints to make this work.

1. The endpoint our button is linking to i.e. `/api/sign-in/google`. This endpoint will use `arctic` to create an authorization URL which we will redirect users to (i.e. we will redirect them to Google with this URL). In this URL, we'll add our intent to access the user's profile and email (asking for profile otherwise we won't get the user's actual name). See https://developers.google.com/identity/protocols/oauth2/scopes for more on Google scopes.
   - This (Next.js) endpoint - apart from generating an authroization URL and redirecting to it - will also take care of setting secure HTTP-only cookies for the state and code verifier used when generating the authorization URL. These will be used by our 2nd (callback) endpoint to verify the callback request made by Google to us.
2. After the user is redirected to Google, they will choose an account to sign in with and then Google will redirect them back to us - to a "callback" endpoint on our Next.js server - the one we configured at the start in the Google console: `api/sign-in/google/callback`
   - In this callback Google makes to us, Google adds some URL params - one of which is a `code` we need to validate using the code verifier we stored in a cookie in the previous endpoint of ours.
   - Validating the code gives us back an access token we can use to request the info we're after (we specified this via the scopes we requested). This Bearer access token needs to be added as an `Authorization` header to a request to: `https://openidconnect.googleapis.com/v1/userinfo`

In summary:

- Sign-in button click goes to a route which generates a URL to Google and redirects user there.
- User signs in with Google and is then redirected back to us with a code.
- We verify this code with some info we kept in cookies
- We get back an access token in exchange for verifing the code and we can finally use this access token to get what we want - user details from Google's OpenID Connect API.

#### Sign-in button handling route

This is what that all ends up looking like in code for the 1st endpoint. In `src/lib/auth.ts` there's the `googleAuth` client from `arctic` that helps with the parts of this flow that need to be tailored for Google:

```ts
//
// src/lib/auth.ts
//

import 'server-only';
import { Google } from 'arctic';

export const googleAuth = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.HOST_NAME}/api/sign-in/google/callback`
);

//
// src/app/(auth)/api/sign-in/google/route.ts
//

import { cookies } from 'next/headers';
import { generateCodeVerifier, generateState } from 'arctic';
import { googleAuth } from '@/lib/auth';

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = await googleAuth.createAuthorizationURL(state, codeVerifier, ['profile', 'email']);

  const allCookies = await cookies();

  allCookies.set('google_oauth_state', state, {
    secure: true,
    path: '/',
    httpOnly: true,
    maxAge: 60 * 10,
  });

  allCookies.set('google_code_verifier', codeVerifier, {
    secure: true,
    path: '/',
    httpOnly: true,
    maxAge: 60 * 10,
  });

  return Response.redirect(url);
}
```

#### Google's redirect handling route

Clicking that button now should take you to Google where you can choose the account to sign-in with. Google will then redirect you to the endpoint implemented below:

```ts
// src/app/(auth)/api/sign-in/google/callback/route.ts

import { cookies } from 'next/headers';
import { googleAuth } from '@/auth';
import { authPaths } from '@/lib/paths';
import { setSession } from '@/lib/session';
import { findUserByEmail, updateUserById } from '@/data-access/users';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const allCookies = await cookies();
  const storedState = allCookies.get('google_oauth_state')?.value ?? null;
  const codeVerifier = allCookies.get('google_code_verifier')?.value ?? null;

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return new Response(null, {
      status: 400,
    });
  }

  try {
    const tokens = await googleAuth.validateAuthorizationCode(code, codeVerifier);
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });

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
```

This one's a little custom for my use case. Basically, I get the user's info and try to find their email in my db. If I don't, then they are not an intended user of this "internal" app. If I do and I don't have their full details (like profile pic, name etc...), then I try fill in the missing details.

On error, I redirect back to the sign-in page with some query params so that page can inform the user of what went wrong.

The initial part is as explained before and identical to the code in the starter kit. We take values from the query params (sent to us from Google); we take values form the cookies (set by us in previous endpoint); we verify the code to get an access token which we can call Google's API to get the user info our app needs.

Btw - the sub field (in `GoogleUser` (the response)) is part of the OpenID Connect standard (not Google specific) - it's the canonical way to identify users across OAuth providers.

> Warning: When implementing your account management system, you shouldn't use the email field in the ID token as a unique identifier for a user. Always use the sub field as it is unique to a Google Account even if the user changes their email address.
>
> An identifier for the user, unique among all Google Accounts and never reused. A Google Account can have multiple email addresses at different points in time, but the sub value is never changed. Use sub within your application as the unique-identifier key for the user. Maximum length of 255 case-sensitive ASCII characters.
>
> https://developers.google.com/identity/openid-connect/openid-connect#discovery

That said - this app is the way it is… The way I see it being used (if it is actually used) is me being given email addresses to add to the app. I'm not going to try figure out an account's sub value and use that to allow them in or not. Email works well.

### Session

#### Setting the session

I relaise there's some missing code in the snippet above e.g. the `setSession` implementation. You can view the full source here: https://github.com/justin-calleja/next-google-auth-blog-post

This is pretty much just copying over code from the starter kit.

```ts
export const setSession = async (userId: UserId) => {
  const token = generateSessionToken();
  const session = await createSession(token, userId);
  await setSessionTokenCookie(token, session.expiresAt);
};

// ----

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}
```

To set a session, we generate a token by filling up an array with random values (using https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues - also `crypto` is available on the browser and Node.js so that's why it's not imported anywhere). Then it's encoded using `@oslojs/encoding` dep.

Then, in `createSession` we hash this token before storing it in the db (similar to how a password would be hashed before inserting it):

```ts
export async function createSession(token: string, userId: Session['userId']): Promise<Session> {
  const sessionId = hashToken(token);
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + SESSION_MAX_DURATION_MS),
  };
  await insertSession(session);
  return session;
}

// ----

const hashToken = (token: string) => {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
};
```

We set the unhashed token in the cookie (that stays on our server or user's device only - and we need to hash it when it's given to us to compare with db value) - and that basically completes setting the session.

#### Getting the session and checking it's still valid or not

Getting the session is just getting it from the cookie:

```ts
const SESSION_COOKIE_NAME = 'session';

export async function getSessionToken(): Promise<string | undefined> {
  const allCookies = await cookies();
  const sessionCookie = allCookies.get(SESSION_COOKIE_NAME)?.value;
  return sessionCookie;
}
```

Important: as is done in the starter kit, we start each `page.tsx` that needs to be "signed-in" only with a call to:

```ts
export const assertAuthenticated = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error(AUTHENTICATION_ERROR_MESSAGE);
  }
  return user;
};
```

E.g. in the dashboard page in `src/app/dashboard/page.tsx`:

```ts
import { assertAuthenticated } from "@/lib/session";
import React from "react";

export default async function Dashboard() {
  const user = await assertAuthenticated();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl">
          Hello <span className="font-bold">{user.given_name}</span>
        </h1>
      </div>
    </div>
  );
}
```

This basically gives us the logged in user or errors out. If it does error out, there's a top level `error.tsx` to handle it. It uses the `error.message` to determine the UI to show and uses anchor tags instead of Next.js's `Link` component to go to `/sign-in` to trigger a server render of that page.

Maybe there's a better way to do this but I wanted to avoid adding new dedicated page just to render each different error that could come up. Anyway, I ended up having to use plain anchor tags as I wanted to render the UI again - and since it's just a server component - it won't do that... maybe I could have put the getting the search params in a client component - I render within the server component and throw error in the client component based on the query params but it works well enough like this so I didn't try that approach.

i.e. I ended up changing the `/sign-in/page.tsx` server component to:

```tsx
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { authPaths } from "@/lib/paths";
import {
  UNAUTHORIZED_USER_ERROR_MESSAGE,
  SOMETHING_WENT_WRONG_ERROR_MESSAGE,
} from "@/lib/errors";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorType = params.error;

  if (errorType === "unauthorized") {
    throw new Error(UNAUTHORIZED_USER_ERROR_MESSAGE);
  }

  if (errorType === "something-went-wrong") {
    throw new Error(SOMETHING_WENT_WRONG_ERROR_MESSAGE);
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Link href={authPaths.oauthStep1}>
        <Button className="cursor-pointer">Continue with Google</Button>
      </Link>
    </div>
  );
}
```

But honestly, this is getting off topic now. Best to examine the repo if you're interested.

At this point we have the sign in with Google; the session and it's validation; and there's also some session extension logic when we validate the token which happens whenever a protected page is accessed via the `assertAuthenticated` we've just looked at (whose primary purpose is to kick unauthorised users out).

All in all - I think this accomplishes the goal I had in mind.
