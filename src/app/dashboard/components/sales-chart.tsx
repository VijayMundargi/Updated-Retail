
"use client"

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getSalesByPeriodAction, type ReportPeriod } from "@/app/dashboard/actions";
import type { SalesDataPoint } from "@/lib/types";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  sales: {
    label: "Sales (Rs.)", 
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

interface SalesChartProps {
  reportPeriod: ReportPeriod;
}

export function SalesChart({ reportPeriod }: SalesChartProps) {
  const [data, setData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getSalesByPeriodAction(reportPeriod);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
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
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No sales data available for the selected period.</div>;
  }
  
  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="timePeriod"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => reportPeriod === 'daily' ? value.slice(5) : value.slice(0, 7)} // Display MM-DD for daily, YYYY-MM for monthly
          />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

