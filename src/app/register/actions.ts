
'use server';

import { revalidatePath } from 'next/cache';
import { getUsersCollection } from '@/lib/mongodb';
import type { User } from '@/lib/types';
import { ObjectId } from 'mongodb';

// Helper to convert MongoDB document to User type
function mongoDocToUser(doc: any): User {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as User;
}

export async function registerUserAction(
  userData: Pick<User, 'name' | 'email'> // We are not storing password in this example
): Promise<User | { error: string }> {
  try {
    const usersCollection = await getUsersCollection();

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      return { error: 'User with this email already exists.' };
    }

    // In a real app, you would hash the password here before saving
    // For example: const hashedPassword = await bcrypt.hash(password, 10);
    // And then store { ...userData, passwordHash: hashedPassword, createdAt: new Date() }

    const userToInsert = {
      ...userData,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(userToInsert);
    // No path revalidation needed for registration in this simple setup,
    // unless you have a user list page.
    return mongoDocToUser({ _id: result.insertedId, ...userToInsert });
  } catch (error) {
    console.error('Error registering user:', error);
    if (error instanceof Error && error.message.includes('duplicate key')) {
        return { error: 'User with this email already exists.' };
    }
    return { error: 'Failed to register user.' };
  }
}
