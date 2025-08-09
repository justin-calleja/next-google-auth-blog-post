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
