'use client';

import { useChartRenderer } from '@/hooks/useChartRenderer';
import { AggregatedDataPoint } from '@/lib/types';
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface BarChartProps {
  data: AggregatedDataPoint[];
  color?: string;
}

export const BarChart = React.memo(function BarChart({ data, color = '#10b981' }: BarChartProps) {
  const [renderTime, setRenderTime] = useState(0);
  const interactionRef = useRef<HTMLDivElement>(null);
  
  // Hover Tooltip
  const [hoverInfo, setHoverInfo] = useState<{ x: number, y: number, point: AggregatedDataPoint } | null>(null);

  const minVal = 0;
  const maxVal = 200; // Fixed scale for now

  const renderCanvas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (data.length === 0) return;

    // Calculate bar width leaving a small gap
    const barWidth = Math.max(1, (width / data.length) - 1);
    const step = width / data.length;

    ctx.fillStyle = color;
    
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const x = i * step;
      
      const normalizedY = (point.avg - minVal) / (maxVal - minVal);
      const barHeight = normalizedY * height;
      const y = height - barHeight;
      
      ctx.fillRect(x, y, barWidth, barHeight);
    }
    
    // Draw hover outline
    if (hoverInfo) {
      const hoverIndex = data.indexOf(hoverInfo.point);
      if (hoverIndex >= 0) {
        const x = hoverIndex * step;
        const normalizedY = (hoverInfo.point.avg - minVal) / (maxVal - minVal);
        const barHeight = normalizedY * height;
        const y = height - barHeight;
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
      }
    }
  }, [data, hoverInfo, color]);

  const { canvasRef, renderTimeRef } = useChartRenderer(renderCanvas, [data, hoverInfo, color]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (data.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    if (mouseX < 0 || mouseX > rect.width) {
      if (hoverInfo) setHoverInfo(null);
      return;
    }
    
    const step = rect.width / data.length;
    let index = Math.floor(mouseX / step);
    index = Math.max(0, Math.min(data.length - 1, index));
    
    const point = data[index];
    if (point && (!hoverInfo || hoverInfo.point !== point)) {
      const snapX = (index * step) + (step / 2);
      const normalizedY = (point.avg - minVal) / (maxVal - minVal);
      const snapY = rect.height - (normalizedY * rect.height);
      
      setHoverInfo({ x: snapX, y: Math.min(snapY, rect.height - 20), point });
    }
  };

  const handlePointerLeave = () => {
    setHoverInfo(null);
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
      {data.length === 0 && (
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
        className="relative flex-1 ml-12 touch-none cursor-crosshair"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
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
              <div className="font-bold">Aggregated Bucket ({hoverInfo.point.count} pts)</div>
              <div className="text-gray-300">Avg: {hoverInfo.point.avg.toFixed(1)}</div>
              <div className="text-gray-300">Min: {hoverInfo.point.min.toFixed(1)} | Max: {hoverInfo.point.max.toFixed(1)}</div>
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
