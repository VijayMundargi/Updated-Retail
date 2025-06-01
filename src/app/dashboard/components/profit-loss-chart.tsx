
"use client"

import React, { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getProfitLossByPeriodAction, type ReportPeriod } from "@/app/dashboard/actions";
import type { ProfitLossDataPoint } from "@/lib/types"; 
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  profit: {
    label: "Revenue (Rs.)", 
    color: "hsl(var(--chart-1))",
  },
  loss: {
    label: "Expenses (Rs.)", 
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

interface ProfitLossChartProps {
  reportPeriod: ReportPeriod;
}

export function ProfitLossChart({ reportPeriod }: ProfitLossChartProps) {
  const [data, setData] = useState<ProfitLossDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getProfitLossByPeriodAction(reportPeriod);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch profit/loss data:", error);
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
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No profit & loss data available for the selected period.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="timePeriod"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => reportPeriod === 'daily' ? value.slice(5) : value.slice(0, 7)} // Display MM-DD for daily, YYYY-MM for monthly
          />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          <Area type="monotone" dataKey="profit" stackId="1" stroke="var(--color-profit)" fill="var(--color-profit)" fillOpacity={0.4} />
          <Area type="monotone" dataKey="loss" stackId="1" stroke="var(--color-loss)" fill="var(--color-loss)" fillOpacity={0.4} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

