'use client';

import { useDataStream } from '@/hooks/useDataStream';
import { useDataWorker } from '@/hooks/useDataWorker';
import { useVirtualization } from '@/hooks/useVirtualization';
import { useMemo, useState, useTransition, useEffect, useRef, useDeferredValue } from 'react';
import { DataPoint } from '@/lib/types';

type SortKey = 'timestamp' | 'value' | 'category' | 'status';

export function DataTable() {
  const { state } = useDataStream();
  // DEFERRED VALUE: Tells React this array update is non-urgent. 
  // Prevents the expensive sorting algorithm from freezing the main thread/Canvas animations.
  const deferredPoints = useDeferredValue(state.points);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDesc, setSortDesc] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Performance measurement
  const [renderMs, setRenderMs] = useState(0);
  const renderStartRef = useRef(0);
  renderStartRef.current = performance.now();

  useEffect(() => {
    setRenderMs(performance.now() - renderStartRef.current);
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    startTransition(() => {
      setSearch(val);
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: SortKey) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSort(key);
    }
  };

  const { dispatchToWorker } = useDataWorker();
  const [processedData, setProcessedData] = useState<DataPoint[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    dispatchToWorker<DataPoint[]>('TABLE_PROCESS', {
      points: deferredPoints,
      search,
      sortKey,
      sortDesc
    }).then(result => {
      if (isMounted) {
        setProcessedData(result);
      }
    });

    return () => { isMounted = false; };
  }, [deferredPoints, search, sortKey, sortDesc, dispatchToWorker]);

  const rowHeight = 40;
  const containerHeight = 400;

  const { containerRef, totalHeight, visibleItems, startIndex, endIndex } = useVirtualization({
    itemCount: processedData.length,
    itemHeight: rowHeight,
    containerHeight,
  });

  return (
    <div className="bg-[#111111] rounded-lg border border-gray-800 p-4 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-lg font-bold">Data Stream Table</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <span className="text-xs text-green-500 font-mono">Render: {renderMs.toFixed(1)}ms</span>
          <span className="text-sm text-gray-400 whitespace-nowrap">
            Visible: {Math.max(0, endIndex - startIndex + 1)} / Total: {processedData.length}
          </span>
          <input
            type="text"
            placeholder="Search..."
            onChange={handleSearch}
            aria-label="Search data table"
            className="bg-black border border-gray-700 rounded px-2 py-1 text-sm outline-none w-full sm:w-48 text-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="border border-gray-800 rounded overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="flex bg-[#1a1a1a] border-b border-gray-800 font-bold text-sm text-gray-400">
            <div 
              className="flex-1 p-2 cursor-pointer hover:text-white select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none" 
              onClick={() => toggleSort('timestamp')}
              onKeyDown={(e) => handleKeyDown(e, 'timestamp')}
              tabIndex={0}
              role="button"
              aria-label="Sort by timestamp"
            >
              Timestamp {sortKey === 'timestamp' ? (sortDesc ? '↓' : '↑') : ''}
            </div>
            <div 
              className="flex-1 p-2 cursor-pointer hover:text-white select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none" 
              onClick={() => toggleSort('value')}
              onKeyDown={(e) => handleKeyDown(e, 'value')}
              tabIndex={0}
              role="button"
              aria-label="Sort by value"
            >
              Value {sortKey === 'value' ? (sortDesc ? '↓' : '↑') : ''}
            </div>
            <div 
              className="flex-1 p-2 cursor-pointer hover:text-white select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none" 
              onClick={() => toggleSort('category')}
              onKeyDown={(e) => handleKeyDown(e, 'category')}
              tabIndex={0}
              role="button"
              aria-label="Sort by category"
            >
              Category {sortKey === 'category' ? (sortDesc ? '↓' : '↑') : ''}
            </div>
            <div 
              className="flex-1 p-2 cursor-pointer hover:text-white select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none" 
              onClick={() => toggleSort('status')}
              onKeyDown={(e) => handleKeyDown(e, 'status')}
              tabIndex={0}
              role="button"
              aria-label="Sort by status"
            >
              Status {sortKey === 'status' ? (sortDesc ? '↓' : '↑') : ''}
            </div>
          </div>

          {/* Virtualized Body */}
          <div 
            ref={containerRef}
            className="relative overflow-y-auto"
            style={{ height: containerHeight }}
          >
            {processedData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                No matching rows found.
              </div>
            ) : (
              <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map(({ index, offsetTop }) => {
                  const row = processedData[index];
                  if (!row) return null;
                  
                  const status = row.value > 150 ? 'Warning' : 'Active';
                  
                  return (
                    <div 
                      key={`${row.timestamp}-${index}`}
                      className="absolute w-full flex border-b border-gray-800/50 text-sm hover:bg-gray-800/30 transition-colors items-center"
                      style={{ top: offsetTop, height: rowHeight }}
                    >
                      <div className="flex-1 p-2 text-gray-300 font-mono truncate">
                        {new Date(row.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="flex-1 p-2 text-gray-300 font-mono truncate">
                        {row.value.toFixed(2)}
                      </div>
                      <div className="flex-1 p-2 truncate">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          row.category === 'Alpha' ? 'bg-red-900/50 text-red-200' :
                          row.category === 'Beta' ? 'bg-blue-900/50 text-blue-200' :
                          'bg-green-900/50 text-green-200'
                        }`}>
                          {row.category}
                        </span>
                      </div>
                      <div className="flex-1 p-2 truncate">
                        <span className={`text-xs ${status === 'Warning' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
