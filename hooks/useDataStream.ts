import { useState, useEffect, useRef, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { generateInitialData, generateNextTick } from '@/lib/dataGenerator';

export interface StreamLog {
  timestamp: number;
  message: string;
}

export interface StreamState {
  points: DataPoint[];
  totalPointsCount: number;
  intervalMs: number;
  status: 'LIVE' | 'PAUSED';
  logs: StreamLog[];
}

const MAX_WINDOW_SIZE = 200000;
const MAX_LOG_SIZE = 6;

export function useDataStream() {
  const [state, setState] = useState<StreamState>({
    points: [],
    totalPointsCount: 0,
    intervalMs: 100,
    status: 'PAUSED',
    logs: [],
  });
  
  const reset = useCallback(() => {
    const initial = generateInitialData(10000);
    setState(prev => ({
      ...prev,
      points: initial,
      totalPointsCount: initial.length,
      status: 'PAUSED',
      logs: [{ timestamp: Date.now(), message: 'Initial dataset: 10,000 points' }]
    }));
  }, []);

  // Initialize once
  useEffect(() => {
    reset();
  }, [reset]);

  const startStream = useCallback(() => {
    setState(prev => ({ ...prev, status: 'LIVE' }));
  }, []);

  const stopStream = useCallback(() => {
    setState(prev => ({ ...prev, status: 'PAUSED' }));
  }, []);

  const increaseLoad = useCallback(() => {
    setState(prev => ({ ...prev, intervalMs: Math.max(10, prev.intervalMs - 20) }));
  }, []);

  const decreaseLoad = useCallback(() => {
    setState(prev => ({ ...prev, intervalMs: Math.min(1000, prev.intervalMs + 50) }));
  }, []);

  const stressTest = useCallback(() => {
    setState(prev => ({ ...prev, intervalMs: 5, status: 'LIVE' }));
  }, []);

  const injectPoints = useCallback((count: number) => {
    setState(prev => {
      const newPoints = generateInitialData(count);
      return {
        ...prev,
        points: [...prev.points, ...newPoints],
        totalPointsCount: prev.totalPointsCount + newPoints.length
      };
    });
  }, []);

  // Stream effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (state.status === 'LIVE') {
      timer = setInterval(() => {
        const now = Date.now();
        const newPoints = generateNextTick(now);
        
        setState(prev => {
          const updatedPoints = [...prev.points, ...newPoints];
          // Enforce bounded sliding window
          if (updatedPoints.length > MAX_WINDOW_SIZE) {
            updatedPoints.splice(0, updatedPoints.length - MAX_WINDOW_SIZE);
          }
          
          const formatTime = (ts: number) => {
            const d = new Date(ts);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
          };

          // To exactly match the prompt's requested sample output log format
          const newLog: StreamLog = {
            timestamp: now,
            message: `${formatTime(now)} → +${newPoints.length} point`
          };

          const newLogs = [...prev.logs, newLog];
          if (newLogs.length > MAX_LOG_SIZE) {
            newLogs.shift();
          }
          
          return {
            ...prev,
            points: updatedPoints,
            totalPointsCount: prev.totalPointsCount + newPoints.length,
            logs: newLogs
          };
        });
      }, state.intervalMs);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.status, state.intervalMs]);

  return {
    state,
    controls: {
      startStream,
      stopStream,
      increaseLoad,
      decreaseLoad,
      normalPace: () => {},
      resetStream: reset,
      stressTest,
      injectPoints
    }
  };
}
