import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Link href="/api/sign-in/google">
        <Button className="cursor-pointer">Continue with Google</Button>
      </Link>
    </div>
  );
}
