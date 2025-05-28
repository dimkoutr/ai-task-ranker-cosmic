
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Task, TaskInputItem, AIRankedTask, User } from '../types';
import { getTaskImportance } from '../services/geminiService';
import * as storageService from '../services/storageService';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { CogIcon } from '../components/icons/CogIcon';
import LoadingSpinner from '../components/LoadingSpinner';
import { FREE_TIER_MAX_TASKS_PER_LIST, getTierDetails } from '../constants';

interface TaskRankerPageProps {
  currentUser: User;
  taskListId: string;
  taskListName: string;
  onBackToDashboard: () => void;
  onNavigateToSettings: () => void;
  onLimitReached: (reason: string) => void; 
}

// This sort function is applied AFTER AI ranking or for initial load.
const sortTasksIfNeeded = (tasksToSort: Task[]): Task[] => {
  return [...tasksToSort].sort((a, b) => {
    // Priority 1: Valid AI Rank (lower is better)
    const aHasValidRank = a.rank !== null && !a.isLoadingRank && !a.error;
    const bHasValidRank = b.rank !== null && !b.isLoadingRank && !b.error;

    if (aHasValidRank && !bHasValidRank) return -1;
    if (!aHasValidRank && bHasValidRank) return 1;
    if (aHasValidRank && bHasValidRank && a.rank !== null && b.rank !== null) {
      if (a.rank !== b.rank) return a.rank - b.rank;
    }

    // Priority 2: Loading state (loading tasks come before others that are not yet ranked with an AI rank)
    // This helps group loading tasks if AI hasn't responded yet, but user order is king before AI responds.
    if (a.isLoadingRank && !b.isLoadingRank && !bHasValidRank) return -1; // Loading task a, non-loading unranked b
    if (!a.isLoadingRank && b.isLoadingRank && !aHasValidRank) return 1; // Non-loading unranked a, loading task b
    
    // Priority 3: Due Date (earlier is better, overdue is highest if not ranked by AI yet)
    // This is more relevant for initial load or if AI fails.
    if (!aHasValidRank && !bHasValidRank) { // Only apply due date sort if neither has a valid AI rank
        const aDueDate = a.dueDate ? new Date(a.dueDate + "T00:00:00").getTime() : Infinity;
        const bDueDate = b.dueDate ? new Date(b.dueDate + "T00:00:00").getTime() : Infinity;
        const today = new Date(); today.setHours(0,0,0,0); 
        const todayTime = today.getTime();

        const aIsOverdue = a.dueDate ? aDueDate < todayTime : false;
        const bIsOverdue = b.dueDate ? bDueDate < todayTime : false;

        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;
        if (aIsOverdue && bIsOverdue) { 
            if (aDueDate !== bDueDate) return aDueDate - bDueDate;
        }
        if (aDueDate !== Infinity || bDueDate !== Infinity ) {
            if (aDueDate !== bDueDate) return aDueDate - bDueDate;
        }
    }

    // Priority 4: Error state (errored tasks go to the bottom or after non-errored unranked)
    if (!a.error && b.error) return -1;
    if (a.error && !b.error) return 1;
    
    // Fallback: Maintain relative order from input array if all else is equal.
    // This is implicitly handled if the sort is stable and items are "equal" by above criteria.
    return 0; 
  });
};


