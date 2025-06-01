
'use server';

import { getSalesCollection, getProductsCollection, getCustomersCollection } from '@/lib/mongodb';
import type { SalesDataPoint, InventoryDataPoint, TopSellingProductDataPoint, CustomerGrowthDataPoint, ProfitLossDataPoint, AverageOrderValueDataPoint, SalesAmountDistributionDataPoint, ProductSalesParetoDataPoint } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { getCurrentUserId } from '@/lib/authUtils'; // Import new util

export type ReportPeriod = 'daily' | 'monthly';

function getDateFormatString(period: ReportPeriod): string {
  return period === 'daily' ? "%Y-%m-%d" : "%Y-%m";
}

export async function getSalesByPeriodAction(period: ReportPeriod = 'monthly'): Promise<SalesDataPoint[]> {
  try {
    const userId = await getCurrentUserId();
    const salesCollection = await getSalesCollection();
    const dateFormat = getDateFormatString(period);
    const salesData = await salesCollection.aggregate([
      { $match: { userId } }, 
      {
        $project: {
          periodGroup: { $dateToString: { format: dateFormat, date: "$date" } },
          totalAmount: 1
        }
      },
      {
        $group: {
          _id: "$periodGroup",
          sales: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          timePeriod: "$_id",
          sales: 1
        }
      }
    ]).toArray();
    return salesData as SalesDataPoint[];
  } catch (error) {
    console.error('Error fetching sales data by period:', error);
    return [];
  }
}

export async function getInventoryByCategoryAction(): Promise<InventoryDataPoint[]> {
  try {
    const userId = await getCurrentUserId();
    const productsCollection = await getProductsCollection();
    const inventoryData = await productsCollection.aggregate([
      { $match: { userId } }, 
      {
        $group: {
          _id: "$category",
          value: { $sum: "$stock" } 
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id", 
          value: 1      
        }
      },
      { $sort: { name: 1 } }
    ]).toArray();
    return inventoryData as InventoryDataPoint[];
  } catch (error) {
    console.error('Error fetching inventory by category:', error);
    return [];
  }
}

export async function getTopSellingProductsAction(limit: number = 5): Promise<TopSellingProductDataPoint[]> {
  try {
    const userId = await getCurrentUserId();
    const salesCollection = await getSalesCollection();
    const topProducts = await salesCollection.aggregate([
      { $match: { userId } }, 
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.productName" },
          sales: { $sum: "$items.quantity" } 
        }
      },
      { $sort: { sales: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          name: 1,
          sales: 1
        }
      }
    ]).toArray();
    return topProducts as TopSellingProductDataPoint[];
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    return [];
  }
}

export async function getCustomerGrowthByPeriodAction(period: ReportPeriod = 'monthly'): Promise<CustomerGrowthDataPoint[]> {
  try {
    const userId = await getCurrentUserId();
    const customersCollection = await getCustomersCollection();
    const dateFormat = getDateFormatString(period);
    const customerGrowth = await customersCollection.aggregate([
      { $match: { userId, createdAt: { $exists: true, $ne: null, $type: "date" } } }, 
      {
        $project: {
          periodGroup: { $dateToString: { format: dateFormat, date: "$createdAt" } }
        }
      },
      {
        $group: {
          _id: "$periodGroup",
          customers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          timePeriod: "$_id",
          customers: 1
        }
      }
    ]).toArray();
    return customerGrowth as CustomerGrowthDataPoint[];
  } catch (error) {
    console.error('Error fetching customer growth by period:', error);
    return [];
  }
}

export async function getProfitLossByPeriodAction(period: ReportPeriod = 'monthly'): Promise<ProfitLossDataPoint[]> {
   try {
    const userId = await getCurrentUserId();
    const salesCollection = await getSalesCollection();
    const dateFormat = getDateFormatString(period);
    const revenueData = await salesCollection.aggregate([
      { $match: { userId } }, 
      {
        $project: {
          periodGroup: { $dateToString: { format: dateFormat, date: "$date" } },
          totalAmount: 1
        }
      },
      {
        $group: {
          _id: "$periodGroup",
          profit: { $sum: "$totalAmount" } 
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          timePeriod: "$_id",
          profit: 1,
          loss: { $literal: 0 } 
        }
      }
    ]).toArray();
    return revenueData as ProfitLossDataPoint[];
  } catch (error) {
    console.error('Error fetching profit/loss data by period:', error);
    return [];
  }
}

