
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCustomerByIdAction } from '@/app/customers/actions'; // Changed import
import type { Customer, Purchase } from '@/lib/types';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, CalendarDays, Hash, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currencySymbol] = useState('Rs.'); 

  // In a more complex app, settings (like currency symbol) might come from a context or store.
  // useEffect(() => {
  //   async function fetchSettings() {
  //     const settings = await getStoreSettingsAction(); // Assuming you have such an action
  //     if (settings && settings.currencySymbol) {
  //       setCurrencySymbol(settings.currencySymbol);
  //     }
  //   }
  //   fetchSettings();
  // }, []);

  useEffect(() => {
    if (customerId) {
      setIsLoading(true);
      setError(null);
      getCustomerByIdAction(customerId)
        .then(result => {
          if (!result) {
            setError("Customer not found.");
            setCustomer(null);
          } else if ('error' in result) {
            setError(result.error);
            setCustomer(null);
            toast({ title: "Error", description: result.error, variant: "destructive" });
          } else {
            setCustomer(result);
          }
        })
        .catch(err => {
          console.error("Failed to fetch customer:", err);
          setError("An unexpected error occurred while fetching customer details.");
          toast({ title: "Error", description: "Could not fetch customer details.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      setError("No customer ID provided.");
    }
  }, [customerId, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        Loading customer details...
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center h-full">
        <PageHeader title="Error" />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
         <PageHeader title="Customer Not Found" />
        <p>The requested customer could not be found.</p>
         <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Customer Details">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
      </PageHeader>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={`https://placehold.co/100x100.png?text=${customer.name.charAt(0)}`} alt={customer.name} data-ai-hint="avatar person" />
                <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
              <CardDescription>Loyalty Points: {customer.loyaltyPoints}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center">
                    <Phone className="mr-3 h-5 w-5 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start">
                    <MapPin className="mr-3 h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>{customer.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>List of all purchases made by {customer.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              {customer.purchaseHistory.length === 0 ? (
                <p className="text-muted-foreground">No purchases recorded for this customer.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><Hash className="inline-block mr-1 h-4 w-4" />Invoice #</TableHead>
                      <TableHead><CalendarDays className="inline-block mr-1 h-4 w-4" />Date</TableHead>
                      <TableHead><ShoppingBag className="inline-block mr-1 h-4 w-4" />Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.purchaseHistory.map((purchase: Purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{purchase.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(purchase.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{purchase.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                        <TableCell className="text-right">{currencySymbol} {purchase.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

