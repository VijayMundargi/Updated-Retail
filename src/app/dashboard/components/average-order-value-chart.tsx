
"use client"

import React, { useState, useEffect } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getAOVByPeriodAction, type ReportPeriod } from "@/app/dashboard/actions";
import type { AverageOrderValueDataPoint } from "@/lib/types";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  aov: {
    label: "AOV (Rs.)",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface AverageOrderValueChartProps {
  reportPeriod: ReportPeriod;
}

export function AverageOrderValueChart({ reportPeriod }: AverageOrderValueChartProps) {
  const [data, setData] = useState<AverageOrderValueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getAOVByPeriodAction(reportPeriod);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch AOV data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reportPeriod]);

  if (loading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No AOV data available for the selected period.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="timePeriod"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => reportPeriod === 'daily' ? value.slice(5) : value.slice(0, 7)} // Display MM-DD for daily, YYYY-MM for monthly
          />
          <YAxis tickFormatter={(value) => `Rs. ${value}`} />
          <Tooltip content={<ChartTooltipContent formatter={(value) => (<span>Rs. {Number(value).toFixed(2)}</span>)} />} />
          <Legend />
          <Line type="monotone" dataKey="aov" stroke="var(--color-aov)" strokeWidth={2} dot={false} name="Average Order Value" />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

