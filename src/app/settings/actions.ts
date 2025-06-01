
'use server';

import { revalidatePath } from 'next/cache';
import { getStoreSettingsCollection } from '@/lib/mongodb';
import type { StoreSettings } from '@/lib/types';
import { getCurrentUserId } from '@/lib/authUtils'; // Import new util

// Helper to convert MongoDB document to StoreSettings type
function mongoDocToStoreSettings(doc: any, currentUserId: string): StoreSettings {
  if (!doc) {
    // Return default settings for the current user if no document is found
    return {
      userId: currentUserId,
      taxRate: 0,
      currencySymbol: '₹',
      pricesIncludeTax: false,
      adminEmail: '',
      notifications: {
        lowStockEmail: false,
        lowStockSms: false,
        dailySalesEmail: false,
        weeklySalesEmail: false,
      }
    } as StoreSettings;
  }
  const { _id, ...rest } = doc;
  const notifications = {
    lowStockEmail: false,
    lowStockSms: false,
    dailySalesEmail: false,
    weeklySalesEmail: false,
    ...(rest.notifications || {})
  };
  return {
    id: _id ? _id.toString() : undefined, // id might not exist if returning defaults before saving
    userId: rest.userId || currentUserId, // Ensure userId is set
    ...rest,
    notifications,
    adminEmail: rest.adminEmail || '',
  } as StoreSettings;
}

export async function getStoreSettingsAction(): Promise<StoreSettings> {
  try {
    const userId = await getCurrentUserId();
    const settingsCollection = await getStoreSettingsCollection();
    // Fetch settings for the current user
    const settingsDoc = await settingsCollection.findOne({ userId });
    return mongoDocToStoreSettings(settingsDoc, userId);
  } catch (error) {
    console.error('Error fetching store settings:', error);
    // This case should ideally not be reached if getCurrentUserId is robust,
    // but as a fallback, we'll try to get a userId to pass to mongoDocToStoreSettings.
    const userId = await getCurrentUserId().catch(() => "fallback_user_id_on_error");
    return mongoDocToStoreSettings(null, userId);
  }
}

export async function updateStoreSettingsAction(
  settingsData: Partial<Omit<StoreSettings, 'id' | 'userId'>>
): Promise<StoreSettings | { error: string }> {
  try {
    const userId = await getCurrentUserId();
    const settingsCollection = await getStoreSettingsCollection();

    const updatePayload: any = { ...settingsData };

    if (typeof updatePayload.taxRate === 'string') {
      updatePayload.taxRate = parseFloat(updatePayload.taxRate);
    }
    if (isNaN(updatePayload.taxRate)) {
        updatePayload.taxRate = 0;
    }
    // userId is not part of settingsData here, it's used for query and potentially in $setOnInsert
    const result = await settingsCollection.findOneAndUpdate(
      { userId }, // Find settings for the current user
      { $set: { ...updatePayload, userId } }, // Ensure userId is set on update
      { upsert: true, returnDocument: 'after' } // Upsert creates if not exists for this user
    );

    if (!result) {
       // This should be rare with upsert:true, but as a fallback:
       const fallbackResult = await settingsCollection.findOne({ userId });
       if (fallbackResult) {
           revalidatePath('/settings');
           return mongoDocToStoreSettings(fallbackResult, userId);
       }
       // Construct from input and default if still nothing
       const constructedResult = { ...mongoDocToStoreSettings(null, userId), ...updatePayload, userId };
       return mongoDocToStoreSettings(constructedResult, userId);
    }

    revalidatePath('/settings');
    return mongoDocToStoreSettings(result, userId);
  } catch (error) {
    console.error('Error updating store settings:', error);
    return { error: 'Failed to update store settings. Check server logs for details.' };
  }
}
