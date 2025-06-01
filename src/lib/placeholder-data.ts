
import type { Product, Customer, Branch, SalesDataPoint, InventoryDataPoint, Purchase, TopSellingProductDataPoint, CustomerGrowthDataPoint, ProfitLossDataPoint } from './types';

// These placeholder data arrays and functions are no longer the primary source for the dashboard charts.
// They are kept for potential other uses or as fallbacks, but the dashboard now fetches live data.

const _placeholderProducts: Product[] = [];
export const getPlaceholderProducts = (): Promise<Product[]> => new Promise(resolve => setTimeout(() => resolve(_placeholderProducts), 500));


const _samplePurchaseHistory: Purchase[] = [];
export const getSamplePurchaseHistory = (): Promise<Purchase[]> => new Promise(resolve => setTimeout(() => resolve(_samplePurchaseHistory), 500));


const _placeholderCustomers: Customer[] = [];
export const getPlaceholderCustomers = (): Promise<Customer[]> => new Promise(resolve => setTimeout(() => resolve(_placeholderCustomers), 500));


const _placeholderBranches: Branch[] = [];
export const getPlaceholderBranches = (): Promise<Branch[]> => new Promise(resolve => setTimeout(() => resolve(_placeholderBranches), 500));


const _salesChartData: SalesDataPoint[] = [];
/** @deprecated Dashboard now uses getMonthlySalesAction from @/app/dashboard/actions */
export const getSalesChartData = (): Promise<SalesDataPoint[]> => {
  console.warn("getSalesChartData from placeholder-data.ts is deprecated for dashboard use.");
  return new Promise(resolve => setTimeout(() => resolve(_salesChartData), 700));
}


const _inventoryStockData: InventoryDataPoint[] = [];
/** @deprecated Dashboard now uses getInventoryByCategoryAction from @/app/dashboard/actions */
export const getInventoryStockData = (): Promise<InventoryDataPoint[]> => {
  console.warn("getInventoryStockData from placeholder-data.ts is deprecated for dashboard use.");
  return new Promise(resolve => setTimeout(() => resolve(_inventoryStockData), 600));
}

const _topSellingProductsData: TopSellingProductDataPoint[] = [];
/** @deprecated Dashboard now uses getTopSellingProductsAction from @/app/dashboard/actions */
export const getTopSellingProductsData = (): Promise<TopSellingProductDataPoint[]> => {
  console.warn("getTopSellingProductsData from placeholder-data.ts is deprecated for dashboard use.");
  return new Promise(resolve => setTimeout(() => resolve(_topSellingProductsData), 800));
}

const _customerGrowthData: CustomerGrowthDataPoint[] = [];
/** @deprecated Dashboard now uses getMonthlyCustomerGrowthAction from @/app/dashboard/actions */
export const getCustomerGrowthData = (): Promise<CustomerGrowthDataPoint[]> => {
  console.warn("getCustomerGrowthData from placeholder-data.ts is deprecated for dashboard use.");
  return new Promise(resolve => setTimeout(() => resolve(_customerGrowthData), 900));
}

const _profitLossData: ProfitLossDataPoint[] = [];
/** @deprecated Dashboard now uses getMonthlyProfitLossAction from @/app/dashboard/actions */
export const getProfitLossData = (): Promise<ProfitLossDataPoint[]> => {
  console.warn("getProfitLossData from placeholder-data.ts is deprecated for dashboard use.");
  return new Promise(resolve => setTimeout(() => resolve(_profitLossData), 1000));
}

// Re-exporting original names for compatibility if any non-dashboard code was using them.
export const placeholderProducts = _placeholderProducts;
export const placeholderCustomers = _placeholderCustomers;
export const placeholderBranches = _placeholderBranches;
export const salesChartData = _salesChartData; 
export const inventoryStockData = _inventoryStockData; 
export const topSellingProductsData = _topSellingProductsData; 
export const customerGrowthData = _customerGrowthData; 
export const profitLossData = _profitLossData;
