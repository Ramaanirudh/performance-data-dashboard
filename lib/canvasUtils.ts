export function setupHighResCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const dpr = window.devicePixelRatio || 1;
  // Get CSS size
  const rect = canvas.getBoundingClientRect();
  
  // Set actual size in memory (scaled to account for extra pixel density)
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // Normalize coordinate system to use css pixels
  context.scale(dpr, dpr);
  
  return { width: rect.width, height: rect.height, dpr };
}

export function measureRenderTime(renderFn: () => void): number {
  const start = performance.now();
  renderFn();
  return performance.now() - start;
}
