import { renderHook } from '@testing-library/react';
import { useVirtualization } from '@/hooks/useVirtualization';

describe('useVirtualization Hook', () => {
  it('calculates correct start and end indices based on container height', () => {
    const { result } = renderHook(() => useVirtualization({
      itemCount: 1000,
      itemHeight: 40,
      containerHeight: 400,
      overscan: 0
    }));

    // With 0 scroll top, 400px container, 40px items = 10 items visible
    expect(result.current.startIndex).toBe(0);
    // endIndex calculation in hook uses Math.ceil((scrollTop + containerHeight) / itemHeight)
    // 400/40 = 10, so indices 0 through 10 (11 items total rendered just to be safe)
    expect(result.current.endIndex).toBe(10); 
    expect(result.current.totalHeight).toBe(40000);
  });
});
