import { DataPoint } from './types';

const CATEGORIES = ['Alpha', 'Beta', 'Gamma', 'Delta'];

let idCounter = 0;

// No stateful random walk to prevent clamping at bounds
export function generateDataPoint(category: string, timestamp: number): DataPoint {
  let catOffset = 0;
  if (category === 'Beta') catOffset = Math.PI / 2;
  if (category === 'Gamma') catOffset = Math.PI;
  if (category === 'Delta') catOffset = Math.PI * 1.5;

  // Combining two sine waves for a realistic pseudo-random trend
  const slowTrend = Math.sin((timestamp / 100000) + catOffset) * 40;
  const fastTrend = Math.sin((timestamp / 10000) + (catOffset * 2)) * 20;
  const noise = (Math.random() - 0.5) * 15;
  
  // Base value centered at 100
  let newValue = 100 + slowTrend + fastTrend + noise;
  
  // Keep values bounded safely within 0 - 200 without clamping permanently
  if (newValue < 0) newValue = 0;
  if (newValue > 200) newValue = 200;
  
  return {
    id: `pt_${idCounter++}`,
    timestamp,
    value: newValue,
    category,
    metadata: {
      generatedAt: Date.now(),
      quality: Math.random() > 0.95 ? 'low' : 'high'
    }
  };
}

export function generateInitialData(count: number = 10000): DataPoint[] {
  const points: DataPoint[] = [];
  const now = Date.now();
  
  // We want to generate historical data, starting from 'count' * 100ms ago
  const interval = 100;
  const startTime = now - (count * interval);
  
  for (let i = 0; i < count; i++) {
    const timestamp = startTime + (i * interval);
    const category = CATEGORIES[i % CATEGORIES.length];
    points.push(generateDataPoint(category, timestamp));
  }
  
  return points;
}

export function generateNextTick(timestamp: number): DataPoint[] {
  // Generate one random category point per tick to match sample output (+1 point)
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  return [generateDataPoint(category, timestamp)];
}
