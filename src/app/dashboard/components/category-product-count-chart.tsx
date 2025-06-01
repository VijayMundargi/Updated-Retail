
"use client"

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getProductCountByCategoryAction } from "@/app/dashboard/actions";
import type { CategoryProductCountDataPoint } from "@/lib/types";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  productCount: {
    label: "Product Count",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function CategoryProductCountChart() {
  const [data, setData] = useState<CategoryProductCountDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getProductCountByCategoryAction();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch product count by category:", error);
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
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No product category data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" accessibilityLayer margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey="category"
            type="category"
            tickLine={false}
            axisLine={false}
            width={100}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <XAxis dataKey="productCount" type="number" hide />
          <Tooltip content={<ChartTooltipContent />} />
          {/* <Legend /> */}
          <Bar dataKey="productCount" fill="var(--color-productCount)" radius={4} name="Products per Category" barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
