export function measureExecution<T>(fn: () => T): { data: T; executionTimeMs: number } {
  const start = performance.now();
  const data = fn();
  const end = performance.now();
  return {
    data,
    executionTimeMs: end - start,
  };
}
