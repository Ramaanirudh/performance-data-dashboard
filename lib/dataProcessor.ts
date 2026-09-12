import { DataPoint, DataFilter, AggregationInterval, AggregatedDataPoint, ProcessingResult } from './types';
import { aggregateData } from './aggregation';
import { measureExecution } from './performanceUtils';

// Pure function, O(N) filtering
export function filterData(points: DataPoint[], filters: DataFilter): DataPoint[] {
  return points.filter(pt => {
    if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(pt.category)) {
      return false;
    }
    if (filters.minValue !== undefined && pt.value < filters.minValue) {
      return false;
    }
    if (filters.maxValue !== undefined && pt.value > filters.maxValue) {
      return false;
    }
    if (filters.minTimestamp !== undefined && pt.timestamp < filters.minTimestamp) {
      return false;
    }
    if (filters.maxTimestamp !== undefined && pt.timestamp > filters.maxTimestamp) {
      return false;
    }
    return true;
  });
}

// Combines filtering and aggregation inside the performance measurement wrapper
export function processAndAggregateData(
  points: DataPoint[],
  filters: DataFilter,
  interval: AggregationInterval
): ProcessingResult<DataPoint[] | AggregatedDataPoint[]> {
  return measureExecution(() => {
    let processed: DataPoint[] = points;
    
    // Only apply filter iteration if filter conditions exist
    if (Object.keys(filters).length > 0) {
      processed = filterData(points, filters);
    }
    
    // Aggregate if requested
    if (interval !== 'raw') {
      return aggregateData(processed, interval);
    }
    
    return processed;
  });
}
