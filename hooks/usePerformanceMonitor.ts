'use client';
import { useState, useEffect } from 'react';

class MetricsStore {
  renderTimeMs = 0;
  dataProcessingMs = 0;
  datasetSize = 0;
  updateFreqMs = 0;
}
export const globalMetrics = new MetricsStore();

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memoryMB: null as number | null,
    interactionLatency: null as number | null,
    renderTime: 0,
    dataProcessing: 0,
    datasetSize: 0,
    updateFreq: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = (currentTime: number) => {
      frameCount++;
      const elapsed = currentTime - lastTime;
      
      if (elapsed >= 1000) {
        const currentFPS = (frameCount * 1000) / elapsed;
        let memory = null;
        if ((performance as any).memory) {
          memory = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
        }

        setMetrics(prev => ({
          ...prev,
          fps: currentFPS,
          memoryMB: memory,
          renderTime: globalMetrics.renderTimeMs,
          dataProcessing: globalMetrics.dataProcessingMs,
          datasetSize: globalMetrics.datasetSize,
          updateFreq: globalMetrics.updateFreqMs,
        }));

        frameCount = 0;
        lastTime = currentTime;
      }
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if ('processingStart' in entry) {
            const latency = (entry as any).processingStart - entry.startTime;
            setMetrics(prev => ({ ...prev, interactionLatency: latency }));
          }
        }
      });
      observer.observe({ type: 'event', buffered: true });
    } catch (e) {
      // Browser doesn't support event timing API
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (observer) observer.disconnect();
    };
  }, []);

  return metrics;
}
