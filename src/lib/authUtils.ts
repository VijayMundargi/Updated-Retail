
'use server';

// In a real app, this would involve session management, token validation,
// cookies, or other authentication mechanisms to determine the logged-in user.

export interface UserDetails {
  id: string; // User's actual ID from the database
  name: string;
  email: string;
  initials: string;
}

/**
 * Gets the ID of the currently "authenticated" user FOR DATA OPERATIONS.
 * IMPORTANT: This is a placeholder for demonstration purposes for data scoping.
 * In a production application, replace this with actual authentication logic
 * that provides the true authenticated user's ID.
 * The AppHeader uses client-side sessionStorage for DISPLAYING user info after login.
 * @returns A promise that resolves to the user ID string.
 */
export async function getCurrentUserId(): Promise<string> {
  // TODO: Replace with actual user ID from session, token, or auth context
  return "demo_user_123"; // Hardcoded for data scoping
}

/**
 * Gets the details (name, email, initials) of the default DATA CONTEXT user.
 * IMPORTANT: This is a placeholder. The AppHeader now uses sessionStorage
 * for displaying the logged-in user's info. This function remains for
 * any server-side logic that might need details of the 'demo_user_123'.
 * @returns A promise that resolves to the UserDetails object for the default data user.
 */
export async function getCurrentUserDetailsAction(): Promise<UserDetails> {
  const userId = await getCurrentUserId(); // This will be "demo_user_123"

  // In a real app, you'd fetch these details from the database using userId.
  // For "demo_user_123", we'll keep returning the demo details.
  if (userId === "demo_user_123") {
    const name = "Demo User (Data Context)";
    const email = "data_context_user@example.com";
    const initials = name
      .split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase();
    return { id: userId, name, email, initials: initials || "DU" };
  }

  // Fallback for any other unexpected userId (should not happen with hardcoded ID)
  return { id: "unknown_user", name: "Unknown User", email: "unknown@example.com", initials: "UU" };
}

