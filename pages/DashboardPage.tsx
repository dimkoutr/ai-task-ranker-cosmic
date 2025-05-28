
import React, { useState, useEffect, useCallback } from 'react';
import { User, TaskListSummary, FeedbackMessage, ThemeName } from '../types';
import * as storageService from '../services/storageService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { AddIcon } from '../components/icons/AddIcon';
import { CogIcon } from '../components/icons/CogIcon';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import InlineIconPicker from '../components/InlineIconPicker';
import { LIST_ICON_MAP, AVAILABLE_LIST_ICONS, DefaultListIcon } from '../components/icons/list/ListIconDefaults';
import { FREE_TIER_MAX_LISTS, getTierDetails } from '../constants';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon'; // For upgrade button

interface DashboardPageProps {
  currentUser: User;
  onSelectList: (listSummary: TaskListSummary) => void;
  onCreateNewList: (listSummary: TaskListSummary, listName: string) => void;
  onLogout: () => void;
  onNavigateToSettings: () => void;
  onNavigateToSubscription: () => void; // New prop
  appCurrentTheme: ThemeName;
  onLimitReached: (reason: string) => void; // New prop
}

const THEME_COLOR_PALETTES: Record<ThemeName, { name: string, value: string }[]> = {
  'cosmic-glow': [
    { name: 'Nebula Purple', value: '#8A2BE2' },
    { name: 'Orion Pink', value: '#D53F8C' },
    { name: 'Galaxy Blue', value: '#3B82F6' },
    { name: 'Quasar Teal', value: '#14B8A6' },
    { name: 'Pulsar Orange', value: '#F97316'},
    { name: 'Stardust Silver', value: '#A0AEC0'}
  ],
  'starlight-serenity': [
    { name: 'Aqua Sky', value: '#64FFDA' },
    { name: 'Celestial Blue', value: '#79CDFF' },
    { name: 'Comet Green', value: '#84CC16' },
    { name: 'Orchid Purple', value: '#A78BFA' },
    { name: 'Moonstone Grey', value: '#A8B2D1'},
    { name: 'Deep Space Navy', value: '#303C55'}
  ],
  'golden-radiance': [
    { name: 'Solar Gold', value: '#FFD700' },
    { name: 'Amber Glow', value: '#E6A01C' },
    { name: 'Terracotta Orange', value: '#FFA500' },
    { name: 'Crimson Sun', value: '#DC2626' },
    { name: 'Bronze Shimmer', value: '#CD7F32' },
    { name: 'Desert Sand', value: '#D4C098'}
  ],
};


