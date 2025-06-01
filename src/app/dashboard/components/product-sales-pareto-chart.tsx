
"use client"

import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getProductSalesParetoAction } from "@/app/dashboard/actions";
import type { ProductSalesParetoDataPoint } from "@/lib/types";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  salesAmount: {
    label: "Sales (Rs.)",
    color: "hsl(var(--chart-1))",
  },
  cumulativePercentage: {
    label: "Cumulative %",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function ProductSalesParetoChart() {
  const [data, setData] = useState<ProductSalesParetoDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getProductSalesParetoAction();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch product sales pareto data:", error);
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
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No Pareto data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false}/>
          <XAxis dataKey="productName" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={70}/>
          <YAxis yAxisId="left" orientation="left" stroke="var(--color-salesAmount)" label={{ value: 'Sales Amount (Rs.)', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle', fill: 'hsl(var(--foreground))'} }} />
          <YAxis yAxisId="right" orientation="right" stroke="var(--color-cumulativePercentage)" domain={[0, 100]} label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', style: {textAnchor: 'middle', fill: 'hsl(var(--foreground))'} }} allowDecimals={false}/>
          <Tooltip content={<ChartTooltipContent 
            formatter={(value, name) => {
                if (name === 'cumulativePercentage') return `${value}%`;
                return `Rs. ${Number(value).toFixed(2)}`;
            }}
          />} />
          <Legend />
          <Bar yAxisId="left" dataKey="salesAmount" fill="var(--color-salesAmount)" name="Sales Amount" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="var(--color-cumulativePercentage)" strokeWidth={2} name="Cumulative %" dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
