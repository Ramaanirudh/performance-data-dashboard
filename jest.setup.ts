import '@testing-library/jest-dom';

// Mock ResizeObserver for JSDOM
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(callback, 0) as any;
global.cancelAnimationFrame = (id: number) => clearTimeout(id);
