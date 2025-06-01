
"use client"

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getSalesAmountDistributionAction } from "@/app/dashboard/actions";
import type { SalesAmountDistributionDataPoint } from "@/lib/types";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  transactionCount: {
    label: "Transactions",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function SalesAmountHistogram() {
  const [data, setData] = useState<SalesAmountDistributionDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getSalesAmountDistributionAction();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch sales amount distribution data:", error);
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
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No sales distribution data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="salesRange"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis allowDecimals={false} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="transactionCount" fill="var(--color-transactionCount)" radius={4} name="Number of Transactions" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
