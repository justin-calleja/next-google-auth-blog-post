---
title: Google sign-in with Next.js and Auth.js
published: false
description:
tags: nextjs, oauth2, authjs
# cover_image: https://direct_url_to_image.jpg
# Use a ratio of 100:42 for best results.
# published_at: 2025-07-11 10:36 +0000
---

## Intro

[Previously](https://dev.to/justincalleja/google-sign-in-with-nextjs-4lnn), I created a dummy Next.js project to experiment setting up Google signin. I wanted only the signin feature without signup or any extra db tables and logic. So I opted to try picking the parts I wanted from a boilerplate implementation (see that post or README of `main` branch in this repo).

It did work out, and I got the "small surface area" I was looking for but I know there are libraries with a lot more features to set this up and want to try again - this time with… [Auth.js](https://authjs.dev/getting-started/installation?framework=pnpm) apparently, I remember it as NextAuth - but seems like I should be checking out Auth.js since that's where it seems they're heading. Planning to try out [better-auth](https://www.better-auth.com/) after this.

Anyway, I've wiped out the previous Next.js app and created a new one. I kept the docker stuff and intend to create a new db for this (drizzle should work fine as I'm expecting it to create its own schema in this new db on the same postgres db server).

### Installation

`pnpm add next-auth@beta`

… hmm "beta" - guess I'll have to try out NextAuth v4 if this doesn't work out.

Speaking about not working out - Next.js running with turbopack didn't work out for me right out of the box in a monorepo using `.js` extensions in imports - something which TS forces you to do when using:

```json
		"module": "NodeNext",
		"moduleResolution": "NodeNext",
```

compiler options (package.json type module). I was source exporting the TS files and relying on Next.js to bundle them. Still burnt by that and had to rant a little. (solution was to `next.config.ts` webpack and use `config.resolve.extensionAlias` - see issues in nextjs repo - also they don't seem to think it's a problem from the closed issues - rant off).

Next:

> The only environment variable that is mandatory is the AUTH_SECRET. This is a random value used by the library to encrypt tokens and email verification hashes. (See Deployment to learn more). You can generate one via the official Auth.js CLI running:
>
> `npx auth secret`

Then add:

```src/auth.ts
import NextAuth from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
})
```

And I'll ad this in the `(auth)` route group to keep it consistent with the previous blog post:

Add a Route Handler under `/app/(auth)/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth"; // Referring to the auth.ts we just created
export const { GET, POST } = handlers;
```

Then:

> Add optional Middleware to keep the session alive, this will update the session expiry every time its called.

```ts
export { auth as middleware } from "@/auth";
```

Here's the first thing I prefer the other repo's approach for. Unless I figure out how to customize this - it's magic. I'm sure there must be a way but here's the first instance were I'm trading off ease of not having to set session extension up myself v.s. ability to easily (in my own codebase) customise it.

Next doc page:

> Auth.js by default saves the session in a cookie using encrypted JSON Web Tokens so that you don’t need to setup a database. However, if you want to persist user data you can set up a database by using one of our official database adapters or create your own.

I'll be storing the session in a database and sending back secure cookies as per the previous blog post.

> Can I set up more than one authentication method?
>
> Yes! You can setup as many authentication methods as you’d like. However, when using a database, if you have multiple providers set up Auth.js will attempt to link them together. For example, if a user has already signed in with GitHub, and therefore has a User and Account table entry associated with that Email, and they then attempt to signin with another method using the same email address, then the two accounts will be linked. See the FAQ for more information on account linking.

Here I'm getting "extra" stuff over and above my requirement - that of signup only via Google for an internal app. This is OK though. First of all, I knew this would happen and that's exactly why I chose the first approach in the previous blog post. I wanted to control exactly which db tables are created and what schema they'll have. I wanted to control what happens on login (fill in any missing data - e.g. I would fill in a row in the user table with my email (that's "signing up" in my app), and when I sign in for the first time, it will take the rest of my profile data like my pic and add it to the user table row of mine - stuff like that - so I figured "semi-manual" is best - but there's probably hooks to accomplish this and extra db tables and columns v.s. increased productivity and less code to maintain - ye I want to know what options I have).

### Register OAuth App in Google's dashboard

> First you have to setup an OAuth application on the Google developers dashboard.

