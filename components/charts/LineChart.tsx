'use client';

import { useChartRenderer } from '@/hooks/useChartRenderer';
import { DataPoint } from '@/lib/types';
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';

interface LineChartProps {
  data: DataPoint[];
  category: string;
  color?: string;
}

export const LineChart = React.memo(function LineChart({ data, category, color = '#3b82f6' }: LineChartProps) {
  const [renderTime, setRenderTime] = useState(0);
  
  // Interactive state (React bypass for perf)
  const scaleXRef = useRef(1);
  const offsetXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const interactionRef = useRef<HTMLDivElement>(null);
  
  // Tooltip state
  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, point: DataPoint } | null>(null);

  const categoryData = useMemo(() => data.filter(d => d.category === category), [data, category]);
  const minVal = 0;
  const maxVal = 200;

  const renderCanvas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (categoryData.length === 0) return;

    const scale = scaleXRef.current;
    const offset = offsetXRef.current;
    
    // Find visible index range to cull out-of-bounds rendering
    const pointWidth = (width / Math.max(categoryData.length - 1, 1)) * scale;
    
    let startIndex = Math.floor(-offset / pointWidth);
    let endIndex = Math.ceil((width - offset) / pointWidth);
    
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(categoryData.length - 1, endIndex);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    
    for (let i = startIndex; i <= endIndex; i++) {
      const point = categoryData[i];
      const x = (i * pointWidth) + offset;
      const normalizedY = (point.value - minVal) / (maxVal - minVal);
      const y = height - (normalizedY * height);
      
      if (i === startIndex) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    // Draw hover dot directly on canvas
    if (hoverInfo) {
      const hoverIndex = categoryData.indexOf(hoverInfo.point);
      if (hoverIndex >= 0) {
        const hoverX = (hoverIndex * pointWidth) + offset;
        const normalizedY = (hoverInfo.point.value - minVal) / (maxVal - minVal);
        const hoverY = height - (normalizedY * height);
        
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.arc(hoverX, hoverY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }, [categoryData, hoverInfo, color]);

  const { canvasRef, renderTimeRef, draw } = useChartRenderer(renderCanvas, [categoryData, hoverInfo, color]);

  const requestDraw = useCallback(() => {
    requestAnimationFrame(() => {
       if (canvasRef.current) draw();
    });
  }, [draw]);

  // Native Wheel Event for non-passive zoom
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
      newScale = Math.max(1, Math.min(newScale, 100)); // Clamp scale
      
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
    
    // Hover logic
    if (categoryData.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    if (mouseX < 0 || mouseX > rect.width) {
      setHoverInfo(null);
      return;
    }
    
    const width = rect.width;
    const scale = scaleXRef.current;
    const offset = offsetXRef.current;
    
    const pointWidth = (width / Math.max(categoryData.length - 1, 1)) * scale;
    const rawIndex = (mouseX - offset) / pointWidth;
    let index = Math.round(rawIndex);
    index = Math.max(0, Math.min(categoryData.length - 1, index));
    
    const point = categoryData[index];
    if (point) {
      const snapX = (index * pointWidth) + offset;
      const normalizedY = (point.value - minVal) / (maxVal - minVal);
      const snapY = rect.height - (normalizedY * rect.height);
      
      setHoverInfo({ x: snapX, y: snapY, point });
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

  const gridLines = [0, 25, 50, 75, 100].map(pct => {
    const val = minVal + ((maxVal - minVal) * (pct / 100));
    return { pct, label: val.toFixed(0) };
  });

  return (
    <div className="relative w-full h-64 bg-[#0a0a0a] border border-gray-800 rounded overflow-hidden flex select-none">
      {categoryData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-30 pointer-events-none">
          No data available
        </div>
      )}

      {/* Y Axis */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2 items-end pr-2 text-xs text-gray-500 z-10 pointer-events-none bg-black/50">
        {gridLines.reverse().map((line, i) => (
          <span key={i}>{line.label}</span>
        ))}
      </div>
      
      {/* Interaction Surface */}
      <div 
        ref={interactionRef}
        className="relative flex-1 ml-12 touch-none cursor-crosshair active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
      >
        {/* SVG Grid Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
           {gridLines.map((line, i) => (
             <line 
               key={i} 
               x1="0" 
               y1={`${100 - line.pct}%`} 
               x2="100%" 
               y2={`${100 - line.pct}%`} 
               stroke="#222" 
               strokeWidth="1" 
             />
           ))}
        </svg>

        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full z-0 block" 
        />
        
        {/* Tooltip React State */}
        {hoverInfo && (
          <div 
            className="absolute z-30 pointer-events-none transition-all duration-75"
            style={{ 
              left: hoverInfo.x,
              top: hoverInfo.y,
              transform: 'translate(-50%, -100%)',
              marginTop: '-10px'
            }}
          >
            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap border border-gray-600">
              <div className="font-bold">{hoverInfo.point.category}</div>
              <div className="text-gray-300">Val: {hoverInfo.point.value.toFixed(1)}</div>
              <div className="text-gray-400">Time: {new Date(hoverInfo.point.timestamp).toLocaleTimeString()}</div>
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-800 absolute left-1/2 -translate-x-1/2"></div>
          </div>
        )}
      </div>

      {/* Dev Perf */}
      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-green-400 font-mono z-20 shadow-lg border border-gray-700 pointer-events-none">
        Render: {renderTime.toFixed(2)}ms
      </div>
    </div>
  );
});
