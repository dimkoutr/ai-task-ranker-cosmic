
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Page, TaskListSummary, ThemeName, FeedbackMessage, AppExportData, SubscriptionTier } from './types';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TaskRankerPage from './pages/TaskRankerPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPage from './pages/SubscriptionPage'; // New Subscription Page
import UpgradeModal from './components/UpgradeModal'; // New Upgrade Modal
import ApiKeyWarningBanner from './components/ApiKeyWarningBanner'; // Import the banner
import * as authService from './services/authService';
import * as storageService from './services/storageService';
import * as themeService from './services/themeService';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { FREE_TIER_THEME, getTierDetails } from './constants';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('auth');
  const [previousPageForSettings, setPreviousPageForSettings] = useState<Page | null>(null);
  const [previousPageTransition, setPreviousPageTransition] = useState<Page | null>(null);
  const [currentTaskListId, setCurrentTaskListId] = useState<string | null>(null);
  const [currentTaskListName, setCurrentTaskListName] = useState<string | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [animationClass, setAnimationClass] = useState('animate-initial-page-fade-in');
  const pageRenderInstance = useRef(0);

  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => themeService.loadInitialTheme());
  
  const [appFeedback, setAppFeedback] = useState<FeedbackMessage | null>(null);
  const [displayedFeedback, setDisplayedFeedback] = useState<FeedbackMessage | null>(null);
  const [feedbackAnimationClass, setFeedbackAnimationClass] = useState<string>('');
  const feedbackTimeoutRef = useRef<number | null>(null);
  const feedbackDisplayTimeoutRef = useRef<number | null>(null);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');


  const navigateTo = (newPage: Page) => {
    pageRenderInstance.current += 1;
    setPreviousPageTransition(currentPage);
    setCurrentPage(newPage);
  };

  const openUpgradeModal = (reason: string) => {
    setUpgradeReason(reason);
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
    setUpgradeReason('');
  };

  useEffect(() => {
    storageService.initializeDefaultUserForDemo();
    const user = authService.getCurrentUserFromSession();
    if (user) {
      setCurrentUser(user);
      navigateTo('dashboard');
    } else {
      navigateTo('auth');
    }
    setIsLoadingSession(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      const tierDetails = getTierDetails(currentUser.subscriptionTier);
      if (tierDetails && !tierDetails.accessToAllThemes && currentTheme !== FREE_TIER_THEME) {
        // If user is on free tier and current theme is not the free theme, revert to free theme
        setCurrentTheme(FREE_TIER_THEME);
        themeService.applyTheme(FREE_TIER_THEME);
      } else {
        themeService.applyTheme(currentTheme);
      }
    } else {
       themeService.applyTheme(currentTheme); // Apply default if no user (e.g. on auth page)
    }
  }, [currentTheme, currentUser]);
  
  useEffect(() => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    if (feedbackDisplayTimeoutRef.current) clearTimeout(feedbackDisplayTimeoutRef.current);

    if (appFeedback) {
      setDisplayedFeedback(appFeedback);
      setFeedbackAnimationClass('animate-toast-enter');
      feedbackTimeoutRef.current = window.setTimeout(() => setAppFeedback(null), 5000);
    } else if (displayedFeedback) {
      setFeedbackAnimationClass('animate-toast-exit');
      feedbackDisplayTimeoutRef.current = window.setTimeout(() => {
        setDisplayedFeedback(null);
        setFeedbackAnimationClass('');
      }, 400);
    }
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (feedbackDisplayTimeoutRef.current) clearTimeout(feedbackDisplayTimeoutRef.current);
    };
  }, [appFeedback, displayedFeedback]);


  useEffect(() => {
    const pageOrder: Page[] = ['auth', 'dashboard', 'taskRanker', 'settings', 'subscription'];
    
    if (previousPageTransition === null) {
        setAnimationClass('animate-initial-page-fade-in');
        return;
    }
    
    const prevIndex = pageOrder.indexOf(previousPageTransition);
    const currIndex = pageOrder.indexOf(currentPage);

    if (currIndex > prevIndex) {
        setAnimationClass('animate-page-enter-from-right');
    } else if (currIndex < prevIndex) {
        setAnimationClass('animate-page-enter-from-left');
    } else {
        setAnimationClass('animate-initial-page-fade-in'); 
    }
  }, [currentPage, previousPageTransition]);


  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    authService.signOut();
    setCurrentUser(null);
    setCurrentTaskListId(null);
    setCurrentTaskListName(null);
    setPreviousPageForSettings(null);
    navigateTo('auth');
  };

  const handleSelectList = (listSummary: TaskListSummary) => {
    setCurrentTaskListId(listSummary.id);
    setCurrentTaskListName(listSummary.name);
    navigateTo('taskRanker');
  };

  const handleCreateNewList = (listSummary: TaskListSummary, listName: string) => {
    setAppFeedback({ type: 'success', text: `List "${listName}" created successfully!` });
    pageRenderInstance.current += 1; // Force re-render of dashboard
    navigateTo('dashboard'); 
  };
  
  const handleBackToDashboard = () => {
    setCurrentTaskListId(null);
    setCurrentTaskListName(null);
    navigateTo('dashboard');
    pageRenderInstance.current +=1; 
  };

  const handleNavigateToSettings = () => {
    setPreviousPageForSettings(currentPage);
    navigateTo('settings');
  };
  
  const handleNavigateToSubscriptionPage = () => {
    setPreviousPageForSettings(currentPage); // Store current page to return after subscription action
    navigateTo('subscription');
  };


  const handleBackFromSettings = () => {
    if (previousPageForSettings) {
      navigateTo(previousPageForSettings);
    } else {
      navigateTo('dashboard'); 
    }
    setPreviousPageForSettings(null);
  };
  
  const handleBackFromSubscription = () => {
    if (previousPageForSettings) {
      navigateTo(previousPageForSettings);
    } else if (currentUser) {
      navigateTo('dashboard'); // Default back to dashboard if user is logged in
    } else {
      navigateTo('auth'); // Fallback if no user somehow
    }
    setPreviousPageForSettings(null);
  };


  const handleChangeTheme = (theme: ThemeName) => {
    if (!currentUser) return;
    const tierDetails = getTierDetails(currentUser.subscriptionTier);

    if (tierDetails && !tierDetails.accessToAllThemes && theme !== FREE_TIER_THEME) {
        openUpgradeModal(`Access all themes, including ${theme.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}, by upgrading your plan.`);
        return;
    }
    setCurrentTheme(theme);
    setAppFeedback({type: 'info', text: `Theme changed to ${theme.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}.`});
  };
  
  const handleUpgradePlan = async (newTierId: SubscriptionTier) => {
    if (!currentUser) return;
    try {
        const updatedUser = await storageService.updateUserSubscriptionTier(currentUser.id, newTierId);
        if (updatedUser) {
            setCurrentUser(updatedUser); // Update user state in App.tsx
            authService.signIn(updatedUser.username); // Re-set session storage with updated user
            const tierDetails = getTierDetails(newTierId);
            setAppFeedback({ type: 'success', text: `Successfully upgraded to ${tierDetails?.name || newTierId} plan!` });
            navigateTo('dashboard'); // Or back to previousPageForSettings
        } else {
            throw new Error("Failed to update user subscription.");
        }
    } catch (error) {
        console.error("Upgrade plan error:", error);
        setAppFeedback({ type: 'error', text: `Failed to upgrade plan: ${(error as Error).message}` });
    }
  };


  const handleExportData = async () => {
    if (!currentUser) return;
    const tierDetails = getTierDetails(currentUser.subscriptionTier);
    if (!tierDetails?.dataExportImport) {
      openUpgradeModal("Unlock data export and import by upgrading your plan.");
      throw new Error("Feature not available on current plan."); // Prevent settings page from showing success
    }
    try {
      const jsonData = await storageService.exportUserData(currentUser.id);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai_task_ranker_backup_${currentUser.username}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setAppFeedback({type: 'success', text: 'Data exported successfully!'});
    } catch (error) {
      console.error("Export error:", error);
      setAppFeedback({type: 'error', text: `Export failed: ${(error as Error).message}`});
      throw error; 
    }
  };

  const handleImportData = async (file: File) => {
    if (!currentUser) return;
    const tierDetails = getTierDetails(currentUser.subscriptionTier);
    if (!tierDetails?.dataExportImport) {
      openUpgradeModal("Unlock data export and import by upgrading your plan.");
      throw new Error("Feature not available on current plan."); // Prevent settings page from showing success
    }
    try {
      const result = await storageService.importUserData(currentUser.id, file);
      let message = '';
      if (result.errors.length > 0) {
        message += `Import finished with errors: ${result.errors.join(', ')}. `;
      } else {
         message += `Import successful! `;
      }
      message += `${result.importedCount} new lists imported, ${result.overwrittenCount} lists overwritten.`;
      
      const feedbackType: FeedbackMessage['type'] = result.errors.length > 0 ? 'warning' : 'success';
      setAppFeedback({type: feedbackType, text: message});
      
      pageRenderInstance.current += 1;
      navigateTo('dashboard');


    } catch (error) {
      console.error("Import error:", error);
      setAppFeedback({type: 'error', text: `Import failed: ${(error as Error).message}`});
      throw error; 
    }
  };

  const handleResetAccount = async () => {
    if (!currentUser) return;
    try {
      await storageService.resetUserAccount(currentUser.id);
      setAppFeedback({ type: 'success', text: "Your account has been reset. All task lists are cleared." });
      pageRenderInstance.current +=1;
      if (currentPage === 'dashboard') {
        navigateTo('dashboard'); 
      }
    } catch (error) {
      console.error("Account reset error:", error);
      setAppFeedback({ type: 'error', text: `Account reset failed: ${(error as Error).message}` });
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      await storageService.deleteUserAccount(currentUser.id);
      setAppFeedback({ type: 'success', text: "Your account has been permanently deleted." });
      handleLogout(); 
    } catch (error) {
      console.error("Account deletion error:", error);
      setAppFeedback({ type: 'error', text: `Account deletion failed: ${(error as Error).message}` });
    }
  };


  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900">
        <SparklesIcon className="w-12 h-12 text-sky-400 animate-sparkles-pulse mr-4" />
        <p className="text-2xl text-slate-300 font-semibold">Loading Cosmic Session...</p>
      </div>
    );
  }
  
  const getPageKey = () => {
    const basePrefix = "aiTaskRankerAppPage";
    const instanceNumber = pageRenderInstance.current;
    const timestamp = Date.now();

    if (currentPage === 'taskRanker') {
      const listIdPart = currentTaskListId ? `listId_${currentTaskListId}` : 'noActiveList';
      return `${basePrefix}-${currentPage}-${listIdPart}-instance${instanceNumber}-t${timestamp}`;
    }
    return `${basePrefix}-${currentPage}-instance${instanceNumber}-t${timestamp}`;
  };

  return (
    <>
      <ApiKeyWarningBanner /> {/* Render the banner here */}
      <div className="page-transition-container pt-16"> {/* Added pt-16 to account for banner height if visible */}
        {displayedFeedback && (
            <div 
                className={`fixed top-20 right-5 z-[100] p-4 rounded-lg shadow-xl text-sm border ${feedbackAnimationClass} ${ // Adjusted top-20 from top-5
                    displayedFeedback.type === 'success' ? 'bg-green-600/80 backdrop-blur-sm border-green-500 text-white' : 
                    displayedFeedback.type === 'error' ? 'bg-red-600/80 backdrop-blur-sm border-red-500 text-white' :
                    displayedFeedback.type === 'warning' ? 'bg-yellow-500/80 backdrop-blur-sm border-yellow-400 text-black' :
                    'bg-sky-600/80 backdrop-blur-sm border-sky-500 text-white'
                }`}
                role={displayedFeedback.type === 'error' ? 'alert' : 'status'}
                aria-live="polite" // Added for accessibility
            >
                {displayedFeedback.text}
            </div>
        )}

        {isUpgradeModalOpen && (
          <UpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={closeUpgradeModal}
            onUpgrade={() => {
              closeUpgradeModal();
              handleNavigateToSubscriptionPage();
            }}
            reason={upgradeReason}
          />
        )}

        {currentPage === 'auth' && !currentUser && (
          <div key={getPageKey()} className={`page ${animationClass}`}>
              <AuthPage onLoginSuccess={handleLoginSuccess} />
          </div>
        )}
        {currentPage === 'dashboard' && currentUser && (
          <div key={getPageKey()} className={`page ${animationClass}`}>
              <DashboardPage
                currentUser={currentUser}
                onSelectList={handleSelectList}
                onCreateNewList={(summary, name) => handleCreateNewList(summary, name)}
                onLogout={handleLogout}
                onNavigateToSettings={handleNavigateToSettings}
                onNavigateToSubscription={handleNavigateToSubscriptionPage}
                appCurrentTheme={currentTheme}
                onLimitReached={openUpgradeModal}
                key={`dashboard-${pageRenderInstance.current}`} 
              />
          </div>
        )}
        {currentPage === 'taskRanker' && currentUser && currentTaskListId && currentTaskListName && (
          <div key={getPageKey()} className={`page ${animationClass}`}>
              <TaskRankerPage
                currentUser={currentUser}
                taskListId={currentTaskListId}
                taskListName={currentTaskListName}
                onBackToDashboard={handleBackToDashboard}
                onNavigateToSettings={handleNavigateToSettings}
                onLimitReached={openUpgradeModal}
              />
          </div>
        )}
        {currentPage === 'settings' && currentUser && (
          <div key={getPageKey()} className={`page ${animationClass}`}>
            <SettingsPage
              currentUser={currentUser}
              currentTheme={currentTheme}
              onChangeTheme={handleChangeTheme}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onResetAccount={handleResetAccount}
              onDeleteAccount={handleDeleteAccount}
              onNavigateToSubscription={handleNavigateToSubscriptionPage}
              onBack={handleBackFromSettings}
            />
          </div>
        )}
        {currentPage === 'subscription' && currentUser && (
          <div key={getPageKey()} className={`page ${animationClass}`}>
            <SubscriptionPage
                currentUser={currentUser}
                onSelectPlan={handleUpgradePlan}
                onBack={handleBackFromSubscription}
             />
          </div>
        )}
      </div>
    </>
  );
};

export default App;
