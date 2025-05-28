
// Mock storage service using LocalStorage
import { User, TaskListSummary, TaskListDetail, AppLocalStorage, Task, ThemeName, AppExportData, SubscriptionTier } from '../types';
import { FREE_TIER_THEME } from '../constants';


const LOCAL_STORAGE_KEY = 'aiTaskRankerApp';
const APP_IDENTIFIER = 'ai-task-ranker-cosmic';
const EXPORT_FORMAT_VERSION = '1.0.3'; // Bump version due to subscriptionTier addition

const getDefaultListIconId = (): string => 'default'; 
const getDefaultListColor = (): string => '#8A2BE2'; 


const getDefaultData = (): AppLocalStorage => ({
  users: [],
  taskLists: {},
  currentUser: undefined,
  currentTheme: FREE_TIER_THEME,
});


export const getLocalStorage = (): AppLocalStorage => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data) as AppLocalStorage;
      if (typeof parsed.taskLists !== 'object' || parsed.taskLists === null) {
        parsed.taskLists = {};
      }
      // Ensure users have a subscription tier
      parsed.users = parsed.users.map(user => ({
        ...user,
        subscriptionTier: user.subscriptionTier || 'free',
      }));
      Object.values(parsed.taskLists).forEach(userLists => {
        userLists.forEach(list => {
          if (!list.icon) list.icon = getDefaultListIconId(); 
          if (!list.color) list.color = getDefaultListColor();
          list.tasks.forEach(task => {
            if (task.dueDate === undefined) task.dueDate = null;
          });
        });
      });
      if (!parsed.currentTheme) {
        parsed.currentTheme = FREE_TIER_THEME;
      }
      return parsed;
    } catch (e) {
      console.error("Error parsing localStorage data, resetting to default:", e);
    }
  }
  const defaultData = getDefaultData();
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};


export const setLocalStorageData = (data: AppLocalStorage): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

// --- User Management ---
export const getUsers = async (): Promise<User[]> => {
  const data = getLocalStorage();
  return (data.users || []).map(user => ({
    ...user,
    subscriptionTier: user.subscriptionTier || 'free',
  }));
};

export const saveUsers = async (users: User[]): Promise<void> => {
  const data = getLocalStorage();
  data.users = users.map(user => ({
    ...user,
    subscriptionTier: user.subscriptionTier || 'free',
  }));
  setLocalStorageData(data);
};

export const findUserByUsername = async (username: string): Promise<User | undefined> => {
  const users = await getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
};

export const createUser = async (username: string): Promise<User> => {
  const users = await getUsers();
  if (await findUserByUsername(username)) {
    throw new Error("User already exists.");
  }
  const newUser: User = { 
    id: crypto.randomUUID(), 
    username,
    subscriptionTier: 'free', // Default to free tier
  };
  users.push(newUser);
  await saveUsers(users);
  return newUser;
};

export const updateUserSubscriptionTier = async (userId: string, tier: SubscriptionTier): Promise<User | null> => {
  const data = getLocalStorage();
  const userIndex = data.users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    data.users[userIndex].subscriptionTier = tier;
    setLocalStorageData(data);
    return data.users[userIndex];
  }
  return null;
};


// --- Task List Management ---

