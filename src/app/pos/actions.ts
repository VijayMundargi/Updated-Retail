
'use server';

import { revalidatePath } from 'next/cache';
import { getSalesCollection, getProductsCollection, getCustomersCollection } from '@/lib/mongodb';
import type { Sale, CartItem, Product, Customer } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { addCustomerAction } from '@/app/customers/actions';
import { getStoreSettingsAction } from '@/app/settings/actions';
import { sendLowStockEmailNotification } from '@/lib/emailService';
import { LOW_STOCK_THRESHOLD, APP_TITLE } from '@/lib/constants';
import { getCurrentUserId } from '@/lib/authUtils'; // Import new util

// Helper to convert MongoDB document to Sale type
function mongoDocToSale(doc: any): Sale {
  if (!doc) return null as unknown as Sale;
  const { _id, date, ...rest } = doc;
  return { id: _id.toString(), date: new Date(date), ...rest } as Sale;
}

// Helper to convert MongoDB document to Product type (ObjectId to string id)
// This helper is specific to this file's needs or could be imported if identical.
// For now, keeping it local to illustrate potential differences from products/actions.ts version.
function mongoDocToProduct(doc: any): Product {
  if (!doc) {
    // Or handle more gracefully depending on where it's called
    throw new Error("mongoDocToProduct received null document");
  }
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as Product;
}


interface CustomerInfoForSale {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
}

