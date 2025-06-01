
'use server';

import { getUsersCollection } from '@/lib/mongodb';
import type { UserDetails } from '@/lib/authUtils';
import type { User } from '@/lib/types'; // Assuming User type is defined for DB schema

export async function loginUserAction(
  credentials: Pick<User, 'email'> // Password check is skipped for simulation
): Promise<UserDetails | { error: string }> {
  try {
    const usersCollection = await getUsersCollection();
    const userDoc = await usersCollection.findOne({ email: credentials.email });

    if (!userDoc) {
      return { error: 'Invalid email or password.' }; // Generic message for security
    }

    // In a real app, you would compare a hashed password here:
    // const passwordMatch = await bcrypt.compare(credentials.password, userDoc.passwordHash);
    // if (!passwordMatch) {
    //   return { error: 'Invalid email or password.' };
    // }

    const initials = userDoc.name
      .split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase() || userDoc.email.substring(0, 2).toUpperCase();

    return {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      initials: initials,
    };

  } catch (error) {
    console.error('Error during login:', error);
    return { error: 'An unexpected error occurred during login.' };
  }
}