export const getTaskListSummaries = async (userId: string): Promise<TaskListSummary[]> => {
  const data = getLocalStorage();
  const userLists = data.taskLists[userId] || [];
  return userLists.map(list => ({
    id: list.id,
    name: list.name,
    taskCount: list.tasks.length,
    lastModified: list.lastModified,
    icon: list.icon || getDefaultListIconId(),
    color: list.color || getDefaultListColor(),
  })).sort((a,b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
};

export const getTaskListDetail = async (userId: string, listId: string): Promise<TaskListDetail> => {
  const data = getLocalStorage();
  const userLists = data.taskLists[userId] || [];
  const list = userLists.find(l => l.id === listId);
  if (!list) {
    throw new Error("Task list not found.");
  }
  const detailedList = {
    ...list,
    icon: list.icon || getDefaultListIconId(),
    color: list.color || getDefaultListColor(),
    tasks: list.tasks.map(task => ({ ...task, dueDate: task.dueDate === undefined ? null : task.dueDate })),
  };
  return JSON.parse(JSON.stringify(detailedList));
};

export const saveTaskList = async (userId: string, listDataToSave: TaskListDetail): Promise<TaskListDetail> => {
  const data = getLocalStorage();
  if (!data.taskLists[userId]) {
    data.taskLists[userId] = [];
  }
  const listIndex = data.taskLists[userId].findIndex(l => l.id === listDataToSave.id);
  const updatedListData = { 
    ...listDataToSave, 
    lastModified: new Date().toISOString(),
    icon: listDataToSave.icon || getDefaultListIconId(),
    color: listDataToSave.color || getDefaultListColor(),
    tasks: listDataToSave.tasks.map(task => ({ ...task, dueDate: task.dueDate === undefined ? null : task.dueDate })),
  };
  
  if (listIndex > -1) {
    data.taskLists[userId][listIndex] = updatedListData;
  } else {
    data.taskLists[userId].push(updatedListData);
  }
  setLocalStorageData(data);
  return JSON.parse(JSON.stringify(updatedListData));
};

export const createTaskList = async (userId: string, listName: string, icon?: string, color?: string): Promise<TaskListSummary> => {
  const data = getLocalStorage();
  if (!data.taskLists[userId]) {
    data.taskLists[userId] = [];
  }
  
  const newList: TaskListDetail = {
    id: crypto.randomUUID(),
    name: listName,
    tasks: [],
    lastModified: new Date().toISOString(),
    icon: icon || getDefaultListIconId(),
    color: color || getDefaultListColor(),
  };
  data.taskLists[userId].push(newList);
  setLocalStorageData(data);
  return {
    id: newList.id,
    name: newList.name,
    taskCount: 0,
    lastModified: newList.lastModified,
    icon: newList.icon,
    color: newList.color,
  };
};

export const deleteTaskList = async (userId: string, listId: string): Promise<void> => {
  const data = getLocalStorage();
  if (data.taskLists[userId]) {
    data.taskLists[userId] = data.taskLists[userId].filter(list => list.id !== listId);
    setLocalStorageData(data);
  } else {
    throw new Error("User has no task lists or user not found for deletion.");
  }
};


export const initializeDefaultUserForDemo = async (): Promise<void> => {
  const data = getLocalStorage();
  let demoUser = data.users.find(u => u.username === 'demo_user');
  if (!demoUser) {
    demoUser = { id: 'default-demo-user-id', username: 'demo_user', subscriptionTier: 'free' };
    data.users.push(demoUser);
    
    if (!data.taskLists[demoUser.id]) {
      data.taskLists[demoUser.id] = [];
    }
    
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const fiveDaysAgo = new Date(today); fiveDaysAgo.setDate(today.getDate() - 5);
    const fiveDaysHence = new Date(today); fiveDaysHence.setDate(today.getDate() + 5);

    const toISODateString = (date: Date) => date.toISOString().split('T')[0];

    const defaultTasks1: Task[] = [
      { id: crypto.randomUUID(), text: "Plan weekend getaway 🏖️", dueDate: toISODateString(fiveDaysHence), rank: 1, justification: "🚨 Needs immediate planning for relaxation!", isLoadingRank: false, error: null },
      { id: crypto.randomUUID(), text: "Grocery shopping for the week 🛒", dueDate: toISODateString(tomorrow), rank: 2, justification: "✅ Essential for meals, do it soon.", isLoadingRank: false, error: null },
      { id: crypto.randomUUID(), text: "Read new sci-fi book 📚", dueDate: null, rank: 3, justification: "⏳ Leisure activity, can wait.", isLoadingRank: false, error: null },
      { id: crypto.randomUUID(), text: "Submit overdue tax forms 🧾", dueDate: toISODateString(fiveDaysAgo), rank: null, justification: "😬 Uh oh, this is late!", isLoadingRank: false, error: null },
    ];
    
    data.taskLists[demoUser.id].push({
      id: 'demo-list-1',
      name: 'My Personal Errands',
      tasks: defaultTasks1,
      lastModified: new Date(Date.now() - 86400000).toISOString(), 
      icon: 'shopping-bag', 
      color: '#D53F8C', 
    });
     data.taskLists[demoUser.id].push({
      id: 'demo-list-2',
      name: 'Work Project Alpha',
      tasks: [ { id: crypto.randomUUID(), text: "Finalize Q3 report presentation 📊", dueDate: toISODateString(today), rank: 1, justification: "🚀 Deadline approaching fast!", isLoadingRank: false, error: null }],
      lastModified: new Date().toISOString(),
      icon: 'briefcase', 
      color: '#3B82F6', 
    });
     data.taskLists[demoUser.id].push({
      id: 'demo-list-3',
      name: 'Empty Example List',
      tasks: [],
      lastModified: new Date(Date.now() - 172800000).toISOString(), 
      icon: 'planet', 
      color: '#14B8A6', 
    });

    setLocalStorageData(data);
    console.log("Initialized default demo_user and sample task lists with due dates.");
  } else if (!demoUser.subscriptionTier) {
    // Retroactively add subscription tier if missing for existing demo user
    demoUser.subscriptionTier = 'free';
    const userIndex = data.users.findIndex(u => u.id === demoUser!.id);
    if (userIndex > -1) {
      data.users[userIndex] = demoUser;
      setLocalStorageData(data);
      console.log("Updated demo_user with free subscription tier.");
    }
  }
};

// --- Theme Management ---
export const getSavedTheme = (): ThemeName => {
  const data = getLocalStorage();
  return data.currentTheme || FREE_TIER_THEME;
};

export const saveTheme = (theme: ThemeName): void => {
  const data = getLocalStorage();
  data.currentTheme = theme;
  setLocalStorageData(data);
};

// --- Data Export/Import ---
export const exportUserData = async (userId: string): Promise<string> => {
  const data = getLocalStorage();
  const userTaskLists = (data.taskLists[userId] || []).map(list => ({
    ...list,
    icon: list.icon || getDefaultListIconId(),
    color: list.color || getDefaultListColor(),
    tasks: list.tasks.map(task => ({ ...task, dueDate: task.dueDate === undefined ? null : task.dueDate })),
  }));
  
  const exportData: AppExportData = {
    appIdentifier: APP_IDENTIFIER,
    exportFormatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    userId: userId,
    taskLists: JSON.parse(JSON.stringify(userTaskLists)),
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const importUserData = async (
  userId: string, 
  file: File
): Promise<{ importedCount: number; overwrittenCount: number; errors: string[] }> => {
  let parsedData: AppExportData;
  const errors: string[] = [];
  let importedCount = 0;
  let overwrittenCount = 0;

  try {
    const jsonData = await file.text();
    parsedData = JSON.parse(jsonData);
  } catch (e) {
    errors.push("Invalid JSON file format or could not read file.");
    return { importedCount, overwrittenCount, errors };
  }

  if (parsedData.appIdentifier !== APP_IDENTIFIER) {
    errors.push("File does not seem to be a valid AI Task Ranker export.");
  }
  if (!parsedData.taskLists || !Array.isArray(parsedData.taskLists)) {
    errors.push("Export file is missing task lists or they are in an invalid format.");
  }

  if (errors.length > 0) {
    return { importedCount, overwrittenCount, errors };
  }

  const data = getLocalStorage();
  if (!data.taskLists[userId]) {
    data.taskLists[userId] = [];
  }

  const currentUserLists = data.taskLists[userId];

  for (const importedList of parsedData.taskLists) {
    if (!importedList.id || !importedList.name || !Array.isArray(importedList.tasks)) {
        errors.push(`Skipping an invalid list entry: ${importedList.name || importedList.id || 'Unknown List'}`);
        continue;
    }
    
    const listWithDefaults: TaskListDetail = {
      ...importedList,
      icon: importedList.icon || getDefaultListIconId(),
      color: importedList.color || getDefaultListColor(),
      lastModified: importedList.lastModified || new Date().toISOString(),
      tasks: importedList.tasks.map(task => ({ ...task, dueDate: task.dueDate === undefined ? null : task.dueDate })),
    };

    const existingListIndex = currentUserLists.findIndex(l => l.id === listWithDefaults.id);
    if (existingListIndex > -1) {
      currentUserLists[existingListIndex] = listWithDefaults;
      overwrittenCount++;
    } else {
      currentUserLists.push(listWithDefaults);
      importedCount++;
    }
  }

  currentUserLists.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  data.taskLists[userId] = currentUserLists;
  setLocalStorageData(data);

  return { importedCount, overwrittenCount, errors };
};

// --- Account Reset/Delete ---
export const resetUserAccount = async (userId: string): Promise<void> => {
  const data = getLocalStorage();
  if (data.taskLists[userId]) {
    data.taskLists[userId] = []; // Clears lists but keeps user and their subscription tier
    setLocalStorageData(data);
    console.log(`Account reset for user ${userId}: All task lists cleared.`);
  } else {
    console.warn(`Attempted to reset account for user ${userId}, but no task lists found.`);
  }
};

export const deleteUserAccount = async (userId: string): Promise<void> => {
  const data = getLocalStorage();
  
  const userIndex = data.users.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    data.users.splice(userIndex, 1);
  } else {
    console.warn(`Attempted to delete user ${userId}, but user not found in users array.`);
  }

  if (data.taskLists[userId]) {
    delete data.taskLists[userId];
  } else {
    console.warn(`Attempted to delete task lists for user ${userId}, but no lists found.`);
  }

  if (data.currentUser === userId) {
    data.currentUser = undefined;
  }
  setLocalStorageData(data);
  console.log(`Account permanently deleted for user ${userId}.`);
};
