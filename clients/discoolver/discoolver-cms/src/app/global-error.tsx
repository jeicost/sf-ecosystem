"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <button
            onClick={reset}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
