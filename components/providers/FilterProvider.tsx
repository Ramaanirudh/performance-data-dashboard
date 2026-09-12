'use client';

import React, { createContext, useContext, useState, useTransition, ReactNode } from 'react';

export interface FilterState {
  category: string; 
  minValue: number;
  timeRangeMs: number | null;
  aggregation: 'none' | '1m' | '5m' | '1h';
}

interface FilterContextType {
  filters: FilterState;
  isPending: boolean;
  setCategory: (c: string) => void;
  setMinValue: (val: number) => void;
  setTimeRange: (ms: number | null) => void;
  setAggregation: (agg: 'none' | '1m' | '5m' | '1h') => void;
  resetFilters: () => void;
}

const defaultState: FilterState = {
  category: 'All',
  minValue: 0,
  timeRangeMs: null,
  aggregation: 'none',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultState);
  const [isPending, startTransition] = useTransition();

  const updateFilter = (updates: Partial<FilterState>) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, ...updates }));
    });
  };

  return (
    <FilterContext.Provider value={{
      filters,
      isPending,
      setCategory: (category) => updateFilter({ category }),
      setMinValue: (minValue) => updateFilter({ minValue }),
      setTimeRange: (timeRangeMs) => updateFilter({ timeRangeMs }),
      setAggregation: (aggregation) => updateFilter({ aggregation }),
      resetFilters: () => updateFilter(defaultState),
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
