import { ChartContainer } from '@/components/charts/ChartContainer';
import { FilterProvider } from '@/components/providers/FilterProvider';
import { FilterPanel } from '@/components/controls/FilterPanel';
import { TimeRangeSelector } from '@/components/controls/TimeRangeSelector';
import { DataTable } from '@/components/ui/DataTable';

export default function DashboardPage() {
  return (
    <FilterProvider>
      <div className="flex flex-col gap-6">
        <section className="bg-[#111111] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Dashboard Overview</h2>
          <p className="text-gray-400 mb-6">
            Welcome to the performance-critical data visualization dashboard.
            Here is a demonstration of the real-time Canvas + SVG rendering engine.
          </p>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
               <FilterPanel />
               <TimeRangeSelector />
            </div>
            <div className="flex-grow min-w-0">
               <ChartContainer />
               <div className="mt-6 overflow-hidden">
                 <DataTable />
               </div>
            </div>
          </div>
        </section>
      </div>
    </FilterProvider>
  );
}
