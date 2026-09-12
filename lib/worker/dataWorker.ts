import { processAndAggregateData } from '../dataProcessor';
import { DataPoint } from '../types';

self.onmessage = (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'AGGREGATE') {
      const { points, filter, interval } = payload;
      const result = processAndAggregateData(points, filter, interval);
      self.postMessage({ id, status: 'SUCCESS', result });
    } 
    else if (type === 'TABLE_PROCESS') {
      const { points, search, sortKey, sortDesc } = payload;
      
      let data = points as DataPoint[];
      if (search) {
        const lowerSearch = search.toLowerCase();
        data = data.filter(p => 
          p.category.toLowerCase().includes(lowerSearch) ||
          p.value.toString().includes(lowerSearch)
        );
      }

      data = [...data].sort((a, b) => {
        let aVal: any = a[sortKey as keyof DataPoint];
        let bVal: any = b[sortKey as keyof DataPoint];
        
        if (sortKey === 'status') {
          aVal = a.value > 150 ? 'Warning' : 'Active';
          bVal = b.value > 150 ? 'Warning' : 'Active';
        }

        if (aVal < bVal) return sortDesc ? 1 : -1;
        if (aVal > bVal) return sortDesc ? -1 : 1;
        return 0;
      });
      
      self.postMessage({ id, status: 'SUCCESS', result: data });
    }
    else {
      throw new Error('Unknown worker action type');
    }
  } catch (err: any) {
    self.postMessage({ id, status: 'ERROR', error: err.message });
  }
};
