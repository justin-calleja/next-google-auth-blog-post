import { assertAuthenticated } from "@/lib/session";
import React from "react";

export default async function Dashboard() {
  const user = await assertAuthenticated();

  return <div>Hello {user.given_name}</div>;
}
