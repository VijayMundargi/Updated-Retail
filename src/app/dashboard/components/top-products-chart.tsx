
"use client"

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { getTopSellingProductsAction } from "@/app/dashboard/actions"; // Updated import
import type { TopSellingProductDataPoint } from "@/lib/types"; 
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  sales: {
    label: "Units Sold",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function TopProductsChart() {
  const [data, setData] = useState<TopSellingProductDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // You can pass a limit to the action, e.g., getTopSellingProductsAction(5)
        const result = await getTopSellingProductsAction(); 
        setData(result);
      } catch (error) {
        console.error("Failed to fetch top products data:", error);
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
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No top products data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" accessibilityLayer margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
          <CartesianGrid horizontal={false} />
          <YAxis 
            dataKey="name" 
            type="category" 
            tickLine={false} 
            axisLine={false} 
            width={120} // Adjust width based on expected label length
            interval={0} // Show all labels
            tick={{ fontSize: 12 }}
          />
          <XAxis dataKey="sales" type="number" hide/>
          <Tooltip content={<ChartTooltipContent />} />
          <Bar dataKey="sales" fill="var(--color-sales)" radius={4} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
