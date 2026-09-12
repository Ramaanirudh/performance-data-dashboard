'use client';

import { useFilters } from '@/components/providers/FilterProvider';
import { useState, useEffect } from 'react';

export function FilterPanel() {
  const { filters, setCategory, setMinValue, resetFilters, isPending } = useFilters();
  const [localMin, setLocalMin] = useState(filters.minValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localMin !== filters.minValue) {
        setMinValue(localMin);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localMin, filters.minValue, setMinValue]);

  useEffect(() => {
    setLocalMin(filters.minValue);
  }, [filters.minValue]);

  return (
    <div className="bg-[#1a1a1a] p-4 rounded border border-gray-700 font-mono text-sm">
      <h3 className="font-bold mb-4 text-gray-300">Filters {isPending && <span className="text-blue-400 text-xs ml-2">(Updating...)</span>}</h3>
      
      <div className="mb-4">
        <label className="block text-gray-400 mb-1">Category:</label>
        <select 
          className="bg-black border border-gray-600 text-white rounded p-1 w-full outline-none"
          value={filters.category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Alpha">Alpha</option>
          <option value="Beta">Beta</option>
          <option value="Gamma">Gamma</option>
          <option value="Delta">Delta</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-gray-400 mb-1">Minimum Value: {localMin}</label>
        <input 
          type="range" 
          min="0" 
          max="200" 
          value={localMin}
          onChange={(e) => setLocalMin(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>

      <button 
        onClick={resetFilters}
        className="w-full bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 rounded py-1 transition-colors mt-2"
      >
        Reset Filters
      </button>
    </div>
  );
}
