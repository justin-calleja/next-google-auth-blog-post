import { auth } from "@/auth";
import React from "react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }

  return <>Welcome to the dashboard</>;
}
