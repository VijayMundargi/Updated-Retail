
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Package, ShoppingCart, Users, Building2, Settings, Palette } from 'lucide-react';

export const APP_TITLE = "RetailManagement Store";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Products", href: "/products", icon: Package },
  { title: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Branches", href: "/branches", icon: Building2 },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const THEME_ICON = Palette;

export const LOW_STOCK_THRESHOLD = 10;
