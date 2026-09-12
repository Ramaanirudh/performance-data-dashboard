import { processAndAggregateData } from '@/lib/dataProcessor';
import { DataPoint, AggregatedDataPoint } from '@/lib/types';

describe('Data Processor', () => {
  const mockData: DataPoint[] = [
    { id: '1', timestamp: 100000, value: 10, category: 'Alpha' },
    { id: '2', timestamp: 130000, value: 20, category: 'Alpha' },
    { id: '3', timestamp: 160000, value: 30, category: 'Beta' },
  ];

  it('filters by category successfully', () => {
    const result = processAndAggregateData(mockData, { categories: ['Alpha'] }, 'raw');
    expect(result.data.length).toBeGreaterThan(0);
    expect((result.data as DataPoint[]).every(d => d.category === 'Alpha')).toBe(true);
  });

  it('aggregates data correctly', () => {
    // 100,000 and 130,000 belong to the same 1-minute bucket (60,000 to 120,000, and 120,000 to 180,000)
    // Wait, 100k is in 60k bucket, 130k is in 120k bucket! Let's change 130k to 110k for same bucket
    mockData[1].timestamp = 110000;
    const result = processAndAggregateData(mockData, { categories: ['Alpha'] }, '1m');
    const bucket = (result.data as AggregatedDataPoint[]).find(d => Math.floor(d.timestamp / 60000) * 60000 === 60000);
    expect(bucket).toBeDefined();
    expect(bucket?.avg).toBe(15); // (10 + 20) / 2
  });

  it('handles empty arrays gracefully without crashing', () => {
    const result = processAndAggregateData([], { categories: ['Alpha'] }, '1m');
    expect(result.data).toEqual([]);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });
});
