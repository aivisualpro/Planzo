import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DashboardWidgets } from "@/components/dashboard-widgets";

export default function Page() {
  const chartData: any[] = [];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={chartData} />
      </div>
      <div className="px-4 lg:px-6">
        <DashboardWidgets />
      </div>
    </div>
  );
}
