
"use client"

import React, { useState, useEffect } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getMonthlySalesCountAction } from "@/app/dashboard/actions";
import type { SalesCountDataPoint } from "@/lib/types";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  count: {
    label: "Sales Count",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function SalesCountChart() {
  const [data, setData] = useState<SalesCountDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getMonthlySalesCountAction();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch sales count data:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No sales count data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 7)}
          />
          <YAxis allowDecimals={false}/>
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2} dot={false} name="Number of Sales" />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
