import { useEffect, useRef, useCallback } from 'react';
import { setupHighResCanvas, measureRenderTime } from '@/lib/canvasUtils';

type RenderCallback = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

export function useChartRenderer(renderFn: RenderCallback, dependencies: any[] = []) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTimeRef = useRef<number>(0);
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Only resize if needed (e.g. initial or after container resize)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
      setupHighResCanvas(canvas, ctx);
    }
    
    renderTimeRef.current = measureRenderTime(() => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      renderFn(ctx, rect.width, rect.height);
    });
  }, [renderFn, ...dependencies]);

  useEffect(() => {
    let animationFrameId: number;
    
    const renderLoop = () => {
      draw();
      // Since we are triggered by data changes, we don't need a perpetual loop,
      // but we use requestAnimationFrame to safely batch the update and stay performant
    };
    
    animationFrameId = requestAnimationFrame(renderLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [draw]);
  
  // Handle container resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(draw);
    });
    
    resizeObserver.observe(canvas);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [draw]);

  return { canvasRef, renderTimeRef, draw };
}
