
'use server';

import { revalidatePath } from 'next/cache';
import { getCustomersCollection } from '@/lib/mongodb';
import type { Customer, Purchase } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { getCurrentUserId } from '@/lib/authUtils'; // Import new util

// Helper to convert MongoDB document to Customer type
function mongoDocToCustomer(doc: any): Customer {
  const { _id, purchaseHistory, createdAt, ...rest } = doc;
  const convertedPurchaseHistory = (purchaseHistory || []).map((p: any) => ({
    ...p,
    id: p._id ? p._id.toString() : p.id,
  }));
  return {
    id: _id.toString(),
    purchaseHistory: convertedPurchaseHistory,
    createdAt: createdAt ? new Date(createdAt) : new Date(0),
    ...rest
  } as Customer;
}

export async function getCustomersAction(): Promise<Customer[]> {
  try {
    const userId = await getCurrentUserId();
    const customersCollection = await getCustomersCollection();
    const customers = await customersCollection.find({ userId }).toArray(); // Filter by userId
    return customers.map(mongoDocToCustomer);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

export async function getCustomerByIdAction(customerId: string): Promise<Customer | null | { error: string }> {
  if (!ObjectId.isValid(customerId)) {
    return { error: 'Invalid customer ID format.' };
  }
  try {
    const userId = await getCurrentUserId();
    const customersCollection = await getCustomersCollection();
    const customerDoc = await customersCollection.findOne({ _id: new ObjectId(customerId), userId }); // Filter by userId
    if (!customerDoc) {
      return null; // Or { error: 'Customer not found or not owned by user.' }
    }
    return mongoDocToCustomer(customerDoc);
  } catch (error) {
    console.error('Error fetching customer by ID:', error);
    return { error: 'Failed to fetch customer.' };
  }
}

export async function addCustomerAction(customerData: Omit<Customer, 'id' | 'purchaseHistory' | 'loyaltyPoints' | 'createdAt' | 'userId'>): Promise<Customer | { error: string }> {
  try {
    const userId = await getCurrentUserId();
    const customersCollection = await getCustomersCollection();
    const customerToInsert = {
      ...customerData,
      userId, // Add userId
      purchaseHistory: [] as Purchase[],
      loyaltyPoints: 0,
      createdAt: new Date(),
    };
    const result = await customersCollection.insertOne(customerToInsert);
    revalidatePath('/customers');
    revalidatePath(`/customers/${result.insertedId.toString()}`);
    revalidatePath('/dashboard');
    return mongoDocToCustomer({ _id: result.insertedId, ...customerToInsert });
  } catch (error) {
    console.error('Error adding customer:', error);
    return { error: 'Failed to add customer.' };
  }
}

export async function updateCustomerAction(customerId: string, customerData: Partial<Omit<Customer, 'id' | 'createdAt' | 'userId'>>): Promise<Customer | { error: string }> {
  if (!ObjectId.isValid(customerId)) {
    return { error: 'Invalid customer ID format.' };
  }
  try {
    const userId = await getCurrentUserId();
    const customersCollection = await getCustomersCollection();

    const updateData = { ...customerData };
    if (updateData.purchaseHistory) {
        updateData.purchaseHistory = updateData.purchaseHistory.map(p => ({
            ...p,
            id: p.id || new ObjectId().toString(),
            date: p.date || new Date().toISOString(),
        }));
    }

    const result = await customersCollection.findOneAndUpdate(
      { _id: new ObjectId(customerId), userId }, // Filter by userId
      { $set: updateData },
      { returnDocument: 'after' }
    );
    if (!result) {
      return { error: 'Customer not found or not owned by user.' };
    }
    revalidatePath('/customers');
    revalidatePath(`/customers/${customerId}`);
    return mongoDocToCustomer(result);
  } catch (error) {
    console.error('Error updating customer:', error);
    return { error: 'Failed to update customer.' };
  }
}

export async function deleteCustomerAction(customerId: string): Promise<{ success: boolean; error?: string }> {
  if (!ObjectId.isValid(customerId)) {
    return { success: false, error: 'Invalid customer ID format.' };
  }
  try {
    const userId = await getCurrentUserId();
    const customersCollection = await getCustomersCollection();
    const result = await customersCollection.deleteOne({ _id: new ObjectId(customerId), userId }); // Filter by userId
    if (result.deletedCount === 0) {
      return { success: false, error: 'Customer not found, already deleted, or not owned by user.' };
    }
    revalidatePath('/customers');
    revalidatePath(`/customers/${customerId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting customer:', error);
    return { success: false, error: 'Failed to delete customer.' };
  }
}
