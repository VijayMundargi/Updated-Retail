
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Pie, PieChart, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { getInventoryByCategoryAction } from "@/app/dashboard/actions"; // Updated import
import type { InventoryDataPoint } from "@/lib/types";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton";

// Keep this flexible or ensure action returns names that match these keys
const chartConfigBase = {
  fruits: { label: "Fruits", color: "hsl(var(--chart-1))" },
  bakery: { label: "Bakery", color: "hsl(var(--chart-2))" },
  dairy: { label: "Dairy", color: "hsl(var(--chart-3))" },
  beverages: { label: "Beverages", color: "hsl(var(--chart-4))" },
  pantry: { label: "Pantry", color: "hsl(var(--chart-5))" },
  vegetables: { label: "Vegetables", color: "hsl(var(--chart-1))"}, // Example additional
  meats: { label: "Meats", color: "hsl(var(--chart-2))" },
  other: { label: "Other", color: "hsl(var(--muted))" }
} satisfies ChartConfig;


export function InventoryChart() {
  const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartConfig, setChartConfig] = useState<ChartConfig>(chartConfigBase);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getInventoryByCategoryAction();
        setInventoryData(result);
        
        // Dynamically build chartConfig based on fetched categories
        const dynamicConfig: ChartConfig = {};
        result.forEach((item, index) => {
          const key = item.name.toLowerCase().replace(/\s+/g, '_'); // Create a key from category name
           dynamicConfig[key] = {
            label: item.name,
            // Cycle through chart colors or use a color generation function
            color: `hsl(var(--chart-${(index % 5) + 1}))` 
          };
        });
        setChartConfig(current => ({...chartConfigBase, ...dynamicConfig}));

      } catch (error) {
        console.error("Failed to fetch inventory data:", error);
        setInventoryData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processedData = useMemo(() => {
    if (!inventoryData) return [];
    return inventoryData.map(item => {
      const key = item.name.toLowerCase().replace(/\s+/g, '_');
      return {
        name: item.name,
        value: item.value,
        fill: chartConfig[key]?.color || chartConfig['other']?.color || 'hsl(var(--muted))'
      };
    });
  }, [inventoryData, chartConfig]);

  if (loading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (!processedData || processedData.length === 0) {
    return <div className="flex items-center justify-center w-full h-full text-muted-foreground">No inventory data available.</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer>
          <Tooltip content={<ChartTooltipContent nameKey="name"/>} />
          <Legend />
          <Pie
            data={processedData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90} // Increased from 80
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
              const RADIAN = Math.PI / 180;
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              if (percent < 0.07) return null; // Increased threshold from 0.05
              return (
                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="9px"> {/* Reduced font size from 10px */}
                  {`${name} (${value})`}
                </text>
              );
            }}
          >
            {processedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
