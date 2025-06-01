
'use server';

import { revalidatePath } from 'next/cache';
import { getProductsCollection } from '@/lib/mongodb';
import type { Product } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { getStoreSettingsAction } from '@/app/settings/actions';
import { sendLowStockEmailNotification } from '@/lib/emailService';
import { LOW_STOCK_THRESHOLD, APP_TITLE } from '@/lib/constants';
import { getCurrentUserId } from '@/lib/authUtils'; // Import new util

// Helper to convert MongoDB document to Product type (ObjectId to string id)
function mongoDocToProduct(doc: any): Product {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as Product;
}

export async function getProductsAction(): Promise<Product[]> {
  try {
    const userId = await getCurrentUserId();
    const productsCollection = await getProductsCollection();
    const products = await productsCollection.find({ userId }).toArray();
    return products.map(mongoDocToProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function addProductAction(productData: Omit<Product, 'id' | 'userId'>): Promise<Product | { error: string }> {
  try {
    const userId = await getCurrentUserId();
    const productsCollection = await getProductsCollection();
    const productToInsert = {
        ...productData,
        price: Number(productData.price),
        stock: Number(productData.stock),
        userId, // Add userId
    };
    const result = await productsCollection.insertOne(productToInsert);
    const newProduct = mongoDocToProduct({ _id: result.insertedId, ...productToInsert});

    if (newProduct.stock < LOW_STOCK_THRESHOLD) {
        const storeSettings = await getStoreSettingsAction(); // Settings are now user-specific
        if (storeSettings?.notifications?.lowStockEmail && storeSettings.adminEmail) {
            await sendLowStockEmailNotification(
                storeSettings.adminEmail,
                { id: newProduct.id, name: newProduct.name, stock: newProduct.stock },
                APP_TITLE
            );
        }
    }

    revalidatePath('/products');
    revalidatePath('/dashboard');
    return newProduct;
  } catch (error: any) {
    console.error('Error adding product:', error);
    let errorMessage = 'Failed to add product. Check server logs for more details.';
    if (error instanceof Error) {
        errorMessage = `Failed to add product: ${error.message}`;
    }
    return { error: errorMessage };
  }
}

export async function updateProductAction(productId: string, productData: Partial<Omit<Product, 'id' | 'userId'>>): Promise<Product | { error: string }> {
  if (!ObjectId.isValid(productId)) {
    return { error: 'Invalid product ID format.' };
  }
  try {
    const userId = await getCurrentUserId();
    const productsCollection = await getProductsCollection();
    const productToUpdate = { ...productData };
    if (productData.price !== undefined) productToUpdate.price = Number(productData.price);
    if (productData.stock !== undefined) productToUpdate.stock = Number(productData.stock);

    const result = await productsCollection.findOneAndUpdate(
      { _id: new ObjectId(productId), userId }, // Ensure user owns the product
      { $set: productToUpdate },
      { returnDocument: 'after' }
    );
    if (!result) {
      return { error: 'Product not found or you do not have permission to update it.' };
    }
    const updatedProduct = mongoDocToProduct(result);

    if (updatedProduct.stock < LOW_STOCK_THRESHOLD) {
        const storeSettings = await getStoreSettingsAction();
        if (storeSettings?.notifications?.lowStockEmail && storeSettings.adminEmail) {
            await sendLowStockEmailNotification(
                storeSettings.adminEmail,
                { id: updatedProduct.id, name: updatedProduct.name, stock: updatedProduct.stock },
                APP_TITLE
            );
        }
    }

    revalidatePath('/products');
    revalidatePath('/dashboard');
    revalidatePath('/pos');
    return updatedProduct;
  } catch (error: any) {
    console.error('Error updating product:', error);
    let errorMessage = 'Failed to update product. Check server logs for more details.';
     if (error instanceof Error) {
        errorMessage = `Failed to update product: ${error.message}`;
    }
    return { error: errorMessage };
  }
}

export async function deleteProductAction(productId: string): Promise<{ success: boolean; error?: string }> {
   if (!ObjectId.isValid(productId)) {
    return { success: false, error: 'Invalid product ID format.' };
  }
  try {
    const userId = await getCurrentUserId();
    const productsCollection = await getProductsCollection();
    const result = await productsCollection.deleteOne({ _id: new ObjectId(productId), userId }); // Ensure user owns the product
    if (result.deletedCount === 0) {
      return { success: false, error: 'Product not found, already deleted, or you do not have permission to delete it.' };
    }
    revalidatePath('/products');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    let errorMessage = 'Failed to delete product. Check server logs for more details.';
    if (error instanceof Error) {
        errorMessage = `Failed to delete product: ${error.message}`;
    }
    return { success: false, error: errorMessage };
  }
}
