'use client';

import { useChartRenderer } from '@/hooks/useChartRenderer';
import { DataPoint } from '@/lib/types';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';

interface HeatmapProps {
  data: DataPoint[];
}

const CATEGORIES = ['Alpha', 'Beta', 'Gamma'];

export const Heatmap = React.memo(function Heatmap({ data }: HeatmapProps) {
  const [renderTime, setRenderTime] = useState(0);
  
  // Interactive state
  const scaleXRef = useRef(1);
  const offsetXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const interactionRef = useRef<HTMLDivElement>(null);
  
  // Tooltip state
  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, cat: string, count: number } | null>(null);

  // Group data by time buckets to prevent iterating 100k points in the render loop constantly
  const renderCanvas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (data.length === 0) return;

    const scale = scaleXRef.current;
    const offset = offsetXRef.current;
    
    // Calculate global bounds
    const minTime = data[0].timestamp;
    const maxTime = data[data.length - 1].timestamp;
    const timeRange = Math.max(maxTime - minTime, 1);
    
    // Base bucket resolution
    const numBuckets = Math.floor(100 * scale);
    const bucketWidth = width / numBuckets;
    
    // Create density map
    const densityMap: Record<string, number[]> = {
      Alpha: new Array(numBuckets).fill(0),
      Beta: new Array(numBuckets).fill(0),
      Gamma: new Array(numBuckets).fill(0),
    };
    
    let maxDensity = 0;
    
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      const pct = (p.timestamp - minTime) / timeRange;
      const virtualX = (pct * width * scale) + offset;
      
      // Only bucket if it's within the visible viewport bounds roughly
      if (virtualX >= -bucketWidth && virtualX <= width + bucketWidth) {
        const bucketIndex = Math.floor((pct * numBuckets));
        if (bucketIndex >= 0 && bucketIndex < numBuckets && densityMap[p.category]) {
          densityMap[p.category][bucketIndex]++;
          if (densityMap[p.category][bucketIndex] > maxDensity) {
            maxDensity = densityMap[p.category][bucketIndex];
          }
        }
      }
    }
    
    const rowHeight = height / CATEGORIES.length;

    // Draw Heatmap cells
    CATEGORIES.forEach((cat, yIndex) => {
      const rowY = yIndex * rowHeight;
      const buckets = densityMap[cat];
      
      for (let b = 0; b < numBuckets; b++) {
        const count = buckets[b];
        if (count > 0) {
          const x = (b * bucketWidth) + offset;
          const normalizedDensity = Math.max(0.1, count / Math.max(maxDensity, 1)); // alpha between 0.1 and 1
          
          let r = 0, g = 0, bColor = 0;
          if (cat === 'Alpha') { r = 59; g = 130; bColor = 246; }
          else if (cat === 'Beta') { r = 239; g = 68; bColor = 68; }
          else if (cat === 'Gamma') { r = 16; g = 185; bColor = 129; }
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${bColor}, ${normalizedDensity})`;
          // Draw cell slightly larger to prevent subpixel gaps
          ctx.fillRect(x, rowY, bucketWidth + 1, rowHeight);
        }
      }
    });

    // Draw hover highlight
    if (hoverInfo) {
      const catIndex = CATEGORIES.indexOf(hoverInfo.cat);
      if (catIndex >= 0) {
        const rowY = catIndex * rowHeight;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(hoverInfo.x, rowY, bucketWidth, rowHeight);
      }
    }

  }, [data, hoverInfo]);

  const { canvasRef, renderTimeRef, draw } = useChartRenderer(renderCanvas, [data, hoverInfo]);

  const requestDraw = useCallback(() => {
    requestAnimationFrame(() => {
       if (canvasRef.current) draw();
    });
  }, [draw]);

  useEffect(() => {
    const el = interactionRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomFactor = 1.1;
      const direction = e.deltaY < 0 ? 1 : -1;
      const zoomMultiplier = direction > 0 ? zoomFactor : 1 / zoomFactor;
      
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      
      if (mouseX < 0) return;
      
      const oldScale = scaleXRef.current;
      let newScale = oldScale * zoomMultiplier;
      newScale = Math.max(1, Math.min(newScale, 100));
      
      const scaleRatio = newScale / oldScale;
      offsetXRef.current = mouseX - (mouseX - offsetXRef.current) * scaleRatio;
      scaleXRef.current = newScale;
      
      if (offsetXRef.current > 0) offsetXRef.current = 0;
      
      requestDraw();
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleNativeWheel);
  }, [requestDraw]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMouseXRef.current;
      offsetXRef.current += deltaX;
      if (offsetXRef.current > 0) offsetXRef.current = 0;
      
      lastMouseXRef.current = e.clientX;
      setHoverInfo(null);
      requestDraw();
      return;
    }
    
    if (data.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
      setHoverInfo(null);
      return;
    }

    const scale = scaleXRef.current;
    const offset = offsetXRef.current;
    const numBuckets = Math.floor(100 * scale);
    const bucketWidth = rect.width / numBuckets;
    const rowHeight = rect.height / CATEGORIES.length;
    
    const virtualX = mouseX - offset;
    const bucketIndex = Math.floor(virtualX / bucketWidth);
    const catIndex = Math.floor(mouseY / rowHeight);
    
    if (catIndex >= 0 && catIndex < CATEGORIES.length && bucketIndex >= 0 && bucketIndex < numBuckets) {
      const snapX = (bucketIndex * bucketWidth) + offset;
      const cat = CATEGORIES[catIndex];
      // A full implementation would recount here to show density in tooltip, but for performance we'll just show location.
      setHoverInfo({ x: snapX, y: (catIndex * rowHeight) + (rowHeight / 2), cat, count: 0 });
    } else {
      setHoverInfo(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePointerLeave = () => {
    setHoverInfo(null);
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setRenderTime(renderTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [renderTimeRef]);

  return (
    <div className="relative w-full h-64 bg-[#0a0a0a] border border-gray-800 rounded overflow-hidden flex select-none">
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-30 pointer-events-none">
          No data available
        </div>
      )}

      {/* Y Axis (Categories) */}
      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-around py-0 items-end pr-2 text-[10px] text-gray-500 z-10 pointer-events-none bg-black/60">
        {CATEGORIES.map(cat => (
          <span key={cat} className="uppercase font-bold">{cat}</span>
        ))}
      </div>
      
      {/* Interaction Surface */}
      <div 
        ref={interactionRef}
        className="relative flex-1 ml-16 touch-none cursor-crosshair active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
      >
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
           <line x1="0" y1="33.3%" x2="100%" y2="33.3%" stroke="#222" strokeWidth="1" />
           <line x1="0" y1="66.6%" x2="100%" y2="66.6%" stroke="#222" strokeWidth="1" />
        </svg>

        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full z-0 block" 
        />
        
        {/* Tooltip */}
        {hoverInfo && (
          <div 
            className="absolute z-30 pointer-events-none transition-all duration-75"
            style={{ 
              left: hoverInfo.x,
              top: hoverInfo.y,
              transform: 'translate(-50%, -50%)',
              marginLeft: '20px'
            }}
          >
            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-gray-600">
              <div className="font-bold">{hoverInfo.cat}</div>
              <div className="text-gray-400">Time Segment</div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-green-400 font-mono z-20 shadow-lg border border-gray-700 pointer-events-none">
        Render: {renderTime.toFixed(2)}ms
      </div>
      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] text-gray-500 font-bold z-20 pointer-events-none uppercase tracking-wider">
        Heatmap
      </div>
    </div>
  );
});
