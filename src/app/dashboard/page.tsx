import React from "react";

export default async function Dashboard() {
  const user = await assertAuthenticated();
  return <>Todo...</>;
}
