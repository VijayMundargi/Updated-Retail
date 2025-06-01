
"use client"

import React, { useState, useEffect } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { getCustomerGrowthByPeriodAction, type ReportPeriod } from "@/app/dashboard/actions";
import type { CustomerGrowthDataPoint } from "@/lib/types"; 
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  customers: {
    label: "New Customers",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface CustomerGrowthChartProps {
  reportPeriod: ReportPeriod;
}

export function CustomerGrowthChart({ reportPeriod }: CustomerGrowthChartProps) {
  const [data, setData] = useState<CustomerGrowthDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getCustomerGrowthByPeriodAction(reportPeriod);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch customer growth data:", error);
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
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No customer growth data available for the selected period.</div>;
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
          <YAxis allowDecimals={false} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          <Line type="monotone" dataKey="customers" stroke="var(--color-customers)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

