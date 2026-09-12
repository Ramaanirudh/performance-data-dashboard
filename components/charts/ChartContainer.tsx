'use client';

import { useDataStream } from '@/hooks/useDataStream';
import { DebugPanel } from '@/components/controls/DebugPanel';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { ScatterPlot } from './ScatterPlot';
import { Heatmap } from './Heatmap';
import { processAndAggregateData } from '@/lib/dataProcessor';
import { useMemo } from 'react';
import { AggregatedDataPoint } from '@/lib/types';
import { useFilters } from '@/components/providers/FilterProvider';
import { globalMetrics } from '@/hooks/usePerformanceMonitor';
import { PerformanceMonitor } from '@/components/controls/PerformanceMonitor';
import { useDataWorker } from '@/hooks/useDataWorker';
import { useState, useEffect } from 'react';

export function ChartContainer() {
  const { state, controls } = useDataStream();
  const { filters } = useFilters();
  
  globalMetrics.datasetSize = state.points.length;
  globalMetrics.updateFreqMs = state.intervalMs;

  // Filter raw points for the line charts
  const filteredPoints = useMemo(() => {
    let pts = state.points;
    if (filters.minValue > 0) {
      pts = pts.filter(p => p.value >= filters.minValue);
    }
    if (filters.timeRangeMs) {
      const cutoff = Date.now() - filters.timeRangeMs;
      pts = pts.filter(p => p.timestamp >= cutoff);
    }
    return pts;
  }, [state.points, filters.minValue, filters.timeRangeMs]);

  const { dispatchToWorker } = useDataWorker();
  const [barChartData, setBarChartData] = useState<AggregatedDataPoint[]>([]);
  const [execTime, setExecTime] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const categories = filters.category !== 'All' ? [filters.category] : undefined;
    const aggLevel = filters.aggregation === 'none' ? '1m' : filters.aggregation;

    dispatchToWorker<any>('AGGREGATE', {
      points: filteredPoints,
      filter: { categories },
      interval: aggLevel
    }).then(result => {
      if (isMounted) {
        setBarChartData(result.data);
        setExecTime(result.executionTimeMs);
        globalMetrics.dataProcessingMs = result.executionTimeMs;
      }
    });

    return () => { isMounted = false; };
  }, [filteredPoints, filters.category, filters.aggregation, dispatchToWorker]);

  const showAlpha = filters.category === 'All' || filters.category === 'Alpha';
  const showBeta = filters.category === 'All' || filters.category === 'Beta';

  if (state.points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-gray-800 rounded-lg text-gray-400 bg-[#1a1a1a]">
        <svg className="animate-spin h-8 w-8 mb-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p>Waiting for data stream...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Row: Main Charts & Performance */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-grow flex flex-col gap-6 min-w-0">
          {showAlpha && (
            <div>
              <h3 className="text-sm font-bold mb-2 text-gray-400">Alpha Category (Line - Live)</h3>
              <LineChart data={filteredPoints} category="Alpha" color="#ef4444" />
            </div>
          )}
          {showBeta && (
            <div>
              <h3 className="text-sm font-bold mb-2 text-gray-400">Beta Category (Line - Live)</h3>
              <LineChart data={filteredPoints} category="Beta" color="#3b82f6" />
            </div>
          )}
          {filteredPoints.length === 0 && (
            <div className="h-64 border border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              No data matches your current filters.
            </div>
          )}
        </div>
        <div className="w-full lg:w-80 flex-shrink-0 order-first lg:order-last">
          <PerformanceMonitor onStressTest={controls.stressTest} />
        </div>
      </div>
      
      {/* Second Row: Bar & Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-w-0">
          <h3 className="text-sm font-bold mb-2 text-gray-400">
            {filters.category !== 'All' ? filters.category : 'All Categories'} (Bar - {filters.aggregation === 'none' ? '1m' : filters.aggregation} Aggregation) 
            <span className="text-green-500 font-mono text-xs ml-2">Agg: {execTime.toFixed(1)}ms</span>
          </h3>
          {barChartData.length > 0 ? (
            <BarChart data={barChartData} color="#10b981" />
          ) : (
            <div className="h-[300px] border border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              No aggregated data.
            </div>
          )}
        </div>
        <div className="min-w-0">
           <h3 className="text-sm font-bold mb-2 text-gray-400">Scatter Plot</h3>
           <ScatterPlot data={filteredPoints} />
        </div>
      </div>

      {/* Third Row: Heatmap */}
      <div className="min-w-0">
         <h3 className="text-sm font-bold mb-2 text-gray-400">Heatmap (All Categories)</h3>
         <Heatmap data={filteredPoints} />
      </div>

      <DebugPanel state={state} controls={controls} />
    </div>
  );
}
