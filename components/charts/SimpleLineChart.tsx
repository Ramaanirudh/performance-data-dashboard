'use client';

import { useChartRenderer } from '@/hooks/useChartRenderer';
import { DataPoint } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';

interface SimpleLineChartProps {
  data: DataPoint[];
  category: string;
}

export function SimpleLineChart({ data, category }: SimpleLineChartProps) {
  const [renderTime, setRenderTime] = useState(0);

  // Filter data for the specific category to display
  const categoryData = useMemo(() => data.filter(d => d.category === category), [data, category]);

  // Determine min/max for scaling
  const minVal = 0;
  const maxVal = 200; // Fixed for this example to match generator

  const renderCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (categoryData.length === 0) return;

    const xStep = width / Math.max(categoryData.length - 1, 1);
    
    ctx.beginPath();
    ctx.strokeStyle = category === 'Alpha' ? '#ef4444' : '#3b82f6'; // Different colors
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    
    categoryData.forEach((point, i) => {
      const x = i * xStep;
      const normalizedY = (point.value - minVal) / (maxVal - minVal);
      const y = height - (normalizedY * height);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  };

  const { canvasRef, renderTimeRef } = useChartRenderer(renderCanvas, [categoryData]);

  // Periodically update the render time display to avoid spamming React state every frame
  useEffect(() => {
    const interval = setInterval(() => {
      setRenderTime(renderTimeRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, [renderTimeRef]);

  // SVG grid lines
  const gridLines = [0, 25, 50, 75, 100].map(pct => {
    const val = minVal + ((maxVal - minVal) * (pct / 100));
    return { pct, label: val.toFixed(0) };
  });

  return (
    <div className="relative w-full h-64 bg-black border border-gray-800 rounded overflow-hidden flex">
      {/* Y Axis Labels (SVG) */}
      <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2 items-end pr-2 text-xs text-gray-500 z-10 pointer-events-none">
        {gridLines.reverse().map((line, i) => (
          <span key={i}>{line.label}</span>
        ))}
      </div>
      
      <div className="relative flex-1 ml-12">
        {/* SVG Grid Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
           {gridLines.map((line, i) => (
             <line 
               key={i} 
               x1="0" 
               y1={`${100 - line.pct}%`} 
               x2="100%" 
               y2={`${100 - line.pct}%`} 
               stroke="#333" 
               strokeWidth="1" 
               strokeDasharray="4 4"
             />
           ))}
        </svg>

        {/* Canvas for High-Density Points */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full z-0 block" 
        />
      </div>

      {/* Dev performance overlay */}
      <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-green-400 font-mono z-20 shadow-lg border border-gray-700">
        Render: {renderTime.toFixed(2)}ms
      </div>
    </div>
  );
}