const TaskRankerPage: React.FC<TaskRankerPageProps> = ({
  currentUser,
  taskListId,
  taskListName,
  onBackToDashboard,
  onNavigateToSettings,
  onLimitReached,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRanking, setIsRanking] = useState<boolean>(false);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const draggedItem = useRef<Task | null>(null);
  const draggedItemIndex = useRef<number | null>(null);
  const [draggedTaskIndexVisual, setDraggedTaskIndexVisual] = useState<number | null>(null);
  const [dragHoverTargetIndex, setDragHoverTargetIndex] = useState<number | null>(null);

  const currentUserTierDetails = getTierDetails(currentUser.subscriptionTier);
  const aiRankingType = currentUserTierDetails?.aiRankingType || 'Basic';


  const loadTasks = useCallback(async () => {
    setIsLoadingList(true);
    setGlobalError(null);
    try {
      const listDetail = await storageService.getTaskListDetail(currentUser.id, taskListId);
      // Initially sort tasks based on saved ranks or due dates.
      setTasks(sortTasksIfNeeded(listDetail.tasks.map(t => ({...t, dueDate: t.dueDate || null}))));
    } catch (err) {
      console.error("Failed to load task list:", err);
      setGlobalError("Failed to load tasks for this list. " + (err as Error).message);
      setTasks([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [currentUser.id, taskListId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const saveCurrentTasks = useCallback(async (tasksToSave: Task[]) => {
    try {
      const tasksForStorage = tasksToSave.map(t => ({
        ...t,
        rank: (typeof t.rank === 'number' && !isNaN(t.rank)) ? t.rank : null,
      }));
      const currentListDetails = await storageService.getTaskListDetail(currentUser.id, taskListId);
      await storageService.saveTaskList(currentUser.id, {
        id: taskListId,
        name: taskListName,
        tasks: tasksForStorage, 
        lastModified: new Date().toISOString(),
        icon: currentListDetails.icon, 
        color: currentListDetails.color,
      });
    } catch (err) {
      console.error("Failed to save tasks:", err);
      setGlobalError("Failed to save changes to your task list. " + (err as Error).message);
    }
  }, [currentUser.id, taskListId, taskListName]);

  const processTaskRanking = useCallback(async (
    tasksInUserOrderSentToAI: Task[], 
    idsThatWereLoading: Set<string> 
  ) => {
    
    if (tasksInUserOrderSentToAI.length === 0) {
      setIsRanking(false);
      const finalTasksNoRanking = tasksInUserOrderSentToAI.map(t =>
        idsThatWereLoading.has(t.id) && t.isLoadingRank
          ? { ...t, isLoadingRank: false, error: t.error || "Task list empty, not ranked." }
          : t
      );
      setTasks(finalTasksNoRanking); // Should be empty, sortTasksIfNeeded not strictly needed for empty
      await saveCurrentTasks(finalTasksNoRanking);
      return;
    }
    
    setIsRanking(true); 
    setGlobalError(null);

    try {
      const aiRankedTasks: AIRankedTask[] = await getTaskImportance(tasksInUserOrderSentToAI);
      
      setTasks(prevTasks => { 
        const rankedTasksMap = new Map(aiRankedTasks.map(rt => [rt.id, rt]));
        const updatedTasks = tasksInUserOrderSentToAI.map(task => {
          if (idsThatWereLoading.has(task.id) || rankedTasksMap.has(task.id)) { 
            const rankedInfo = rankedTasksMap.get(task.id);
            if (rankedInfo) {
              return {
                ...task,
                rank: rankedInfo.rank,
                justification: rankedInfo.justification,
                isLoadingRank: false,
                error: null,
              };
            } else if (idsThatWereLoading.has(task.id)) { 
              return { ...task, isLoadingRank: false, error: "AI did not return a rank for this task." };
            }
          }
          // If a task wasn't meant to be loading and AI didn't rank it (e.g. an old errored task), keep its state
          return prevTasks.find(pt => pt.id === task.id) || task; 
        });
        const finalTasks = sortTasksIfNeeded(updatedTasks);
        saveCurrentTasks(finalTasks); 
        return finalTasks;
      });
    } catch (error) {
      console.error("Failed to get task importance for batch:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to rank tasks due to an unknown error.";
      setGlobalError(`${aiRankingType} AI Ranking Error: ${errorMessage}`);
      setTasks(prevTasks => { 
        const updatedOnError = tasksInUserOrderSentToAI.map(t => {
          if (idsThatWereLoading.has(t.id) || t.isLoadingRank) { 
            return { ...t, isLoadingRank: false, error: errorMessage };
          }
           return prevTasks.find(pt => pt.id === t.id) || t;
        });
        const finalTasks = sortTasksIfNeeded(updatedOnError);
        saveCurrentTasks(finalTasks); 
        return finalTasks;
      });
    } finally {
      setIsRanking(false);
    }
  }, [saveCurrentTasks, aiRankingType]);

  const addTask = useCallback(async (text: string, dueDate: string | null) => {
    if (!text.trim()) return;

    if (currentUserTierDetails && tasks.length >= currentUserTierDetails.maxTasksPerList) {
        onLimitReached(`You've reached the maximum of ${currentUserTierDetails.maxTasksPerList} tasks per list for the ${currentUserTierDetails.name} plan. Please upgrade to add more tasks to this list.`);
        return;
    }

    setGlobalError(null);

    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      dueDate,
      rank: null,
      justification: null,
      isLoadingRank: true, // New task will be ranked
      error: null,
    };
    
    // New task is added to the top, all existing non-errored tasks also marked for re-ranking.
    const tasksWithNewItemAtTop = [newTask, ...tasks];
    const tasksInUserOrderForAI = tasksWithNewItemAtTop.map(t => ({
        ...t, 
        rank: null, 
        justification: null,
        isLoadingRank: !t.error, // Mark for loading if not an error task
        error: t.error 
    }));
    
    // Immediately update UI to show new task at top, with loading states
    setTasks(tasksInUserOrderForAI); 
    setIsRanking(true); // Indicate that an AI operation is about to start

    try {
        const idsToRank = new Set(tasksInUserOrderForAI.filter(t => t.isLoadingRank).map(t => t.id));
        if (idsToRank.size > 0) {
          await processTaskRanking(tasksInUserOrderForAI, idsToRank);
        } else { // Should not happen if new task is added correctly
          const sortedTasks = sortTasksIfNeeded(tasksInUserOrderForAI); // Fallback sort
          setTasks(sortedTasks);
          await saveCurrentTasks(sortedTasks);
          setIsRanking(false); 
        }
    } catch (error) {
        console.error("Error during addTask's ranking/saving process:", error);
        const message = error instanceof Error ? error.message : String(error);
        setGlobalError(`Failed to process new task: ${message}`);
        setTasks(current => {
            const errorProcessed = tasksInUserOrderForAI.map(t => ({ 
                ...t, 
                isLoadingRank: false, 
                error: t.id === newTask.id ? message : t.error 
            }));
            return sortTasksIfNeeded(errorProcessed); // Sort after error
        });
        setIsRanking(false); 
    }
  }, [tasks, processTaskRanking, saveCurrentTasks, currentUserTierDetails, onLimitReached, taskListName]);

  const removeTask = useCallback(async (id: string) => {
    setGlobalError(null);
    const tasksAfterRemoval = tasks.filter(task => task.id !== id);
    
    const needsReRanking = tasksAfterRemoval.some(t => !t.error); // Re-rank if there are non-error tasks left

    if (needsReRanking && tasksAfterRemoval.length > 0) {
      const tasksInUserOrderForAI = tasksAfterRemoval.map(t => ({ 
          ...t, 
          isLoadingRank: !t.error, 
          rank: null, 
          justification: null, 
          error: t.error 
      }));
      // Immediately update UI with removed task gone, others show loading
      setTasks(tasksInUserOrderForAI); 
      setIsRanking(true);

      try {
        const idsToRank = new Set(tasksInUserOrderForAI.filter(t => t.isLoadingRank).map(t => t.id));
        if (idsToRank.size > 0) {
          await processTaskRanking(tasksInUserOrderForAI, idsToRank);
        } else { // Should not happen if needsReRanking is true and list not empty
          const sortedTasks = sortTasksIfNeeded(tasksInUserOrderForAI);
          setTasks(sortedTasks);
          await saveCurrentTasks(sortedTasks);
          setIsRanking(false);
        }
      } catch (error) {
          console.error("Error during removeTask's ranking/saving process:", error);
          const message = error instanceof Error ? error.message : String(error);
          setGlobalError(`Failed to re-rank tasks after removal: ${message}`);
          setTasks(current => { 
            const errorProcessed = tasksInUserOrderForAI.map(t => ({ ...t, isLoadingRank: false, error: message }));
            return sortTasksIfNeeded(errorProcessed);
          });
          setIsRanking(false);
      }
    } else {
      // No re-ranking needed (e.g. list becomes empty, or only error tasks remain)
      setTasks(tasksAfterRemoval); 
      await saveCurrentTasks(tasksAfterRemoval);
      setIsRanking(false); 
    }
  }, [tasks, processTaskRanking, saveCurrentTasks, taskListName]);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    draggedItem.current = tasks[index];
    draggedItemIndex.current = index;
    setDraggedTaskIndexVisual(index); 
    event.dataTransfer.effectAllowed = 'move';
    try { event.dataTransfer.setData('text/plain', tasks[index].id); } catch (e) { /* old browser? */ }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault(); 
    if (draggedItemIndex.current === null || draggedItemIndex.current === index) {
      if (dragHoverTargetIndex !== null && dragHoverTargetIndex !== index) {
          setDragHoverTargetIndex(null);
      }
      return;
    }
    if (dragHoverTargetIndex !== index) {
        setDragHoverTargetIndex(index);
    }
  };
  
  const handleDragEnterItem = (index: number) => {
    if (draggedItemIndex.current !== null && draggedItemIndex.current !== index) {
      setDragHoverTargetIndex(index);
    }
  };

  const handleDragLeaveItem = () => {
    // Handled by onDragOver and onDrop/onDragEnd to ensure hover target resets correctly
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    event.preventDefault();
    if (draggedItemIndex.current === null || draggedItem.current === null || draggedItemIndex.current === dropIndex) {
      setDraggedTaskIndexVisual(null);
      setDragHoverTargetIndex(null);
      draggedItem.current = null;
      draggedItemIndex.current = null;
      return;
    }

    let reorderedTasksArray = [...tasks];
    const itemToMove = reorderedTasksArray.splice(draggedItemIndex.current, 1)[0];
    reorderedTasksArray.splice(dropIndex, 0, itemToMove);

    // This list is now in the user's exact new order. Mark for AI ranking.
    const tasksInUserOrderForAI = reorderedTasksArray.map(t => ({
      ...t,
      rank: null, 
      justification: null, 
      isLoadingRank: !t.error, // Mark for loading if not an error task
      error: t.error
    }));
    
    // Immediately update UI to reflect the drag-and-drop, with loading states
    setTasks(tasksInUserOrderForAI); 
    setIsRanking(true);

    // Clear visual drag states
    setDraggedTaskIndexVisual(null);
    setDragHoverTargetIndex(null);
    draggedItem.current = null;
    draggedItemIndex.current = null;

    try {
        const idsToRank = new Set(tasksInUserOrderForAI.filter(t => t.isLoadingRank).map(t => t.id));
        if (idsToRank.size > 0) {
          await processTaskRanking(tasksInUserOrderForAI, idsToRank);
        } else { // E.g. if only error tasks were reordered
          setTasks(tasksInUserOrderForAI); // Keep user order, no AI ranks
          await saveCurrentTasks(tasksInUserOrderForAI);
          setIsRanking(false);
        }
    } catch (error) {
        console.error("Error during handleDrop's ranking/saving process:", error);
        const message = error instanceof Error ? error.message : String(error);
        setGlobalError(`Failed to rank tasks after reorder: ${message}`);
        setTasks(currentReordered => { 
            const errorProcessed = tasksInUserOrderForAI.map(t => ({ 
                ...t, 
                isLoadingRank: false, 
                error: message 
            }));
            return sortTasksIfNeeded(errorProcessed); // Sort after error
        });
        setIsRanking(false);
    }
  };

  const handleDragEnd = () => {
    // Reset visual state if drag ended without a successful drop (e.g., outside a valid target)
    if (draggedItemIndex.current !== null) { 
      setDraggedTaskIndexVisual(null);
      setDragHoverTargetIndex(null);
      draggedItem.current = null;
      draggedItemIndex.current = null;
    }
  };


  if (isLoadingList) {
    return (
      <div className="page-container-flex">
        <main className="page-content-scrollable flex flex-col items-center justify-center">
          <LoadingSpinner className="w-12 h-12 mb-4 text-purple-400" />
          <p className="text-xl text-text-secondary">Loading your cosmic task list: <span className="font-semibold text-text-accent">{taskListName}</span>...</p>
        </main>
      </div>
    );
  }
  
  const anyTaskIsLoadingRank = tasks.some(t => t.isLoadingRank);
  // Form is disabled if AI is ranking (indicated by anyTaskIsLoadingRank which implies isRanking is true) 
  // OR if task limit is reached.
  const formDisabled = (isRanking && anyTaskIsLoadingRank) || (currentUserTierDetails ? tasks.length >= currentUserTierDetails.maxTasksPerList : false);


  return (
    <div className="page-container-flex">
      <header className="page-header-area p-4 md:p-8 md:pb-6">
        <div className="flex justify-between items-center mb-2">
            <button
                onClick={onBackToDashboard}
                className="text-text-accent hover:text-text-accent-hover transition-colors duration-200 text-sm hover:underline inline-flex items-center gap-1 group focus:outline-none focus-visible:ring-1 focus-visible:ring-border-focus-alt rounded"
                title="Back to Dashboard"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
            </button>
             <button
                onClick={onNavigateToSettings}
                className="header-icon-button button-active-pop p-2 rounded-full hover:bg-surface-interactive focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                aria-label="Open application settings"
                title="Settings"
            >
                <CogIcon className="w-6 h-6 text-text-secondary hover:text-text-primary transition-colors" />
            </button>
        </div>
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-sky-rose-lime flex items-center justify-center gap-x-2 md:gap-x-4 text-center">
            <SparklesIcon className="w-9 h-9 md:w-11 md:h-11 text-yellow-300 opacity-80 animate-sparkles-pulse" />
            {taskListName}
            <SparklesIcon className="w-9 h-9 md:w-11 md:h-11 text-pink-400 opacity-80 animate-sparkles-pulse [animation-delay:-1s]" />
          </h1>
          <p className="text-text-secondary mt-3 text-lg text-center">
            AI Ranking: <span className="font-semibold text-text-accent">{aiRankingType}</span>. Add tasks with due dates. Drag to reorder. AI will re-rank upon changes.
          </p>
          {currentUserTierDetails && currentUserTierDetails.maxTasksPerList !== Infinity && (
            <p className="text-text-muted text-sm text-center mt-1">
                Tasks: {tasks.length} / {currentUserTierDetails.maxTasksPerList}.
            </p>
          )}
        </div>
      </header>

      <main className="page-content-scrollable p-4 md:p-8 md:pt-0">
        <div className={`container mx-auto max-w-3xl bg-surface-primary backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10 border border-border-secondary transition-all duration-300 ${isRanking && anyTaskIsLoadingRank ? 'animate-pulse-slow border-purple-500/70 shadow-purple-500/50' : ''}`}>
          <TaskForm onAddTask={addTask} disabled={formDisabled} />
          
          {currentUserTierDetails && tasks.length >= currentUserTierDetails.maxTasksPerList && !formDisabled && ( 
            <div className="bg-yellow-500/20 border border-yellow-700 text-yellow-200 p-4 rounded-lg mb-6 text-sm shadow-lg flex items-center gap-3" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>You've reached the task limit of {currentUserTierDetails.maxTasksPerList} for this list on the {currentUserTierDetails.name} plan. <button onClick={() => onLimitReached(`Upgrade to add more tasks to the list "${taskListName}".`)} className="font-semibold underline hover:text-yellow-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-yellow-100 rounded">Upgrade Plan</button> to add more.</span>
            </div>
          )}

          {globalError && (
            <div className="bg-red-500/20 border border-red-700 text-red-300 p-4 rounded-lg mb-6 text-sm shadow-lg flex items-center gap-3" role="alert">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{globalError}</span>
            </div>
          )}
          
          {isRanking && anyTaskIsLoadingRank && !globalError && ( 
            <div className="my-8 p-6 md:p-10 bg-surface-interactive/40 backdrop-blur-sm rounded-xl border border-border-secondary shadow-xl relative overflow-hidden">
              <div className="flex flex-col items-center text-center">
                <LoadingSpinner className="w-14 h-14 text-text-accent mb-6" />
                <p className="text-xl md:text-2xl font-semibold text-text-primary mb-2 animate-text-pulse-enhanced">
                  AI is Recalibrating Cosmic Priorities...
                </p>
                <p className="text-sm md:text-base text-text-secondary">
                  Analyzing task constellations and due dates, please wait.
                </p>
                <SparklesIcon className="w-6 h-6 text-yellow-400/70 absolute top-4 left-4 animate-sparkles-pulse [animation-delay:-0.2s]" />
                <SparklesIcon className="w-5 h-5 text-pink-400/60 absolute top-8 right-6 animate-sparkles-pulse [animation-delay:-0.8s]" />
                <SparklesIcon className="w-7 h-7 text-sky-400/50 absolute bottom-5 left-10 animate-sparkles-pulse [animation-delay:-1.5s]" />
                <SparklesIcon className="w-4 h-4 text-purple-400/70 absolute bottom-8 right-12 animate-sparkles-pulse [animation-delay:-0.5s]" />
              </div>
            </div>
          )}

          {!isRanking && tasks.length === 0 && !globalError && !isLoadingList && (
            <p className="text-center text-text-muted mt-10 text-xl">✨ This task list is empty. Add a task to begin! ✨</p>
          )}

          <TaskList 
            tasks={tasks} 
            onRemoveTask={removeTask} 
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onDragEnterItem={handleDragEnterItem}
            onDragLeaveItem={handleDragLeaveItem}
            draggedTaskIndex={draggedTaskIndexVisual} 
            dragHoverTargetIndex={dragHoverTargetIndex}
          />
        </div>
      </main>

      <footer className="page-footer-area text-center py-6 text-text-muted text-sm">
        <p>Viewing: {taskListName} ✨ Powered by {aiRankingType} Gemini AI</p>
      </footer>
    </div>
  );
};

export default TaskRankerPage;
    