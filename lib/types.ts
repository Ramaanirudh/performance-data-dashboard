export interface DataPoint {
  id: string;
  timestamp: number;
  value: number;
  category: string;
  metadata?: Record<string, any>;
}

export interface AggregatedDataPoint {
  timestamp: number;
  min: number;
  max: number;
  avg: number;
  count: number;
  category?: string;
}

export interface DataFilter {
  categories?: string[];
  minValue?: number;
  maxValue?: number;
  minTimestamp?: number;
  maxTimestamp?: number;
}

export interface ProcessingResult<T> {
  data: T;
  executionTimeMs: number;
}

export type AggregationInterval = '1m' | '5m' | '1h' | 'raw';

export interface DashboardConfig {

  refreshRate: number;
  theme: 'light' | 'dark';
}
