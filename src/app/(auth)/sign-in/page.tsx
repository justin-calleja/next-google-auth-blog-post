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
