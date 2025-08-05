import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <>
      <Link href="/api/login/google">
        <Button className="cursor-pointer m-4">Continue with Google</Button>
      </Link>
    </>
  );
}
