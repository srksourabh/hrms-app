"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootPage Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f4]">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">⚠️</div>
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="mb-4 text-sm text-slate-600">
          The page could not load. Please try again.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-xs font-semibold text-slate-500">
              Error details
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-100 p-2 text-xs text-red-600">
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-slate-950 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
