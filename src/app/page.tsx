import { auth } from "@/auth";
import SignIn from "@/components/sign-in";
import SignOut from "@/components/sign-out";

export default async function Home() {
  // https://authjs.dev/getting-started/session-management/get-session?framework=Next.js
  const session = await auth();
  console.log(session);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <SignIn />
      <SignOut />
    </div>
  );
}
