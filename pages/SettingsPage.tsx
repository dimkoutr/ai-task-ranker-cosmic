
import React, { useState, useRef, useEffect } from 'react';
import { ThemeName, FeedbackMessage, User } from '../types';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import { PaletteIcon } from '../components/icons/PaletteIcon';
import { ArchiveBoxIcon } from '../components/icons/ArchiveBoxIcon';
import { AlertTriangleIcon } from '../components/icons/AlertTriangleIcon';
import { RefreshCwIcon } from '../components/icons/RefreshCwIcon';
import { Trash2Icon } from '../components/icons/Trash2Icon';
import ConfirmModal from '../components/ConfirmModal';
import { FREE_TIER_THEME, getTierDetails } from '../constants';
import { ArrowRightIcon } from '../components/icons/ArrowRightIcon'; // For upgrade button
import { CrownIcon } from '../components/icons/CrownIcon'; // For plan display


interface SettingsPageProps {
  currentUser: User;
  currentTheme: ThemeName;
  onChangeTheme: (themeName: ThemeName) => void;
  onExportData: () => Promise<void>;
  onImportData: (file: File) => Promise<void>;
  onResetAccount: () => Promise<void> | void;
  onDeleteAccount: () => Promise<void> | void;
  onNavigateToSubscription: () => void; // New prop
  onBack: () => void;
}

const THEMES: { name: ThemeName; label: string; gradient: string; isPremium: boolean }[] = [
  { name: 'cosmic-glow', label: 'Cosmic Glow', gradient: 'bg-gradient-to-br from-purple-700 via-pink-600 to-indigo-700', isPremium: false },
  { name: 'starlight-serenity', label: 'Starlight Serenity', gradient: 'bg-gradient-to-br from-sky-700 via-teal-600 to-slate-700', isPremium: true },
  { name: 'golden-radiance', label: 'Golden Radiance', gradient: 'bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-600', isPremium: true },
];

const APP_VERSION = '1.1.0'; // Static version number

