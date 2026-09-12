'use client';

import { StreamState, useDataStream } from '@/hooks/useDataStream';

interface DebugPanelProps {
  state: StreamState;
  controls: ReturnType<typeof useDataStream>['controls'];
}

export function DebugPanel({ state, controls }: DebugPanelProps) {

  return (
    <div className="bg-[#1a1a1a] p-6 rounded border border-gray-700 font-mono text-sm text-gray-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white text-base">Data Stream Debug Panel</h3>
        <div className="space-x-2 text-xs">
          <button onClick={controls.startStream} disabled={state.status === 'LIVE'} className="px-3 py-1.5 bg-green-900 text-green-300 rounded disabled:opacity-50">Start</button>
          <button onClick={controls.stopStream} disabled={state.status === 'PAUSED'} className="px-3 py-1.5 bg-red-900 text-red-300 rounded disabled:opacity-50">Stop</button>
          <button onClick={controls.increaseLoad} className="px-3 py-1.5 bg-gray-800 rounded hover:bg-gray-700">Faster</button>
          <button onClick={controls.decreaseLoad} className="px-3 py-1.5 bg-gray-800 rounded hover:bg-gray-700">Slower</button>
          <button onClick={controls.resetStream} className="px-3 py-1.5 bg-blue-900 text-blue-300 rounded hover:bg-blue-800">Reset</button>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <span className="text-gray-400 font-bold mb-1">Load Level Injection</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => controls.injectPoints(10000)}
              className="bg-purple-900 hover:bg-purple-800 text-white px-3 py-2 rounded text-xs font-bold"
            >
              +10k Points (1x)
            </button>
            <button
              onClick={() => controls.injectPoints(20000)}
              className="bg-purple-800 hover:bg-purple-700 text-white px-3 py-2 rounded text-xs font-bold"
            >
              +20k Points (2x)
            </button>
            <button
              onClick={() => controls.injectPoints(50000)}
              className="bg-fuchsia-900 hover:bg-fuchsia-800 text-white px-3 py-2 rounded text-xs font-bold"
            >
              +50k Points (5x)
            </button>
            <button
              onClick={() => controls.injectPoints(100000)}
              className="bg-fuchsia-800 hover:bg-fuchsia-700 text-white px-3 py-2 rounded text-xs font-bold"
            >
              +100k Points (10x)
            </button>
          </div>
        </div>

        <div>
          <div className="space-y-1 bg-black p-4 rounded min-h-[140px] text-gray-400">
            {state.logs.map((log, i) => (
              <div key={i}>{log.message}</div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Current points: <span className="text-white">{state.totalPointsCount.toLocaleString()}</span></div>
          <div>Update interval: <span className="text-white">{state.intervalMs} ms</span></div>
          <div>Status: <span className={state.status === 'LIVE' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{state.status}</span></div>
          <div>Points / sec: <span className="text-white">{state.intervalMs > 0 ? (1000 / state.intervalMs).toFixed(1) : 0}</span></div>
        </div>
      </div>
    </div>
  );
}
