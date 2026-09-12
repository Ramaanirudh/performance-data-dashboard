import { setupHighResCanvas, measureRenderTime } from '@/lib/canvasUtils';

describe('Canvas Utilities', () => {
  it('sets up a high resolution canvas correctly', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Mock getBoundingClientRect
    canvas.getBoundingClientRect = () => ({ width: 800, height: 600, bottom: 0, left: 0, right: 0, top: 0, x: 0, y: 0, toJSON: () => {} });
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });

    const result = setupHighResCanvas(canvas, ctx);
    
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(result.width).toBe(800);
    expect(result.dpr).toBe(2);
  });
  
  it('measures render time', () => {
    const result = measureRenderTime(() => {
      // do nothing
    });
    expect(typeof result).toBe('number');
  });
});
