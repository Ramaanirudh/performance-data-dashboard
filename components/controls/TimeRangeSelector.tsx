'use client';

import { useFilters } from '@/components/providers/FilterProvider';

export function TimeRangeSelector() {
  const { filters, setTimeRange, setAggregation } = useFilters();

  return (
    <div className="bg-[#1a1a1a] p-4 rounded border border-gray-700 font-mono text-sm mt-4">
      <h3 className="font-bold mb-4 text-gray-300">Time & Aggregation</h3>
      
      <div className="mb-4">
        <label className="block text-gray-400 mb-2">Time Range (Rolling Window):</label>
        <div className="flex gap-2">
          <button 
            className={`flex-1 py-1 px-2 rounded border ${filters.timeRangeMs === null ? 'bg-blue-900 border-blue-700 text-white' : 'bg-black border-gray-600 text-gray-400'}`}
            onClick={() => setTimeRange(null)}
          >
            All
          </button>
          <button 
            className={`flex-1 py-1 px-2 rounded border ${filters.timeRangeMs === 60000 ? 'bg-blue-900 border-blue-700 text-white' : 'bg-black border-gray-600 text-gray-400'}`}
            onClick={() => setTimeRange(60000)}
          >
            1 Min
          </button>
          <button 
            className={`flex-1 py-1 px-2 rounded border ${filters.timeRangeMs === 300000 ? 'bg-blue-900 border-blue-700 text-white' : 'bg-black border-gray-600 text-gray-400'}`}
            onClick={() => setTimeRange(300000)}
          >
            5 Min
          </button>
        </div>
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Data Aggregation:</label>
        <div className="grid grid-cols-2 gap-2">
          <button 
            className={`py-1 px-2 rounded border ${filters.aggregation === 'none' ? 'bg-green-900 border-green-700 text-white' : 'bg-black border-gray-600 text-gray-400'}`}
            onClick={() => setAggregation('none')}
          >
            Raw (O(1))
          </button>
          <button 
            className={`py-1 px-2 rounded border ${filters.aggregation === '1m' ? 'bg-green-900 border-green-700 text-white' : 'bg-black border-gray-600 text-gray-400'}`}
            onClick={() => setAggregation('1m')}
          >
            1 Min Avg
          </button>
          <button 
            className={`py-1 px-2 rounded border ${filters.aggregation === '5m' ? 'bg-green-900 border-green-700 text-white' : 'bg-black border-gray-600 text-gray-400'}`}
            onClick={() => setAggregation('5m')}
          >
            5 Min Avg
          </button>
          <button 
            className={`py-1 px-2 rounded border ${filters.aggregation === '1h' ? 'bg-green-900 border-green-700 text-white' : 'bg-black border-gray-600 text-gray-400'}`}
            onClick={() => setAggregation('1h')}
          >
            1 Hour Avg
          </button>
        </div>
      </div>
    </div>
  );
}
