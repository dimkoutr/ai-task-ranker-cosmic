
export interface Task {
  id: string;
  text: string;
  dueDate: string | null; // ISO date string (e.g., "YYYY-MM-DD")
  rank: number | null;
  justification: string | null;
  isLoadingRank: boolean;
  error: string | null;
}

// For sending task text and ID to the AI for ranking
export interface TaskInputItem {
  id: string;
  text: string;
  dueDate: string | null; // ISO date string (e.g., "YYYY-MM-DD")
}

// Represents the AI's ranking and justification for a single task from a batch
export interface AIRankedTask {
  id: string; // To map the rank back to the correct task
  rank: number;
  justification: string;
}

// --- Subscription Tiers ---
export type SubscriptionTier = 'free' | 'pro' | 'cosmic_pro';

export interface TierDetails {
  id: SubscriptionTier;
  name: string;
  priceMonthly?: string; // e.g., "$4.99"
  priceYearly?: string; // e.g., "$49.99"
  isFree?: boolean;
  features: string[];
  highlight?: string; // e.g., "Most Popular"
  ctaText: string;
  maxLists: number;
  maxTasksPerList: number;
  accessToAllThemes: boolean;
  dataExportImport: boolean;
  aiRankingType: 'Basic' | 'Advanced' | 'Priority';
  exclusiveIcons?: boolean; // For Cosmic Pro
  prioritySupport?: boolean; // For Cosmic Pro
}


// --- User and Multi-List ---
export interface User {
  id: string;
  username: string;
  subscriptionTier: SubscriptionTier;
}

export interface TaskListSummary {
  id: string;
  name: string;
  taskCount: number;
  lastModified: string; // ISO date string
  icon?: string; // e.g., 'planet', 'star', 'briefcase'
  color?: string; // e.g., '#FF0000' or a CSS variable name
}

export interface TaskListDetail {
  id: string;
  name: string;
  tasks: Task[];
  lastModified: string; // ISO date string
  icon?: string;
  color?: string;
}

export type Page = 'auth' | 'dashboard' | 'taskRanker' | 'settings' | 'subscription';

export interface FeedbackMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

// Structure for LocalStorage data
export interface AppLocalStorage {
  users: User[];
  taskLists: {
    [userId: string]: TaskListDetail[];
  };
  currentUser?: string; // Stores the ID of the currently logged-in user
  currentTheme?: ThemeName;
}

// --- Settings ---
export type ThemeName = 'cosmic-glow' | 'starlight-serenity' | 'golden-radiance';

export interface AppExportData {
  appIdentifier: string;
  exportFormatVersion: string;
  exportedAt: string;
  userId: string;
  taskLists: TaskListDetail[];
}