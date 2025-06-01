
"use client";

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, PlusCircle, Trash2, Percent, CheckCircle, Loader2, AlertTriangle, FileText, User as UserIcon } from "lucide-react";
import type { Product, CartItem, Customer } from "@/lib/types";
import { getProductsAction } from '@/app/products/actions';
import { getCustomersAction } from '@/app/customers/actions';
import { createSaleAction } from './actions';
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function POSPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>("walk-in-anonymous"); // Default to anonymous
  
  // State for new customer inputs
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0); // Percentage
  const [isCheckoutComplete, setIsCheckoutComplete] = useState(false);
  const [lastSaleTotal, setLastSaleTotal] = useState(0);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState('');
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isProcessingCheckout, startCheckoutTransition] = useTransition();
  const [currencySymbol] = useState('Rs.');

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingProducts(true);
      setIsLoadingCustomers(true);
      try {
        const [fetchedProducts, fetchedCustomers] = await Promise.all([
          getProductsAction(),
          getCustomersAction()
        ]);
        setAllProducts(fetchedProducts);
        setCustomers(fetchedCustomers);
      } catch (error) {
        console.error("Failed to fetch initial POS data:", error);
        toast({ title: "Error", description: "Could not load products or customers.", variant: "destructive" });
        setAllProducts([]);
        setCustomers([]);
      } finally {
        setIsLoadingProducts(false);
        setIsLoadingCustomers(false);
      }
    };
    fetchInitialData();
  }, [toast]);

  const filteredProducts = useMemo(() => 
    allProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  , [allProducts, searchTerm]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map(item =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice } : item
          );
        } else {
          toast({ title: "Stock Limit", description: `Cannot add more ${product.name}. Max stock reached.`, variant: "destructive" });
          return prevCart;
        }
      } else {
        if (product.stock > 0) {
          return [...prevCart, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, totalPrice: product.price }];
        } else {
          toast({ title: "Out of Stock", description: `${product.name} is out of stock.`, variant: "destructive" });
          return prevCart;
        }
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const productInAll = allProducts.find(p => p.id === productId);
    if (!productInAll) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity > productInAll.stock) {
      toast({ title: "Stock Limit", description: `Cannot set quantity of ${productInAll.name} to ${newQuantity}. Max stock is ${productInAll.stock}.`, variant: "destructive" });
      setCart(prevCart => prevCart.map(item =>
        item.productId === productId ? { ...item, quantity: productInAll.stock, totalPrice: productInAll.stock * item.unitPrice } : item
      ));
    }
    else {
      setCart(prevCart => prevCart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice } : item
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.totalPrice, 0), [cart]);
  const discountAmount = useMemo(() => (subtotal * discount) / 100, [subtotal, discount]);
  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Empty Cart", description: "Please add products to the cart before checkout.", variant: "destructive" });
      return;
    }

    let saleCustomerInfo: Parameters<typeof createSaleAction>[5] = undefined;
    const selectedExistingCustomer = customers.find(c => c.id === selectedCustomerId);

    if (selectedExistingCustomer) {
      saleCustomerInfo = {
        customerId: selectedExistingCustomer.id,
        customerName: selectedExistingCustomer.name,
        customerEmail: selectedExistingCustomer.email,
        customerPhone: selectedExistingCustomer.phone,
        customerAddress: selectedExistingCustomer.address,
      };
    } else if (selectedCustomerId === "walk-in-new") {
      if (!newCustomerName || !newCustomerEmail) {
        toast({ title: "Missing Information", description: "Please enter Name and Email for the new customer.", variant: "destructive" });
        return;
      }
      saleCustomerInfo = {
        // customerId will be undefined, signaling to backend to create new
        customerName: newCustomerName,
        customerEmail: newCustomerEmail,
        customerPhone: newCustomerPhone,
        // customerAddress: can be added if a field for it is implemented
      };
    }
    // If selectedCustomerId is "walk-in-anonymous", saleCustomerInfo remains undefined for anonymous sale.
    
    startCheckoutTransition(async () => {
      const result = await createSaleAction(cart, subtotal, discount, discountAmount, total, saleCustomerInfo);
      if ('error' in result) {
        let description = result.error;
        if (result.insufficientStock && result.insufficientStock.length > 0) {
          description += " Details: " + result.insufficientStock.map(item => `${item.productName} (requested ${item.requested}, available ${item.available})`).join(', ');
        }
        toast({ title: "Checkout Failed", description, variant: "destructive" });
        const fetchedProducts = await getProductsAction();
        setAllProducts(fetchedProducts);
      } else {
        setLastSaleTotal(result.totalAmount);
        setLastInvoiceNumber(result.invoiceNumber);
        setLastSaleId(result.id);
        setIsCheckoutComplete(true);
        toast({ title: "Checkout Successful!", description: <>Invoice #{result.invoiceNumber} created. Total: {currencySymbol} {result.totalAmount.toFixed(2)}</> });
        
        const [fetchedProducts, fetchedCustomers] = await Promise.all([
          getProductsAction(),
          getCustomersAction() // Re-fetch customers in case a new one was added
        ]);
        setAllProducts(fetchedProducts);
        setCustomers(fetchedCustomers);
      }
    });
  };

  const startNewSale = () => {
    setCart([]);
    setDiscount(0);
    setIsCheckoutComplete(false);
    setSearchTerm('');
    setLastSaleTotal(0);
    setLastInvoiceNumber('');
    setLastSaleId(null);
    setSelectedCustomerId("walk-in-anonymous"); // Reset to anonymous
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
  };

  const handleCustomerSelectionChange = (value: string) => {
    setSelectedCustomerId(value);
    if (value !== "walk-in-new") {
      // Clear new customer fields if not adding a new one
      setNewCustomerName('');
      setNewCustomerEmail('');
      setNewCustomerPhone('');
    }
  };

  if (isCheckoutComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <CardTitle>Checkout Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-lg">Sale processed successfully.</p>
            <p className="text-2xl font-bold my-2">Total: {currencySymbol} {lastSaleTotal.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Invoice #{lastInvoiceNumber}</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            {lastSaleId && (
              <Link href={`/invoice/${lastSaleId}`} passHref legacyBehavior>
                <Button variant="outline" className="w-full sm:w-auto">
                  <FileText className="mr-2 h-4 w-4" /> View Invoice
                </Button>
              </Link>
            )}
            <Button onClick={startNewSale} className="w-full sm:w-auto flex-grow">Start New Sale</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Point of Sale" description="Process customer transactions quickly." />
      <div className="grid md:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Products</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search products by name..." 
                  className="pl-8 w-full" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoadingProducts || isProcessingCheckout}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" /> Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-muted-foreground text-center">No products found or available.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map(product => (
                    <Card key={product.id} className="flex flex-col">
                      <CardHeader className="p-2 flex-shrink-0">
                        {product.image ? 
                          <Image src={product.image} alt={product.name} width={100} height={100} className="rounded-md object-cover w-full h-32" data-ai-hint={product['data-ai-hint'] || 'product item'} />
                          : <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                        }
                        <CardTitle className="text-base mt-2">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2 text-sm flex-grow">
                        <p className="text-muted-foreground">{product.category}</p>
                        <p className="font-semibold">{currencySymbol} {product.price.toFixed(2)}</p>
                        <p className={`text-xs ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-600'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </p>
                      </CardContent>
                      <CardFooter className="p-2 flex-shrink-0">
                        <Button size="sm" className="w-full" onClick={() => addToCart(product)} disabled={product.stock === 0 || isProcessingCheckout}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add to Cart
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart & Checkout */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Current Sale</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center">Cart is empty.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-center">
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center"
                            min="0"
                            disabled={isProcessingCheckout}
                          />
                        </TableCell>
                        <TableCell className="text-right">{currencySymbol} {item.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.productId)} disabled={isProcessingCheckout}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Separator className="my-4" />
              
              <div className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="customer-select" className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" /> Customer
                  </Label>
                  {isLoadingCustomers ? (
                     <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading customers...
                     </div>
                  ) : (
                    <Select
                      value={selectedCustomerId}
                      onValueChange={handleCustomerSelectionChange}
                      disabled={isProcessingCheckout}
                    >
                      <SelectTrigger id="customer-select">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walk-in-anonymous">Walk-in (Anonymous Sale)</SelectItem>
                        <SelectItem value="walk-in-new">Add New Customer</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedCustomerId === "walk-in-new" && (
                  <div className="space-y-3 p-3 border rounded-md mt-2">
                    <Label className="text-sm font-medium">New Customer Details:</Label>
                     <div>
                      <Label htmlFor="new-cust-name" className="text-xs">Name</Label>
                      <Input id="new-cust-name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Full Name" disabled={isProcessingCheckout} />
                    </div>
                     <div>
                      <Label htmlFor="new-cust-email" className="text-xs">Email</Label>
                      <Input id="new-cust-email" type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} placeholder="you@example.com" disabled={isProcessingCheckout} />
                    </div>
                     <div>
                      <Label htmlFor="new-cust-phone" className="text-xs">Phone (Optional)</Label>
                      <Input id="new-cust-phone" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Phone Number" disabled={isProcessingCheckout} />
                    </div>
                  </div>
                )}


                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currencySymbol} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="discount" className="flex items-center">
                    <Percent className="mr-1 h-4 w-4" /> Discount (%)
                  </Label>
                  <Input 
                    id="discount" 
                    type="number" 
                    value={discount} 
                    onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="w-20 h-8 text-right"
                    disabled={isProcessingCheckout} 
                  />
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Discount Applied</span>
                    <span>-{currencySymbol} {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{currencySymbol} {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={cart.length === 0 || isLoadingProducts || isProcessingCheckout || isLoadingCustomers}>
                {isProcessingCheckout ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Complete Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}

