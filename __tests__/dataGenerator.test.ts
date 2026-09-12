import { generateInitialData, generateNextTick } from '@/lib/dataGenerator';

describe('Data Generator', () => {
  it('generates the exact requested number of initial points', () => {
    const data = generateInitialData(100);
    expect(data).toHaveLength(100);
  });

  it('generates valid DataPoint shapes', () => {
    const data = generateInitialData(1);
    expect(data[0]).toHaveProperty('timestamp');
    expect(data[0]).toHaveProperty('value');
    expect(data[0]).toHaveProperty('category');
    expect(typeof data[0].timestamp).toBe('number');
    expect(typeof data[0].value).toBe('number');
    expect(['Alpha', 'Beta', 'Gamma']).toContain(data[0].category);
  });

  it('generates next tick data correctly', () => {
    const now = Date.now();
    const tickData = generateNextTick(now);
    expect(tickData.length).toBeGreaterThan(0);
    expect(tickData[0].timestamp).toBe(now);
  });
});
