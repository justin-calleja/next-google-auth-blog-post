"use client";

import { Button } from "@/components/ui/button";
import { 
  AUTHENTICATION_ERROR_MESSAGE, 
  UNAUTHORIZED_USER_ERROR_MESSAGE,
  SOMETHING_WENT_WRONG_ERROR_MESSAGE 
} from "@/lib/errors";
import Link from "next/link";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const isAuthenticationError = error.message.includes(
    AUTHENTICATION_ERROR_MESSAGE
  );
  const isUnauthorizedError = error.message.includes(
    UNAUTHORIZED_USER_ERROR_MESSAGE
  );
  const isSomethingWentWrongError = error.message.includes(
    SOMETHING_WENT_WRONG_ERROR_MESSAGE
  );

  // Common card container style
  const cardContainer = "min-h-screen flex items-center justify-center bg-gray-50";
  const cardContent = "max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center";
  const iconContainer = "mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4";
  const warningIcon = (
    <svg
      className="w-8 h-8 text-red-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );

  if (isAuthenticationError) {
    return (
      <div className="container mx-auto py-12 min-h-screen space-y-8">
        <h1 className="text-4xl font-bold text-center">Oops! You Need to Be Logged In</h1>
        <p className="text-lg text-center">To access this page, please log in first.</p>
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isUnauthorizedError) {
    return (
      <div className={cardContainer}>
        <div className={cardContent}>
          <div className="mb-6">
            <div className={iconContainer}>
              {warningIcon}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Not Authorized
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Your email address is not authorized to access this application. 
              Access is manually granted by the administrator.
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              If you believe you should have access, please contact the administrator 
              to add your email address to the authorized users list.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-in">
                <Button variant="outline" className="w-full sm:w-auto">
                  Try Different Account
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full sm:w-auto">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSomethingWentWrongError) {
    return (
      <div className={cardContainer}>
        <div className={cardContent}>
          <div className="mb-6">
            <div className={iconContainer}>
              {warningIcon}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <div className="text-gray-600 leading-relaxed">
              <p className="py-2">
                Please create a ticket with the steps you took to end up here.
              </p>
              <p>Thank you 🙏</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-in">
                <Button variant="outline" className="w-full sm:w-auto">
                  Try Different Account
                </Button>
              </Link>
              <Link href="/">
                <Button className="w-full sm:w-auto">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for any other errors
  return (
    <div className="container mx-auto py-12 min-h-screen space-y-8">
      <h1 className="text-4xl font-bold text-center">Oops! Something went wrong</h1>
      <p className="text-lg text-center">{error.message}</p>
    </div>
  );
}
