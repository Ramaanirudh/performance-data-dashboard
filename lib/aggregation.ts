import { DataPoint, AggregatedDataPoint, AggregationInterval } from './types';

const INTERVAL_MS: Record<Exclude<AggregationInterval, 'raw'>, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '1h': 60 * 60 * 1000,
};

export function aggregateData(
  points: DataPoint[],
  interval: Exclude<AggregationInterval, 'raw'>
): AggregatedDataPoint[] {
  const intervalMs = INTERVAL_MS[interval];
  
  // Use a Map for O(1) bucket lookups.
  const buckets = new Map<number, { sum: number; count: number; min: number; max: number }>();
  
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    // Map timestamp to interval bucket floor
    const bucketTime = Math.floor(pt.timestamp / intervalMs) * intervalMs;
    
    const existing = buckets.get(bucketTime);
    if (!existing) {
      buckets.set(bucketTime, { sum: pt.value, count: 1, min: pt.value, max: pt.value });
    } else {
      existing.sum += pt.value;
      existing.count += 1;
      if (pt.value < existing.min) existing.min = pt.value;
      if (pt.value > existing.max) existing.max = pt.value;
    }
  }
  
  const result: AggregatedDataPoint[] = [];
  
  for (const [timestamp, data] of buckets.entries()) {
    result.push({
      timestamp,
      // Calculate final average safely
      avg: data.sum / data.count,
      min: data.min,
      max: data.max,
      count: data.count,
    });
  }
  
  // Return sorted chronologically
  return result.sort((a, b) => a.timestamp - b.timestamp);
}