export async function getAOVByPeriodAction(period: ReportPeriod = 'monthly'): Promise<AverageOrderValueDataPoint[]> {
  try {
    const userId = await getCurrentUserId();
    const salesCollection = await getSalesCollection();
    const dateFormat = getDateFormatString(period);
    const aovData = await salesCollection.aggregate([
      { $match: { userId } }, 
      {
        $project: {
          periodGroup: { $dateToString: { format: dateFormat, date: "$date" } },
          totalAmount: 1
        }
      },
      {
        $group: {
          _id: "$periodGroup",
          totalSalesAmount: { $sum: "$totalAmount" },
          numberOfSales: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          timePeriod: "$_id",
          aov: {
            $cond: {
              if: { $eq: ["$numberOfSales", 0] },
              then: 0,
              else: { $divide: ["$totalSalesAmount", "$numberOfSales"] }
            }
          }
        }
      },
      { $sort: { timePeriod: 1 } }
    ]).toArray();
    return aovData.map(d => ({ ...d, aov: parseFloat(d.aov.toFixed(2)) })) as AverageOrderValueDataPoint[];
  } catch (error) {
    console.error('Error fetching AOV data by period:', error);
    return [];
  }
}

export async function getSalesAmountDistributionAction(): Promise<SalesAmountDistributionDataPoint[]> {
  try {
    const userId = await getCurrentUserId();
    const salesCollection = await getSalesCollection();
    const distribution = await salesCollection.aggregate([
      { $match: { userId } },
      {
        $bucket: {
          groupBy: "$totalAmount",
          boundaries: [0, 51, 101, 201, 501, 1001], 
          default: "1001+",
          output: {
            transactionCount: { $sum: 1 }
          }
        }
      },
      {
        $project: {
          _id: 0,
          salesRange: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 0] }, then: "Rs. 0-50" },
                { case: { $eq: ["$_id", 51] }, then: "Rs. 51-100" },
                { case: { $eq: ["$_id", 101] }, then: "Rs. 101-200" },
                { case: { $eq: ["$_id", 201] }, then: "Rs. 201-500" },
                { case: { $eq: ["$_id", 501] }, then: "Rs. 501-1000" },
                { case: { $eq: ["$_id", "1001+"] }, then: "Rs. 1001+" },
              ],
              default: "Other"
            }
          },
          transactionCount: 1
        }
      },
       {
        $addFields: {
          order: {
            $switch: {
              branches: [
                { case: { $eq: ["$salesRange", "Rs. 0-50"] }, then: 1 },
                { case: { $eq: ["$salesRange", "Rs. 51-100"] }, then: 2 },
                { case: { $eq: ["$salesRange", "Rs. 101-200"] }, then: 3 },
                { case: { $eq: ["$salesRange", "Rs. 201-500"] }, then: 4 },
                { case: { $eq: ["$salesRange", "Rs. 501-1000"] }, then: 5 },
                { case: { $eq: ["$salesRange", "Rs. 1001+"] }, then: 6 },
              ],
              default: 99
            }
          }
        }
      },
      { $sort: { order: 1 } },
      { $project: { order: 0 } }
    ]).toArray();
    return distribution as SalesAmountDistributionDataPoint[];
  } catch (error) {
    console.error('Error fetching sales amount distribution:', error);
    return [];
  }
}

export async function getProductSalesParetoAction(limit: number = 7): Promise<ProductSalesParetoDataPoint[]> {
  try {
    const userId = await getCurrentUserId();
    const salesCollection = await getSalesCollection();

    const productSales = await salesCollection.aggregate([
      { $match: { userId } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalSalesAmount: { $sum: "$items.totalPrice" }
        }
      },
      { $sort: { totalSalesAmount: -1 } },
    ]).toArray();

    if (!productSales.length) return [];

    const overallTotalSales = productSales.reduce((sum, p) => sum + p.totalSalesAmount, 0);

    if (overallTotalSales === 0) return productSales.slice(0, limit).map(p => ({ productName: p.productName, salesAmount: p.totalSalesAmount, cumulativePercentage: 0 }));


    let cumulativeAmount = 0;
    const paretoData = productSales.map(p => {
      cumulativeAmount += p.totalSalesAmount;
      return {
        productName: p.productName,
        salesAmount: p.totalSalesAmount,
        cumulativePercentage: parseFloat(((cumulativeAmount / overallTotalSales) * 100).toFixed(1))
      };
    });

    return paretoData.slice(0, limit) as ProductSalesParetoDataPoint[];
  } catch (error) {
    console.error('Error fetching product sales pareto data:', error);
    return [];
  }
}

