
"use client";

import React, { useState, useTransition } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2, CalendarDays } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { getProductsAction } from '@/app/products/actions';
import type { Product } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import {
  getSalesByPeriodAction,
  getTopSellingProductsAction,
  getInventoryByCategoryAction,
  getCustomerGrowthByPeriodAction,
  getProfitLossByPeriodAction,
  getAOVByPeriodAction,
  getSalesAmountDistributionAction,
  getProductSalesParetoAction,
  type ReportPeriod
} from "./actions";
import type {
  SalesDataPoint,
  TopSellingProductDataPoint,
  InventoryDataPoint,
  CustomerGrowthDataPoint,
  ProfitLossDataPoint,
  AverageOrderValueDataPoint,
  SalesAmountDistributionDataPoint,
  ProductSalesParetoDataPoint
} from '@/lib/types';


// Bar Graphs
import { SalesChart } from "./components/sales-chart"; // Monthly Sales Revenue
import { TopProductsChart } from "./components/top-products-chart"; // Top Selling Products by Units

// Line Graphs
import { CustomerGrowthChart } from "./components/customer-growth-chart"; // New Customer Growth
import { AverageOrderValueChart } from "./components/average-order-value-chart"; // Average Order Value (AOV)

// Pie Chart
import { InventoryChart } from "./components/inventory-chart"; // Inventory by Category

// Area Chart
import { ProfitLossChart } from "./components/profit-loss-chart"; // Monthly Revenue Overview

// Histogram
import { SalesAmountHistogram } from "./components/sales-amount-histogram"; // Sales Amount Distribution

// Pareto Chart
import { ProductSalesParetoChart } from "./components/product-sales-pareto-chart"; // Product Sales Contribution