I go over that in my [previous post](https://dev.to/justincalleja/google-sign-in-with-nextjs-4lnn) (read the "Get required env vars" section - **however** note that the callback URL must change here to align with how Auth.js is set up - read on).

So previously:

```sh
git --no-pager show main:src/lib/paths.ts
export const authPaths = {
  oauthStep1: "/api/sign-in/google",
  oauthStep2: "/api/sign-in/google/callback",
  signinSuccessRedirect: "/dashboard",
  signin: "/sign-in",
};
```

i.e. `oauthStep2` says the Google project I set up previously calls the app back on `/api/sign-in/google/callback`

Auth.js is expecting: `[origin]/api/auth/callback/google` - so I'll create another Google project and set it up similarly except for the callback URL.

Then I'll put the client id and secret in `.env.local` where that `AUTH_SECRET` env var was generated (via `npx auth secret`).

> Many providers only allow you to register one callback URL at a time. Therefore, if you want to have an active OAuth configuration for development and production environments, you'll need to register a second OAuth app in the Google dashboard for the other environment(s).
>
> https://authjs.dev/getting-started/authentication/oauth

"active" because you could change it to use your app's domain name but then you don't get to keep the localhost one.

Also note that the env vars are called differently here:

```
AUTH_GOOGLE_ID={CLIENT_ID}
AUTH_GOOGLE_SECRET={CLIENT_SECRET}
```

> Auth.js will automatically pick up these if formatted like the example above. You can also use a different name for the environment variables if needed, but then you’ll need to pass them to the provider manually.
>
> https://authjs.dev/getting-started/authentication/oauth

### Setup Provider in `NextAuth`

In `src/auth.ts`

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
});
```

… and for the route handler `./app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

Then the docs show a server component or client component based sign in (basically either importing the `signin` we exported from our `auth.ts` file above or get the one from `"next-auth/react"` for the client component):

```tsx
// server component:

import { signIn } from "@/auth"
 
export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("google")
      }}
    >
      <button type="submit">Signin with Google</button>
    </form>
  )
}
```

```tsx
"use client"

import { signIn } from "next-auth/react"
 
export default function SignIn() {
  return <button onClick={() => signIn("google")}></button>
}
```

And then "Ship it!" - hmm ok lets actually put it on a page first - and see what's on that `auth` variable we're returning from `src/auth.ts`. In `src/app/page.tsx`:

```ts
import { auth } from "@/auth";
import SignIn from "@/components/sign-in";

export default async function Home() {
  // https://authjs.dev/getting-started/session-management/get-session?framework=Next.js
  const session = await auth()
  console.log(session);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <SignIn />
    </div>
  );
}
```

After signing in, you should see the session info logged out on the server (and the client console actually - with a "Server" tag or "pill" whatever you call it - nice touch - assuming it's only for dev mode 🤪).

### POST?

Ok so I went ahead and made a `SignOut` component - basically just like the `SignIn` one but using the `signOut` I'm exporting from `src/auth.ts`. Then before trying to sign in again, I removed the `POST` export from `./app/api/auth/[...nextauth]/route.ts`, i.e. the code that handles requests to any path after `/api/auth`.

In the previous blog post, I was using:

```ts
export const authPaths = {
  oauthStep1: "/api/sign-in/google",
  oauthStep2: "/api/sign-in/google/callback",
  // ...
};
```

i.e. a "Sign in with google" button would start the process by `GET /api/sign-in/google` and then when the user is done at Google; Google calls us with `GET /api/sign-in/google/callback`.

So not sure what the `POST` is for. What we're differing with is where the session is stored. Previously using a db and currently (at least so far), it's kept on http only cookie from what I can tell.

So anyway, removing `POST` still works. I think I'll just keep it like that and see what goes wrong.

### Loose ends

#### Dashboard redirect

Now I'll try to shape the solution so far to behave like I had it previously using `arctic` + boilerplate code. For one, we redirected to another page after signing in. That's pretty easy to find on docs under "Session Management":

> Once authenticated, the user will be redirected back to the page they started the signin from. If you want the user to be redirected somewhere else after sign in (.i.e /dashboard), you can do so by passing the target URL as redirectTo in the sign-in options.
>
> https://authjs.dev/getting-started/session-management/login?framework=Next.js


```ts
// src/components/sign-in.tsx
await signIn("google", { redirectTo: "/dashboard" });
```

And add an `app/dashboard/page.tsx`

```tsx
import { auth } from "@/auth";
import React from "react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }

  return <>Welcome to the dashboard</>;
}
```

and a `src/app/error.tsx`

```ts
"use client";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div>
      <div>{error.message}</div>
    </div>
  );
}
```

If you log out and try visiting `/dashboard`, you should be kicked out and if you sign in from `/` you should be redirected to `/dashboard` on successful signin.

#### Database session
