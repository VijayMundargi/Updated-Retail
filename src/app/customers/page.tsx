
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Eye, Trash2, Loader2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import type { Customer } from "@/lib/types";
import { getCustomersAction, addCustomerAction, updateCustomerAction, deleteCustomerAction } from './actions';
import { type ColumnDef } from "@tanstack/react-table";
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchCustomers = async () => {
    setIsLoadingData(true);
    try {
      const fetchedCustomers = await getCustomersAction();
      setCustomers(fetchedCustomers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({ title: "Error", description: "Could not fetch customers.", variant: "destructive" });
      setCustomers([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'purchaseHistory' | 'loyaltyPoints'>) => {
    startTransition(async () => {
      const result = await addCustomerAction(customerData);
      if ('error' in result) {
        toast({ title: "Error Adding Customer", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Customer Added", description: `${result.name} has been added.` });
        setCustomers(prev => [result, ...prev]);
        setIsDialogOpen(false);
      }
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    const { id, ...customerData } = customer;
    // For simplicity, loyaltyPoints and purchaseHistory are part of the customer object passed to update.
    // More granular updates would require specific logic in the action.
    startTransition(async () => {
      const result = await updateCustomerAction(id, customerData);
      if ('error' in result) {
        toast({ title: "Error Updating Customer", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Customer Updated", description: `${result.name} has been updated.` });
        setCustomers(prev => prev.map(c => c.id === result.id ? result : c));
        setEditingCustomer(null);
        setIsDialogOpen(false);
      }
    });
  };
  
  const handleDeleteCustomer = (customerId: string) => {
    const customerName = customers.find(c => c.id === customerId)?.name;
    startTransition(async () => {
      const result = await deleteCustomerAction(customerId);
      if (!result.success) {
        toast({ title: "Error Deleting Customer", description: result.error || "Could not delete customer.", variant: "destructive" });
      } else {
        toast({ title: "Customer Deleted", description: `${customerName || 'Customer'} has been deleted.`, variant: "destructive" });
        setCustomers(prev => prev.filter(c => c.id !== customerId));
      }
    });
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  }

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "loyaltyPoints", header: "Loyalty Points" },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/customers/${customer.id}`}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View customer {customer.name}</span>
              </Link>
            </Button>
            <Button variant="outline" size="icon" onClick={() => openEditDialog(customer)} disabled={isPending}>
              <Edit className="h-4 w-4" />
            </Button>
             <Button variant="destructive" size="icon" onClick={() => handleDeleteCustomer(customer.id)} disabled={isPending}>
              {isPending && editingCustomer?.id !== customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];
  
  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading customers...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Customers" description="Manage your customer profiles and history.">
        <Button onClick={openAddDialog} disabled={isPending}>
           {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Add Customer
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={customers} filterColumnId="name" filterPlaceholder="Filter customers by name..." />
      
      <CustomerFormDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        customer={editingCustomer}
        onSave={editingCustomer ? handleEditCustomer : (data) => handleAddCustomer(data as Omit<Customer, 'id' | 'purchaseHistory' | 'loyaltyPoints'>)}
        isPending={isPending}
      />
    </>
  );
}

interface CustomerFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  customer: Customer | null;
  onSave: (customer: Customer | Omit<Customer, 'id' | 'purchaseHistory' | 'loyaltyPoints'>) => void;
  isPending?: boolean;
}

function CustomerFormDialog({ isOpen, setIsOpen, customer, onSave, isPending }: CustomerFormDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  // Loyalty points and purchase history are not directly editable in this form for simplicity
  // They would be managed by other processes (e.g., POS completing a sale)
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
    } else if (isOpen && !customer) {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
    }
  }, [customer, isOpen]);

  const handleSubmit = () => {
    if (!name || !email) {
      toast({title: "Validation Error", description: "Name and Email are required.", variant: "destructive"});
      return;
    }
    const customerData = { name, email, phone, address };

    if (customer && customer.id) { // Editing existing customer
      // Pass along existing loyalty points and purchase history if editing
      onSave({ ...customer, ...customerData, loyaltyPoints: customer.loyaltyPoints, purchaseHistory: customer.purchaseHistory });
    } else { // Adding new customer
      onSave(customerData); // loyaltyPoints and purchaseHistory will be initialized by the action
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {customer ? 'Update customer details.' : 'Enter details for the new customer.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cust-name" className="text-right">Name</Label>
            <Input id="cust-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cust-email" className="text-right">Email</Label>
            <Input id="cust-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cust-phone" className="text-right">Phone</Label>
            <Input id="cust-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cust-address" className="text-right">Address</Label>
            <Input id="cust-address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
