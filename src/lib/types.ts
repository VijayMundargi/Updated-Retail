
export interface Product {
  id: string; // Corresponds to MongoDB _id (as string)
  name: string;
  category: string;
  price: number;
  stock: number;
  userId: string; // Added for user-specific data
  image?: string;
  description?: string;
  'data-ai-hint'?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  userId: string; // Added for user-specific data
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  purchaseHistory: Purchase[];
  createdAt: Date;
}

export interface Purchase {
  id: string;
  date: string; // ISO date string
  items: CartItem[];
  totalAmount: number;
  invoiceNumber: string;
  // userId is implicitly handled by the parent Sale's userId
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  size: string; // e.g., "Small", "Medium", "Large" or sqm
  userId: string; // Added for user-specific data
  manager?: string;
}

export interface User {
  id: string; // This is the User's own ID, not to be confused with userId field in other documents
  name: string;
  email: string;
  // In a real app, you would store a hashed password, not the password itself.
  // passwordHash?: string;
  createdAt: Date;
}

export interface Sale {
  id: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  discountApplied: number; // Percentage
  discountAmount: number;
  totalAmount: number;
  invoiceNumber: string;
  userId: string; // Added for user-specific data
  customerId?: string; // Optional: if a customer is associated
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
}

export interface StoreSettings {
  id?: string; // MongoDB _id
  userId: string; // Identifies the user these settings belong to
  taxRate?: number;
  currencySymbol?: string;
  pricesIncludeTax?: boolean;
  adminEmail?: string; // Email for admin notifications
  notifications?: {
    lowStockEmail?: boolean;
    lowStockSms?: boolean;
    dailySalesEmail?: boolean;
    weeklySalesEmail?: boolean;
  };
  // Add other settings as needed
}


export interface SalesDataPoint {
  timePeriod: string; // Changed from month
  sales: number;
}

export interface InventoryDataPoint {
  name: string; // Corresponds to category usually
  value: number; // Stock quantity for that category
}

export interface TopSellingProductDataPoint {
  name: string;
  sales: number; // Units sold or revenue
}

export interface CustomerGrowthDataPoint {
  timePeriod: string; // Changed from month
  customers: number; // New customers acquired
}

export interface ProfitLossDataPoint {
  timePeriod: string; // Changed from month
  profit: number;
  loss: number;
}

export interface AverageOrderValueDataPoint {
  timePeriod: string; // Changed from month
  aov: number;
}

// Data point for Sales Amount Distribution Histogram
export interface SalesAmountDistributionDataPoint {
  salesRange: string; // e.g., "0-50", "51-100"
  transactionCount: number;
}

// Data point for Product Sales Pareto Chart
export interface ProductSalesParetoDataPoint {
  productName: string;
  salesAmount: number;
  cumulativePercentage: number;
}

