
'use server';

import { revalidatePath } from 'next/cache';
import { getBranchesCollection } from '@/lib/mongodb';
import type { Branch } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { getCurrentUserId } from '@/lib/authUtils'; // Import new util

// Helper to convert MongoDB document to Branch type
function mongoDocToBranch(doc: any): Branch {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as Branch;
}

export async function getBranchesAction(): Promise<Branch[]> {
  try {
    const userId = await getCurrentUserId();
    const branchesCollection = await getBranchesCollection();
    const branches = await branchesCollection.find({ userId }).toArray(); // Filter by userId
    return branches.map(mongoDocToBranch);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

export async function addBranchAction(branchData: Omit<Branch, 'id' | 'userId'>): Promise<Branch | { error: string }> {
  try {
    const userId = await getCurrentUserId();
    const branchesCollection = await getBranchesCollection();
    const branchToInsert = { ...branchData, userId }; // Add userId
    const result = await branchesCollection.insertOne(branchToInsert);
    revalidatePath('/branches');
    return mongoDocToBranch({ _id: result.insertedId, ...branchToInsert });
  } catch (error) {
    console.error('Error adding branch:', error);
    return { error: 'Failed to add branch.' };
  }
}

export async function updateBranchAction(branchId: string, branchData: Partial<Omit<Branch, 'id' | 'userId'>>): Promise<Branch | { error: string }> {
  if (!ObjectId.isValid(branchId)) {
    return { error: 'Invalid branch ID format.' };
  }
  try {
    const userId = await getCurrentUserId();
    const branchesCollection = await getBranchesCollection();
    const result = await branchesCollection.findOneAndUpdate(
      { _id: new ObjectId(branchId), userId }, // Filter by userId
      { $set: branchData },
      { returnDocument: 'after' }
    );
    if (!result) {
      return { error: 'Branch not found or not owned by user.' };
    }
    revalidatePath('/branches');
    return mongoDocToBranch(result);
  } catch (error) {
    console.error('Error updating branch:', error);
    return { error: 'Failed to update branch.' };
  }
}

export async function deleteBranchAction(branchId: string): Promise<{ success: boolean; error?: string }> {
  if (!ObjectId.isValid(branchId)) {
    return { success: false, error: 'Invalid branch ID format.' };
  }
  try {
    const userId = await getCurrentUserId();
    const branchesCollection = await getBranchesCollection();
    const result = await branchesCollection.deleteOne({ _id: new ObjectId(branchId), userId }); // Filter by userId
    if (result.deletedCount === 0) {
      return { success: false, error: 'Branch not found, already deleted, or not owned by user.' };
    }
    revalidatePath('/branches');
    return { success: true };
  } catch (error) {
    console.error('Error deleting branch:', error);
    return { success: false, error: 'Failed to delete branch.' };
  }
}