const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  currentTheme,
  onChangeTheme,
  onExportData,
  onImportData,
  onResetAccount,
  onDeleteAccount,
  onNavigateToSubscription,
  onBack,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pageFeedback, setPageFeedback] = useState<FeedbackMessage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isProcessingDangerAction, setIsProcessingDangerAction] = useState(false);

  const currentUserTierDetails = getTierDetails(currentUser.subscriptionTier);


  useEffect(() => {
    if (pageFeedback) {
      const timer = setTimeout(() => setPageFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [pageFeedback]);

  const handleThemeButtonClick = (themeName: ThemeName) => {
    onChangeTheme(themeName); // App.tsx will handle gating and modal
  };

  const handleExportClick = async () => {
    if (!currentUserTierDetails?.dataExportImport) {
      // This case should ideally be handled by disabling the button,
      // but App.tsx's onExportData will also throw and trigger UpgradeModal.
      onNavigateToSubscription(); // Or App.tsx opens modal
      return;
    }
    setIsExporting(true);
    setPageFeedback(null);
    try {
      await onExportData();
    } catch (e) {
      // Error already handled by App.tsx if it's a feature limit error
      if (!((e as Error).message.includes("Feature not available"))) {
         setPageFeedback({ type: 'error', text: `Export failed: ${(e as Error).message}` });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
     if (!currentUserTierDetails?.dataExportImport) {
      onNavigateToSubscription();
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsImporting(true);
      setPageFeedback(null);
      try {
        await onImportData(file);
      } catch (e) {
        if (!((e as Error).message.includes("Feature not available"))) {
           setPageFeedback({ type: 'error', text: `Import failed: ${(e as Error).message}` });
        }
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; 
        }
      }
    }
  };
  
  const confirmResetAccount = async () => {
    setIsResetConfirmOpen(false);
    setIsProcessingDangerAction(true);
    setPageFeedback(null);
    try {
      await onResetAccount();
    } catch (e) {
       setPageFeedback({ type: 'error', text: `Account reset failed: ${(e as Error).message}`});
    } finally {
        setIsProcessingDangerAction(false);
    }
  };

  const confirmDeleteAccount = async () => {
    setIsDeleteConfirmOpen(false);
    setIsProcessingDangerAction(true);
    setPageFeedback(null);
    try {
        await onDeleteAccount();
    } catch (e) {
        setPageFeedback({ type: 'error', text: `Account deletion failed: ${(e as Error).message}`});
        setIsProcessingDangerAction(false); 
    }
  };


  return (
    <div className="page-container-flex">
      <header className="page-header-area p-4 md:p-8 md:pb-6">
        <div className="container mx-auto max-w-4xl">
          <button
            onClick={onBack}
            className="text-text-accent hover:text-text-accent-hover transition-colors duration-200 text-sm hover:underline mb-4 inline-flex items-center gap-1 group focus:outline-none focus-visible:ring-1 focus-visible:ring-border-focus-alt rounded"
            title="Go back to previous page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-sky-rose-lime flex items-center justify-center gap-x-3 text-center">
            <SparklesIcon className="w-9 h-9 md:w-11 md:h-11 text-yellow-300 opacity-80 animate-sparkles-pulse" />
            Settings
            <SparklesIcon className="w-9 h-9 md:w-11 md:h-11 text-pink-400 opacity-80 animate-sparkles-pulse [animation-delay:-1s]" />
          </h1>
          <p className="text-text-secondary mt-3 text-lg text-center">Customize your application experience, {currentUser.username}.</p>
        </div>
      </header>

      <main className="page-content-scrollable p-4 md:p-8 md:pt-0">
        <div className="container mx-auto max-w-3xl space-y-10">
          {pageFeedback && (
            <div className={`p-4 mb-6 rounded-lg text-sm shadow-lg border ${
                pageFeedback.type === 'success' ? 'bg-green-600/80 border-green-500 text-white' : 
                pageFeedback.type === 'error' ? 'bg-red-600/80 border-red-500 text-white' :
                pageFeedback.type === 'warning' ? 'bg-yellow-500/80 border-yellow-400 text-black' :
                'bg-sky-600/80 border-sky-500 text-white'
              }`}
              role={pageFeedback.type === 'error' ? 'alert' : 'status'}
              aria-live="polite">
              {pageFeedback.text}
            </div>
          )}
          
          {currentUserTierDetails && (
             <section 
                aria-labelledby="current-plan-title" 
                className="bg-surface-primary backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8 border border-border-secondary"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 id="current-plan-title" className="text-2xl font-semibold text-text-accent mb-2 flex items-center gap-3">
                           <CrownIcon className="w-7 h-7" />
                           Current Plan: {currentUserTierDetails.name}
                        </h2>
                        <p className="text-sm text-text-secondary">
                            {currentUserTierDetails.id === 'free' 
                                ? "Unlock more features by upgrading your plan." 
                                : `You have access to ${currentUserTierDetails.aiRankingType} AI ranking and more!`}
                        </p>
                    </div>
                    <button
                        onClick={onNavigateToSubscription}
                        className="button-primary text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out button-active-pop button-hover-glow flex items-center justify-center gap-2 flex-shrink-0"
                        title={currentUserTierDetails.id === 'free' ? "View upgrade options" : "Manage your subscription"}
                      >
                       {currentUserTierDetails.id === 'free' ? 'Upgrade Plan' : 'Manage Plan'} <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
             </section>
          )}


          <section 
            aria-labelledby="appearance-settings-title" 
            className="bg-surface-primary backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8 border border-border-secondary"
          >
            <h2 id="appearance-settings-title" className="text-2xl font-semibold text-text-accent mb-6 flex items-center gap-3">
              <PaletteIcon className="w-7 h-7" />
              Appearance
            </h2>
            <p className="text-sm text-text-secondary mb-5">Select your preferred theme. Premium themes require an upgraded plan.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {THEMES.map(theme => (
                <button
                  key={theme.name}
                  onClick={() => handleThemeButtonClick(theme.name)}
                  className={`p-5 rounded-lg theme-select-button ${theme.gradient} ${currentTheme === theme.name ? 'active' : ''} flex flex-col items-center justify-center aspect-video transition-all duration-200 ease-in-out hover:opacity-90 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary focus-visible:ring-border-focus`}
                  aria-pressed={currentTheme === theme.name}
                  title={`Activate ${theme.label} theme ${theme.isPremium && !currentUserTierDetails?.accessToAllThemes ? '(Premium - Upgrade to use)' : ''}`}
                >
                  <span className="block text-center font-semibold text-white text-shadow-sm text-lg">{theme.label}</span>
                  {currentTheme === theme.name && (
                    <span className="text-xs text-white/80 mt-1">(Active)</span>
                  )}
                  {theme.isPremium && currentTheme !== theme.name && (
                     <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                        PRO
                     </div>
                  )}
                   {theme.isPremium && !currentUserTierDetails?.accessToAllThemes && (
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-white text-sm font-semibold">Upgrade to Unlock</span>
                     </div>
                   )}
                </button>
              ))}
            </div>
          </section>

          <section 
            aria-labelledby="data-management-settings-title" 
            className="bg-surface-primary backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8 border border-border-secondary"
          >
            <h2 id="data-management-settings-title" className="text-2xl font-semibold text-text-accent mb-6 flex items-center gap-3">
              <ArchiveBoxIcon className="w-7 h-7" />
              Data Management
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-1">Export Data</h3>
                <p className="text-sm text-text-secondary mb-3">Export all your task lists to a JSON file. This is useful for backups or transferring your data.</p>
                <button
                  onClick={handleExportClick}
                  disabled={isExporting || isProcessingDangerAction || !currentUserTierDetails?.dataExportImport}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg button-secondary font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus button-active-pop button-hover-glow flex items-center justify-center gap-2 disabled:opacity-60"
                  title={!currentUserTierDetails?.dataExportImport ? "Upgrade to Pro to export data" : "Export your data as a JSON file"}
                >
                  {isExporting ? <LoadingSpinner className="w-5 h-5" /> : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  }
                  {isExporting ? 'Exporting...' : 'Export My Data'}
                </button>
              </div>
              <div className="border-t border-border-secondary my-6"></div>
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-1">Import Data</h3>
                <p className="text-sm text-text-secondary mb-3">Import task lists from a previously exported JSON file. This may overwrite existing lists if they have the same ID.
                <strong className="block text-yellow-400/90 mt-1">Warning:</strong> Importing data is a sensitive operation. Ensure your file is a valid export from this application.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept=".json"
                  className="hidden"
                  aria-label="Import data file"
                  disabled={isImporting || isProcessingDangerAction || !currentUserTierDetails?.dataExportImport}
                />
                <button
                  onClick={handleImportClick}
                  disabled={isImporting || isProcessingDangerAction || !currentUserTierDetails?.dataExportImport}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg button-secondary font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus button-active-pop button-hover-glow flex items-center justify-center gap-2 disabled:opacity-60"
                   title={!currentUserTierDetails?.dataExportImport ? "Upgrade to Pro to import data" : "Import data from a JSON file"}
                >
                  {isImporting ? <LoadingSpinner className="w-5 h-5" /> : 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  }
                  {isImporting ? 'Importing...' : 'Import Data from File'}
                </button>
              </div>
            </div>
          </section>

          <section 
            aria-labelledby="danger-zone-title"
            className="bg-danger-bg backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-8 border border-danger-border animate-pulse-danger-zone-border"
          >
            <h2 id="danger-zone-title" className="text-2xl font-semibold text-danger-text mb-4 flex items-center gap-3">
              <AlertTriangleIcon className="w-7 h-7 text-danger-text" />
              Danger Zone
            </h2>
            <p className="text-sm text-red-200/80 mb-6">These actions are destructive and/or irreversible. Please proceed with caution.</p>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-red-200/90 mb-1">Reset Account</h3>
                <p className="text-sm text-red-200/70 mb-3">This will delete all your task lists. Your account login and subscription plan will remain, but all task data will be cleared. This action cannot be undone.</p>
                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  disabled={isProcessingDangerAction}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg button-danger-outline font-medium transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-danger-bg focus-visible:ring-danger-text button-active-pop flex items-center justify-center gap-2 disabled:opacity-60"
                  title="Delete all task data (account and plan remain)"
                >
                  {isProcessingDangerAction ? <LoadingSpinner className="w-5 h-5 text-danger-text" /> : <RefreshCwIcon className="w-5 h-5" />}
                  Reset My Account
                </button>
              </div>
              <div className="border-t border-danger-border/50 my-6"></div>
              <div>
                <h3 className="text-lg font-medium text-red-200/90 mb-1">Delete Account Permanently</h3>
                <p className="text-sm text-red-200/70 mb-3">This will permanently delete your account, including your login credentials and all associated task lists. This action is irreversible and your data cannot be recovered.</p>
                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isProcessingDangerAction}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg button-danger-solid font-semibold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-danger-bg focus-visible:ring-red-300 button-active-pop button-hover-glow flex items-center justify-center gap-2 disabled:opacity-60"
                  title="Permanently delete account and all data"
                >
                  {isProcessingDangerAction ? <LoadingSpinner className="w-5 h-5" /> : <Trash2Icon className="w-5 h-5" />}
                  Delete My Account Permanently
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>

      <footer className="page-footer-area text-center py-6 text-text-muted text-sm">
        <p>AI Task Ranker Settings ✨ Version {APP_VERSION}</p>
      </footer>

      {isResetConfirmOpen && (
        <ConfirmModal
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={confirmResetAccount}
          title="Confirm Account Reset"
          message={`Are you sure you want to reset your account, ${currentUser.username}? This will delete ALL your task lists. Your login and plan will remain. This action cannot be undone.`}
          confirmText="Yes, Reset My Account"
          cancelText="Cancel"
          confirmButtonType="danger"
        />
      )}

      {isDeleteConfirmOpen && (
        <ConfirmModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          onConfirm={confirmDeleteAccount}
          title="Confirm PERMANENT Account Deletion"
          message={`DANGER! Are you absolutely sure you want to permanently delete your account, ${currentUser.username}? This will erase your login and ALL associated data (task lists, etc.). This action is IRREVERSIBLE.`}
          confirmText="Yes, Delete Permanently"
          cancelText="Cancel"
          confirmButtonType="danger"
        />
      )}
    </div>
  );
};

export default SettingsPage;
