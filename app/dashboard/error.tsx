'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
      <h2 className="text-xl font-bold text-red-500">Something went wrong!</h2>
      <p className="text-gray-400">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
