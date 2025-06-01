
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSaleByIdAction } from '@/app/pos/actions';
import type { Sale } from '@/lib/types';
import { ArrowLeft, Printer, Loader2, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { APP_TITLE } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const saleId = params.saleId as string;
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currencySymbol = 'Rs.'; 

  useEffect(() => {
    if (saleId) {
      setIsLoading(true);
      setError(null);
      getSaleByIdAction(saleId)
        .then(result => {
          if (!result) {
            setError("Invoice not found.");
            setSale(null);
          } else if ('error' in result) {
            setError(result.error);
            setSale(null);
            toast({ title: "Error", description: result.error, variant: "destructive" });
          } else {
            setSale(result);
          }
        })
        .catch(err => {
          console.error("Failed to fetch invoice:", err);
          setError("An unexpected error occurred while fetching invoice details.");
          toast({ title: "Error", description: "Could not fetch invoice details.", variant: "destructive" });
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
      setError("No invoice ID provided.");
    }
  }, [saleId, toast]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <div className="flex flex-col items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading Invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted p-4 text-center">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-destructive">Error Loading Invoice</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error}</p>
                <Button variant="outline" onClick={() => router.push('/pos')} className="mt-6">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to POS
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted p-4 text-center">
         <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Invoice Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p>The requested invoice could not be found.</p>
                 <Button variant="outline" onClick={() => router.push('/pos')} className="mt-6">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to POS
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted p-4 sm:p-8 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto bg-card p-6 sm:p-8 rounded-lg shadow-lg print:shadow-none print:rounded-none print:border-none">
        <div className="flex justify-between items-start mb-6 print:mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">{APP_TITLE}</h1>
            <p className="text-muted-foreground">Retail Store Invoice</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold">Invoice #{sale.invoiceNumber}</h2>
            <p className="text-muted-foreground">Date: {format(new Date(sale.date), 'MMM d, yyyy HH:mm')}</p>
          </div>
        </div>

        {sale.customerName && (
          <div className="mb-6 print:mb-4 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Bill To:</h3>
              <p className="font-medium">{sale.customerName}</p>
              {sale.customerEmail && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-3 w-3" />
                  {sale.customerEmail}
                </div>
              )}
              {sale.customerPhone && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="mr-2 h-3 w-3" />
                  {sale.customerPhone}
                </div>
              )}
              {sale.customerAddress && (
                <div className="flex items-start text-sm text-muted-foreground mt-1">
                  <MapPin className="mr-2 h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{sale.customerAddress}</span>
                </div>
              )}
            </div>
            {/* You can add a "Ship To" section here if needed */}
          </div>
        )}


        <Card className="mb-6 print:mb-4 print:border-none print:shadow-none">
          <CardHeader className="print:p-0">
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="print:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Item</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{currencySymbol} {item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{currencySymbol} {item.totalPrice.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end mb-6 print:mb-4">
          <div className="w-full sm:w-1/2 md:w-1/3 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{currencySymbol} {sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount ({sale.discountApplied.toFixed(0)}%):</span>
                <span className="text-red-500">-{currencySymbol} {sale.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{currencySymbol} {sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-muted-foreground text-sm mb-8 print:mb-6">
          <p>Thank you for your purchase!</p>
          {/* Add your store's contact info or return policy here */}
          {/* <p>Questions? Contact us at support@example.com</p> */}
        </div>
        
        <div className="flex justify-between mt-8 print:hidden">
            <Button variant="outline" onClick={() => router.push('/pos')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to POS
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print Invoice
            </Button>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:mb-4 { margin-bottom: 1rem !important; } /* Adjusted from mb-6 for print */
        }
      `}</style>
    </div>
  );
}

