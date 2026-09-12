'use client';

import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  onStressTest?: () => void;
}

export function PerformanceMonitor({ onStressTest }: PerformanceMonitorProps) {
  const metrics = usePerformanceMonitor();
  
  let status = 'OPTIMAL';
  let statusColor = 'text-green-500';
  
  if (metrics.fps < 30 || metrics.renderTime > 16 || (metrics.memoryMB && metrics.memoryMB > 500)) {
    status = 'WARNING';
    statusColor = 'text-yellow-500';
  }
  if (metrics.fps < 10) {
    status = 'CRITICAL';
    statusColor = 'text-red-500';
  }

  return (
    <div className="bg-[#1a1a1a] p-4 rounded border border-gray-700 font-mono text-sm mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-300">PERFORMANCE</h3>
        {onStressTest && (
          <button 
            onClick={onStressTest}
            className="bg-red-900/40 hover:bg-red-900/80 text-red-200 border border-red-800 rounded px-2 py-0.5 text-xs transition-colors"
          >
            Stress Test
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">FPS</span>
          <span className={metrics.fps < 30 ? 'text-yellow-500' : 'text-green-400'}>{metrics.fps.toFixed(1)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">Render Time</span>
          <span className={metrics.renderTime > 16 ? 'text-yellow-500' : 'text-gray-200'}>{metrics.renderTime.toFixed(1)} ms</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">Data Processing</span>
          <span className="text-gray-200">{metrics.dataProcessing.toFixed(1)} ms</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">Dataset Size</span>
          <span className="text-gray-200">{metrics.datasetSize.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">Memory</span>
          <span className="text-gray-200">{metrics.memoryMB !== null ? `${metrics.memoryMB.toFixed(1)} MB` : 'Unavailable'}</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">Update Frequency</span>
          <span className="text-gray-200">{metrics.updateFreq} ms</span>
        </div>
        <div className="flex justify-between border-b border-gray-800 pb-1">
          <span className="text-gray-400">Interaction Latency</span>
          <span className="text-gray-200">{metrics.interactionLatency !== null ? `${metrics.interactionLatency.toFixed(1)} ms` : 'Unavailable'}</span>
        </div>
        <div className="flex justify-between pt-1 font-bold">
          <span className="text-gray-400">Status</span>
          <span className={statusColor}>{status}</span>
        </div>
      </div>
    </div>
  );
}
