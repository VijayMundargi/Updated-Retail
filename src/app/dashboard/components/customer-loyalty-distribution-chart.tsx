
"use client"

import React, { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getCustomerLoyaltyDistributionAction } from "@/app/dashboard/actions";
import type { CustomerLoyaltyDistributionDataPoint } from "@/lib/types";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  customerCount: {
    label: "Customers",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function CustomerLoyaltyDistributionChart() {
  const [data, setData] = useState<CustomerLoyaltyDistributionDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getCustomerLoyaltyDistributionAction();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch customer loyalty distribution:", error);
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
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No loyalty data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="loyaltyRange"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis allowDecimals={false} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="customerCount" fill="var(--color-customerCount)" radius={4} name="Customers in Range" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