const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onSelectList,
  onCreateNewList,
  onLogout,
  onNavigateToSettings,
  onNavigateToSubscription,
  appCurrentTheme,
  onLimitReached,
}) => {
  const [taskLists, setTaskLists] = useState<TaskListSummary[]>([]);
  const [newListName, setNewListName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<TaskListSummary | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null);

  const [selectedIconId, setSelectedIconId] = useState<string>(AVAILABLE_LIST_ICONS[0].id);
  const [selectedColorValue, setSelectedColorValue] = useState<string>(() => THEME_COLOR_PALETTES[appCurrentTheme][0].value);

  const currentUserTierDetails = getTierDetails(currentUser.subscriptionTier);

  useEffect(() => {
    const currentPalette = THEME_COLOR_PALETTES[appCurrentTheme];
    if (!currentPalette.find(c => c.value === selectedColorValue)) {
      setSelectedColorValue(currentPalette[0].value);
    }
  }, [appCurrentTheme, selectedColorValue]);


  const clearFeedback = useCallback(() => {
    if (feedbackMessage) { 
        const timer = setTimeout(() => setFeedbackMessage(null), 4000);
        return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  useEffect(() => {
    clearFeedback();
  }, [clearFeedback]);


  const fetchTaskLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const lists = await storageService.getTaskListSummaries(currentUser.id);
      setTaskLists(lists);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to load task lists. ' + (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    fetchTaskLists();
  }, [fetchTaskLists]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedListName = newListName.trim();
    if (!trimmedListName) {
      setFeedbackMessage({type: 'error', text: "New list name cannot be empty."});
      return;
    }

    if (currentUserTierDetails && taskLists.length >= currentUserTierDetails.maxLists) {
        onLimitReached(`You've reached the maximum of ${currentUserTierDetails.maxLists} task lists for the ${currentUserTierDetails.name} plan. Please upgrade to create more lists.`);
        return;
    }

    setFeedbackMessage(null);
    setIsCreatingList(true);
    
    try {
      const newListSummary = await storageService.createTaskList(currentUser.id, trimmedListName, selectedIconId, selectedColorValue);
      onCreateNewList(newListSummary, trimmedListName);
      fetchTaskLists(); // Re-fetch to update list count and display
      setNewListName(''); 
      setSelectedIconId(AVAILABLE_LIST_ICONS[0].id);
      setSelectedColorValue(THEME_COLOR_PALETTES[appCurrentTheme][0].value);
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to create new list. ' + (err as Error).message });
    } finally {
      setIsCreatingList(false);
    }
  };
  
  const openDeleteConfirmation = (list: TaskListSummary) => {
    setListToDelete(list);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteList = async () => {
    if (!listToDelete) return;
    setFeedbackMessage(null);
    try {
      await storageService.deleteTaskList(currentUser.id, listToDelete.id);
      fetchTaskLists(); // Re-fetch to update list count and display
      setFeedbackMessage({ type: 'success', text: `List "${listToDelete.name}" deleted.` });
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: "Failed to delete task list. " + (err as Error).message });
    } finally {
      setIsDeleteModalOpen(false);
      setListToDelete(null);
    }
  };
  
  const showUpgradeBanner = currentUserTierDetails && taskLists.length >= currentUserTierDetails.maxLists && currentUserTierDetails.id === 'free';

  return (
    <div className="page-container-flex">
      <header className="page-header-area p-4 md:p-8 md:pb-6">
        <div className="container mx-auto max-w-4xl flex justify-between items-center">
           <h1 className="text-3xl md:text-4xl font-bold text-gradient-sky-rose-lime flex items-center gap-x-2">
            <SparklesIcon className="w-8 h-8 text-yellow-300 opacity-80 animate-sparkles-pulse" />
            Welcome, {currentUser.username}!
          </h1>
          <div className="flex items-center gap-3">
            <button
                onClick={onNavigateToSettings}
                className="header-icon-button button-active-pop p-2 rounded-full hover:bg-surface-interactive focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                aria-label="Open application settings"
                title="Settings"
            >
                <CogIcon className="w-6 h-6 text-text-secondary hover:text-text-primary transition-colors" />
            </button>
            <button
                onClick={onLogout}
                className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out button-active-pop button-hover-glow flex items-center justify-center"
                title="Sign out of your account"
            >
                Sign Out
            </button>
          </div>
        </div>
        <p className="text-text-secondary mt-2 container mx-auto max-w-4xl text-lg">Manage your AI-powered task lists or create a new one.</p>
        {currentUserTierDetails && (
          <p className="text-text-muted mt-1 container mx-auto max-w-4xl text-sm">
            Current Plan: <span className="font-semibold text-text-accent">{currentUserTierDetails.name}</span>.
            Lists: {taskLists.length} / {currentUserTierDetails.maxLists === Infinity ? 'Unlimited' : currentUserTierDetails.maxLists}.
          </p>
        )}
      </header>

      <main className="page-content-scrollable p-4 md:p-8 md:pt-0">
        <div className="container mx-auto max-w-4xl">
          {feedbackMessage && (
              <div className={`p-4 mb-6 rounded-lg text-sm shadow-lg border ${
                  feedbackMessage.type === 'success' ? 'bg-green-600/80 backdrop-blur-sm border-green-500 text-white' : 
                  feedbackMessage.type === 'error' ? 'bg-red-600/80 backdrop-blur-sm border-red-500 text-white' :
                  'bg-sky-600/80 backdrop-blur-sm border-sky-500 text-white'
                }`}
                role={feedbackMessage.type === 'error' ? 'alert' : 'status'}>
                {feedbackMessage.text}
              </div>
          )}

          {showUpgradeBanner && (
            <div className="mb-8 p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-2xl border border-purple-400/50 text-white flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeInUp">
              <div>
                <h3 className="text-xl font-semibold mb-1">Unlock More Power!</h3>
                <p className="text-sm opacity-90">You've reached the list limit for the Free Explorer plan. Upgrade to create unlimited lists and access more advanced features.</p>
              </div>
              <button
                onClick={onNavigateToSubscription}
                className="button-secondary bg-white/20 hover:bg-white/30 text-white border-white/50 font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out button-active-pop button-hover-glow flex items-center justify-center gap-2 flex-shrink-0"
                title="Go to subscription plans"
              >
                Upgrade Plan <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="bg-surface-primary backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10 border border-border-secondary">
            <h2 className="text-2xl font-semibold text-text-accent mb-6">Create New Task List</h2>
            
            <form onSubmit={handleCreateList} className="space-y-6 mb-10">
              <div>
                <label htmlFor="newListName" className="block text-sm font-medium text-text-accent mb-1.5">List Name</label>
                <input
                  id="newListName"
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter name for new list (e.g., Work Projects)"
                  className="w-full p-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus outline-none transition-all duration-300 shadow-sm placeholder-input-placeholder text-input-text input-focus-glow"
                  disabled={isCreatingList || (currentUserTierDetails?.maxLists !== Infinity && taskLists.length >= currentUserTierDetails!.maxLists)}
                  aria-required="true"
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label id="accent-color-group-label" className="block text-sm font-medium text-text-accent mb-2">Accent Color</label>
                  <div 
                    className="flex flex-wrap gap-2 p-2 bg-input-bg border border-input-border rounded-lg"
                    role="group"
                    aria-labelledby="accent-color-group-label"
                  >
                    {THEME_COLOR_PALETTES[appCurrentTheme].map(color => (
                      <button
                        type="button"
                        key={color.value}
                        title={color.name}
                        aria-label={`Select color: ${color.name}`}
                        aria-pressed={selectedColorValue === color.value}
                        onClick={() => setSelectedColorValue(color.value)}
                        className={`w-8 h-8 rounded-md border-2 transition-all duration-150 ease-in-out transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-input-bg
                                    ${selectedColorValue === color.value ? 'ring-2 ring-offset-2 ring-border-focus border-white shadow-lg scale-110' : 'border-transparent hover:border-slate-400'}`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                </div>
                
                <InlineIconPicker
                  currentSelectedIconId={selectedIconId}
                  onSelectIcon={setSelectedIconId}
                  selectedColorValue={selectedColorValue}
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingList || !newListName.trim() || (currentUserTierDetails?.maxLists !== Infinity && taskLists.length >= currentUserTierDetails!.maxLists) }
                className="w-full button-primary text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 button-active-pop button-hover-glow flex items-center justify-center gap-2"
                title={ (currentUserTierDetails?.maxLists !== Infinity && taskLists.length >= currentUserTierDetails!.maxLists) ? `List limit reached for ${currentUserTierDetails.name} plan` : "Create new task list"}
              >
                {isCreatingList ? <LoadingSpinner className="w-5 h-5" /> : <AddIcon className="w-5 h-5" />}
                {isCreatingList ? 'Creating List...' : 'Create List'}
              </button>
            </form>
            
            <h2 className="text-2xl font-semibold text-text-accent mb-6 border-t border-border-secondary pt-8">Your Task Lists</h2>
            {isLoading ? (
                <div className="text-center py-10">
                    <LoadingSpinner className="w-10 h-10 text-sky-400 mx-auto mb-3" />
                    <p className="text-text-secondary">Loading your cosmic lists...</p>
                </div>
            ) : taskLists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {taskLists.map((list, index) => {
                  const ListIconComponent = LIST_ICON_MAP[list.icon || 'default'] || DefaultListIcon;
                  return (
                    <div
                      key={list.id}
                      className="bg-surface-secondary backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-border-secondary transition-all duration-300 ease-out hover:scale-[1.03] animate-list-card-enter hover-card-glow"
                      style={{ animationDelay: `${index * 0.05}s`, borderTop: `4px solid ${list.color || 'var(--color-text-accent)'}` }}
                      role="listitem"
                    >
                      <button 
                        onClick={() => onSelectList(list)} 
                        className="block w-full text-left p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus rounded-t-lg"
                        aria-label={`Open list: ${list.name}`}
                        title={`Open list: ${list.name}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                           <ListIconComponent className="w-7 h-7 flex-shrink-0" style={{ color: list.color || 'var(--color-text-accent)' }}/>
                           <h3 className="text-xl font-semibold text-text-primary truncate" title={list.name}>{list.name}</h3>
                        </div>
                        <p className="text-sm text-text-secondary">
                          {list.taskCount} {list.taskCount === 1 ? 'task' : 'tasks'}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Last modified: {new Date(list.lastModified).toLocaleDateString()}
                        </p>
                      </button>
                      <div className="bg-surface-subtle/50 p-3 border-t border-border-secondary">
                          <button
                            onClick={() => openDeleteConfirmation(list)}
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-colors duration-150 w-full text-center font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 focus-visible:bg-red-500/20"
                            aria-label={`Delete list: ${list.name}`}
                            title={`Delete list: ${list.name}`}
                          >
                            Delete List
                          </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-text-muted py-10 text-lg">
                No task lists yet. Create one above to get started!
              </p>
            )}
          </div>
        </div>
      </main>
      <footer className="page-footer-area text-center py-6 text-text-muted text-sm">
        <p>Dashboard - AI Task Ranker &copy; {new Date().getFullYear()}</p>
      </footer>

      {isDeleteModalOpen && listToDelete && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={executeDeleteList}
          title="Confirm Deletion"
          message={`Are you sure you want to permanently delete the task list "${listToDelete.name}" and all its tasks? This action cannot be undone.`}
          confirmText="Delete List"
          confirmButtonType="danger"
        />
      )}
    </div>
  );
};

export default DashboardPage;
