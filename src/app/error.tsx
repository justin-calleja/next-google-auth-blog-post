"use client";

export default function ErrorPage({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div>
      <div>{error.message}</div>
    </div>
  );
}
