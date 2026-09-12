'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { DataPoint } from '@/lib/types';
import { processAndAggregateData } from '@/lib/dataProcessor';

type WorkerMessageType = 'AGGREGATE' | 'TABLE_PROCESS';

export function useDataWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequests = useRef<Map<number, { resolve: Function, reject: Function }>>(new Map());
  const messageIdRef = useRef(0);
  
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('../lib/worker/dataWorker.ts', import.meta.url), { type: 'module' });
      
      workerRef.current.onmessage = (e) => {
        const { id, status, result, error } = e.data;
        const req = pendingRequests.current.get(id);
        
        if (req) {
          if (status === 'SUCCESS') req.resolve(result);
          else req.reject(new Error(error));
          pendingRequests.current.delete(id);
        }
      };

      workerRef.current.onerror = (err) => {
        console.error('Web Worker Error:', err);
        setUseFallback(true);
      };
    } catch (e) {
      console.warn('Failed to initialize Web Worker, using main thread fallback', e);
      setUseFallback(true);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const dispatchToWorker = useCallback(<T>(type: WorkerMessageType, payload: any): Promise<T> => {
    return new Promise((resolve, reject) => {
      // Graceful fallback to synchronous main thread processing if worker fails
      if (useFallback || !workerRef.current) {
        try {
          if (type === 'AGGREGATE') {
            resolve(processAndAggregateData(payload.points, payload.filter, payload.interval) as any);
          } else if (type === 'TABLE_PROCESS') {
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
            resolve(data as any);
          }
        } catch (err) {
          reject(err);
        }
        return;
      }

      // Dispatch to worker
      const id = ++messageIdRef.current;
      pendingRequests.current.set(id, { resolve, reject });
      workerRef.current.postMessage({ id, type, payload });
    });
  }, [useFallback]);

  return { dispatchToWorker, useFallback };
}