export async function createSaleAction(
  cartItems: CartItem[],
  subtotal: number,
  discountApplied: number,
  discountAmount: number,
  totalAmount: number,
  customerInfo?: CustomerInfoForSale
): Promise<Sale | { error: string; insufficientStock?: { productId: string, productName: string, requested: number, available: number }[] }> {
  try {
    const userId = await getCurrentUserId(); // Get current user ID
    const salesCollection = await getSalesCollection();
    const productsCollection = await getProductsCollection();
    const customersCollection = await getCustomersCollection();
    

    const productIds = cartItems.map(item => new ObjectId(item.productId));
    // Ensure product lookups are also scoped by userId if products are user-specific
    const productsInDB = await productsCollection.find({ _id: { $in: productIds }, userId }).toArray();

    const productsMap = new Map(productsInDB.map(p => [p._id.toString(), p]));
    const insufficientStockItems: { productId: string, productName: string, requested: number, available: number }[] = [];

    for (const item of cartItems) {
      const product = productsMap.get(item.productId);
      if (!product) {
        // This implies a product from the cart wasn't found for this user
        return { error: `Product ${item.productName} not found or not available for this user.` };
      }
      if (product.stock < item.quantity) {
        insufficientStockItems.push({
          productId: item.productId,
          productName: item.productName,
          requested: item.quantity,
          available: product.stock
        });
      }
    }

    if (insufficientStockItems.length > 0) {
      return {
        error: 'Insufficient stock for one or more items.',
        insufficientStock: insufficientStockItems
      };
    }

    let finalCustomerId: string | undefined = customerInfo?.customerId;
    let finalCustomerName: string | undefined = customerInfo?.customerName;
    let finalCustomerEmail: string | undefined = customerInfo?.customerEmail;
    let finalCustomerPhone: string | undefined = customerInfo?.customerPhone;
    let finalCustomerAddress: string | undefined = customerInfo?.customerAddress;

    if (!finalCustomerId && customerInfo?.customerEmail && customerInfo?.customerName) {
      // Check for existing customer for the current userId
      const existingCustomerByEmail = await customersCollection.findOne({ email: customerInfo.customerEmail, userId });

      if (existingCustomerByEmail) {
        finalCustomerId = existingCustomerByEmail._id.toString();
        finalCustomerName = existingCustomerByEmail.name;
        finalCustomerEmail = existingCustomerByEmail.email;
        finalCustomerPhone = existingCustomerByEmail.phone || customerInfo.customerPhone;
        finalCustomerAddress = existingCustomerByEmail.address || customerInfo.customerAddress;
      } else {
        // Omit userId here because addCustomerAction will add it
        const newCustomerData: Omit<Customer, 'id' | 'purchaseHistory' | 'loyaltyPoints' | 'createdAt' | 'userId'> = {
          name: customerInfo.customerName,
          email: customerInfo.customerEmail,
          phone: customerInfo.customerPhone,
          address: customerInfo.customerAddress,
        };
        // addCustomerAction will automatically use the current userId from getCurrentUserId()
        const addResult = await addCustomerAction(newCustomerData);
        if ('error' in addResult) {
          console.error("Failed to add new customer during sale:", addResult.error);
          finalCustomerId = undefined;
          finalCustomerName = customerInfo.customerName;
          finalCustomerEmail = customerInfo.customerEmail;
          finalCustomerPhone = customerInfo.customerPhone;
          finalCustomerAddress = customerInfo.customerAddress;
        } else {
          finalCustomerId = addResult.id;
        }
      }
    }

    const saleToInsert: Omit<Sale, 'id'> = {
      date: new Date(),
      items: cartItems,
      subtotal,
      discountApplied,
      discountAmount,
      totalAmount,
      invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
      userId, // Add userId to the sale
      ...(finalCustomerId && { customerId: finalCustomerId }),
      ...(finalCustomerName && { customerName: finalCustomerName }),
      ...(finalCustomerEmail && { customerEmail: finalCustomerEmail }),
      ...(finalCustomerPhone && { customerPhone: finalCustomerPhone }),
      ...(finalCustomerAddress && { customerAddress: finalCustomerAddress }),
    };
    const result = await salesCollection.insertOne(saleToInsert);

    for (const item of cartItems) {
      // Ensure product stock updates are for products belonging to the current user
      const updateResult = await productsCollection.findOneAndUpdate(
        { _id: new ObjectId(item.productId), userId },
        { $inc: { stock: -item.quantity } },
        { returnDocument: 'after' }
      );

      if (updateResult) {
        const updatedProduct = mongoDocToProduct(updateResult); 
         if (updatedProduct.stock < LOW_STOCK_THRESHOLD) {
          // Fetch store settings inside the loop only if needed, to minimize DB calls
          // Alternatively, fetch once before the loop if performance is critical and settings don't change rapidly.
          const storeSettings = await getStoreSettingsAction();
          if (storeSettings?.notifications?.lowStockEmail && storeSettings.adminEmail) {
            await sendLowStockEmailNotification(
              storeSettings.adminEmail,
              { id: updatedProduct.id, name: updatedProduct.name, stock: updatedProduct.stock },
              APP_TITLE
            );
          }
        }
      } else {
        // This is a critical failure: product was verified at start but couldn't be updated.
        // This could be due to a race condition or data inconsistency.
        // Throwing an error here will abort the sale process and trigger the catch block.
        console.error(`CRITICAL: Product ID ${item.productId} (Name: ${item.productName}) for user ${userId} was not found or did not match during stock update, despite passing initial checks. Stock for this item was NOT updated.`);
        throw new Error(`Failed to update stock for product "${item.productName}". It may have been modified or deleted.`);
      }
    }

    revalidatePath('/pos');
    revalidatePath('/products');
    revalidatePath('/dashboard');
    if (finalCustomerId) {
      revalidatePath(`/customers/${finalCustomerId}`);
    }

    return mongoDocToSale({ _id: result.insertedId, ...saleToInsert });

  } catch (error: any) {
    console.error('Error creating sale:', error);
    let clientErrorMessage = 'Failed to create sale and update stock. Please check server logs for details.';
    // If the error is an instance of Error and has a message, use it.
    // This allows more specific errors thrown within the try block to be shown to the client.
    if (error instanceof Error && error.message) {
      clientErrorMessage = error.message;
    }
    return { error: clientErrorMessage };
  }
}

export async function getSaleByIdAction(saleId: string): Promise<Sale | null | { error: string }> {
  if (!ObjectId.isValid(saleId)) {
    return { error: 'Invalid sale ID format.' };
  }
  try {
    const userId = await getCurrentUserId();
    const salesCollection = await getSalesCollection();
    const saleDoc = await salesCollection.findOne({ _id: new ObjectId(saleId), userId }); // Filter by userId
    if (!saleDoc) {
      return null; // Or { error: 'Sale not found or not owned by user.' }
    }
    return mongoDocToSale(saleDoc);
  } catch (error) {
    console.error('Error fetching sale by ID:', error);
    return { error: 'Failed to fetch sale details.' };
  }
}