export default function DashboardPage() {
  const [isExporting, startExportTransition] = useTransition();
  const { toast } = useToast();
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('monthly');

  const exportDashboardReportsToExcel = async () => {
    startExportTransition(async () => {
      try {
        toast({ title: "Exporting Reports...", description: "Preparing dashboard data for Excel export. This may take a moment." });
        
        const workbook = XLSX.utils.book_new();
        const periodName = reportPeriod === 'daily' ? 'Daily' : 'Monthly';

        // 1. Products Export (existing logic)
        const products: Product[] = await getProductsAction();
        if (products && products.length > 0) {
          const productSheetData = products.map(({ id, name, category, price, stock, description, image, 'data-ai-hint': dataAiHint }) => ({
            ID: id,
            Name: name,
            Category: category,
            Price: price,
            Stock: stock,
            Description: description || '',
            ImageURL: image || '',
            DataAIHint: dataAiHint || ''
          }));
          const productWorksheet = XLSX.utils.json_to_sheet(productSheetData);
          XLSX.utils.book_append_sheet(workbook, productWorksheet, "Products");
        } else {
          const emptyProductSheet = XLSX.utils.json_to_sheet([{ Message: "No product data available." }]);
          XLSX.utils.book_append_sheet(workbook, emptyProductSheet, "Products");
        }

        // Helper function to add sheets
        const addSheetToWorkbook = (sheetName: string, data: any[], defaultMessage: string = "No data available for this report.") => {
          if (data && data.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
          } else {
            const emptySheet = XLSX.utils.json_to_sheet([{ Message: defaultMessage }]);
            XLSX.utils.book_append_sheet(workbook, emptySheet, sheetName);
          }
        };

        // 2. Fetch and add other reports
        const [
          salesData,
          topProductsData,
          inventoryData,
          customerGrowthData,
          profitLossData,
          aovData,
          salesDistributionData,
          paretoData
        ] = await Promise.all([
          getSalesByPeriodAction(reportPeriod),
          getTopSellingProductsAction(),
          getInventoryByCategoryAction(),
          getCustomerGrowthByPeriodAction(reportPeriod),
          getProfitLossByPeriodAction(reportPeriod),
          getAOVByPeriodAction(reportPeriod),
          getSalesAmountDistributionAction(),
          getProductSalesParetoAction()
        ]);

        addSheetToWorkbook(`Sales (${periodName})`, salesData as SalesDataPoint[]);
        addSheetToWorkbook("Top Selling Products", topProductsData as TopSellingProductDataPoint[]);
        addSheetToWorkbook("Inventory by Category", inventoryData as InventoryDataPoint[]);
        addSheetToWorkbook(`Customer Growth (${periodName})`, customerGrowthData as CustomerGrowthDataPoint[]);
        addSheetToWorkbook(`Profit & Loss (${periodName})`, profitLossData as ProfitLossDataPoint[]);
        addSheetToWorkbook(`Avg Order Value (${periodName})`, aovData as AverageOrderValueDataPoint[]);
        addSheetToWorkbook("Sales Amount Distribution", salesDistributionData as SalesAmountDistributionDataPoint[]);
        addSheetToWorkbook("Product Sales Pareto", paretoData as ProductSalesParetoDataPoint[]);
        
        const fileName = `Dashboard_Reports_${new Date().toISOString().split('T')[0]}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast({ title: "Export Successful", description: `Dashboard reports exported to ${fileName}.` });

      } catch (error) {
        console.error("Failed to export dashboard reports:", error);
        toast({ title: "Export Failed", description: "Could not export dashboard reports.", variant: "destructive" });
      }
    });
  };

  const commonChartHeight = "h-[300px] sm:h-[350px] md:h-[400px]";

  return (
    <>
      <PageHeader title="Dashboard" description="Advanced data visualizations.">
        <div className="flex items-center gap-2">
           <Select value={reportPeriod} onValueChange={(value) => setReportPeriod(value as ReportPeriod)}>
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Report Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Reports</SelectItem>
              <SelectItem value="monthly">Monthly Reports</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export Reports
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportDashboardReportsToExcel} disabled={isExporting}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export All Dashboard Reports to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        
        <Card>
          <CardHeader>
            <CardTitle>Bar Graph: {reportPeriod === 'daily' ? 'Daily' : 'Monthly'} Sales Revenue</CardTitle>
            <CardDescription>Total sales revenue (Rs.) per {reportPeriod === 'daily' ? 'day' : 'month'}.</CardDescription>
          </CardHeader>
          <CardContent className={commonChartHeight}>
            <SalesChart reportPeriod={reportPeriod} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bar Graph: Top 5 Selling Products</CardTitle>
            <CardDescription>Products with the most units sold (overall).</CardDescription>
          </CardHeader>
          <CardContent className={commonChartHeight}>
            <TopProductsChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Graph: New Customer Growth</CardTitle>
            <CardDescription>New customer profiles created per {reportPeriod === 'daily' ? 'day' : 'month'}.</CardDescription>
          </CardHeader>
          <CardContent className={commonChartHeight}>
            <CustomerGrowthChart reportPeriod={reportPeriod} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Line Graph: Average Order Value (AOV)</CardTitle>
            <CardDescription>Average sales amount (Rs.) per order, {reportPeriod === 'daily' ? 'daily' : 'monthly'}.</CardDescription>
          </CardHeader>
          <CardContent className={commonChartHeight}>
            <AverageOrderValueChart reportPeriod={reportPeriod} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pie Chart: Inventory by Category</CardTitle>
            <CardDescription>Current stock value across product categories.</CardDescription>
          </CardHeader>
          <CardContent className={commonChartHeight}>
            <InventoryChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Area Chart: {reportPeriod === 'daily' ? 'Daily' : 'Monthly'} Revenue Overview</CardTitle>
            <CardDescription>Summary of revenue over time (expenses not tracked).</CardDescription>
          </CardHeader>
          <CardContent className={commonChartHeight}>
            <ProfitLossChart reportPeriod={reportPeriod} />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Histogram: Sales Transaction Amount Distribution</CardTitle>
            <CardDescription>Number of transactions within different sales amount ranges (overall).</CardDescription>
          </CardHeader>
          <CardContent className={commonChartHeight}>
            <SalesAmountHistogram />
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pareto Chart: Product Contribution to Sales</CardTitle>
            <CardDescription>Sales amount by top products and their cumulative contribution (overall).</CardDescription>
          </CardHeader>
          <CardContent className={commonChartHeight}>
            <ProductSalesParetoChart />
          </CardContent>
        </Card>

      </div>
    </>
  );
}

