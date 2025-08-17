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
import { handlers } from "@/auth" // Referring to the auth.ts we just created
export const { GET, POST } = handlers
```

Then:

> Add optional Middleware to keep the session alive, this will update the session expiry every time its called.

```ts
export { auth as middleware } from "@/auth"
```

Here's the first thing I prefer the other repo's approach for. Unless I figure out how to customize this - it's magic. I'm sure there must be a way but here's the first instance were I'm trading off ease of not having to set session extension up myself v.s. ability to easily (in my own codebase) customise it.

Next doc page:

> Auth.js by default saves the session in a cookie using encrypted JSON Web Tokens so that you don’t need to setup a database. However, if you want to persist user data you can set up a database by using one of our official database adapters or create your own.

I'll be storing the session in a database and sending back secure cookies as per the previous blog post.

> Can I set up more than one authentication method?
>
> Yes! You can setup as many authentication methods as you’d like. However, when using a database, if you have multiple providers set up Auth.js will attempt to link them together. For example, if a user has already signed in with GitHub, and therefore has a User and Account table entry associated with that Email, and they then attempt to signin with another method using the same email address, then the two accounts will be linked. See the FAQ for more information on account linking.

Here I'm getting "extra" stuff over and above my requirement - that of signup only via Google for an internal app. This is OK though. First of all, I knew this would happen and that's exactly why I chose the first approach in the previous blog post. I wanted to control exactly which db tables are created and what schema they'll have. I wanted to control what happens on login (fill in any missing data - e.g. I would fill in a row in the user table with my email (that's "signing up" in my app), and when I sign in for the first time, it will take the rest of my profile data like my pic and add it to the user table row of mine - stuff like that - so I figured manual is best - but there's probably hooks to accomplish this and extra db tables and columns v.s. increased productivity and less code to maintain - ye I want to know what options I have).
