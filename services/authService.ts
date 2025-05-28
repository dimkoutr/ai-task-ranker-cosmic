
// Mock authentication service using LocalStorage
// IMPORTANT: This is NOT secure and for demonstration purposes only.
// In a real application, use a proper backend authentication system.

import { User, AppLocalStorage, SubscriptionTier } from '../types';
import { getUsers, saveUsers, getLocalStorage, setLocalStorageData } from './storageService'; // Use storageService for user data

const CURRENT_USER_SESSION_KEY = 'aiTaskRanker_currentUserSession';

export const signUp = async (username: string, password?: string): Promise<User> => {
  if (!username.trim()) {
    throw new Error("Username cannot be empty.");
  }

  const users = await getUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists. Please choose another or sign in.");
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    username: username.trim(),
    subscriptionTier: 'free', // Default to 'free' tier
  };

  users.push(newUser);
  await saveUsers(users);
  
  localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(newUser));
  return newUser;
};

export const signIn = async (username: string, password?: string): Promise<User> => {
  if (!username.trim()) {
    throw new Error("Username cannot be empty.");
  }

  const users = await getUsers();
  let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user) {
    throw new Error("Invalid username or password. (Hint: try 'demo_user' or sign up)");
  }
  
  // Ensure existing users have a subscription tier, default to 'free' if missing (for backward compatibility)
  if (!user.subscriptionTier) {
    user.subscriptionTier = 'free';
    // Persist this change if it happened
    const userIndex = users.findIndex(u => u.id === user!.id);
    if (userIndex > -1) {
        users[userIndex] = user;
        await saveUsers(users);
    }
  }

  localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(user));
  return user;
};

export const signOut = (): void => {
  localStorage.removeItem(CURRENT_USER_SESSION_KEY);
};

export const getCurrentUserFromSession = (): User | null => {
  const userJson = localStorage.getItem(CURRENT_USER_SESSION_KEY);
  if (userJson) {
    try {
      const user = JSON.parse(userJson) as User;
      // Ensure subscriptionTier exists, default to 'free' if not (for robustness)
      if (!user.subscriptionTier) {
        user.subscriptionTier = 'free';
      }
      return user;
    } catch (e) {
      console.error("Failed to parse current user from session:", e);
      localStorage.removeItem(CURRENT_USER_SESSION_KEY); 
      return null;
    }
  }
  return null;
};
