/**
 * Analytics Page - Insights and Metrics
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  BookmarkCheck,
  History,
  User,
  TrendingUp,
  Download,
  BarChart3,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAnalytics, AnalyticsResponse } from "@/services/api/researcher";
import { useToast } from "@/hooks/useToast";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  BarChartConfig,
  BarChartContainer,
  BarChartTooltip,
  BarChartTooltipContent,
} from "@/components/ui/bar-chart";
import { Line, LineChart, XAxis, YAxis, Bar, BarChart } from "recharts";

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Prepare weekly chart data - group by day of week (MUST be before early returns)
  const weeklyChartData = React.useMemo(() => {
    if (!data?.activity_data) return [];

    const dayMap: { [key: string]: number } = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    data.activity_data.forEach((item) => {
      const date = new Date(item.date);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayName = dayNames[date.getDay()];
      dayMap[dayName] += item.count;
    });

    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
      day,
      searches: dayMap[day],
    }));
  }, [data?.activity_data]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getAnalytics();
      setData(response);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;

    // Create CSV content
    const csvContent = [
      // Header
      ["Recruitr Analytics Report", new Date().toLocaleDateString()],
      [],
      ["Metric", "Value"],
      ["Total Searches (This Month)", data.stats.searches_this_month],
      ["Saved Participants", data.stats.saved_participants],
      ["Recent Searches (7 days)", data.stats.recent_searches],
      ["Quality Searches (5+ results)", data.stats.high_quality_matches],
      [],
      ["Insights"],
      ["Most Active Day", data.insights.most_active_day],
      ["Avg Matches Per Search", data.insights.avg_matches_per_search],
      ["Most Searched Role", data.insights.most_searched_role],
      ["Most Used Tool", data.insights.most_used_tool_filter],
      [],
      ["Activity Data"],
      ["Date", "Searches"],
      ...data.activity_data.map((item) => [item.date, item.count]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recruitr-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Analytics report downloaded as CSV",
    });
  };

  // Early returns for loading and no data states
  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Spinner variant="bars" size={48} className="text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Analytics Yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Start searching for participants to see your analytics and insights
            here.
          </p>
          <Button
            onClick={() => (window.location.href = "/researcher/search")}
            className="bg-primary text-primary-foreground"
          >
            <Search className="h-4 w-4 mr-2" />
            Start Searching
          </Button>
        </div>
      </div>
    );
  }

  // Chart configuration
  const chartConfig = {
    count: {
      label: "Searches",
      color: "rgb(var(--color-blue-600))",
    },
  } satisfies ChartConfig;

  // Bar chart configuration for weekly breakdown
  const weeklyBarChartConfig = {
    searches: {
      label: "Searches",
      color: "hsl(var(--chart-1))",
    },
  } satisfies BarChartConfig;

  // Calculate trend percentage
  const calculateTrend = (current: number, previous: number = 0) => {
    if (previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${Math.round(change)}%`;
  };

  // Custom Tooltip for the new chart
  interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }

  const ChartCustomTooltip = ({
    active,
    payload,
    label,
  }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="rounded-lg border bg-popover p-3 shadow-sm shadow-black/5 min-w-[120px]">
          <p className="text-sm font-medium text-popover-foreground mb-1">
            {label
              ? new Date(label).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : ""}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="size-1.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-muted-foreground">Searches:</span>
            <span className="font-semibold text-popover-foreground">
              {entry.value}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your search performance and participant engagement
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={!data}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Searches"
          value={data.stats.searches_this_month.toString()}
          subtitle="This month"
          icon={<Search className="h-5 w-5" />}
          trend={calculateTrend(
            data.stats.searches_this_month,
            data.stats.total_searches - data.stats.searches_this_month
          )}
          trendUp={data.stats.searches_this_month > 0}
        />
        <StatsCard
          title="Saved Participants"
          value={data.stats.saved_participants.toString()}
          subtitle="Across all searches"
          icon={<BookmarkCheck className="h-5 w-5" />}
        />
        <StatsCard
          title="Recent Searches"
          value={data.stats.recent_searches.toString()}
          subtitle="Last 7 days"
          icon={<History className="h-5 w-5" />}
        />
        <StatsCard
          title="Quality Searches"
          value={data.stats.high_quality_matches.toString()}
          subtitle="With 5+ matches"
          icon={<User className="h-5 w-5" />}
          trend={calculateTrend(
            data.stats.high_quality_matches,
            data.stats.total_searches - data.stats.high_quality_matches
          )}
          trendUp={data.stats.high_quality_matches > 0}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search Activity Chart - Using New Component */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Search Activity Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2.5 py-6">
            {data.activity_data && data.activity_data.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="h-80 w-full overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
              >
                <LineChart
                  data={data.activity_data}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 5,
                    bottom: 20,
                  }}
                  style={{ overflow: "visible" }}
                >
                  {/* Background pattern */}
                  <defs>
                    <pattern
                      id="dotGrid"
                      x="0"
                      y="0"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        cx="10"
                        cy="10"
                        r="1"
                        fill="hsl(var(--input))"
                        fillOpacity="1"
                      />
                    </pattern>
                    <filter
                      id="lineShadow"
                      x="-100%"
                      y="-100%"
                      width="300%"
                      height="300%"
                    >
                      <feDropShadow
                        dx="4"
                        dy="6"
                        stdDeviation="25"
                        floodColor="rgb(var(--color-blue-600), 0.4)"
                      />
                    </filter>
                    <filter
                      id="dotShadow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feDropShadow
                        dx="2"
                        dy="2"
                        stdDeviation="3"
                        floodColor="rgba(0,0,0,0.5)"
                      />
                    </filter>
                  </defs>

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickMargin={10}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    tickMargin={10}
                    tickCount={6}
                  />

                  <ChartTooltip
                    content={<ChartCustomTooltip />}
                    cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }}
                  />

                  {/* Background pattern for chart area */}
                  <rect
                    x="60px"
                    y="-20px"
                    width="calc(100% - 75px)"
                    height="calc(100% - 10px)"
                    fill="url(#dotGrid)"
                    style={{ pointerEvents: "none" }}
                  />

                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="rgb(var(--color-blue-600))"
                    strokeWidth={2}
                    filter="url(#lineShadow)"
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "rgb(var(--color-blue-600))",
                      stroke: "white",
                      strokeWidth: 2,
                      filter: "url(#dotShadow)",
                    }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No search activity data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Breakdown Chart - Duotone Bar Chart */}
        <Card className="">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookmarkCheck className="h-5 w-5 text-primary" />
              Weekly Search Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2.5 py-6">
            {data.activity_data && data.activity_data.length > 0 ? (
              <BarChartContainer
                config={weeklyBarChartConfig}
                className="h-80 w-full"
              >
                <BarChart accessibilityLayer data={weeklyChartData}>
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="85%"
                    fill="url(#default-pattern-dots)"
                  />
                  <defs>
                    <pattern
                      id="default-pattern-dots"
                      x="0"
                      y="0"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle
                        className=" text-muted"
                        cx="2"
                        cy="2"
                        r="1"
                        fill="currentColor"
                      />
                    </pattern>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tick={{
                      fontSize: 11,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                  />
                  <BarChartTooltip
                    cursor={false}
                    content={<BarChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="searches"
                    fill="var(--color-searches)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </BarChartContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BookmarkCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No weekly data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card className="">
        <CardHeader>
          <CardTitle className="text-lg">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InsightRow
            label="Most active day"
            value={data.insights.most_active_day}
            color="text-primary-600"
          />
          <InsightRow
            label="Average matches per search"
            value={data.insights.avg_matches_per_search.toString()}
            color="text-primary-600"
          />
          <InsightRow
            label="Most searched role"
            value={data.insights.most_searched_role}
            color="text-primary-600"
          />
          <InsightRow
            label="Most used tool filter"
            value={data.insights.most_used_tool_filter}
            color="text-primary-600"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: string | null;
  trendUp?: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary-600">
            {icon}
          </div>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                trendUp
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Insight Row Component
function InsightRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={cn("text-sm font-semibold", color)}>{value}</span>
    </div>
  );
}
